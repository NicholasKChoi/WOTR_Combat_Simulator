// The Vercel Blob BuildStore. Credentials come from the function's OIDC token for storeId.
import { BlobNotFoundError, BlobPreconditionFailedError, del, get, head, put } from '@vercel/blob';
import { nextCounter, type BuildStore, type PutResult, type StoredWithEtag } from './build-store';
import { namedBuildKey } from './named-builds';
import { rateCounterKey, savedBuildKey } from './saved-builds';

const COUNTER_ATTEMPTS = 3;

// @vercel/blob reads VERCEL_BLOB_RETRIES from process.env on every put, head and del call (default 10; get is
// not retried), and bumpCounter's attempts multiply those retries.
export const BLOB_SDK_RETRIES = 1;

export function createBlobBuildStore(storeId: string, env: string): BuildStore {
  if (!process.env.VERCEL_BLOB_RETRIES) process.env.VERCEL_BLOB_RETRIES = String(BLOB_SDK_RETRIES);
  const putOptions = { access: 'private', addRandomSuffix: false, contentType: 'application/json', storeId } as const;

  const exists = async (key: string): Promise<boolean> => {
    try {
      await head(key, { storeId });
      return true;
    } catch {
      return false;
    }
  };

  // @vercel/blob 2.9 `get` resolves null when the blob answers 404. BlobNotFoundError is also treated
  // as absent.
  // A fresh read's etag feeds put's ifMatch, which compares against the strong etag. The CDN weakens the
  // etag (W/"...") of a compressed response, so a fresh read asks for the body uncompressed. The etag
  // comes from this same response, not a separate head(): a write between the two would pair stale
  // content with a fresh etag and lose that write.
  const read = async (key: string, fresh: boolean): Promise<StoredWithEtag | null> => {
    try {
      const result = await get(key, {
        access: 'private',
        storeId,
        ...(fresh ? { useCache: false, headers: { 'accept-encoding': 'identity' } } : {}),
      });
      if (result === null) return null;
      const { etag } = result.blob;
      if (fresh && etag.startsWith('W/')) throw new Error(`Blob read of ${key} returned a weak etag ${etag}, which ifMatch cannot use`);
      return { value: await new Response(result.stream).json(), etag };
    } catch (error) {
      if (error instanceof BlobNotFoundError) return null;
      throw error;
    }
  };

  // For build writes only. A put whose response was lost may still have landed, and the SDK's retry of it
  // then fails with 412 or "already exists". Text equality, not a deep compare: a value serialized
  // differently is not ours.
  const landed = async (key: string, json: string): Promise<boolean> => {
    try {
      const stored = await read(key, true);
      return stored !== null && JSON.stringify(stored.value) === json;
    } catch {
      return false;
    }
  };

  const create = async (key: string, json: string): Promise<PutResult> => {
    try {
      await put(key, json, { ...putOptions, allowOverwrite: false });
      return 'created';
    } catch (error) {
      if (await landed(key, json)) return 'created';
      if (await exists(key)) return 'exists';
      throw error;
    }
  };

  return {
    async putBuild(id, json) {
      return create(savedBuildKey(env, id), json);
    },
    async getBuild(id) {
      return (await read(savedBuildKey(env, id), false))?.value ?? null;
    },
    async deleteBuild(id) {
      await del(savedBuildKey(env, id), { storeId });
    },
    async bumpCounter(clientKey, windowStart, limit) {
      const key = rateCounterKey(env, clientKey);
      for (let attempt = 0; attempt < COUNTER_ATTEMPTS; attempt += 1) {
        const current = await read(key, true);
        const update = nextCounter(current?.value ?? null, windowStart, limit);
        if (update === 'refused') return update;
        const write = current === null ? { allowOverwrite: false } : { allowOverwrite: true, ifMatch: current.etag };
        try {
          await put(key, JSON.stringify(update), { ...putOptions, ...write });
          return update;
        } catch (error) {
          // No landed read-back: parallel saves from one client write identical counter JSON, so it would
          // count every losing writer as landed and let them all pass the limit.
          if (error instanceof BlobPreconditionFailedError) continue;
          if (current === null && (await exists(key))) continue;
          throw error;
        }
      }
      return 'contended';
    },
    async createNamed(id, json) {
      return create(namedBuildKey(env, id), json);
    },
    async getNamed(id) {
      return read(namedBuildKey(env, id), true);
    },
    // No retry: one that re-read the blob for its new etag would overwrite the concurrent writer. The
    // landed check compares content only and never feeds its etag into a write.
    // Which error the SDK raises for ifMatch on a deleted blob is unverified (blob-build-store.live.test.ts
    // records it), so not-found also conflicts.
    async replaceNamed(id, json, etag) {
      const key = namedBuildKey(env, id);
      try {
        await put(key, json, { ...putOptions, allowOverwrite: true, ifMatch: etag });
        return 'replaced';
      } catch (error) {
        if (await landed(key, json)) return 'replaced';
        if (error instanceof BlobPreconditionFailedError || error instanceof BlobNotFoundError) return 'conflict';
        throw error;
      }
    },
    async deleteNamed(id) {
      try {
        await del(namedBuildKey(env, id), { storeId });
      } catch (error) {
        if (!(error instanceof BlobNotFoundError)) throw error;
      }
    },
  };
}
