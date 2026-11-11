import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlobNotFoundError } from '@vercel/blob';
import { buildStoreFromEnv, type BuildStore } from './build-store';

// A fake Blob service with etags, ifMatch and a CDN cache that serves the first body it saw for a key
// unless the caller passes useCache: false.
interface Stored {
  body: string;
  etag: string;
}
const blobs = new Map<string, Stored>();
const cdn = new Map<string, Stored>();
let etagCounter = 0;

vi.mock('@vercel/blob', async (importOriginal) => {
  const original = await importOriginal<typeof import('@vercel/blob')>();
  return {
    ...original,
    put: vi.fn(async (key: string, body: string, options: { allowOverwrite?: boolean; ifMatch?: string }) => {
      const current = blobs.get(key);
      if (options.ifMatch !== undefined) {
        if (!current) throw new original.BlobNotFoundError();
        if (current.etag !== options.ifMatch) throw new original.BlobPreconditionFailedError();
      } else if (current && !options.allowOverwrite) {
        throw new Error('This blob already exists');
      }
      blobs.set(key, { body, etag: `etag-${++etagCounter}` });
      return {};
    }),
    get: vi.fn(async (key: string, options: { useCache?: boolean }) => {
      const fresh = blobs.get(key);
      if (!fresh) return null;
      if (!cdn.has(key)) cdn.set(key, fresh);
      const served = options.useCache === false ? fresh : cdn.get(key)!;
      return { statusCode: 200, stream: new Response(served.body).body, headers: new Headers(), blob: { etag: served.etag } };
    }),
    head: vi.fn(async (key: string) => {
      if (!blobs.has(key)) throw new original.BlobNotFoundError();
      return {};
    }),
    del: vi.fn(async (key: string) => {
      if (!blobs.delete(key)) throw new original.BlobNotFoundError();
    }),
  };
});

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'named-store-acceptance-'));
  blobs.clear();
  cdn.clear();
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const NAMED_ID = 'Nm3_k9-QaB0Nm3_k9-QaB0';

const backends = [
  ['file store', () => buildStoreFromEnv({ NODE_ENV: 'test', BUILDS_LOCAL_DIR: dir })],
  ['blob store', () => buildStoreFromEnv({ NODE_ENV: 'test', BUILDS_STORE_ID: 'store_x', VERCEL: '1', VERCEL_ENV: 'preview' })],
] as const;

describe.each(backends)('named builds through the env-built %s', (_name, make) => {
  let store: BuildStore;
  beforeEach(async () => {
    store = await make();
  });

  it('creates once, refuses a second create, and reads the first value back with an etag', async () => {
    expect(await store.getNamed(NAMED_ID)).toBeNull();
    expect(await store.createNamed(NAMED_ID, '{"v":1}')).toBe('created');
    expect(await store.createNamed(NAMED_ID, '{"v":2}')).toBe('exists');
    const stored = await store.getNamed(NAMED_ID);
    expect(stored?.value).toEqual({ v: 1 });
    expect(typeof stored?.etag).toBe('string');
    expect(stored?.etag).not.toBe('');
  });

  it('replaces with the current etag, gives a new etag, and reads the latest value despite a stale cache', async () => {
    await store.createNamed(NAMED_ID, '{"v":1}');
    const first = await store.getNamed(NAMED_ID);
    expect(await store.replaceNamed(NAMED_ID, '{"v":2}', first!.etag)).toBe('replaced');
    const second = await store.getNamed(NAMED_ID);
    expect(second?.value).toEqual({ v: 2 });
    expect(second?.etag).not.toBe(first?.etag);
  });

  it('refuses a stale etag and keeps the first replacement', async () => {
    await store.createNamed(NAMED_ID, '{"v":1}');
    const first = await store.getNamed(NAMED_ID);
    expect(await store.replaceNamed(NAMED_ID, '{"v":2}', first!.etag)).toBe('replaced');
    expect(await store.replaceNamed(NAMED_ID, '{"v":3}', first!.etag)).toBe('conflict');
    expect((await store.getNamed(NAMED_ID))?.value).toEqual({ v: 2 });
  });

  it('reports a conflict for an absent id and does not create it', async () => {
    expect(await store.replaceNamed(NAMED_ID, '{"v":1}', 'any-etag')).toBe('conflict');
    expect(await store.getNamed(NAMED_ID)).toBeNull();
  });

  it('lets exactly one of two concurrent replaces with the same etag win', async () => {
    await store.createNamed(NAMED_ID, '{"v":1}');
    const { etag } = (await store.getNamed(NAMED_ID))!;
    const results = await Promise.all([store.replaceNamed(NAMED_ID, '{"v":"a"}', etag), store.replaceNamed(NAMED_ID, '{"v":"b"}', etag)]);
    expect([...results].sort()).toEqual(['conflict', 'replaced']);
    const winner = results[0] === 'replaced' ? 'a' : 'b';
    expect((await store.getNamed(NAMED_ID))?.value).toEqual({ v: winner });
  });

  it('deletes a named build and tolerates deleting an absent one', async () => {
    await store.createNamed(NAMED_ID, '{"v":1}');
    await store.deleteNamed(NAMED_ID);
    expect(await store.getNamed(NAMED_ID)).toBeNull();
    await expect(store.deleteNamed(NAMED_ID)).resolves.toBeUndefined();
  });

  it('keeps a saved build and a named build with the same id apart', async () => {
    expect(await store.putBuild(NAMED_ID, '{"kind":"saved"}')).toBe('created');
    expect(await store.createNamed(NAMED_ID, '{"kind":"named"}')).toBe('created');
    expect(await store.getBuild(NAMED_ID)).toEqual({ kind: 'saved' });
    expect((await store.getNamed(NAMED_ID))?.value).toEqual({ kind: 'named' });
    await store.deleteNamed(NAMED_ID);
    expect(await store.getBuild(NAMED_ID)).toEqual({ kind: 'saved' });
  });
});

describe('Blob deletes keep their differing absent-key behavior', () => {
  it('deleteBuild rejects on an absent blob while deleteNamed resolves', async () => {
    const store = await buildStoreFromEnv({ NODE_ENV: 'test', BUILDS_STORE_ID: 'store_x', VERCEL: '1', VERCEL_ENV: 'preview' });
    await expect(store.deleteBuild('Zx3_k9-QaB0')).rejects.toBeInstanceOf(BlobNotFoundError);
    await expect(store.deleteNamed(NAMED_ID)).resolves.toBeUndefined();
  });

  it('replaceNamed refuses a wrong etag on a Blob store', async () => {
    const store = await buildStoreFromEnv({ NODE_ENV: 'test', BUILDS_STORE_ID: 'store_x', VERCEL: '1', VERCEL_ENV: 'preview' });
    await store.createNamed(NAMED_ID, '{}');
    expect(await store.replaceNamed(NAMED_ID, '{"a":1}', 'wrong')).toBe('conflict');
  });
});

describe('file store layout', () => {
  it('writes a named build at <env>/named-builds/<id>.json and isolates envs', async () => {
    const dev = await buildStoreFromEnv({ NODE_ENV: 'test', BUILDS_LOCAL_DIR: dir });
    await dev.createNamed(NAMED_ID, '{"v":1}');
    expect(await readFile(path.join(dir, 'development', 'named-builds', `${NAMED_ID}.json`), 'utf8')).toBe('{"v":1}');
    const preview = await buildStoreFromEnv({ NODE_ENV: 'test', BUILDS_LOCAL_DIR: dir, VERCEL: '1', VERCEL_ENV: 'preview' });
    expect(await preview.getNamed(NAMED_ID)).toBeNull();
  });
});
