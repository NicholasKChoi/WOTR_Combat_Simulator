// The Vercel Blob BuildStore. Credentials come from the function's OIDC token for storeId.
import { BlobNotFoundError, BlobPreconditionFailedError, del, get, head, put } from '@vercel/blob';
import type { BuildStore, CounterUpdate } from './build-store';
import { rateCounterKey, savedBuildKey } from './saved-builds';

const COUNTER_ATTEMPTS = 3;

export function createBlobBuildStore(storeId: string, env: string): BuildStore {
  const exists = async (key: string): Promise<boolean> => {
    try {
      await head(key, { storeId });
      return true;
    } catch {
      return false;
    }
  };

  // Absence is handled both as a null result and as BlobNotFoundError: which one the SDK uses
  // could not be checked without a live store.
  const read = async (key: string, fresh: boolean): Promise<{ value: unknown; etag: string } | null> => {
    try {
      const result = await get(key, { access: 'private', storeId, ...(fresh ? { useCache: false } : {}) });
      if (result === null) return null;
      return { value: await new Response(result.stream).json(), etag: result.blob.etag };
    } catch (error) {
      if (error instanceof BlobNotFoundError) return null;
      throw error;
    }
  };

  return {
    async putBuild(id, json) {
      const key = savedBuildKey(env, id);
      try {
        await put(key, json, { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json', storeId });
        return 'created';
      } catch (error) {
        if (await exists(key)) return 'exists';
        throw error;
      }
    },
    async getBuild(id) {
      return (await read(savedBuildKey(env, id), false))?.value ?? null;
    },
    async deleteBuild(id) {
      await del(savedBuildKey(env, id), { storeId });
    },
    async bumpCounter(clientKey, windowStart) {
      const key = rateCounterKey(env, clientKey);
      for (let attempt = 0; attempt < COUNTER_ATTEMPTS; attempt += 1) {
        const current = await read(key, true);
        const stored = current?.value as Partial<CounterUpdate> | undefined;
        const update: CounterUpdate = { windowStart, count: stored?.windowStart === windowStart && typeof stored.count === 'number' ? stored.count + 1 : 1 };
        const write = current === null ? { allowOverwrite: false } : { allowOverwrite: true, ifMatch: current.etag };
        try {
          await put(key, JSON.stringify(update), { access: 'private', addRandomSuffix: false, contentType: 'application/json', storeId, ...write });
          return update;
        } catch (error) {
          if (error instanceof BlobPreconditionFailedError) continue;
          if (current === null && (await exists(key))) continue;
          throw error;
        }
      }
      return 'contended';
    },
  };
}
