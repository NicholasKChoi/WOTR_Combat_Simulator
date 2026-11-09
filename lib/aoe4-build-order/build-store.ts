// Where saved builds and save-rate counters live. Callers pass bare ids and client keys; each store
// prefixes them with its own env through savedBuildKey and rateCounterKey.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { rateCounterKey, savedBuildKey, storageEnv } from './saved-builds';

export type PutResult = 'created' | 'exists';

export interface CounterUpdate {
  windowStart: number;
  count: number;
}

export interface BuildStore {
  putBuild(id: string, json: string): Promise<PutResult>;
  getBuild(id: string): Promise<unknown | null>;
  deleteBuild(id: string): Promise<void>;
  bumpCounter(clientKey: string, windowStart: number): Promise<CounterUpdate | 'contended'>;
}

export const BUILDS_LOCAL_DIR_DEFAULT = '.builds-local';

function nextCounter(stored: unknown, windowStart: number): CounterUpdate {
  const previous = stored as Partial<CounterUpdate> | null | undefined;
  return { windowStart, count: previous?.windowStart === windowStart && typeof previous.count === 'number' ? previous.count + 1 : 1 };
}

export function createMemoryBuildStore(env = 'development'): BuildStore {
  const builds = new Map<string, string>();
  const counters = new Map<string, CounterUpdate>();
  return {
    async putBuild(id, json) {
      const key = savedBuildKey(env, id);
      if (builds.has(key)) return 'exists';
      builds.set(key, json);
      return 'created';
    },
    async getBuild(id) {
      const json = builds.get(savedBuildKey(env, id));
      return json === undefined ? null : JSON.parse(json);
    },
    async deleteBuild(id) {
      builds.delete(savedBuildKey(env, id));
    },
    async bumpCounter(clientKey, windowStart) {
      const key = rateCounterKey(env, clientKey);
      const update = nextCounter(counters.get(key), windowStart);
      counters.set(key, update);
      return update;
    },
  };
}

const hasCode = (error: unknown, code: string): boolean => (error as NodeJS.ErrnoException | null)?.code === code;

export function createFileBuildStore(dir: string, env: string): BuildStore {
  const root = path.resolve(dir);
  // A key must map to itself under root: a `..` segment that stays inside root could still alias
  // another key, such as a client key that lands a counter on a build file.
  const fileFor = (key: string): string => {
    const file = path.resolve(root, key);
    if (!file.startsWith(root + path.sep) || path.relative(root, file).split(path.sep).join('/') !== key) {
      throw new Error(`build store: key ${JSON.stringify(key)} is not a plain path inside ${root}`);
    }
    return file;
  };

  return {
    async putBuild(id, json) {
      const file = fileFor(savedBuildKey(env, id));
      await mkdir(path.dirname(file), { recursive: true });
      try {
        await writeFile(file, json, { flag: 'wx' });
        return 'created';
      } catch (error) {
        if (hasCode(error, 'EEXIST')) return 'exists';
        throw error;
      }
    },
    async getBuild(id) {
      const file = fileFor(savedBuildKey(env, id));
      try {
        return JSON.parse(await readFile(file, 'utf8'));
      } catch (error) {
        if (hasCode(error, 'ENOENT')) return null;
        throw error;
      }
    },
    async deleteBuild(id) {
      await rm(fileFor(savedBuildKey(env, id)), { force: true });
    },
    // Synchronous on purpose: with no await between the read and the write, concurrent calls in one
    // process never lose an update. Across processes it is not atomic; this store serves only next dev,
    // Vitest and Playwright, where a lost count only loosens the limit.
    async bumpCounter(clientKey, windowStart) {
      const file = fileFor(rateCounterKey(env, clientKey));
      let stored: unknown = null;
      try {
        stored = JSON.parse(readFileSync(file, 'utf8'));
      } catch (error) {
        if (!hasCode(error, 'ENOENT')) throw error;
      }
      const update = nextCounter(stored, windowStart);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(update));
      return update;
    },
  };
}

async function storeFor(env: NodeJS.ProcessEnv): Promise<BuildStore> {
  const storage = storageEnv(env.VERCEL_ENV);
  if (env.BUILDS_STORE_ID) {
    const { createBlobBuildStore } = await import('./blob-build-store');
    return createBlobBuildStore(env.BUILDS_STORE_ID, storage);
  }
  return createFileBuildStore(env.BUILDS_LOCAL_DIR || BUILDS_LOCAL_DIR_DEFAULT, storage);
}

let processStore: Promise<BuildStore> | undefined;

export function buildStoreFromEnv(env?: NodeJS.ProcessEnv): Promise<BuildStore> {
  if (env !== undefined) return storeFor(env);
  processStore ??= storeFor(process.env).catch((error: unknown) => {
    processStore = undefined;
    throw error;
  });
  return processStore;
}
