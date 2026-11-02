import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
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
            { code: 'unknown-id', message: 'line 3: unknown unit "knigt" in unit', step: 0, line: 3, suggestion: 'knight' },
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

    it('returns a parse failure unchanged and without lines', () => {
        const text = 'start -> sheep\nfly'
        const result = textToBuildOrder(text, catalog)
        expect(result).toStrictEqual(parseBuildOrderText(text))
        expect(result.ok).toBe(false)
        expect('lines' in result).toBe(false)
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
