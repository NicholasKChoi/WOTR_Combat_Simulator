import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import { FINITE_NODE_REFS, nodeKindOf } from './model'
import type { BuildStep } from './model'
import {
    INPUT_DEFAULTS,
    OPTIONAL_STEP_FIELDS,
    SIM_INPUT_BOUNDS,
    buildOrderCatalog,
    buildOrderShape,
    checkBuildOrder,
    checkSimInputs,
    nearestId,
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
                { code: 'unknown-id', message: 'line 9: unknown building "nowhere" in producer', step: 1, line: 9, suggestion: undefined },
            ].map((found) => JSON.parse(JSON.stringify(found))),
        })
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
