// Create, read, update and delete for named (editable) builds. The order of the checks is the contract: the first
// failing check answers, and an update takes its rate-limit slot before the edit secret is compared.
import type { BuildsError, SimulateError } from './api';
import { methodNotAllowed, type RouteReply } from './api-route';
import type { BuildStore } from './build-store';
import { disallowedMethod, errorReply, idFailure, refusedSaveSlot, storageUnavailable, type StoreGetter } from './builds-routes';
import {
  editSecretHash,
  isNamedBuildId,
  NAMED_BUILD_CACHE_CONTROL,
  namedBuildPath,
  newEditSecret,
  newNamedBuildId,
  parseEditSecret,
  parseIfMatchRevision,
  revisionEtag,
  sameSecretHash,
  storedNamedBuildSchema,
  type CreateNamedBuildResponse,
  type NamedBuild,
  type RandomBytes,
  type StoredNamedBuild,
  type UpdateNamedBuildResponse,
} from './named-builds';
import { checkSaveBuildRequest } from './saved-builds';
import type { BuildOrderCatalog } from './schema';

type StoredRead = { ok: true; stored: StoredNamedBuild; etag: string } | { ok: false; reply: RouteReply<BuildsError> };

const notFound = (): RouteReply<BuildsError> => errorReply(404, 'no named build with that id');
const changed = (): RouteReply<BuildsError> => errorReply(412, 'the build has changed since that revision');

async function newCredentials(random: RandomBytes | undefined): Promise<{ id: string; editSecret: string; secretHash: string }> {
  const id = newNamedBuildId(random);
  const editSecret = newEditSecret(random);
  return { id, editSecret, secretHash: await editSecretHash(editSecret) };
}

export async function createNamedBuildReply(
  req: { method: string | undefined; body: unknown; clientKey: string },
  deps: { store: StoreGetter; catalog: BuildOrderCatalog; nowMs: number; random?: RandomBytes },
): Promise<RouteReply<CreateNamedBuildResponse | BuildsError | SimulateError>> {
  if (req.method !== 'POST') return methodNotAllowed(req.method, ['POST']);
  const checked = checkSaveBuildRequest(req.body, deps.catalog);
  if (!checked.ok) return { status: checked.status, body: checked.error };

  let credentials: Awaited<ReturnType<typeof newCredentials>>;
  try {
    credentials = await newCredentials(deps.random);
  } catch (cause) {
    return idFailure(cause);
  }
  const { id, editSecret, secretHash } = credentials;
  const now = new Date(deps.nowMs).toISOString();
  const json = JSON.stringify({ ...checked.record, revision: 1, createdAt: now, updatedAt: now, secretHash });

  try {
    const store = await deps.store();
    const refused = await refusedSaveSlot(store, req.clientKey, deps.nowMs);
    if (refused) return refused;
    if ((await store.createNamed(id, json)) === 'exists') {
      console.error('builds: named id collision');
      return errorReply(500, 'the build id could not be created');
    }
    return { status: 201, headers: { ETag: revisionEtag(1) }, body: { id, path: namedBuildPath(id), editSecret, revision: 1, updatedAt: now } };
  } catch (cause) {
    return storageUnavailable(cause);
  }
}

async function readStored(store: BuildStore, id: string): Promise<StoredRead> {
  const found = await store.getNamed(id);
  if (found === null) return { ok: false, reply: notFound() };
  const parsed = storedNamedBuildSchema.safeParse(found.value);
  if (!parsed.success) {
    console.error('builds: stored build failed its schema', parsed.error);
    return { ok: false, reply: errorReply(500, 'the stored build could not be read') };
  }
  return { ok: true, stored: parsed.data, etag: found.etag };
}

async function readNamedBuild(store: BuildStore, id: string): Promise<RouteReply<NamedBuild | BuildsError>> {
  const read = await readStored(store, id);
  if (!read.ok) return read.reply;
  const { secretHash: _secretHash, ...shown } = read.stored;
  return {
    status: 200,
    headers: { 'Cache-Control': NAMED_BUILD_CACHE_CONTROL, ETag: revisionEtag(read.stored.revision) },
    body: { ...shown, id },
  };
}

async function updateNamedBuild(
  req: { id: string; body: unknown; authorization: string | undefined; ifMatch: string | undefined; clientKey: string },
  deps: { store: StoreGetter; catalog: BuildOrderCatalog; nowMs: number },
): Promise<RouteReply<UpdateNamedBuildResponse | BuildsError | SimulateError>> {
  const secret = parseEditSecret(req.authorization);
  if (secret === null) return errorReply(401, 'an edit secret is required', { 'WWW-Authenticate': 'Bearer' });
  const revision = parseIfMatchRevision(req.ifMatch);
  if (revision === null) return errorReply(428, 'If-Match with the current revision is required');
  const checked = checkSaveBuildRequest(req.body, deps.catalog);
  if (!checked.ok) return { status: checked.status, body: checked.error };

  try {
    const store = await deps.store();
    const refused = await refusedSaveSlot(store, req.clientKey, deps.nowMs);
    if (refused) return refused;
    const read = await readStored(store, req.id);
    if (!read.ok) return read.reply;
    if (!sameSecretHash(await editSecretHash(secret), read.stored.secretHash)) return errorReply(403, 'the edit secret does not match');
    if (revision !== read.stored.revision) return changed();

    const updatedAt = new Date(deps.nowMs).toISOString();
    const next: StoredNamedBuild = { ...read.stored, ...checked.record, revision: read.stored.revision + 1, updatedAt };
    if ((await store.replaceNamed(req.id, JSON.stringify(next), read.etag)) === 'conflict') return changed();
    return {
      status: 200,
      headers: { ETag: revisionEtag(next.revision) },
      body: { id: req.id, path: namedBuildPath(req.id), revision: next.revision, updatedAt },
    };
  } catch (cause) {
    return storageUnavailable(cause);
  }
}

export async function namedBuildReply(
  req: { method: string | undefined; id: unknown; body: unknown; authorization: string | undefined; ifMatch: string | undefined; clientKey: string },
  deps: { store: StoreGetter; catalog: BuildOrderCatalog; env: string | null; nowMs: number },
): Promise<RouteReply<NamedBuild | UpdateNamedBuildResponse | BuildsError | SimulateError>> {
  const disallowed = disallowedMethod(req.method, ['GET', 'PUT'], deps.env);
  if (disallowed) return disallowed;
  if (!isNamedBuildId(req.id)) return notFound();
  if (req.method === 'PUT') return updateNamedBuild({ ...req, id: req.id }, deps);

  try {
    const store = await deps.store();
    if (req.method === 'GET') return await readNamedBuild(store, req.id);
    await store.deleteNamed(req.id);
    return { status: 204 };
  } catch (cause) {
    return storageUnavailable(cause);
  }
}
