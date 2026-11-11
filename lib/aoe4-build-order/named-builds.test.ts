import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import {
    EDIT_SECRET_PATTERN,
    NAMED_BUILD_CACHE_CONTROL,
    editSecretHash,
    isNamedBuildId,
    namedBuildKey,
    namedBuildPath,
    newEditSecret,
    newNamedBuildId,
    parseEditSecret,
    parseIfMatchRevision,
    revisionEtag,
    sameSecretHash,
    storedNamedBuildSchema,
    type NamedBuild,
    type RandomBytes,
} from './named-builds'
import { savedBuildId } from './saved-builds'

const filled =
    (byte: number): RandomBytes =>
    (count) =>
        new Uint8Array(count).fill(byte)

const throwing: RandomBytes = () => {
    throw new Error('no entropy')
}

const SECRET = 'A'.repeat(43)

describe('newNamedBuildId', () => {
    it.each([
        ['all zero bytes', 0, 'A'.repeat(22)],
        ['all 0xff bytes', 0xff, `${'_'.repeat(21)}w`],
    ])('encodes %s', (_name, byte, expected) => {
        expect(newNamedBuildId(filled(byte))).toBe(expected)
    })

    it('throws when the random source throws', () => {
        expect(() => newNamedBuildId(throwing)).toThrow('no entropy')
    })

    it('gives distinct ids from the default source', () => {
        expect(newNamedBuildId()).not.toBe(newNamedBuildId())
    })
})

describe('isNamedBuildId', () => {
    const shortId = 'A'.repeat(21)
    const longId = 'A'.repeat(23)

    it.each([
        ['22 A characters', 'A'.repeat(22), true],
        ['the all-0xff id', `${'_'.repeat(21)}w`, true],
        ['21 characters', shortId, false],
        ['23 characters', longId, false],
        ['a number', 22, false],
        ['undefined', undefined, false],
    ])('%s', (_name, value, expected) => {
        expect(isNamedBuildId(value)).toBe(expected)
    })

    it('rejects a saved build id', async () => {
        const id = await savedBuildId({ version: 1, buildOrder: listBuilds()[0], durationSeconds: 600 })
        expect(id).toHaveLength(11)
        expect(isNamedBuildId(id)).toBe(false)
    })
})

describe('newEditSecret', () => {
    it('encodes 32 zero bytes as 43 characters', () => {
        const secret = newEditSecret(filled(0))
        expect(secret).toBe(SECRET)
        expect(EDIT_SECRET_PATTERN.test(secret)).toBe(true)
    })

    it('throws when the random source throws', () => {
        expect(() => newEditSecret(throwing)).toThrow('no entropy')
    })
})

describe('editSecretHash', () => {
    it('is the base64url SHA-256 of the secret', async () => {
        const expected = createHash('sha256').update('hunter2').digest('base64url')
        expect(expected).toHaveLength(43)
        expect(await editSecretHash('hunter2')).toBe(expected)
    })

    it('differs for different secrets', async () => {
        expect(await editSecretHash('a')).not.toBe(await editSecretHash('b'))
    })
})

describe('sameSecretHash', () => {
    it.each([
        ['equal strings', 'abcdef', 'abcdef', true],
        ['the first character differs', 'abcdef', 'xbcdef', false],
        ['the last character differs', 'abcdef', 'abcdex', false],
        ['one character differs in the middle', 'abcdef', 'abcxef', false],
        ['different lengths', 'abcdef', 'abcde', false],
        ['the first is a prefix of the second', 'abcde', 'abcdef', false],
        ['empty strings', '', '', true],
    ])('%s', (_name, a, b, expected) => {
        expect(sameSecretHash(a, b)).toBe(expected)
    })
})

describe('parseEditSecret', () => {
    it.each([
        ['a valid bearer secret', `Bearer ${SECRET}`, SECRET],
        ['undefined', undefined, null],
        ['an empty header', '', null],
        ['a lowercase scheme', `bearer ${SECRET}`, null],
        ['two spaces', `Bearer  ${SECRET}`, null],
        ['a trailing space', `Bearer ${SECRET} `, null],
        ['another scheme', `Basic ${SECRET}`, null],
        ['a 42-character token', `Bearer ${'A'.repeat(42)}`, null],
        ['a 44-character token', `Bearer ${'A'.repeat(44)}`, null],
    ])('%s', (_name, header, expected) => {
        expect(parseEditSecret(header)).toBe(expected)
    })
})

describe('parseIfMatchRevision', () => {
    it.each([
        ['"1"', '"1"', 1],
        ['the largest safe integer', '"9007199254740991"', 9007199254740991],
        ['undefined', undefined, null],
        ['a weak ETag', 'W/"1"', null],
        ['a star', '*', null],
        ['zero', '"0"', null],
        ['a leading zero', '"01"', null],
        ['an unquoted value', '1', null],
        ['a list', '"1", "2"', null],
        ['above the largest safe integer', '"9007199254740992"', null],
        ['a negative number', '"-1"', null],
        ['an empty ETag', '""', null],
    ])('%s', (_name, header, expected) => {
        expect(parseIfMatchRevision(header)).toBe(expected)
    })
})

describe('storedNamedBuildSchema', () => {
    const stored = {
        version: 1 as const,
        buildOrder: listBuilds()[0],
        durationSeconds: 600,
        revision: 2,
        createdAt: '2026-11-10T18:00:00.000Z',
        updatedAt: '2026-11-10T18:05:00.000Z',
        secretHash: SECRET,
    }

    it('accepts a stored build', () => {
        expect(storedNamedBuildSchema.safeParse(stored).success).toBe(true)
    })

    it.each([
        ['a missing secretHash', { secretHash: undefined }],
        ['a 42-character secretHash', { secretHash: 'A'.repeat(42) }],
        ['revision 0', { revision: 0 }],
        ['a fractional revision', { revision: 1.5 }],
        ['a non-ISO createdAt', { createdAt: 'yesterday' }],
        ['version 2', { version: 2 }],
    ])('rejects %s', (_name, change) => {
        expect(storedNamedBuildSchema.safeParse({ ...stored, ...change }).success).toBe(false)
    })

    it('keeps secretHash out of the public shape', () => {
        const { secretHash: _secretHash, ...rest } = stored
        const build: NamedBuild = { ...rest, id: 'A'.repeat(22) }
        // @ts-expect-error a NamedBuild has no secretHash
        const leaked: { secretHash: string } = build
        expect(leaked).toBe(build)
    })
})

describe('keys, paths and headers', () => {
    const id = 'A'.repeat(22)

    it('builds the exact strings', () => {
        expect(namedBuildKey('preview', id)).toBe(`preview/named-builds/${id}.json`)
        expect(namedBuildPath(id)).toBe(`/apps/aoe4-build-order?n=${id}`)
        expect(revisionEtag(3)).toBe('"3"')
        expect(NAMED_BUILD_CACHE_CONTROL).toBe('no-store')
    })
})
