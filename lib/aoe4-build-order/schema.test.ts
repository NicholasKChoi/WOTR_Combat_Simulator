import { describe, expect, it } from 'vitest'
import englishSnapshot from '../../data/aoe4-build-order/aoe4world/english.json'
import baseRules from '../../data/aoe4-build-order/rules/base.json'
import englishRules from '../../data/aoe4-build-order/rules/english.json'
import { listBuilds } from './builds'
import { type BaseRules, type CivData, type Snapshot, buildGameData } from './data'
import { FINITE_NODE_REFS, MAX_DEPOSITS, nodeKindOf } from './model'
import type { BuildStep } from './model'
import {
    INPUT_DEFAULTS,
    OPTIONAL_STEP_FIELDS,
    SIM_INPUT_BOUNDS,
    buildOrderCatalog,
    buildOrderSchema,
    buildOrderShape,
    checkBuildOrder,
    checkSimInputs,
    nearestId,
    nodeRefIssue,
    resolveSimInputs,
} from './schema'
import { ENGLISH } from './test-helpers'

const catalog = buildOrderCatalog(ENGLISH)

const TC = 'capital-town-center'

function order(steps: unknown[], start: unknown = { rally: 'sheep' }): Record<string, unknown> {
    return { civ: 'english', name: 'test', start, steps }
}

function messages(value: unknown): string[] {
    const result = checkBuildOrder(value, catalog)
    return result.ok ? [] : result.issues.map((found) => found.message)
}

function onlyIssue(value: unknown) {
    const result = checkBuildOrder(value, catalog)
    if (result.ok) throw new Error('expected issues')
    expect(result.issues).toHaveLength(1)
    return result.issues[0]
}

const pause = { action: 'pause', producer: TC }

describe('checkBuildOrder shape', () => {
    it.each([
        [null, 'build order: must be an object'],
        [[], 'build order: must be an object'],
        [{ ...order([]), civ: 3 }, 'civ: must be a string'],
        [{ name: 'test', start: { rally: 'sheep' }, steps: [] }, 'civ: must be a string'],
        [{ ...order([]), name: undefined }, 'name: must be a string'],
        [{ ...order([]), source: 3 }, 'source: must be a string'],
        [order([], 'x'), 'start: must be an object'],
        [{ ...order([]), steps: 'x' }, 'steps: must be an array'],
        [order([], { rally: 4 }), 'start: start.rally must be a string'],
        [order([], { rally: 'sheep', villagers: 6 }), 'start: start.villagers must be an object'],
        [order([], { rally: 'sheep', villagers: { sheep: '6' } }), 'start: start.villagers.sheep must be a number'],
    ])('reports %j as syntax', (value, message) => {
        expect(onlyIssue(value)).toStrictEqual({ code: 'syntax', message })
    })

    it.each([
        [5, 'is not an object'],
        [{}, 'missing action'],
        [{ action: 3 }, 'action must be a string'],
        [{ action: 'fly' }, 'unknown action "fly"'],
        [{ action: 'pause' }, 'missing producer'],
        [{ action: 'pause', producer: 5 }, 'producer must be a string'],
        [{ action: 'produce', producer: 'stable', unit: 'knight', count: '2' }, 'count must be a number'],
        [{ action: 'move', count: 'x', from: 'gold', to: 'wood' }, 'count must be a number or "all"'],
        [{ ...pause, trigger: 3 }, 'trigger must be an object'],
        [{ ...pause, trigger: { kind: 4 } }, 'trigger.kind must be a string'],
        [{ ...pause, trigger: { kind: 'time' } }, 'trigger.seconds must be a number'],
        [{ ...pause, trigger: { kind: 'bank', resource: 'wood' } }, 'trigger.atLeast must be a number'],
        [{ ...pause, trigger: { kind: 'depleted', node: 3 } }, 'trigger.node must be a string'],
        [{ ...pause, reaction: false }, 'reaction must be true'],
    ])('reports step %j as syntax', (step, text) => {
        expect(onlyIssue(order([step]))).toStrictEqual({ code: 'syntax', message: `steps[0]: ${text}`, step: 0 })
    })

    it.each([
        ['soon', undefined],
        ['tme', 'time'],
    ])('reports trigger kind %j with suggestion %j', (kind, suggestion) => {
        const found = onlyIssue(order([{ ...pause, trigger: { kind } }]))
        expect(found.code).toBe('unknown-trigger-kind')
        expect(found.message).toBe(`steps[0]: unknown trigger kind "${kind}"; the kinds are time, villagers, depleted, bank`)
        expect(found.suggestion).toBe(suggestion)
    })

    it('accepts a fractional walkSeconds and an empty step list', () => {
        const rallied = { action: 'produce', producer: TC, unit: 'villager', rally: 'sheep', walkSeconds: 0.5 }
        expect(checkBuildOrder(order([rallied]), catalog).ok).toBe(true)
        expect(checkBuildOrder(order([]), catalog).ok).toBe(true)
    })

    it('drops unknown keys at every level without an issue', () => {
        const step = { ...pause, trigger: { kind: 'time', seconds: 5, extra: 1 }, extra: 1 }
        const result = checkBuildOrder({ ...order([step], { rally: 'sheep', extra: 1 }), extra: 1 }, catalog)
        expect(result).toStrictEqual({ ok: true, order: order([{ ...pause, trigger: { kind: 'time', seconds: 5 } }]) })
    })

    it('caps the step count at 200', () => {
        expect(checkBuildOrder(order(Array(200).fill(pause)), catalog).ok).toBe(true)
        expect(onlyIssue(order(Array(201).fill(pause)))).toStrictEqual({ code: 'out-of-range', message: 'steps: 201 steps, more than 200' })
    })

    it('keeps the shape free of game data', () => {
        const unknownIds = { civ: 'french', name: 'test', steps: [{ action: 'produce', producer: 'nowhere', unit: 'knigt' }] }
        expect(buildOrderShape.safeParse(unknownIds).success).toBe(true)
        expect(buildOrderShape.safeParse({ ...unknownIds, steps: [{ action: 'produce', producer: 'stable', unit: 5 }] }).success).toBe(false)
    })
})

describe('checkBuildOrder ids and rules', () => {
    it.each([
        [order([{ action: 'produce', producer: 'stable', unit: 'longbowman' }]), 'invalid', 'steps[0]: stable cannot produce longbowman'],
        [order([{ action: 'produce', producer: 'stable', unit: 'knight', count: 0 }]), 'out-of-range', 'steps[0]: count: 0 is outside 1..200'],
        [order([{ action: 'move', count: 3, from: 'sheep', to: 'wood', walkSeconds: 61 }]), 'out-of-range', 'steps[0]: walkSeconds: 61 is outside 0..60'],
        [order([{ action: 'build', building: 'house', from: 'wood', builders: 1.5 }]), 'out-of-range', 'steps[0]: builders: 1.5 is not an integer'],
        [order([{ ...pause, trigger: { kind: 'time', seconds: 3601 } }]), 'out-of-range', 'steps[0]: trigger.seconds: 3601 is outside 0..3600'],
        [order([{ ...pause, trigger: { kind: 'villagers', count: 0 } }]), 'out-of-range', 'steps[0]: trigger.count: 0 is outside 1..200'],
        [order([{ ...pause, trigger: { kind: 'bank', resource: 'wood', atLeast: -1 } }]), 'out-of-range', 'steps[0]: trigger.atLeast: -1 is outside 0..100000'],
        [order([{ ...pause, trigger: { kind: 'bank', resource: 'iron', atLeast: 1 } }]), 'unknown-id', 'steps[0]: unknown resource "iron" in trigger.resource'],
        [order([{ ...pause, trigger: { kind: 'depleted', node: 'gold#1' } }]), 'invalid', 'steps[0]: node "gold#1": deposit 1 is written gold in trigger.node'],
        [order([{ ...pause, trigger: { kind: 'depleted', node: 'gold#9' } }]), 'out-of-range', 'steps[0]: node "gold#9": deposit number is outside 2..8 in trigger.node'],
        [order([{ ...pause, trigger: { kind: 'depleted', node: 'silver' } }]), 'unknown-id', 'steps[0]: unknown node "silver" in trigger.node'],
        [order([{ ...pause, trigger: { kind: 'depleted', node: 'wood' } }]), 'invalid', 'steps[0]: node "wood" never runs out in trigger.node'],
        [order([{ action: 'build', building: 'house', from: 'wood#2' }]), 'invalid', 'steps[0]: node "wood#2": only gold has numbered deposits in from'],
        [order([{ action: 'research', tech: 'wheelbarrow', at: 'stable' }]), 'invalid', 'steps[0]: wheelbarrow cannot be researched at stable'],
        [order([{ ...pause, reaction: true }]), 'invalid', 'steps[0]: only a step triggered by a node running out can be a reaction'],
        [order([{ action: 'produce', producer: TC, unit: 'villager', walkSeconds: 2 }]), 'invalid', 'steps[0]: walkSeconds without rally'],
        [order([{ action: 'produce', producer: 'stable', unit: 'knight', rally: 'gold' }]), 'invalid', 'steps[0]: rally on knight, which is not a villager'],
        [order([{ action: 'rally', producer: 'stable', to: 'gold' }]), 'invalid', 'steps[0]: rally on stable, which produces no villagers'],
        [order([{ action: 'produce', producer: 'siege-workshop', unit: 'siege-tower' }]), 'invalid', 'steps[0]: siege-workshop cannot produce siege-tower'],
        [{ ...order([]), civ: 'french' }, 'unknown-id', 'civ: unknown civ "french"'],
        [order([], { rally: 'sheep', villagers: { sheep: 5 } }), 'invalid', 'start: start.villagers sums to 5, the civ starts with 6'],
        [order([], { villagers: { sheep: 6 } }), 'invalid', 'start: no start.rally while starting building capital-town-center produces villagers'],
        [order([], { rally: 'sheep', villagers: { sheep: 201 } }), 'out-of-range', 'start: start.villagers.sheep: 201 is outside 0..200'],
    ])('reports %j', (value, code, message) => {
        const found = onlyIssue(value)
        expect([found.code, found.message]).toEqual([code, message])
    })

    it.each(Object.entries(catalog.rejectedTechs))('rejects research of %s with its classification', (tech, { code, property }) => {
        expect(onlyIssue(order([{ action: 'research', tech }]))).toStrictEqual({
            code,
            message: `steps[0]: technology "${tech}" is not supported: property ${property}`,
            step: 0,
        })
        expect(catalog.techs).not.toContain(tech)
    })

    const build = (building: string) => ({ action: 'build', building, from: 'wood' })
    const noRally = (building: string) => `build ${building} with no start.rally and no earlier rally for every ${building}`

    it.each([
        ['no rally anywhere', [build('town-center')], {}, [`steps[0]: ${noRally('town-center')}`]],
        ['a start rally, even an unknown node', [build('town-center')], { rally: 'silver' }, ['start: unknown node "silver" in start.rally']],
        ['an earlier rally step', [{ action: 'rally', producer: 'town-center', to: 'wood' }, build('town-center')], {}, []],
        ['an earlier rally step on one instance', [{ action: 'rally', producer: 'town-center', instance: 1, to: 'wood' }, build('town-center')], {}, [`steps[1]: ${noRally('town-center')}`]],
        ['an earlier rallied villager', [{ action: 'produce', producer: 'town-center', unit: 'villager', rally: 'wood' }, build('town-center')], {}, []],
        ['a later rally step', [build('town-center'), { action: 'rally', producer: 'town-center', to: 'wood' }], {}, [`steps[0]: ${noRally('town-center')}`]],
        ['a building that makes no villagers', [build('house')], {}, []],
    ])('checks a villager producer built with %s', (_, steps, start, expected) => {
        const withoutStartRule = messages(order(steps, start)).filter((message) => !message.startsWith('start: no start.rally'))
        expect(withoutStartRule).toEqual(expected)
    })

    it('reports a repeated research on the later step, naming the earlier one', () => {
        const research = { action: 'research', tech: 'wheelbarrow' }
        expect(onlyIssue(order([research, pause, research]))).toStrictEqual({
            code: 'invalid',
            message: 'steps[2]: wheelbarrow is already researched by steps[0]',
            step: 2,
        })
    })
})

describe('checkBuildOrder ordering and gating', () => {
    it('orders field issues by civ, name, start, then each step in field order, then its cross-field issues', () => {
        const value = {
            civ: 'french',
            name: 1,
            start: { villagers: { sheep: 'x' } },
            steps: [
                { trigger: { kind: 'time', seconds: -1 }, action: 'produce', producer: 'stable', unit: 'knight', count: 0 },
                { reaction: true, action: 'produce', producer: 'stable', unit: 'longbowman', walkSeconds: 3 },
                { action: 'pause', producer: 'nowhere' },
            ],
        }
        expect(messages(value)).toEqual([
            'civ: unknown civ "french"',
            'name: must be a string',
            'start: start.villagers.sheep must be a number',
            'steps[0]: trigger.seconds: -1 is outside 0..3600',
            'steps[0]: count: 0 is outside 1..200',
            'steps[1]: only a step triggered by a node running out can be a reaction',
            'steps[1]: stable cannot produce longbowman',
            'steps[1]: walkSeconds without rally',
            'steps[2]: unknown building "nowhere" in producer',
        ])
    })

    it('puts start rules first and cross-step issues after every step', () => {
        const research = { action: 'research', tech: 'wheelbarrow' }
        const value = order([research, { ...research, at: 'stable' }, { action: 'produce', producer: 'stable', unit: 'longbowman' }], {
            rally: 'sheep',
            villagers: { sheep: 5 },
        })
        expect(messages(value)).toEqual([
            'start: start.villagers sums to 5, the civ starts with 6',
            'steps[1]: wheelbarrow cannot be researched at stable',
            'steps[2]: stable cannot produce longbowman',
            'steps[1]: wheelbarrow is already researched by steps[0]',
        ])
    })

    it('skips cross-field rules on a step with a bad field', () => {
        const found = onlyIssue(order([{ action: 'produce', producer: 'stable', unit: 'knigt', rally: 'sheep' }]))
        expect(found.message).toBe('steps[0]: unknown unit "knigt" in unit')
    })

    it('skips cross-step rules when any step has a bad field', () => {
        const research = { action: 'research', tech: 'wheelbarrow' }
        expect(messages(order([research, research, { action: 'pause', producer: 'nowhere' }]))).toEqual(['steps[2]: unknown building "nowhere" in producer'])
    })

    it('skips start rules when start has a bad field', () => {
        expect(messages(order([], { villagers: { sheep: 5, silver: 1 } }))).toEqual(['start: unknown node "silver" in start.villagers'])
    })

    it('labels steps and start by line when lines are given', () => {
        const result = checkBuildOrder(order([pause, { action: 'pause', producer: 'nowhere' }], { villagers: { sheep: 5 }, rally: 'sheep' }), catalog, {
            start: 3,
            steps: [5, 9],
        })
        expect(result).toStrictEqual({
            ok: false,
            issues: [
                { code: 'invalid', message: 'line 3: start.villagers sums to 5, the civ starts with 6', line: 3 },
                { code: 'unknown-id', message: 'line 9: unknown building "nowhere"', step: 1, line: 9, suggestion: undefined },
            ].map((found) => JSON.parse(JSON.stringify(found))),
        })
    })

    it('skips the start and cross-step rules when asked to skip the whole-order rules', () => {
        const value = order([{ action: 'research', tech: 'wheelbarrow' }, { action: 'research', tech: 'wheelbarrow' }], { villagers: { sheep: 5 }, rally: 'sheep' })
        expect(messages(value)).toEqual(['start: start.villagers sums to 5, the civ starts with 6', 'steps[1]: wheelbarrow is already researched by steps[0]'])
        expect(checkBuildOrder(value, catalog, undefined, true).ok).toBe(true)
        const unknown = order([{ action: 'produce', producer: 'stable', unit: 'knigt' }])
        expect(checkBuildOrder(unknown, catalog, undefined, true)).toMatchObject({ ok: false, issues: [{ message: 'steps[0]: unknown unit "knigt" in unit' }] })
    })

    it('gives the same issues for the same value', () => {
        const value = order([{ action: 'produce', producer: 'stable', unit: 'knigt' }, { action: 'fly' }], { villagers: 3 })
        expect(checkBuildOrder(value, catalog)).toStrictEqual(checkBuildOrder(value, catalog))
    })
})

describe('suggestions', () => {
    it.each([
        [order([{ action: 'produce', producer: 'stable', unit: 'knigt' }]), 'knight'],
        [order([{ action: 'produce', producer: 'stabel', unit: 'knight' }]), 'stable'],
        [order([{ action: 'build', building: 'hose', from: 'wood' }]), 'house'],
        [order([{ action: 'research', tech: 'wheelbarow' }]), 'wheelbarrow'],
        [order([{ action: 'research', tech: 'wheelbarrow', at: 'mil' }]), 'mill'],
        [order([{ action: 'build', building: 'house', from: 'shep' }]), 'sheep'],
        [order([{ ...pause, trigger: { kind: 'depleted', node: 'gld' } }]), 'gold'],
        [order([], { rally: 'shep' }), 'sheep'],
        [order([{ action: 'produce', producer: 'stable', unit: 'zzzzz' }]), undefined],
        [{ ...order([]), civ: 'englsh' }, undefined],
        [order([{ ...pause, trigger: { kind: 'bank', resource: 'wod', atLeast: 1 } }]), undefined],
        [order([{ action: 'produc', producer: TC }]), undefined],
        [order([{ action: 'build', building: 'house', from: 'gold#9' }]), undefined],
    ])('suggests for %j: %j', (value, suggestion) => {
        const found = onlyIssue(value)
        expect(found.suggestion).toBe(suggestion)
        expect('suggestion' in found).toBe(suggestion !== undefined)
    })
})

describe('nearestId', () => {
    it.each([
        ['knigt', ['knave', 'knight'], 'knight'],
        ['Knight', ['knight'], 'knight'],
        ['KNIGT', ['knight'], 'knight'],
        ['cat', ['bat', 'hat'], 'bat'],
        ['abcdef', ['abcdxy'], 'abcdxy'],
        ['abcdef', ['abcxyz'], undefined],
        ['soon', ['time', 'villagers', 'depleted', 'bank'], undefined],
        ['abc', [], undefined],
    ])('matches %j in %j as %j', (value, choices, expected) => {
        expect(nearestId(value, choices)).toBe(expected)
    })
})

describe('nearestId cost', () => {
    function levenshtein(a: string, b: string): number {
        const rows = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
            }
        }
        return rows[a.length][b.length]
    }

    function slowNearest(value: string, choices: readonly string[]): string | undefined {
        const limit = Math.max(1, Math.floor(value.length / 3))
        let best: string | undefined
        let bestDistance = limit + 1
        for (const choice of choices) {
            const distance = levenshtein(value.toLowerCase(), choice.toLowerCase())
            if (distance < bestDistance) [best, bestDistance] = [choice, distance]
        }
        return best
    }

    it.each(['knigt', 'KNIGHT', 'x', '', 'abcdefghijklmnopqrstuvwxyz0123456789abcd', 'spear', 'villagr', 'man-at-arm', 'longbowmen', 'scot'])(
        'matches the full search for %j',
        (value) => {
            expect(nearestId(value, catalog.units)).toBe(slowNearest(value, catalog.units))
        },
    )

    it('rejects a 900,000 character unit id quickly', () => {
        const huge = 'k'.repeat(900_000)
        const started = performance.now()
        expect(nearestId(huge, catalog.units)).toBeUndefined()
        const result = checkBuildOrder(order([{ action: 'produce', producer: 'stable', unit: huge }]), catalog)
        expect(performance.now() - started).toBeLessThan(500)
        if (result.ok) throw new Error('expected issues')
        expect(result.issues.map(({ code, suggestion }) => [code, suggestion])).toEqual([['unknown-id', undefined]])
    })
})

describe('quoted ids in issue messages', () => {
    const simIssues = (inputs: unknown) => {
        const result = checkSimInputs(inputs, catalog)
        return result.ok ? [] : result.issues.map((found) => found.message)
    }
    const rally = (value: string) => messages(order([pause], { rally: value }))
    const kinds = 'the kinds are time, villagers, depleted, bank'
    // Each row builds a value of a given length that starts with prefix and is padded with fill, and names the message tail it must produce.
    const sites: [string, string, string, (value: string) => string[], (quoted: string) => string][] = [
        ['unit', '', 'a', (v) => messages(order([{ action: 'produce', producer: TC, unit: v }])), (q) => `steps[0]: unknown unit "${q}" in unit`],
        ['building', '', 'a', (v) => messages(order([{ action: 'build', building: v }])), (q) => `steps[0]: unknown building "${q}" in building`],
        ['technology', '', 'a', (v) => messages(order([{ action: 'research', tech: v }])), (q) => `steps[0]: unknown tech "${q}" in tech`],
        ['unknown node', '', 'a', rally, (q) => `unknown node "${q}" in start.rally`],
        ['not a node or deposit', 'gold#', 'a', rally, (q) => `node "${q}" is not a node or a numbered deposit such as gold#2 in start.rally`],
        ['only gold has deposits', 'stone#', '9', rally, (q) => `node "${q}": only gold has numbered deposits in start.rally`],
        ['deposit number outside', 'gold#', '9', rally, (q) => `node "${q}": deposit number is outside 2..${MAX_DEPOSITS} in start.rally`],
        ['resource', '', 'a', (v) => messages(order([{ ...pause, trigger: { kind: 'bank', resource: v, atLeast: 1 } }])), (q) => `steps[0]: unknown resource "${q}" in trigger.resource`],
        ['trigger kind', '', 'a', (v) => messages(order([{ ...pause, trigger: { kind: v } }])), (q) => `steps[0]: unknown trigger kind "${q}"; ${kinds}`],
        ['action', '', 'a', (v) => messages(order([{ action: v }])), (q) => `steps[0]: unknown action "${q}"`],
        ['civ', '', 'a', (v) => messages({ ...order([]), civ: v }), (q) => `civ: unknown civ "${q}"`],
        ['trips key', '', 'a', (v) => simIssues({ trips: { [v]: {} } }), (q) => `unknown node "${q}"`],
        ['houseBuilderSource', '', 'a', (v) => simIssues({ houseBuilderSource: v }), (q) => `inputs.houseBuilderSource: unknown node "${q}"`],
        ['influenceCoverage key', '', 'a', (v) => simIssues({ influenceCoverage: { [v]: 1 } }), (q) => `unknown building "${q}"`],
    ]
    const cases = sites.flatMap(([site, prefix, fill, run, expected]) =>
        [39, 40, 41, 5000].map((length): [string, number, string[], string] => {
            const value = prefix + fill.repeat(length - prefix.length)
            return [site, length, run(value), expected(length > 40 ? `${value.slice(0, 40)}...` : value)]
        }),
    )

    it.each(cases)('%s: a %i character value is quoted as %#', (_site, _length, got, expected) => {
        expect(got.filter((message) => message.endsWith(expected))).toHaveLength(1)
    })

    it.each([
        ['wood', 'node "wood" never runs out in trigger.node'],
        ['gold#1', 'node "gold#1": deposit 1 is written gold in trigger.node'],
    ])('keeps the message for the short value %s', (value, expected) => {
        const trigger = { kind: 'depleted', node: value }
        expect(messages(order([{ ...pause, trigger }]))).toEqual([`steps[0]: ${expected}`])
    })
})

describe('buildOrderSchema cache', () => {
    it('returns one schema per catalog object', () => {
        expect(buildOrderSchema(catalog)).toBe(buildOrderSchema(catalog))
        expect(buildOrderSchema(buildOrderCatalog(ENGLISH))).not.toBe(buildOrderSchema(catalog))
    })

    it('gives the same issues from a cached schema as from a fresh catalog', () => {
        const bad = order([{ action: 'produce', producer: TC, unit: 'knigt' }, { action: 'build', building: 'nope' }])
        const first = checkBuildOrder(bad, catalog)
        expect(checkBuildOrder(bad, catalog)).toEqual(first)
        expect(checkBuildOrder(bad, buildOrderCatalog(ENGLISH))).toEqual(first)
    })
})

describe('checkBuildOrder accepted orders', () => {
    const research = (tech: string) => ({ action: 'research', tech })
    it.each([
        ['techs with modeled, ignored and unmodeled effects', order(['bloomery', 'shaft-mining', 'survival-techniques', 'fitted-leatherwork', 'admiralty'].map(research))],
        ['research at its building', order([{ action: 'research', tech: 'wheelbarrow', at: 'mill' }])],
        ['two different techs', order([research('wheelbarrow'), research('textiles')])],
        ['villagers from kings-palace', order([{ action: 'produce', producer: 'kings-palace', unit: 'villager' }])],
        ['a scout without rally', order([{ action: 'produce', producer: TC, unit: 'scout' }])],
        ['a rally on town-center', order([{ action: 'rally', producer: 'town-center', to: 'wood' }])],
        ['a split start with a zero entry', order([], { rally: 'sheep', villagers: { sheep: 4, wood: 2, gold: 0 } })],
        ['move all between deposits', order([{ action: 'move', count: 'all', from: 'gold', to: 'gold#2' }])],
        ['bank 0 and depleted deposits', order([{ kind: 'bank', resource: 'wood', atLeast: 0 }, { kind: 'depleted', node: 'berry' }, { kind: 'depleted', node: 'gold#2' }].map((trigger) => ({ ...pause, trigger })))],
    ])('accepts %s', (_, value) => {
        expect(checkBuildOrder(value, catalog)).toStrictEqual({ ok: true, order: value })
    })

    it('needs no start.rally when no starting building makes villagers', () => {
        const noProducers = { ...catalog, startVillagerProducers: [] }
        expect(checkBuildOrder({ ...order([]), start: undefined }, noProducers).ok).toBe(true)
        expect(messages({ ...order([]), start: undefined })).toEqual(['start: no start.rally while starting building capital-town-center produces villagers'])
        expect(messages(order([], {}))).toEqual(messages({ ...order([]), start: undefined }))
    })
})

describe('checkBuildOrder step bounds', () => {
    const villager = (fields: object) => ({ action: 'produce', producer: TC, unit: 'villager', ...fields })
    const shift = (fields: object) => ({ action: 'move', count: 1, from: 'sheep', to: 'wood', ...fields })
    const bounded: [string, (n: number) => object, number[], number[]][] = [
        ['trigger.seconds', (n) => ({ ...pause, trigger: { kind: 'time', seconds: n } }), [0, 3600], [-1, 3601, 1.5, Infinity]],
        ['trigger.count', (n) => ({ ...pause, trigger: { kind: 'villagers', count: n } }), [1, 200], [0, 201, 2.5]],
        ['trigger.atLeast', (n) => ({ ...pause, trigger: { kind: 'bank', resource: 'food', atLeast: n } }), [0, 100000], [-1, 100001, 400.5]],
        ['produce count', (n) => villager({ count: n }), [1, 200], [0, 201, 2.5, Infinity]],
        ['move count', (n) => shift({ count: n }), [1, 200], [0, 201, 1.5]],
        ['builders', (n) => ({ action: 'build', building: 'house', from: 'wood', builders: n }), [1, 200], [0, 201, 1.5]],
        ['instance', (n) => ({ ...pause, instance: n }), [1, 200], [0, 201, 1.5, NaN]],
        ['rally walkSeconds', (n) => ({ action: 'rally', producer: TC, to: 'wood', walkSeconds: n }), [0, 4.5, 60], [-0.5, 60.5, Infinity, NaN]],
        ['produce walkSeconds', (n) => villager({ rally: 'wood', walkSeconds: n }), [0, 60], [-1, 61]],
        ['build walkSeconds', (n) => ({ action: 'build', building: 'house', from: 'wood', walkSeconds: n }), [0, 60], [-1, 60.5]],
        ['move walkSeconds', (n) => shift({ walkSeconds: n }), [0, 60], [-1, 60.5]],
    ]

    it.each(bounded)('bounds %s', (_, make, inside, outside) => {
        for (const n of inside) expect(messages(order([make(n)])), String(n)).toEqual([])
        for (const n of outside) {
            const found = onlyIssue(order([make(n)]))
            expect([found.code, found.step], String(n)).toEqual(['out-of-range', 0])
            expect(found.message).toContain(String(n))
        }
    })

    it.each([-1, 201, 1.5])('bounds a start.villagers value of %j', (n) => {
        const found = onlyIssue(order([], { rally: 'sheep', villagers: { sheep: 6, wood: n } }))
        expect(found.code).toBe('out-of-range')
        expect(found.message).toContain('start.villagers.wood')
    })

    it('reports only the step cap when 201 steps are also bad', () => {
        expect(onlyIssue(order(Array(201).fill({ action: 'pause', producer: 'nowhere' }))).message).toBe('steps: 201 steps, more than 200')
    })

    it('freezes the bounds table', () => {
        expect(Object.isFrozen(SIM_INPUT_BOUNDS) && Object.isFrozen(SIM_INPUT_BOUNDS.steps)).toBe(true)
    })
})

describe('checkBuildOrder unknown ids', () => {
    it.each([
        [{ action: 'produce', producer: TC, unit: 'knight-x' }, 'knight-x'],
        [{ action: 'pause', producer: 'castle' }, 'castle'],
        [{ action: 'build', building: 'villager', from: 'wood' }, 'villager'],
        [{ action: 'research', tech: 'forestry-1' }, 'forestry-1'],
        [{ action: 'research', tech: 'villager' }, 'villager'],
        [{ action: 'research', tech: 'wheelbarrow', at: 'wheelbarrow' }, 'wheelbarrow'],
        [{ action: 'move', count: 1, from: 'sheep', to: 'fish' }, 'fish'],
        [{ action: 'move', count: 1, from: '__proto__', to: 'wood' }, '__proto__'],
        [{ action: 'rally', producer: TC, to: 'gold-mine' }, 'gold-mine'],
        [{ action: 'produce', producer: 'nowhere', unit: 'villager' }, 'nowhere'],
        [{ action: 'research', tech: 'no-such-tech', at: 'house' }, 'no-such-tech'],
    ])('reports only the unknown id in %j', (step, id) => {
        const found = onlyIssue(order([step]))
        expect([found.code, found.step]).toEqual(['unknown-id', 0])
        expect(found.message).toContain(`"${id}"`)
    })

    it.each([
        ['an unknown start node key', { rally: 'sheep', villagers: { sheep: 5, fish: 1 } }, 'fish'],
        ['an own __proto__ start key', JSON.parse('{"rally":"sheep","villagers":{"__proto__":6}}'), '__proto__'],
        ['an unknown start.rally', { rally: 'fish' }, 'fish'],
    ])('reports %s', (_, start, id) => {
        const found = onlyIssue(order([], start))
        expect(found).toEqual({ code: 'unknown-id', message: expect.stringContaining(`"${id}"`) })
    })
})

describe('checkBuildOrder cross-field and start rules', () => {
    it.each([
        [{ action: 'produce', producer: TC, unit: 'scout', rally: 'wood' }, ['scout']],
        [{ action: 'rally', producer: 'house', to: 'wood' }, ['house']],
        [{ action: 'produce', producer: 'house', unit: 'villager' }, ['house', 'villager']],
        [{ action: 'research', tech: 'wheelbarrow', at: 'house' }, ['wheelbarrow', 'house']],
    ])('rejects %j naming %j', (step, names) => {
        const found = onlyIssue(order([step]))
        expect([found.code, found.step]).toEqual(['invalid', 0])
        for (const name of names) expect(found.message).toContain(name)
    })

    it.each([{ sheep: 7 }, { sheep: 4, wood: 3 }, { sheep: 200 }])('rejects start.villagers %j for not summing to 6', (villagers) => {
        expect(onlyIssue(order([], { rally: 'sheep', villagers })).message).toMatch(/^start: start\.villagers sums to \d+, the civ starts with 6$/)
    })

    it('needs an earlier kings-palace-wide rally source to build a kings-palace without start.rally', () => {
        const palace = { action: 'build', building: 'kings-palace', from: 'wood' }
        const toWood = { action: 'rally', producer: 'kings-palace', to: 'wood' }
        const fed = { action: 'produce', producer: 'kings-palace', unit: 'villager', rally: 'wood' }
        const stepIssues = (steps: unknown[]) => messages(order(steps, { villagers: { sheep: 6 } })).filter((text) => text.startsWith('steps'))
        expect(stepIssues([toWood, palace])).toEqual([])
        expect(stepIssues([fed, palace])).toEqual([])
        expect(stepIssues([{ ...fed, instance: 1 }, palace])).toEqual(['steps[1]: build kings-palace with no start.rally and no earlier rally for every kings-palace'])
        expect(stepIssues([palace, toWood])).toHaveLength(1)
        expect(messages(order([palace]))).toEqual([])
    })
})

describe('checkBuildOrder repeated research', () => {
    const tech = (id: string, more: object = {}) => ({ action: 'research', tech: id, ...more })

    it('reports each later repeat against the first', () => {
        expect(messages(order([tech('wheelbarrow'), tech('wheelbarrow', { at: 'mill' }), tech('wheelbarrow')]))).toEqual([
            'steps[1]: wheelbarrow is already researched by steps[0]',
            'steps[2]: wheelbarrow is already researched by steps[0]',
        ])
    })

    it.each([
        ['no-such-tech', 'unknown-id'],
        ['forestry', 'unknown-tech-effect'],
    ])('reports %s twice with its own code and no repeat', (id, code) => {
        const result = checkBuildOrder(order([tech(id), tech(id)]), catalog)
        expect(result.ok ? [] : result.issues.map((found) => [found.code, found.step])).toEqual([
            [code, 0],
            [code, 1],
        ])
    })

    it('counts a reaction step in list order', () => {
        const reaction = { trigger: { kind: 'depleted', node: 'berry' }, reaction: true }
        expect(messages(order([tech('wheelbarrow', reaction), tech('wheelbarrow')]))).toEqual(['steps[1]: wheelbarrow is already researched by steps[0]'])
        const rallied = [{ action: 'rally', producer: 'town-center', to: 'wood', ...reaction }, { action: 'build', building: 'town-center', from: 'wood' }]
        expect(messages(order(rallied, { villagers: { sheep: 6 } })).filter((text) => text.startsWith('steps'))).toEqual([])
    })
})

describe('checkBuildOrder issue location', () => {
    const badStart = { rally: 'sheep', villagers: { sheep: 5 } }
    const castle = { action: 'pause', producer: 'castle' }

    it('omits line where lines has no entry and on every issue without lines', () => {
        const found = checkBuildOrder(order([pause, castle], badStart), catalog, { steps: [3] })
        expect(found.ok ? [] : found.issues.map((issue) => [issue.step, issue.line, issue.message])).toEqual([
            [undefined, undefined, 'start: start.villagers sums to 5, the civ starts with 6'],
            [1, undefined, 'steps[1]: unknown building "castle" in producer'],
        ])
        const unlined = checkBuildOrder(order([castle, castle], badStart), catalog)
        expect(unlined.ok ? [] : unlined.issues.filter((issue) => 'line' in issue)).toEqual([])
        expect(unlined.ok ? 0 : unlined.issues.length).toBe(3)
    })

    it('orders one step by field: trigger, producer, instance, count', () => {
        const step = { action: 'produce', producer: 'castle', instance: 0, unit: 'villager', count: 500, trigger: { kind: 'time', seconds: -1 } }
        expect(messages(order([step]))).toEqual([
            'steps[0]: trigger.seconds: -1 is outside 0..3600',
            'steps[0]: unknown building "castle" in producer',
            'steps[0]: instance: 0 is outside 1..200',
            'steps[0]: count: 500 is outside 1..200',
        ])
    })

    it('reports an unknown id and a type error on one step, both as field issues', () => {
        expect(messages(order([{ action: 'produce', producer: 'nowhere', unit: 'villager', count: 'x' }]))).toEqual([
            'steps[0]: unknown building "nowhere" in producer',
            'steps[0]: count must be a number',
        ])
    })

    it('reports a hole in steps as a null step', () => {
        const sparse = checkBuildOrder(order([pause, , pause]), catalog)
        expect(sparse).toStrictEqual(checkBuildOrder(order([pause, null, pause]), catalog))
        expect(sparse.ok ? [] : sparse.issues).toStrictEqual([{ code: 'syntax', message: 'steps[1]: is not an object', step: 1 }])
    })

    it.each([undefined, 'build', 42, {}, order([undefined, []])])('rejects %j without throwing', (value) => {
        expect(checkBuildOrder(value, catalog).ok).toBe(false)
    })
})

describe('node refs in a build order', () => {
    const refs: [string, string | null][] = [
        ['gold', null],
        ['gold#2', null],
        ['gold#8', null],
        ['wood', null],
        ['gold#1', 'invalid'],
        ['wood#2', 'invalid'],
        ['berry#2', 'invalid'],
        ['stone#2', 'invalid'],
        ['gold#0', 'out-of-range'],
        ['gold#9', 'out-of-range'],
        ['iron', 'unknown-id'],
        ['iron#2', 'unknown-id'],
        ['gold#02', 'syntax'],
        ['gold#', 'syntax'],
        ['gold#x', 'syntax'],
        ['gold#2#3', 'syntax'],
    ]

    it.each(refs)('classifies %s', (ref, code) => {
        const problem = nodeRefIssue(ref, false)
        expect(problem?.code ?? null).toBe(code)
        if (problem) expect(problem.reason).toContain(`"${ref}"`)
    })

    it('rejects farm and wood only where the node must run out', () => {
        expect(nodeRefIssue('farm', true)).toStrictEqual({ code: 'invalid', reason: 'node "farm" never runs out' })
        expect([nodeRefIssue('wood', true)?.code, nodeRefIssue('gold#2', true), nodeRefIssue('farm', false)]).toEqual(['invalid', null, null])
        expect(nodeRefIssue(3, false)).toStrictEqual({ code: 'syntax', reason: 'node must be a string' })
    })

    const villager = { action: 'produce', producer: TC, unit: 'villager' }
    const places: [string, (ref: string) => unknown][] = [
        ['rally', (ref) => order([{ ...villager, rally: ref }])],
        ['to', (ref) => order([{ action: 'rally', producer: TC, to: ref }])],
        ['from', (ref) => order([{ action: 'build', building: 'house', from: ref }])],
        ['then', (ref) => order([{ action: 'build', building: 'house', from: 'sheep', then: ref }])],
        ['from', (ref) => order([{ action: 'move', count: 1, from: ref, to: 'wood' }])],
        ['to', (ref) => order([{ action: 'move', count: 1, from: 'sheep', to: ref }])],
        ['start.rally', (ref) => order([], { villagers: { sheep: 6 }, rally: ref })],
        ['start.villagers', (ref) => order([], { villagers: { sheep: 5, [ref]: 1 }, rally: 'sheep' })],
    ]

    it.each(places)('gives every ref the same issue in %s', (place, make) => {
        for (const [ref, code] of refs) {
            const result = checkBuildOrder(make(ref), catalog)
            const found = result.ok ? [] : result.issues.map((issue) => [issue.code, issue.message.split(': ').slice(1).join(': ')])
            expect(found, ref).toEqual(code === null ? [] : [[code, `${nodeRefIssue(ref, false)!.reason} in ${place}`]])
        }
    })
})

describe('triggers and reactions', () => {
    const depleted = (node: unknown) => ({ kind: 'depleted', node })
    const bank = (fields: object) => ({ kind: 'bank', resource: 'wood', atLeast: 400, ...fields })

    it.each([
        ['depleted without node', { kind: 'depleted' }, 'syntax'],
        ['depleted farm', depleted('farm'), 'invalid'],
        ['depleted iron', depleted('iron'), 'unknown-id'],
        ['bank wood 400', bank({}), null],
        ['bank without resource', { kind: 'bank', atLeast: 400 }, 'syntax'],
        ['bank of a string amount', bank({ atLeast: '400' }), 'syntax'],
        ['bank of sheep', bank({ resource: 'sheep' }), 'unknown-id'],
        ['an unknown kind', { kind: 'event' }, 'unknown-trigger-kind'],
    ])('classifies %s', (_, trigger, code) => {
        const result = checkBuildOrder(order([{ ...pause, trigger }]), catalog)
        expect(result.ok ? [] : result.issues.map((found) => found.code)).toEqual(code === null ? [] : [code])
    })

    it.each([
        { action: 'produce', producer: TC, unit: 'villager' },
        { action: 'rally', producer: TC, to: 'wood' },
        pause,
        { action: 'build', building: 'house', from: 'berry' },
        { action: 'research', tech: 'wheelbarrow' },
        { action: 'move', count: 'all', from: 'berry', to: 'wood' },
    ])('accepts a depleted reaction on %o', (step) => {
        expect(messages(order([{ ...step, trigger: depleted('berry'), reaction: true }]))).toEqual([])
    })

    it.each([undefined, { kind: 'time', seconds: 5 }, { kind: 'villagers', count: 7 }, bank({})])('rejects a reaction on trigger %j', (trigger) => {
        expect(onlyIssue(order([{ ...pause, trigger, reaction: true }]))).toStrictEqual({
            code: 'invalid',
            message: 'steps[0]: only a step triggered by a node running out can be a reaction',
            step: 0,
        })
    })

    it('reports only the unknown kind on a reaction and a type error for reaction "yes"', () => {
        expect(onlyIssue(order([{ ...pause, trigger: { kind: 'event' }, reaction: true }])).code).toBe('unknown-trigger-kind')
        expect(onlyIssue(order([{ ...pause, trigger: depleted('berry'), reaction: 'yes' }])).message).toBe('steps[0]: reaction must be true')
    })

    it.each([
        { action: 'move', count: 'All', from: 'sheep', to: 'wood' },
        { action: 'move', count: '3', from: 'sheep', to: 'wood' },
        { action: 'produce', producer: TC, unit: 'villager', count: 'all' },
    ])('takes "all" as a count on move only: %j', (step) => {
        expect(onlyIssue(order([step])).code).toBe('syntax')
    })
})

describe('OPTIONAL_STEP_FIELDS', () => {
    const full: Record<BuildStep['action'], Record<string, unknown>> = {
        produce: { producer: TC, instance: 1, unit: 'villager', count: 1, rally: 'sheep', walkSeconds: 1 },
        rally: { producer: TC, instance: 1, to: 'wood', walkSeconds: 1 },
        pause: { producer: TC, instance: 1 },
        build: { building: 'house', builders: 1, from: 'wood', then: 'wood', walkSeconds: 1 },
        research: { tech: 'wheelbarrow', at: 'mill' },
        move: { count: 1, from: 'sheep', to: 'wood', walkSeconds: 1 },
    }
    const omissions = Object.entries(full).flatMap(([action, fields]) => Object.keys(fields).map((name) => [action, name] as const))

    it.each(omissions)('agrees with the schema on omitting %s %s', (action, name) => {
        const fields = { ...full[action as BuildStep['action']] }
        delete fields[name]
        const value = order([{ action, ...fields }])
        if (OPTIONAL_STEP_FIELDS[action as BuildStep['action']].includes(name)) {
            expect(buildOrderShape.safeParse(value).success).toBe(true)
        } else {
            expect(onlyIssue(value)).toStrictEqual({ code: 'syntax', message: `steps[0]: missing ${name}`, step: 0 })
        }
    })
})

describe('checkSimInputs', () => {
    const tripDefaults = Object.fromEntries(
        Object.entries(ENGLISH.base.gatherNodes).map(([node, { trip }]) => [
            node,
            { walkSecondsCamp: trip.walkSecondsCamp.value, walkSecondsTownCenter: trip.walkSecondsTownCenter.value, dropOffSeconds: trip.dropOffSeconds.value },
        ]),
    )
    const defaults = {
        durationSeconds: 1200,
        trips: tripDefaults,
        walkSeconds: ENGLISH.base.walkSeconds.value,
        autoHouses: true,
        houseBuilders: 1,
        houseBuilderSource: 'wood',
        influenceCoverage: { mill: 1 },
        nodeAmounts: Object.fromEntries(FINITE_NODE_REFS.map((ref) => [ref, ENGLISH.base.gatherNodes[nodeKindOf(ref)].amount?.value ?? null])),
    }

    it.each([undefined, null, {}])('resolves %j to the defaults', (value) => {
        expect(checkSimInputs(value, catalog)).toStrictEqual({ ok: true, inputs: defaults })
    })

    it('merges overrides onto the defaults', () => {
        const result = checkSimInputs(
            { durationSeconds: 60, trips: { gold: { dropOffSeconds: 1.5 } }, influenceCoverage: { mill: 0.5, house: 0 }, nodeAmounts: { gold: null, stone: 7 } },
            catalog,
        )
        expect(result).toStrictEqual({
            ok: true,
            inputs: {
                ...defaults,
                durationSeconds: 60,
                trips: { ...tripDefaults, gold: { ...tripDefaults.gold, dropOffSeconds: 1.5 } },
                influenceCoverage: { mill: 0.5, house: 0 },
                nodeAmounts: { ...defaults.nodeAmounts, gold: null, stone: 7 },
            },
        })
    })

    it.each([
        [60, true],
        [3600, true],
        [59, false],
        [3601, false],
    ])('bounds durationSeconds %j', (durationSeconds, ok) => {
        const result = checkSimInputs({ durationSeconds }, catalog)
        const issues = [{ code: 'out-of-range', message: `inputs.durationSeconds: ${durationSeconds} is outside 60..3600` }]
        expect(result).toStrictEqual(ok ? { ok: true, inputs: { ...defaults, durationSeconds } } : { ok: false, issues })
    })

    it('reports every bad input in field order', () => {
        const value = {
            durationSeconds: '60',
            trips: { 'gold#2': {}, gold: { walkSecondsCamp: 'x' }, wood: 3 },
            walkSeconds: 61,
            autoHouses: 1,
            houseBuilders: 0.5,
            houseBuilderSource: 'gold#2',
            influenceCoverage: { mill: 2, nope: 1 },
            nodeAmounts: { wood: 1, 'gold#2': 'x', berry: -1 },
        }
        expect(checkSimInputs(value, catalog)).toStrictEqual({
            ok: false,
            issues: [
                { code: 'syntax', message: 'inputs.durationSeconds: must be a number' },
                { code: 'unknown-id', message: 'inputs.trips.gold#2: unknown node "gold#2"' },
                { code: 'syntax', message: 'inputs.trips.gold.walkSecondsCamp: must be a number' },
                { code: 'syntax', message: 'inputs.trips.wood: must be an object' },
                { code: 'out-of-range', message: 'inputs.walkSeconds: 61 is outside 0..60' },
                { code: 'syntax', message: 'inputs.autoHouses: must be a boolean' },
                { code: 'out-of-range', message: 'inputs.houseBuilders: 0.5 is not an integer' },
                { code: 'unknown-id', message: 'inputs.houseBuilderSource: unknown node "gold#2"' },
                { code: 'out-of-range', message: 'inputs.influenceCoverage.mill: 2 is outside 0..1' },
                { code: 'unknown-id', message: 'inputs.influenceCoverage.nope: unknown building "nope"' },
                { code: 'invalid', message: 'inputs.nodeAmounts.wood: node "wood" never runs out' },
                { code: 'syntax', message: 'inputs.nodeAmounts.gold#2: must be a number' },
                { code: 'out-of-range', message: 'inputs.nodeAmounts.berry: -1 is outside 0..100000' },
            ],
        })
    })

    it.each([5, [], 'x'])('rejects %j as a whole', (value) => {
        expect(checkSimInputs(value, catalog)).toStrictEqual({ ok: false, issues: [{ code: 'syntax', message: 'inputs: must be an object' }] })
    })

    it.each([undefined, { durationSeconds: 59 }, { trips: { gold: { dropOffSeconds: 2 } } }])('matches resolveSimInputs for %j', (value) => {
        expect(resolveSimInputs(value, ENGLISH)).toStrictEqual(checkSimInputs(value, catalog))
    })
})

describe('checkSimInputs fields', () => {
    const resolved = () => {
        const result = checkSimInputs({}, catalog)
        if (!result.ok) throw new Error('defaults rejected')
        return result.inputs
    }
    const issuesFor = (value: unknown) => {
        const result = checkSimInputs(value, catalog)
        return result.ok ? [] : result.issues
    }

    it('reads walkSeconds and trip defaults from the data the catalog was built from', () => {
        const base = structuredClone(baseRules) as unknown as BaseRules
        base.walkSeconds.value = 9
        base.gatherNodes.farm.trip.walkSecondsCamp.value = 7.5
        const changed = buildGameData('english', structuredClone(englishSnapshot) as unknown as Snapshot, base, structuredClone(englishRules) as unknown as CivData)
        const result = checkSimInputs(undefined, buildOrderCatalog(changed))
        expect(result.ok && [result.inputs.walkSeconds, result.inputs.trips.farm.walkSecondsCamp]).toEqual([9, 7.5])
    })

    it('takes every supplied scalar field', () => {
        const given = { durationSeconds: 600, walkSeconds: 0, autoHouses: false, houseBuilders: 3, houseBuilderSource: 'gold', influenceCoverage: { mill: 0 } }
        expect(checkSimInputs(given, catalog)).toStrictEqual({ ok: true, inputs: { ...resolved(), ...given } })
    })

    it.each([
        ['durationSeconds', [60, 3600], [59, 3601, 60.5]],
        ['walkSeconds', [0, 60], [-0.1, 60.5, Infinity]],
        ['houseBuilders', [1, 200], [0, 201, 1.5]],
    ])('bounds %s', (field, inside, outside) => {
        for (const n of inside) expect(issuesFor({ [field]: n }), String(n)).toEqual([])
        for (const n of outside) expect(issuesFor({ [field]: n }), String(n)).toEqual([{ code: 'out-of-range', message: expect.stringContaining(`inputs.${field}: `) }])
    })

    it.each([
        ['walkSecondsCamp', 60],
        ['walkSecondsTownCenter', 60],
        ['dropOffSeconds', 30],
    ])('bounds trips.wood.%s at 0..%d', (field, max) => {
        for (const n of [0, max]) expect(issuesFor({ trips: { wood: { [field]: n } } })).toEqual([])
        for (const n of [-1, max + 0.5]) {
            expect(issuesFor({ trips: { wood: { [field]: n } } })).toEqual([{ code: 'out-of-range', message: expect.stringContaining(`inputs.trips.wood.${field}: `) }])
        }
    })

    it('bounds influenceCoverage values at 0..1', () => {
        expect(issuesFor({ influenceCoverage: { mill: 0, 'mining-camp': 1 } })).toEqual([])
        for (const n of [-0.1, 1.1]) expect(issuesFor({ influenceCoverage: { mill: n } }).map((found) => found.code)).toEqual(['out-of-range'])
    })

    it.each([
        [{ trips: 3 }, 'inputs.trips: must be an object'],
        [{ trips: { farm: { dropOffSeconds: '1' } } }, 'inputs.trips.farm.dropOffSeconds: must be a number'],
        [{ walkSeconds: '5' }, 'inputs.walkSeconds: must be a number'],
        [{ houseBuilders: '1' }, 'inputs.houseBuilders: must be a number'],
        [{ houseBuilderSource: 1 }, 'inputs.houseBuilderSource: must be a string'],
        [{ influenceCoverage: [] }, 'inputs.influenceCoverage: must be an object'],
        [{ influenceCoverage: { mill: '1' } }, 'inputs.influenceCoverage.mill: must be a number'],
        [{ nodeAmounts: 5 }, 'inputs.nodeAmounts: must be an object'],
    ])('reports %j as syntax', (value, message) => {
        expect(issuesFor(value)).toStrictEqual([{ code: 'syntax', message }])
    })

    it.each([
        [{ trips: { fish: {} } }, 'inputs.trips.fish'],
        [JSON.parse('{"trips":{"__proto__":{}}}'), 'inputs.trips.__proto__'],
        [{ houseBuilderSource: 'fish' }, 'inputs.houseBuilderSource'],
        [{ influenceCoverage: { villager: 1 } }, 'inputs.influenceCoverage.villager'],
    ])('reports an unknown id in %j', (value, path) => {
        expect(issuesFor(value)).toEqual([{ code: 'unknown-id', message: expect.stringContaining(`${path}: `) }])
    })

    it('ignores extra keys and reports fields in declaration order', () => {
        expect(issuesFor({ influenceCoverage: { mill: 2 }, durationSeconds: 1, extra: true }).map((found) => found.message.split(':')[0])).toEqual([
            'inputs.durationSeconds',
            'inputs.influenceCoverage.mill',
        ])
    })

    it('returns fresh objects that share nothing with the catalog or data', () => {
        const first = resolved()
        first.trips.farm.walkSecondsCamp = 99
        first.influenceCoverage.mill = 0
        first.nodeAmounts.gold = 1
        expect(resolved().trips.farm.walkSecondsCamp).toBe(ENGLISH.base.gatherNodes.farm.trip.walkSecondsCamp.value)
        expect([resolved().influenceCoverage, resolved().nodeAmounts.gold]).toEqual([{ mill: 1 }, 4000])
        expect(catalog.inputDefaults.trips.farm.walkSecondsCamp).not.toBe(99)
    })

    it('defaults every finite ref to its base amount and every deposit to the gold amount', () => {
        const deposits = Object.fromEntries(FINITE_NODE_REFS.filter((ref) => ref.startsWith('gold#')).map((ref) => [ref, 4000]))
        expect(Object.keys(resolved().nodeAmounts)).toEqual(FINITE_NODE_REFS)
        expect(resolved().nodeAmounts).toEqual({ sheep: 3000, berry: 1500, deer: 1750, boar: 2000, gold: 4000, ...deposits, stone: 1200 })
        const merged = checkSimInputs({ nodeAmounts: { gold: null, 'gold#3': 2500, berry: 0 } }, catalog)
        expect(merged.ok && merged.inputs.nodeAmounts).toMatchObject({ gold: null, 'gold#2': 4000, 'gold#3': 2500, 'gold#8': 4000, berry: 0, sheep: 3000 })
    })

    it.each([
        ['berry', 0, null],
        ['stone', 100000, null],
        ['gold#2', 2500, null],
        ['farm', 500, 'invalid'],
        ['gold#1', 5, 'invalid'],
        ['wood#2', 5, 'invalid'],
        ['gold#9', 5, 'out-of-range'],
        ['iron', 5, 'unknown-id'],
        ['gold', 1.5, 'out-of-range'],
        ['gold', 100001, 'out-of-range'],
        ['gold', Infinity, 'out-of-range'],
        ['gold#02', 5, 'syntax'],
    ])('reads nodeAmounts.%s = %j as %j', (ref, amount, code) => {
        expect(issuesFor({ nodeAmounts: { [ref]: amount } })).toEqual(code === null ? [] : [{ code, message: expect.stringContaining(`inputs.nodeAmounts.${ref}: `) }])
    })
})

describe('bounds and defaults', () => {
    it('keeps the request bounds', () => {
        const rows = [
            'textChars 0 20000 int',
            'steps 0 200 int',
            'durationSeconds 60 3600 int',
            'triggerSeconds 0 3600 int',
            'triggerCount 1 200 int',
            'triggerAtLeast 0 100000 int',
            'count 1 200 int',
            'builders 1 200 int',
            'houseBuilders 1 200 int',
            'instance 1 200 int',
            'walkSeconds 0 60 real',
            'startVillagers 0 200 int',
            'walkSecondsCamp 0 60 real',
            'walkSecondsTownCenter 0 60 real',
            'dropOffSeconds 0 30 real',
            'influenceCoverage 0 1 real',
            'nodeAmount 0 100000 int',
        ]
        const listed = Object.entries(SIM_INPUT_BOUNDS).map(([key, { min, max, integer }]) => `${key} ${min} ${max} ${integer ? 'int' : 'real'}`)
        expect(listed).toEqual(rows)
        expect(INPUT_DEFAULTS).toStrictEqual({ durationSeconds: 1200, autoHouses: true, houseBuilders: 1, houseBuilderSource: 'wood', influenceCoverage: { mill: 1 } })
    })
})

describe('buildOrderCatalog', () => {
    it('is deterministic and survives JSON', () => {
        expect(buildOrderCatalog(ENGLISH)).toStrictEqual(catalog)
        expect(JSON.parse(JSON.stringify(catalog))).toStrictEqual(catalog)
    })

    it('describes the civ start', () => {
        const { villagers } = ENGLISH.civData.startingState
        expect(catalog.civ).toBe('english')
        expect(catalog.startVillagerTotal).toBe(Object.values(villagers.value).reduce((sum, count) => sum + count, 0))
        expect(catalog.startVillagerProducers).toEqual([TC])
        expect(catalog.defaultStart).toStrictEqual({ villagers: { sheep: 6 }, rally: 'sheep' })
        expect(checkBuildOrder(order([], catalog.defaultStart), catalog).ok).toBe(true)
    })

    it('lists the English landmarks sorted', () => {
        expect(catalog.landmarks).toEqual(['abbey-of-kings', 'berkshire-palace', 'council-hall', 'kings-palace', 'the-white-tower', 'wynguard-palace'])
    })

    it('classifies the rejected techs', () => {
        const byCode = (code: string) => Object.keys(catalog.rejectedTechs).filter((tech) => catalog.rejectedTechs[tech].code === code).sort()
        expect(byCode('unsupported-tech')).toEqual(['enclosures', 'lightweight-beams', 'military-academy'])
        expect(byCode('unknown-tech-effect')).toEqual([
            'arrowslits',
            'boiling-oil',
            'cannon-emplacement',
            'forestry',
            'siege-engineering',
            'springald-emplacement',
            'tithe-barns',
        ])
    })

    it('names knight after its lowest-age unit entry', () => {
        const knights = ENGLISH.byBaseId.get('knight')!.filter((entry) => entry.type === 'unit')
        expect(catalog.names.knight).toBe(knights.reduce((best, entry) => (entry.age < best.age ? entry : best)).name)
    })

    it.each(listBuilds().map((build) => [build.name, build] as const))('accepts the shipped build %s unchanged', (_, build) => {
        expect(checkBuildOrder(build, catalog)).toStrictEqual({ ok: true, order: build })
    })
})
