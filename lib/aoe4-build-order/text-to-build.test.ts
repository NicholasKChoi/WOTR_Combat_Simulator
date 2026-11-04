import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import type { BuildOrderIssue } from './model'
import { formatBuildOrderText, parseBuildOrderText } from './parse-text'
import { buildOrderCatalog, checkBuildOrder } from './schema'
import { ENGLISH } from './test-helpers'
import { textToBuildOrder } from './text-to-build'

const catalog = buildOrderCatalog(ENGLISH)

describe('textToBuildOrder', () => {
    it('returns a checked paste with its lines', () => {
        const knightLongbow = listBuilds().find((build) => build.name === "ENG Knight/Longbow (King's Palace)")!
        const text = formatBuildOrderText(knightLongbow)
        const parsed = parseBuildOrderText(text)
        if (!parsed.ok) throw new Error('expected the shipped build to parse')
        expect(textToBuildOrder(text, catalog)).toStrictEqual({ ok: true, order: parsed.order, lines: parsed.lines })
    })

    it.each([
        [
            'start 6 sheep -> sheep\n# knights\nproduce knigt from stable',
            { code: 'unknown-id', message: 'line 3: unknown unit "knigt"', step: 0, line: 3, suggestion: 'knight' },
            { start: 1, steps: [3] },
        ],
        [
            'start 5 sheep -> sheep\npause capital-town-center',
            { code: 'invalid', message: 'line 1: start.villagers sums to 5, the civ starts with 6', line: 1 },
            { start: 1, steps: [2] },
        ],
        [
            'start -> sheep\n\nproduce longbowman from stable',
            { code: 'invalid', message: 'line 3: stable cannot produce longbowman', step: 0, line: 3 },
            { start: 1, steps: [3] },
        ],
        [
            'start -> sheep\nresearch wheelbarrow\nresearch wheelbarrow',
            { code: 'invalid', message: 'line 3: wheelbarrow is already researched by line 2', step: 1, line: 3 },
            { start: 1, steps: [2, 3] },
        ],
        [
            'pause capital-town-center',
            { code: 'invalid', message: 'start: no start.rally while starting building capital-town-center produces villagers' },
            { steps: [1] },
        ],
    ])('labels check issues by paste line for %j', (text, found, lines) => {
        expect(textToBuildOrder(text, catalog)).toStrictEqual({ ok: false, issues: [found], lines })
    })

    it('returns the syntax issues without lines when every other line is valid', () => {
        const text = 'start -> sheep\nfly'
        const result = textToBuildOrder(text, catalog)
        const failed = parseBuildOrderText(text)
        if (failed.ok) throw new Error('expected a syntax issue')
        expect(result).toStrictEqual({ ok: false, issues: failed.issues })
        expect('lines' in result).toBe(false)
    })

    it('lists the field issues of the parsed lines with the syntax issues in line order', () => {
        expect(textToBuildOrder('start -> sheep\nproduce knigt from stable\nbuild hous', catalog)).toStrictEqual({
            ok: false,
            issues: [
                { code: 'unknown-id', message: 'line 2: unknown unit "knigt"', line: 2, suggestion: 'knight' },
                { code: 'syntax', message: "line 3: expected 'from', got end of line", line: 3 },
            ],
        })
        const linesOf = (text: string) => (textToBuildOrder(text, catalog) as { issues: BuildOrderIssue[] }).issues.map((found) => found.line)
        expect(linesOf('start -> sheep\nfly\nproduce knigt from stable\nbuild house from wod\nbuild')).toEqual([2, 3, 4, 5])
    })

    it('puts issues without a line before the first line', () => {
        const text = ['start -> sheep', ...Array(201).fill('pause capital-town-center'), 'fly'].join('\n')
        const result = textToBuildOrder(text, catalog)
        if (result.ok) throw new Error('expected issues')
        expect(result.issues[0]).toStrictEqual({ code: 'out-of-range', message: 'steps: 201 steps, more than 200' } satisfies BuildOrderIssue)
        expect(result.issues[1]).toMatchObject({ code: 'syntax', line: 203 })
    })

    it.each([
        ['a start line that fails to parse', 'start nonsense\npause capital-town-center'],
        ['a repeated research', 'research wheelbarrow\nresearch wheelbarrow\nfly'],
    ])('skips the start and cross-step rules while a line fails to parse: %s', (_name, text) => {
        const result = textToBuildOrder(text, catalog)
        if (result.ok) throw new Error('expected issues')
        expect(result.issues.map((found) => found.code)).toEqual(['syntax'])
    })

    it('keeps a per-step cross-field issue on a parse failure, with its line and no step', () => {
        const result = textToBuildOrder('start -> sheep\nproduce longbowman from stable\nfly', catalog)
        if (result.ok) throw new Error('expected issues')
        expect(result.issues[0]).toStrictEqual({ code: 'invalid', message: 'line 2: stable cannot produce longbowman', line: 2 })
    })

    it('checks the order parsed from empty text', () => {
        const parsed = parseBuildOrderText('')
        if (!parsed.ok) throw new Error('expected empty text to parse')
        const checked = checkBuildOrder(parsed.order, catalog, parsed.lines)
        if (checked.ok) throw new Error('expected the missing start rally to be reported')
        expect(textToBuildOrder('', catalog)).toStrictEqual({ ok: false, issues: checked.issues, lines: { steps: [] } })
    })

    it('accepts text of exactly 20000 characters', () => {
        const head = 'start -> sheep\npause capital-town-center\n#'
        const text = head.padEnd(20000, 'x')
        expect(textToBuildOrder(text, catalog)).toMatchObject({ ok: true, lines: { start: 1, steps: [2] } })
    })

    it('rejects longer text before parsing it', () => {
        const text = 'not a build order '.repeat(1200).slice(0, 20001)
        expect(textToBuildOrder(text, catalog)).toStrictEqual({
            ok: false,
            issues: [{ code: 'out-of-range', message: 'text: 20001 characters, more than 20000' }],
        })
    })

    it('gives equal results for the same text', () => {
        const text = 'start 6 sheep\nproduce knigt from stable\nfly'
        expect(textToBuildOrder(text, catalog)).toStrictEqual(textToBuildOrder(text, catalog))
        const pasted = 'start -> sheep\nproduce knigt from stable'
        expect(textToBuildOrder(pasted, catalog)).toStrictEqual(textToBuildOrder(pasted, catalog))
    })
})
