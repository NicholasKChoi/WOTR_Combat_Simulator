import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as buildStoreModule from './build-store';
import { buildStoreFromEnv } from './build-store';
import { clientKey, SAVE_RATE_LIMIT, takeSaveSlot } from './save-rate-limit';
import * as saveRateLimitModule from './save-rate-limit';

const HOUR_MS = 3_600_000;
const WINDOW_START = 1_000 * HOUR_MS;

let dir: string;
const envFor = (vercelEnv?: string): NodeJS.ProcessEnv => ({ NODE_ENV: 'test', BUILDS_LOCAL_DIR: dir, VERCEL_ENV: vercelEnv });
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'build-store-acceptance-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('public surface', () => {
  it('build-store exports exactly the documented names', () => {
    expect(Object.keys(buildStoreModule).sort()).toEqual(
      ['BUILDS_LOCAL_DIR_DEFAULT', 'buildStoreFromEnv', 'createFileBuildStore', 'createMemoryBuildStore'].sort(),
    );
  });

  it('save-rate-limit exports exactly the documented names', () => {
    expect(Object.keys(saveRateLimitModule).sort()).toEqual(['SAVE_RATE_LIMIT', 'clientKey', 'takeSaveSlot']);
  });
});

describe('store chosen from the environment drives the save limit end to end', () => {
  it('allows 30 saves per client per window, refuses the 31st, and keeps counting across store instances', async () => {
    const env = envFor();
    const key = await clientKey({ headers: { 'x-forwarded-for': '9.9.9.9' }, socket: {} });
    for (let i = 1; i <= SAVE_RATE_LIMIT.maxSaves; i++) {
      const store = await buildStoreFromEnv(env);
      expect(await takeSaveSlot(store, key, WINDOW_START + i)).toEqual({ ok: true });
    }
    const fresh = await buildStoreFromEnv(env);
    expect(await takeSaveSlot(fresh, key, WINDOW_START + 1_800_000)).toEqual({ ok: false, retryAfterSeconds: 1800 });

    const other = await clientKey({ headers: {}, socket: { remoteAddress: '8.8.8.8' } });
    expect(await takeSaveSlot(fresh, other, WINDOW_START + 1_800_000)).toEqual({ ok: true });
    expect(await takeSaveSlot(fresh, key, WINDOW_START + HOUR_MS)).toEqual({ ok: true });
  });

  it('persists a saved build through the env-built store and refuses to overwrite it', async () => {
    const env = envFor('preview');
    const store = await buildStoreFromEnv(env);
    expect(await store.putBuild('abc', JSON.stringify({ v: 1 }))).toBe('created');
    const again = await buildStoreFromEnv(env);
    expect(await again.putBuild('abc', JSON.stringify({ v: 2 }))).toBe('exists');
    expect(await again.getBuild('abc')).toEqual({ v: 1 });
    expect(await readdir(path.join(dir, 'preview'))).toContain('builds');
    await again.deleteBuild('abc');
    expect(await store.getBuild('abc')).toBeNull();
  });

  it('keeps unknown VERCEL_ENV values in the development namespace, apart from preview', async () => {
    const staging = await buildStoreFromEnv(envFor('staging'));
    await staging.putBuild('abc', '{"v":1}');
    const preview = await buildStoreFromEnv(envFor('preview'));
    expect(await preview.getBuild('abc')).toBeNull();
    expect(await readdir(dir)).toEqual(['development']);
  });
});
