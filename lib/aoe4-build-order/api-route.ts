// What every AoE4 route shares. Browser-safe: saved-builds.ts imports it, so it must not import data.ts or any server-only module.
import { MAX_REPORTED_ISSUES, type BuildsError, type SimulateError } from './api';
import type { BuildOrderIssue } from './model';

export interface RouteReply<Body = unknown> {
  status: number;
  headers?: Record<string, string>;
  body?: Body;
}

export interface ReplyTarget<Body = unknown> {
  status(code: number): ReplyTarget<Body>;
  setHeader(name: string, value: string): unknown;
  json(body: Body): void;
  end(): void;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function methodNotAllowed(method: string | undefined, allowed: readonly string[]): RouteReply<BuildsError> {
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

// The caller guarantees at least one issue: the first one's message is the error.
export function issuesError(all: readonly BuildOrderIssue[]): SimulateError {
  const issues = all.slice(0, MAX_REPORTED_ISSUES);
  const omittedIssues = all.length - issues.length;
  return { error: issues[0].message, issues, ...(omittedIssues > 0 ? { omittedIssues } : {}) };
}

// Body comes from the response alone. json is declared as a method, so its parameter is bivariant even under
// strictFunctionTypes; inferring Body from the reply too would let a response type that lacks one of the reply's
// bodies compile.
export function sendReply<Body>(res: ReplyTarget<Body>, reply: RouteReply<NoInfer<Body>>): void {
  res.status(reply.status);
  for (const [name, value] of Object.entries(reply.headers ?? {})) res.setHeader(name, value);
  if (reply.body === undefined) res.end();
  else res.json(reply.body);
}
