// Named (editable) builds: ids, edit secrets, stored and public shapes, storage keys and request-header parsers.
// Browser-safe: Web Crypto only, no node: modules.
import { z } from 'zod';
import { base64UrlEncode, base64UrlSha256, savedBuildSchema } from './saved-builds';

/** Random bytes in a named-build id. */
export const NAMED_BUILD_ID_BYTES = 16;
/** The form of a named-build id: 22 base64url characters. */
export const NAMED_BUILD_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
/** Random bytes in an edit secret. */
export const EDIT_SECRET_BYTES = 32;
/** The form of an edit secret: 43 base64url characters. */
export const EDIT_SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** The Cache-Control of a named-build GET, which must always see the latest revision (Named builds routes). */
export const NAMED_BUILD_CACHE_CONTROL = 'no-store';

const BEARER_PREFIX = 'Bearer ';
const REVISION_PATTERN = /^[1-9][0-9]{0,15}$/;
const IF_MATCH_PATTERN = /^"([^"]*)"$/;

/** Returns the given number of random bytes; replaceable so ids and secrets can be made deterministic. */
export type RandomBytes = (count: number) => Uint8Array;

const cryptoRandomBytes: RandomBytes = (count) => crypto.getRandomValues(new Uint8Array(count));

/** Whether a value is a well-formed named-build id (Named builds routes). */
export function isNamedBuildId(value: unknown): value is string {
  return typeof value === 'string' && NAMED_BUILD_ID_PATTERN.test(value);
}

/** A new random named-build id (Named builds routes). */
export function newNamedBuildId(random: RandomBytes = cryptoRandomBytes): string {
  return base64UrlEncode(random(NAMED_BUILD_ID_BYTES));
}

/** A new random edit secret (Named builds routes). */
export function newEditSecret(random: RandomBytes = cryptoRandomBytes): string {
  return base64UrlEncode(random(EDIT_SECRET_BYTES));
}

/** The hash the store keeps in place of an edit secret (Named builds routes). */
export function editSecretHash(secret: string): Promise<string> {
  return base64UrlSha256(secret);
}

/** Compares two secret hashes in time that does not depend on where they differ. */
export function sameSecretHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

/** Schema of a named build as stored: a saved build plus its revision, timestamps and secret hash. */
export const storedNamedBuildSchema = savedBuildSchema.extend({
  revision: z.number().int().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  secretHash: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});

/** A named build as stored, with its secret hash. */
export type StoredNamedBuild = z.infer<typeof storedNamedBuildSchema>;
/** A named build as GET returns it: the stored build without its secret hash, plus its id (Named builds routes). */
export type NamedBuild = Omit<StoredNamedBuild, 'secretHash'> & { id: string };

/** The 201 body of a named-build create, the only place the edit secret appears (Named builds routes). */
export interface CreateNamedBuildResponse {
  id: string;
  path: string;
  editSecret: string;
  revision: 1;
  updatedAt: string;
}

/** The 200 body of a named-build update (Named builds routes). */
export interface UpdateNamedBuildResponse {
  id: string;
  path: string;
  revision: number;
  updatedAt: string;
}

/** The body of a named-build rename: the new name, which the route trims (Named builds routes). */
export interface RenameNamedBuildRequest {
  name: string;
}

/** The storage key of a named build in a deployment env. */
export const namedBuildKey = (env: string, id: string): string => `${env}/named-builds/${id}.json`;
/** The page path that opens a named build. */
export const namedBuildPath = (id: string): string => `/apps/aoe4-build-order?n=${id}`;
/** The ETag of a revision: its number in quotes (Named builds routes). */
export const revisionEtag = (revision: number): string => `"${revision}"`;

/** Takes the edit secret from a Bearer Authorization header, or null when absent or malformed (Named builds routes). */
export function parseEditSecret(authorization: string | undefined): string | null {
  if (authorization === undefined || !authorization.startsWith(BEARER_PREFIX)) return null;
  const secret = authorization.slice(BEARER_PREFIX.length);
  return EDIT_SECRET_PATTERN.test(secret) ? secret : null;
}

/** Takes the revision from an If-Match header such as "3", or null when absent or malformed (Named builds routes). */
export function parseIfMatchRevision(ifMatch: string | undefined): number | null {
  const digits = ifMatch === undefined ? undefined : IF_MATCH_PATTERN.exec(ifMatch)?.[1];
  if (digits === undefined || !REVISION_PATTERN.test(digits)) return null;
  const revision = Number(digits);
  return revision <= Number.MAX_SAFE_INTEGER ? revision : null;
}
