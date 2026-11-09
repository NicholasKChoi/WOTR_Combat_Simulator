import { describe, expect, it, vi } from 'vitest'
import { MAX_REPORTED_ISSUES } from './api'
import { listBuilds } from './builds'
import type { BuildOrder } from './model'
import { formatBuildOrderText } from './parse-text'
import {
    SAVED_BUILD_ID_PATTERN,
    SAVED_BUILD_MAX_BYTES,
    SAVED_NAME_MAX_CHARS,
    checkSaveBuildRequest,
    isSavedBuildId,
    rateCounterKey,
    savedBuildId,
    savedBuildKey,
    savedBuildPath,
    savedBuildSchema,
    storageEnv,
    type SavedBuild,
} from './saved-builds'
import { buildOrderCatalog, checkBuildOrder } from './schema'
import { ENGLISH } from './test-helpers'

vi.mock('./parse-text', async (importOriginal) => {
    const original = await importOriginal<typeof import('./parse-text')>()
    return { ...original, formatBuildOrderText: vi.fn(original.formatBuildOrderText) }
})

const catalog = buildOrderCatalog(ENGLISH)
const [firstBuild, secondBuild] = listBuilds()

const withOrder = (changes: Partial<BuildOrder>, durationSeconds: unknown = 600) => ({ buildOrder: { ...firstBuild, ...changes }, durationSeconds })

function failure(body: unknown) {
    const result = checkSaveBuildRequest(body, catalog)
    if (result.ok) throw new Error('expected the request to fail')
    return result
}

function badRequest(body: unknown) {
    const result = failure(body)
    if (result.status !== 400) throw new Error('expected 400')
    return result.error
}

describe('savedBuildId', () => {
    const record: SavedBuild = { version: 1, buildOrder: firstBuild, durationSeconds: 600 }

    it.each([
        ['the first build', record],
        ['the second build', { ...record, buildOrder: secondBuild }],
        ['a short duration', { ...record, durationSeconds: 60 }],
    ])('gives 11 url-safe characters for %s', async (_label, value) => {
        const id = await savedBuildId(value)
        expect(id).toHaveLength(11)
        expect(id).toMatch(SAVED_BUILD_ID_PATTERN)
    })

    it('uses only url-safe characters across many records', async () => {
        const ids = await Promise.all(Array.from({ length: 100 }, (_, index) => savedBuildId({ ...record, durationSeconds: 60 + index })))
        expect(ids.filter((id) => !SAVED_BUILD_ID_PATTERN.test(id))).toStrictEqual([])
    })

    it('gives the same id for the same record, whatever the key order of the input', async () => {
        const parsed = savedBuildSchema.parse(record)
        const reordered = savedBuildSchema.parse({ durationSeconds: 600, buildOrder: { steps: firstBuild.steps, name: firstBuild.name, civ: firstBuild.civ, source: firstBuild.source, start: firstBuild.start }, version: 1 })
        const id = await savedBuildId(parsed)
        expect(await savedBuildId(parsed)).toBe(id)
        expect(await savedBuildId(reordered)).toBe(id)
    })

    it.each([
        ['durationSeconds', { ...record, durationSeconds: 601 }],
        ['the name', { ...record, buildOrder: { ...firstBuild, name: 'other' } }],
        ['one step', { ...record, buildOrder: { ...firstBuild, steps: firstBuild.steps.slice(1) } }],
    ])('gives a different id when %s changes', async (_label, changed) => {
        expect(await savedBuildId(changed)).not.toBe(await savedBuildId(record))
    })
})

describe('isSavedBuildId', () => {
    it.each([
        ['Zx3_k9-QaB0', true],
        ['abc', false],
        ['Zx3_k9-QaB', false],
        ['Zx3_k9-QaB00', false],
        ['Zx3.k9-QaB0', false],
        ['Zx3/k9-QaB0', false],
        ['Zx3=k9-QaB0', false],
        ['Zx3_k9-QaB0\n', false],
        [undefined, false],
        [null, false],
        [12345678901, false],
        [['Zx3_k9-QaB0'], false],
    ])('%j is %s', (value, expected) => {
        expect(isSavedBuildId(value)).toBe(expected)
    })
})

describe('storageEnv', () => {
    it.each([
        ['production', 'production'],
        ['preview', 'preview'],
        ['development', 'development'],
        [undefined, 'development'],
        ['', 'development'],
        ['Production', 'development'],
        ['staging', 'development'],
    ])('%j gives %s', (value, expected) => {
        expect(storageEnv(value)).toBe(expected)
    })
})

describe('keys', () => {
    it('lays out build keys, rate counter keys and paths', () => {
        expect(savedBuildKey('preview', 'Zx3_k9-QaB0')).toBe('preview/builds/Zx3_k9-QaB0.json')
        expect(rateCounterKey('development', 'AbCdEfGhIjKlMnOp')).toBe('development/rate-limit/AbCdEfGhIjKlMnOp.json')
        expect(savedBuildPath('Zx3_k9-QaB0')).toBe('/apps/aoe4-build-order?b=Zx3_k9-QaB0')
    })
})

describe('checkSaveBuildRequest', () => {
    it.each([[[]], [null], ['x']])('rejects the non-object body %j', (body) => {
        const message = 'request body: must be a JSON object'
        expect(failure(body)).toStrictEqual({ ok: false, status: 400, error: { error: message, issues: [{ code: 'syntax', message }] } })
    })

    it('reports an order issue from checkBuildOrder', () => {
        const steps = [{ action: 'produce', producer: 'capital-town-center', unit: 'knigt' }] as unknown as BuildOrder['steps']
        const error = badRequest(withOrder({ steps }))
        expect(error.issues).toHaveLength(1)
        expect(error.issues[0]).toMatchObject({ code: 'unknown-id', step: 0 })
    })

    it.each([
        [59, 'durationSeconds: 59 is outside 60..3600'],
        [3601, 'durationSeconds: 3601 is outside 60..3600'],
        [61.5, 'durationSeconds: 61.5 is not an integer'],
        [undefined, 'durationSeconds: missing'],
        ['60', 'durationSeconds: must be a number'],
    ])('rejects durationSeconds %j', (durationSeconds, message) => {
        const error = badRequest({ buildOrder: firstBuild, durationSeconds })
        expect(error).toStrictEqual({ error: message, issues: [{ code: 'out-of-range', message }] })
    })

    it('accepts a name of 100 characters and rejects 101', () => {
        expect(checkSaveBuildRequest(withOrder({ name: 'n'.repeat(SAVED_NAME_MAX_CHARS) }), catalog).ok).toBe(true)
        const message = 'name: 101 characters, more than 100'
        expect(badRequest(withOrder({ name: 'n'.repeat(101) }))).toStrictEqual({ error: message, issues: [{ code: 'out-of-range', message }] })
    })

    it('rejects a record over the byte cap by UTF-8 bytes, not characters', () => {
        const source = '€'.repeat(30_000)
        const result = failure(withOrder({ source }))
        const bytes = new TextEncoder().encode(JSON.stringify({ version: 1, buildOrder: { ...firstBuild, source }, durationSeconds: 600 })).length
        expect(bytes).toBeGreaterThan(SAVED_BUILD_MAX_BYTES)
        expect(source.length).toBeLessThan(SAVED_BUILD_MAX_BYTES)
        expect(result).toStrictEqual({ ok: false, status: 413, error: { error: `saved build: ${bytes} bytes, more than 65536` } })
        expect(checkSaveBuildRequest(withOrder({ source: 'short' }), catalog).ok).toBe(true)
    })

    it.each([[60], [3600]])('accepts durationSeconds %i and returns the record with its json', (durationSeconds) => {
        const result = checkSaveBuildRequest(withOrder({}, durationSeconds), catalog)
        if (!result.ok) throw new Error('expected ok')
        expect(result.record.version).toBe(1)
        expect(result.record.durationSeconds).toBe(durationSeconds)
        expect(result.json).toBe(JSON.stringify(result.record))
    })

    describe('issue order', () => {
        const badSteps = [{ action: 'produce', producer: 'capital-town-center', unit: 'knigt' }] as unknown as BuildOrder['steps']

        it('lists order issues, then the duration issue', () => {
            const codes = badRequest(withOrder({ steps: badSteps }, 59)).issues.map((found) => found.code)
            expect(codes).toStrictEqual(['unknown-id', 'out-of-range'])
        })

        it('skips the name check for an invalid order', () => {
            const issues = badRequest(withOrder({ steps: badSteps, name: 'n'.repeat(101) })).issues
            expect(issues.map((found) => found.message.startsWith('name:'))).toStrictEqual([false])
        })

        it('lists the duration issue before the name issue', () => {
            const messages = badRequest(withOrder({ name: 'n'.repeat(101) }, 59)).issues.map((found) => found.message)
            expect(messages).toStrictEqual(['durationSeconds: 59 is outside 60..3600', 'name: 101 characters, more than 100'])
        })

        it('caps the issues and counts the rest', () => {
            const steps = Array.from({ length: 150 }, () => badSteps[0])
            const order = withOrder({ steps })
            const uncapped = checkBuildOrder(order.buildOrder, catalog)
            const total = uncapped.ok ? 0 : uncapped.issues.length
            const error = badRequest(order)
            expect(total).toBeGreaterThan(MAX_REPORTED_ISSUES)
            expect(error.issues).toHaveLength(MAX_REPORTED_ISSUES)
            expect(error.omittedIssues).toBe(total - MAX_REPORTED_ISSUES)
            expect(error.error).toBe(error.issues[0].message)
        })
    })

    describe('paste round trip', () => {
        it.each(listBuilds().map((build) => [build.name, build] as const))('accepts the shipped build %s', (_name, build) => {
            expect(checkSaveBuildRequest({ buildOrder: build, durationSeconds: 600 }, catalog).ok).toBe(true)
        })

        it('returns the text length issue when the formatted text is too long', () => {
            vi.mocked(formatBuildOrderText).mockReturnValueOnce('x'.repeat(20_001))
            const message = 'text: 20001 characters, more than 20000'
            expect(failure(withOrder({}))).toStrictEqual({ ok: false, status: 400, error: { error: message, issues: [{ code: 'out-of-range', message }] } })
        })

        it('rejects a fractional walkSeconds with the parse issue', () => {
            const steps = firstBuild.steps.map((step, index) => (index === 1 ? { ...step, walkSeconds: 2.5 } : step)) as BuildOrder['steps']
            const error = badRequest(withOrder({ steps }))
            expect(error.issues[0]).toMatchObject({ code: 'syntax', message: expect.stringMatching(/^line \d+: expected walk seconds like 4s, got '2\.5s'$/) })
            expect(error.issues.map((found) => found.code)).not.toContain('invalid')
        })

        it('rejects a build whose reopened text differs, and accepts its own text', () => {
            vi.mocked(formatBuildOrderText).mockReturnValueOnce(formatBuildOrderText(secondBuild))
            const message = 'build order: reopening it as text would change the build; use whole numbers for times and counts'
            expect(failure(withOrder({}))).toStrictEqual({ ok: false, status: 400, error: { error: message, issues: [{ code: 'invalid', message }] } })
            expect(checkSaveBuildRequest(withOrder({}), catalog).ok).toBe(true)
        })
    })
})
