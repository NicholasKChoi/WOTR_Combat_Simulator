// What every AoE4 route shares. Browser-safe: saved-builds.ts imports it, so it must not import data.ts or any server-only module.
import type { SimulateError } from './api';

export interface RouteReply {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ReplyTarget {
  status(code: number): ReplyTarget;
  setHeader(name: string, value: string): unknown;
  json(body: unknown): void;
  end(): void;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function methodNotAllowed(method: string | undefined, allowed: readonly string[]): RouteReply {
  return {
    status: 405,
    headers: { Allow: allowed.join(', ') },
    body: { error: `method ${method} is not allowed; use ${allowed.join(' or ')}` },
  };
}

export function notAnObjectError(): SimulateError {
  const message = 'request body: must be a JSON object';
  return { error: message, issues: [{ code: 'syntax', message }] };
}

export function sendReply(res: ReplyTarget, reply: RouteReply): void {
  res.status(reply.status);
  for (const [name, value] of Object.entries(reply.headers ?? {})) res.setHeader(name, value);
  if (reply.body === undefined) res.end();
  else res.json(reply.body);
}
