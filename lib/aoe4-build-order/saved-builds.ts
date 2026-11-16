// The saved-build record, its content-addressed id, storage keys and the checks a save request must pass.
// Browser-safe: Web Crypto only, no node: modules.
import { z } from 'zod';
import type { BuildsError, SimulateError } from './api';
import { isPlainObject, issuesError, notAnObjectError } from './api-route';
import type { BuildOrder, BuildOrderIssue } from './model';
import { formatBuildOrderText } from './parse-text';
import { buildOrderShape, checkBuildOrder, outOfRange, type BuildOrderCatalog } from './schema';
import { textToBuildOrder } from './text-to-build';

/** The format version stored in every saved build. */
export const SAVED_BUILD_VERSION = 1;

/** Schema of a saved build record: version, build order and duration (Saving a build and opening it by link). */
export const savedBuildSchema = z.object({
  version: z.literal(SAVED_BUILD_VERSION),
  buildOrder: buildOrderShape,
  durationSeconds: z.number().int(),
});

/** The stored record of a saved build (Saving a build and opening it by link). */
export type SavedBuild = z.infer<typeof savedBuildSchema>;
/** The body of POST /builds: a saved build without its version (Builds routes). */
export type SaveBuildRequest = Omit<SavedBuild, 'version'>;
/** The body of a successful save: the build id and the page path that opens it (Builds routes). */
export interface SaveBuildResponse {
  id: string;
  path: string;
}

/** The form of a saved-build id: 11 base64url characters. */
export const SAVED_BUILD_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
/** The largest allowed saved build, in JSON bytes; a larger one is a 413 (Builds routes). */
export const SAVED_BUILD_MAX_BYTES = 65_536;
/** The longest allowed build name, in characters. */
export const SAVED_NAME_MAX_CHARS = 100;

const ID_LENGTH = 11;

/** Whether a value is a well-formed saved-build id (Builds routes). */
export function isSavedBuildId(value: unknown): value is string {
  return typeof value === 'string' && SAVED_BUILD_ID_PATTERN.test(value);
}

/** Encodes bytes as unpadded base64url. */
export function base64UrlEncode(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/** The SHA-256 of a text as unpadded base64url. */
export async function base64UrlSha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return base64UrlEncode(new Uint8Array(digest));
}

/** The content-addressed id of a record, the first 11 characters of its hash, so the same build gets the same id (Builds routes). */
export async function savedBuildId(record: SavedBuild): Promise<string> {
  return (await base64UrlSha256(JSON.stringify(record))).slice(0, ID_LENGTH);
}

/** Maps VERCEL_ENV to the storage prefix: production and preview as they are, anything else development. */
export function storageEnv(vercelEnv: string | undefined): string {
  return vercelEnv === 'production' || vercelEnv === 'preview' ? vercelEnv : 'development';
}

/** The storage env of a deployment, or null on Vercel when VERCEL_ENV is unset, which must not fall back to the development prefix because that also allows DELETE (Builds routes). */
export function deploymentEnv(env: { VERCEL?: string; VERCEL_ENV?: string }): string | null {
  if (env.VERCEL && !env.VERCEL_ENV) return null;
  return storageEnv(env.VERCEL_ENV);
}

/** The storage key of a saved build in a deployment env. */
export const savedBuildKey = (env: string, id: string): string => `${env}/builds/${id}.json`;
/** The storage key of a client's save-rate counter. */
export const rateCounterKey = (env: string, clientKey: string): string => `${env}/rate-limit/${clientKey}.json`;
/** The page path that opens a saved build (Saving a build and opening it by link). */
export const savedBuildPath = (id: string): string => `/apps/aoe4-build-order?b=${id}`;

type SaveCheck =
  | { ok: true; record: SavedBuild; json: string }
  | { ok: false; status: 400; error: SimulateError }
  | { ok: false; status: 413; error: BuildsError };

function badRequest(all: BuildOrderIssue[]): SaveCheck {
  return { ok: false, status: 400, error: issuesError(all) };
}

function durationIssue(value: unknown): BuildOrderIssue | undefined {
  if (value === undefined) return { code: 'out-of-range', message: 'durationSeconds: missing' };
  if (typeof value !== 'number') return { code: 'out-of-range', message: 'durationSeconds: must be a number' };
  const problem = outOfRange(value, 'durationSeconds');
  return problem === undefined ? undefined : { code: 'out-of-range', message: `durationSeconds: ${problem}` };
}

function nameIssue(order: BuildOrder): BuildOrderIssue | undefined {
  if (order.name.length <= SAVED_NAME_MAX_CHARS) return undefined;
  return { code: 'out-of-range', message: `name: ${order.name.length} characters, more than ${SAVED_NAME_MAX_CHARS}` };
}

function sortedKeys(_key: string, value: unknown): unknown {
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a, sortedKeys) === JSON.stringify(b, sortedKeys);

function roundTripIssues(order: BuildOrder, catalog: BuildOrderCatalog): BuildOrderIssue[] {
  const reopened = textToBuildOrder(formatBuildOrderText(order), catalog);
  if (!reopened.ok) return reopened.issues;
  if (sameValue(reopened.order.steps, order.steps) && sameValue(reopened.order.start, order.start)) return [];
  return [{ code: 'invalid', message: 'build order: reopening it as text would change the build; use whole numbers for times and counts' }];
}

/** Checks a save body into the record and its JSON, or a 400 with issues or a 413 over SAVED_BUILD_MAX_BYTES; the build must also survive a round trip through paste text (Builds routes). */
export function checkSaveBuildRequest(body: unknown, catalog: BuildOrderCatalog): SaveCheck {
  if (!isPlainObject(body)) return { ok: false, status: 400, error: notAnObjectError() };
  const checked = checkBuildOrder(body.buildOrder, catalog);
  const found = checked.ok ? [] : checked.issues;
  const duration = durationIssue(body.durationSeconds);
  if (duration !== undefined) found.push(duration);
  const name = checked.ok ? nameIssue(checked.order) : undefined;
  if (name !== undefined) found.push(name);
  if (found.length > 0 || !checked.ok) return badRequest(found);

  const record: SavedBuild = { version: SAVED_BUILD_VERSION, buildOrder: checked.order, durationSeconds: body.durationSeconds as number };
  const json = JSON.stringify(record);
  const bytes = new TextEncoder().encode(json).length;
  if (bytes > SAVED_BUILD_MAX_BYTES) return { ok: false, status: 413, error: { error: `saved build: ${bytes} bytes, more than ${SAVED_BUILD_MAX_BYTES}` } };

  const reopening = roundTripIssues(checked.order, catalog);
  if (reopening.length > 0) return badRequest(reopening);
  return { ok: true, record, json };
}
