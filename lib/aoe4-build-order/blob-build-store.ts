// The Vercel Blob BuildStore. Credentials come from the function's OIDC token for storeId.
import { BlobNotFoundError, BlobPreconditionFailedError, del, get, head, put } from '@vercel/blob';
import { nextCounter, type BuildStore, type PutResult, type StoredWithEtag } from './build-store';
import { namedBuildKey } from './named-builds';
import { rateCounterKey, savedBuildKey } from './saved-builds';

const COUNTER_ATTEMPTS = 3;

export function createBlobBuildStore(storeId: string, env: string): BuildStore {
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
  const read = async (key: string, fresh: boolean): Promise<StoredWithEtag | null> => {
    try {
      const result = await get(key, { access: 'private', storeId, ...(fresh ? { useCache: false } : {}) });
      if (result === null) return null;
      return { value: await new Response(result.stream).json(), etag: result.blob.etag };
    } catch (error) {
      if (error instanceof BlobNotFoundError) return null;
      throw error;
    }
  };

  const create = async (key: string, json: string): Promise<PutResult> => {
    try {
      await put(key, json, { ...putOptions, allowOverwrite: false });
      return 'created';
    } catch (error) {
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
    // No retry: one that re-read the blob for its new etag would overwrite the concurrent writer.
    // Which error the SDK raises for ifMatch on a deleted blob is unverified, so not-found also conflicts.
    async replaceNamed(id, json, etag) {
      try {
        await put(namedBuildKey(env, id), json, { ...putOptions, allowOverwrite: true, ifMatch: etag });
        return 'replaced';
      } catch (error) {
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
