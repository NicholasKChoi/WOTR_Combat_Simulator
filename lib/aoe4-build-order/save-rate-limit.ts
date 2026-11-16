// The fixed-window save limit per client. The counter lives in the BuildStore, because serverless
// instances share no memory.
import type { IncomingHttpHeaders } from 'node:http';
import type { BuildStore } from './build-store';
import { base64UrlSha256 } from './saved-builds';

/** The per-client write budget, maxSaves per windowSeconds, shared by saves, named-build creates and updates (Named builds routes). */
export const SAVE_RATE_LIMIT = Object.freeze({ maxSaves: 30, windowSeconds: 3600 });

const CLIENT_KEY_LENGTH = 16;
const WINDOW_MS = SAVE_RATE_LIMIT.windowSeconds * 1000;

/** A short hash of the client's address, from x-forwarded-for or else the socket, that keys its counter. */
export async function clientKey(req: { headers: IncomingHttpHeaders; socket: { remoteAddress?: string } }): Promise<string> {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim();
  const source = first || req.socket.remoteAddress || 'unknown';
  return (await base64UrlSha256(source)).slice(0, CLIENT_KEY_LENGTH);
}

/** Counts one write against the client's window: ok, or a refusal with the seconds to wait before retrying (Builds routes). */
export async function takeSaveSlot(store: BuildStore, clientKey: string, nowMs: number): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const windowStart = Math.floor(nowMs / WINDOW_MS) * WINDOW_MS;
  const update = await store.bumpCounter(clientKey, windowStart, SAVE_RATE_LIMIT.maxSaves);
  if (update === 'contended') return { ok: false, retryAfterSeconds: 1 };
  if (update !== 'refused') return { ok: true };
  return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((windowStart + WINDOW_MS - nowMs) / 1000)) };
}
