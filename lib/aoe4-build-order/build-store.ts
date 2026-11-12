// Where saved builds, named builds and save-rate counters live. Callers pass bare ids and client keys;
// each store prefixes them with its own env through savedBuildKey, namedBuildKey and rateCounterKey.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { namedBuildKey } from './named-builds';
import { deploymentEnv, rateCounterKey, savedBuildKey } from './saved-builds';

export type PutResult = 'created' | 'exists';

export type ReplaceResult = 'replaced' | 'conflict';

export interface StoredWithEtag {
  value: unknown;
  etag: string;
}

export interface CounterUpdate {
  windowStart: number;
  count: number;
}

export type CounterResult = CounterUpdate | 'contended' | 'refused';

export interface BuildStore {
  putBuild(id: string, json: string): Promise<PutResult>;
  getBuild(id: string): Promise<unknown | null>;
  deleteBuild(id: string): Promise<void>;
  // A 'refused' result writes nothing, so the stored count never passes the limit.
  bumpCounter(clientKey: string, windowStart: number, limit: number): Promise<CounterResult>;
  createNamed(id: string, json: string): Promise<PutResult>;
  // Always a fresh read, never a cached one.
  getNamed(id: string): Promise<StoredWithEtag | null>;
  // Compare-and-swap: writes only when the key exists and its etag is still `etag`; never re-reads the etag to try again.
  replaceNamed(id: string, json: string, etag: string): Promise<ReplaceResult>;
  deleteNamed(id: string): Promise<void>;
}

export const BUILDS_LOCAL_DIR_DEFAULT = '.builds-local';

export function nextCounter(stored: unknown, windowStart: number, limit: number): CounterUpdate | 'refused' {
  const previous = stored as Partial<CounterUpdate> | null | undefined;
  if (previous?.windowStart !== windowStart || typeof previous.count !== 'number') return { windowStart, count: 1 };
  if (previous.count >= limit) return 'refused';
  return { windowStart, count: previous.count + 1 };
}

// The JSON text behind each key of the memory and file stores. readNow and writeNow are synchronous so
// replaceNamed has no await between its compare and its write.
interface TextByKey {
  create(key: string, json: string): Promise<PutResult>;
  read(key: string): Promise<string | null>;
  readNow(key: string): string | null;
  writeNow(key: string, json: string): void;
  remove(key: string): Promise<void>;
}

const textEtag = (json: string): string => createHash('sha256').update(json).digest('hex');

function buildMethods(env: string, text: TextByKey): Omit<BuildStore, 'bumpCounter'> {
  return {
    async putBuild(id, json) {
      return text.create(savedBuildKey(env, id), json);
    },
    async getBuild(id) {
      const json = await text.read(savedBuildKey(env, id));
      return json === null ? null : JSON.parse(json);
    },
    async deleteBuild(id) {
      await text.remove(savedBuildKey(env, id));
    },
    async createNamed(id, json) {
      return text.create(namedBuildKey(env, id), json);
    },
    async getNamed(id) {
      const json = await text.read(namedBuildKey(env, id));
      return json === null ? null : { value: JSON.parse(json), etag: textEtag(json) };
    },
    async replaceNamed(id, json, etag) {
      const key = namedBuildKey(env, id);
      const current = text.readNow(key);
      if (current === null || textEtag(current) !== etag) return 'conflict';
      text.writeNow(key, json);
      return 'replaced';
    },
    async deleteNamed(id) {
      await text.remove(namedBuildKey(env, id));
    },
  };
}

export function createMemoryBuildStore(env = 'development'): BuildStore {
  const builds = new Map<string, string>();
  const counters = new Map<string, CounterUpdate>();
  const readNow = (key: string): string | null => builds.get(key) ?? null;
  return {
    ...buildMethods(env, {
      async create(key, json) {
        if (builds.has(key)) return 'exists';
        builds.set(key, json);
        return 'created';
      },
      read: async (key) => readNow(key),
      readNow,
      writeNow(key, json) {
        builds.set(key, json);
      },
      async remove(key) {
        builds.delete(key);
      },
    }),
    async bumpCounter(clientKey, windowStart, limit) {
      const key = rateCounterKey(env, clientKey);
      const update = nextCounter(counters.get(key), windowStart, limit);
      if (update !== 'refused') counters.set(key, update);
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

  const readNow = (key: string): string | null => {
    try {
      return readFileSync(fileFor(key), 'utf8');
    } catch (error) {
      if (hasCode(error, 'ENOENT')) return null;
      throw error;
    }
  };

  return {
    ...buildMethods(env, {
      async create(key, json) {
        const file = fileFor(key);
        await mkdir(path.dirname(file), { recursive: true });
        try {
          await writeFile(file, json, { flag: 'wx' });
          return 'created';
        } catch (error) {
          if (hasCode(error, 'EEXIST')) return 'exists';
          throw error;
        }
      },
      read: async (key) => readNow(key),
      readNow,
      writeNow(key, json) {
        writeFileSync(fileFor(key), json);
      },
      async remove(key) {
        await rm(fileFor(key), { force: true });
      },
    }),
    // Synchronous on purpose: with no await between the read and the write, concurrent calls in one
    // process never lose an update. Across processes it is not atomic; this store serves only next dev,
    // Vitest and Playwright, where a lost count only loosens the limit.
    async bumpCounter(clientKey, windowStart, limit) {
      const file = fileFor(rateCounterKey(env, clientKey));
      let stored: unknown = null;
      try {
        stored = JSON.parse(readFileSync(file, 'utf8'));
      } catch (error) {
        if (!hasCode(error, 'ENOENT')) throw error;
      }
      const update = nextCounter(stored, windowStart, limit);
      if (update === 'refused') return update;
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(update));
      return update;
    },
  };
}

async function storeFor(env: NodeJS.ProcessEnv): Promise<BuildStore> {
  const storage = deploymentEnv({ VERCEL: env.VERCEL, VERCEL_ENV: env.VERCEL_ENV });
  if (storage === null) throw new Error('VERCEL is set but VERCEL_ENV is not');
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
