// What every AoE4 route shares. Browser-safe: saved-builds.ts imports it, so it must not import data.ts or any server-only module.
import { MAX_REPORTED_ISSUES, type BuildsError, type SimulateError } from './api';
import type { BuildOrderIssue } from './model';

/** The framework-neutral reply a route handler returns: status, headers and optional body (Route). */
export interface RouteReply<Body = unknown> {
  status: number;
  headers?: Record<string, string>;
  body?: Body;
}

/** The part of a Next response that sendReply writes to. */
export interface ReplyTarget<Body = unknown> {
  status(code: number): ReplyTarget<Body>;
  setHeader(name: string, value: string): unknown;
  json(body: Body): void;
  end(chunk?: string): void;
}

/** Whether a value is a non-null, non-array object, as a JSON request body must be (Route). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The 405 reply, with the allowed methods in `Allow` (Route). */
export function methodNotAllowed(method: string | undefined, allowed: readonly string[]): RouteReply<BuildsError> {
  return {
    status: 405,
    headers: { Allow: allowed.join(', ') },
    body: { error: `method ${method} is not allowed; use ${allowed.join(' or ')}` },
  };
}

/** The one-`syntax`-issue error for a request body that is not a JSON object (Route). */
export function notAnObjectError(): SimulateError {
  const message = 'request body: must be a JSON object';
  return { error: message, issues: [{ code: 'syntax', message }] };
}

/** Builds the 400 body from at least one issue (the caller guarantees it): the first issue's message is the error, and issues past MAX_REPORTED_ISSUES are dropped and counted in omittedIssues (Route). */
export function issuesError(all: readonly BuildOrderIssue[]): SimulateError {
  const issues = all.slice(0, MAX_REPORTED_ISSUES);
  const omittedIssues = all.length - issues.length;
  return { error: issues[0].message, issues, ...(omittedIssues > 0 ? { omittedIssues } : {}) };
}

/**
 * Writes a RouteReply to the response. Body is inferred from the response alone: json is declared as a method,
 * so its parameter is bivariant even under strictFunctionTypes, and inferring Body from the reply too would let
 * a response type that lacks one of the reply's bodies compile.
 */
export function sendReply<Body>(res: ReplyTarget<Body>, reply: RouteReply<NoInfer<Body>>): void {
  res.status(reply.status);
  for (const [name, value] of Object.entries(reply.headers ?? {})) res.setHeader(name, value);
  if (reply.body === undefined) res.end();
  else if (reply.headers?.ETag !== undefined) sendWithOwnEtag(res, reply.body);
  else res.json(reply.body);
}

// Next replaces the ETag of a res.json body with a hash of that body, so a body with its own ETag is written directly.
function sendWithOwnEtag(res: ReplyTarget<unknown>, body: unknown): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
