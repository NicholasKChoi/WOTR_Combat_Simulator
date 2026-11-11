// The fixed-window save limit per client. The counter lives in the BuildStore, because serverless
// instances share no memory.
import type { IncomingHttpHeaders } from 'node:http';
import type { BuildStore } from './build-store';
import { base64UrlSha256 } from './saved-builds';

export const SAVE_RATE_LIMIT = Object.freeze({ maxSaves: 30, windowSeconds: 3600 });

const CLIENT_KEY_LENGTH = 16;
const WINDOW_MS = SAVE_RATE_LIMIT.windowSeconds * 1000;

export async function clientKey(req: { headers: IncomingHttpHeaders; socket: { remoteAddress?: string } }): Promise<string> {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim();
  const source = first || req.socket.remoteAddress || 'unknown';
  return (await base64UrlSha256(source)).slice(0, CLIENT_KEY_LENGTH);
}

export async function takeSaveSlot(store: BuildStore, clientKey: string, nowMs: number): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const windowStart = Math.floor(nowMs / WINDOW_MS) * WINDOW_MS;
  const update = await store.bumpCounter(clientKey, windowStart, SAVE_RATE_LIMIT.maxSaves);
  if (update === 'contended') return { ok: false, retryAfterSeconds: 1 };
  if (update !== 'refused') return { ok: true };
  return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((windowStart + WINDOW_MS - nowMs) / 1000)) };
}
