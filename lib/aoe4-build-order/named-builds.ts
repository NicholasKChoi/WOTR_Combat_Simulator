// Named (editable) builds: ids, edit secrets, stored and public shapes, storage keys and request-header parsers.
// Browser-safe: Web Crypto only, no node: modules.
import { z } from 'zod';
import { base64UrlEncode, base64UrlSha256, savedBuildSchema } from './saved-builds';

export const NAMED_BUILD_VERSION = 1;
export const NAMED_BUILD_ID_BYTES = 16;
export const NAMED_BUILD_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
export const EDIT_SECRET_BYTES = 32;
export const EDIT_SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const NAMED_BUILD_CACHE_CONTROL = 'no-store';

const BEARER_PREFIX = 'Bearer ';
const REVISION_PATTERN = /^[1-9][0-9]{0,15}$/;
const IF_MATCH_PATTERN = /^"([^"]*)"$/;

export type RandomBytes = (count: number) => Uint8Array;

const cryptoRandomBytes: RandomBytes = (count) => crypto.getRandomValues(new Uint8Array(count));

export function isNamedBuildId(value: unknown): value is string {
  return typeof value === 'string' && NAMED_BUILD_ID_PATTERN.test(value);
}

export function newNamedBuildId(random: RandomBytes = cryptoRandomBytes): string {
  return base64UrlEncode(random(NAMED_BUILD_ID_BYTES));
}

export function newEditSecret(random: RandomBytes = cryptoRandomBytes): string {
  return base64UrlEncode(random(EDIT_SECRET_BYTES));
}

export function editSecretHash(secret: string): Promise<string> {
  return base64UrlSha256(secret);
}

export function sameSecretHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

export const storedNamedBuildSchema = savedBuildSchema.extend({
  revision: z.number().int().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  secretHash: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});

export type StoredNamedBuild = z.infer<typeof storedNamedBuildSchema>;
export type NamedBuild = Omit<StoredNamedBuild, 'secretHash'> & { id: string };

export interface CreateNamedBuildResponse {
  id: string;
  path: string;
  editSecret: string;
  revision: 1;
  updatedAt: string;
}

export interface UpdateNamedBuildResponse {
  id: string;
  path: string;
  revision: number;
  updatedAt: string;
}

export const namedBuildKey = (env: string, id: string): string => `${env}/named-builds/${id}.json`;
export const namedBuildPath = (id: string): string => `/apps/aoe4-build-order?n=${id}`;
export const revisionEtag = (revision: number): string => `"${revision}"`;

export function parseEditSecret(authorization: string | undefined): string | null {
  if (authorization === undefined || !authorization.startsWith(BEARER_PREFIX)) return null;
  const secret = authorization.slice(BEARER_PREFIX.length);
  return EDIT_SECRET_PATTERN.test(secret) ? secret : null;
}

export function parseIfMatchRevision(ifMatch: string | undefined): number | null {
  const digits = ifMatch === undefined ? undefined : IF_MATCH_PATTERN.exec(ifMatch)?.[1];
  if (digits === undefined || !REVISION_PATTERN.test(digits)) return null;
  const revision = Number(digits);
  return revision <= Number.MAX_SAFE_INTEGER ? revision : null;
}
