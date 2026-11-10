import { methodNotAllowed, type RouteReply } from './api-route';
import type { BuildStore } from './build-store';
import { takeSaveSlot } from './save-rate-limit';
import { checkSaveBuildRequest, isSavedBuildId, savedBuildId, savedBuildPath, savedBuildSchema } from './saved-builds';
import type { BuildOrderCatalog } from './schema';

type StoreGetter = () => Promise<BuildStore>;

const errorReply = (status: number, error: string, headers?: Record<string, string>): RouteReply => ({ status, ...(headers && { headers }), body: { error } });
const storageUnavailable = (cause: unknown): RouteReply => {
  console.error('builds: storage failed', cause);
  return errorReply(503, 'storage is unavailable; try again later');
};
const notFound = (): RouteReply => errorReply(404, 'no saved build with that id');

export async function saveBuildReply(
  req: { method: string | undefined; body: unknown; clientKey: string },
  deps: { store: StoreGetter; catalog: BuildOrderCatalog; nowMs: number },
): Promise<RouteReply> {
  if (req.method !== 'POST') return methodNotAllowed(req.method, ['POST']);
  const checked = checkSaveBuildRequest(req.body, deps.catalog);
  if (!checked.ok) return { status: checked.status, body: checked.error };

  try {
    const store = await deps.store();
    const slot = await takeSaveSlot(store, req.clientKey, deps.nowMs);
    if (!slot.ok) return errorReply(429, 'too many saves from this client; try again later', { 'Retry-After': String(slot.retryAfterSeconds) });
    const id = await savedBuildId(checked.record);
    const put = await store.putBuild(id, checked.json);
    return { status: put === 'created' ? 201 : 200, body: { id, path: savedBuildPath(id) } };
  } catch (cause) {
    return storageUnavailable(cause);
  }
}

async function readSavedBuild(store: BuildStore, id: string): Promise<RouteReply> {
  const stored = await store.getBuild(id);
  if (stored === null) return notFound();
  const parsed = savedBuildSchema.safeParse(stored);
  if (!parsed.success) {
    console.error('builds: stored build failed its schema', parsed.error);
    return errorReply(500, 'the stored build could not be read');
  }
  return { status: 200, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, body: { ...parsed.data, id } };
}

export async function savedBuildReply(
  req: { method: string | undefined; id: unknown },
  deps: { store: StoreGetter; env: string },
): Promise<RouteReply> {
  const canDelete = deps.env !== 'production';
  if (req.method !== 'GET' && !(req.method === 'DELETE' && canDelete)) {
    return methodNotAllowed(req.method, canDelete ? ['GET', 'DELETE'] : ['GET']);
  }
  if (!isSavedBuildId(req.id)) return notFound();

  try {
    const store = await deps.store();
    if (req.method === 'GET') return await readSavedBuild(store, req.id);
    await store.deleteBuild(req.id);
    return { status: 204 };
  } catch (cause) {
    return storageUnavailable(cause);
  }
}
