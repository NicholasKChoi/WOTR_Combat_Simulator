import { describe, expect, it } from 'vitest'
import englishSnapshot from '../../data/aoe4-build-order/aoe4world/english.json'
import baseRules from '../../data/aoe4-build-order/rules/base.json'
import englishRules from '../../data/aoe4-build-order/rules/english.json'
import { BaseRules, CivData, Snapshot, buildGameData, loadGameData } from './data'
import type { BuildOrderLines } from './model'
import { SIM_INPUT_BOUNDS, ValidateOptions, resolveSimInputs, validateBuildOrder } from './validate'

const data = loadGameData('english')
const START = { villagers: { sheep: 6 }, rally: 'sheep' }
const PAUSE = { action: 'pause', producer: 'capital-town-center' }

function order(steps: unknown[], fields: Record<string, unknown> = {}) {
    return { civ: 'english', name: 'test', start: START, steps, ...fields }
}

function issuesOf(input: unknown, options?: ValidateOptions) {
    const result = validateBuildOrder(input, data, options)
    return result.ok === false ? result.issues : []
}

function only(input: unknown, options?: ValidateOptions) {
    const issues = issuesOf(input, options)
    expect(issues).toHaveLength(1)
    return issues[0]
}

function stepIssue(step: unknown) {
    return only(order([step]))
}

function inputIssues(partial: unknown) {
    const result = resolveSimInputs(partial, data)
    return result.ok === false ? result.issues : []
}

function defaults() {
    const result = resolveSimInputs({}, data)
    if (!result.ok) throw new Error('defaults rejected')
    return result.inputs
}

describe('validateBuildOrder accepts', () => {
    it('a valid order with a start split, rally, build and research', () => {
        const input = order([
            { action: 'produce', producer: 'capital-town-center', unit: 'villager' },
            { action: 'rally', producer: 'capital-town-center', to: 'wood', walkSeconds: 3 },
            { action: 'build', building: 'house', from: 'wood' },
            { action: 'research', tech: 'wheelbarrow', at: 'mill' },
            { action: 'research', tech: 'survival-techniques' },
        ])
        expect(validateBuildOrder(input, data)).toEqual({ ok: true, order: input })
    })

    it('a Blacksmith technology and an overlay-modeled technology', () => {
        expect(issuesOf(order([{ action: 'research', tech: 'bloomery' }, { action: 'research', tech: 'shaft-mining' }]))).toEqual([])
    })

    it('extra unknown properties on the order, start, steps and triggers', () => {
        const input = order([{ ...PAUSE, note: 1, trigger: { kind: 'time', seconds: 5, extra: true } }], {
            start: { ...START, extra: 'x' },
            extra: [],
        })
        expect(issuesOf(input)).toEqual([])
    })
})

describe('validateBuildOrder syntax', () => {
    it.each([
        ['a non-object step', 5, 'is not an object'],
        ['a missing field', { action: 'produce', producer: 'capital-town-center' }, 'missing unit'],
        ['a mistyped field', { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: '3' }, 'count must be a number'],
        ['an unknown action', { action: 'train', producer: 'capital-town-center' }, 'unknown action "train"'],
        ['a missing action', { producer: 'capital-town-center' }, 'missing action'],
        ['a non-object trigger', { ...PAUSE, trigger: 90 }, 'trigger must be an object'],
        ['a trigger without a string kind', { ...PAUSE, trigger: { seconds: 90 } }, 'trigger.kind must be a string'],
        ['a time trigger without numeric seconds', { ...PAUSE, trigger: { kind: 'time', seconds: '90' } }, 'trigger.seconds'],
        ['a villagers trigger without numeric count', { ...PAUSE, trigger: { kind: 'villagers' } }, 'trigger.count'],
    ])('rejects %s', (_, step, text) => {
        const found = stepIssue(step)
        expect(found.code).toBe('syntax')
        expect(found.message).toContain('steps[0]')
        expect(found.message).toContain(text)
    })

    it.each([
        ['a non-string civ', { civ: 1 }, 'civ'],
        ['a non-string name', { name: null }, 'name'],
        ['a non-string source', { source: 3 }, 'source'],
        ['a non-object start', { start: 'sheep' }, 'start'],
        ['a non-array steps', { steps: {} }, 'steps'],
    ])('rejects %s at the top level', (_, fields, label) => {
        const found = only(order([], fields))
        expect(found).toEqual({ code: 'syntax', message: expect.stringContaining(label) })
    })

    it('rejects a mistyped start field', () => {
        expect(only(order([], { start: { villagers: { sheep: '6' }, rally: 'sheep' } })).code).toBe('syntax')
        expect(only(order([], { start: { villagers: [], rally: 'sheep' } })).code).toBe('syntax')
        expect(only(order([], { start: { villagers: { sheep: 6 }, rally: 1 } })).code).toBe('syntax')
    })

    it('gives a step with a shape issue no further checks', () => {
        const issues = issuesOf(order([{ action: 'produce', producer: 'no-such-building', unit: 'villager', count: 'x' }]))
        expect(issues.map((i) => i.code)).toEqual(['syntax'])
    })
})

describe('validateBuildOrder ids and techs', () => {
    it('rejects an unknown trigger kind', () => {
        const found = stepIssue({ ...PAUSE, trigger: { kind: 'resource' } })
        expect(found.code).toBe('unknown-trigger-kind')
        expect(found.message).toContain('resource')
    })

    it.each([
        ['unit', { action: 'produce', producer: 'capital-town-center', unit: 'knight-x' }, 'knight-x'],
        ['producer', { action: 'pause', producer: 'castle' }, 'castle'],
        ['building', { action: 'build', building: 'villager', from: 'wood' }, 'villager'],
        ['tech', { action: 'research', tech: 'forestry-1' }, 'forestry-1'],
        ['tech that is a unit', { action: 'research', tech: 'villager' }, 'villager'],
        ['research building', { action: 'research', tech: 'wheelbarrow', at: 'wheelbarrow' }, 'wheelbarrow'],
        ['node', { action: 'move', count: 1, from: 'sheep', to: 'fish' }, 'fish'],
        ['rally.to', { action: 'rally', producer: 'capital-town-center', to: 'gold-mine' }, 'gold-mine'],
        ['__proto__ node', { action: 'move', count: 1, from: '__proto__', to: 'wood' }, '__proto__'],
    ])('rejects an unknown %s', (_, step, id) => {
        const found = stepIssue(step)
        expect(found.code).toBe('unknown-id')
        expect(found.message).toContain('steps[0]')
        expect(found.message).toContain(id)
    })

    it('rejects an unknown civ', () => {
        expect(only(order([], { civ: 'french' }))).toEqual({ code: 'unknown-id', message: expect.stringContaining('french') })
    })

    it('rejects an unknown start node key and start.rally', () => {
        const key = only(order([], { start: { villagers: { sheep: 5, fish: 1 }, rally: 'sheep' } }))
        expect(key).toEqual({ code: 'unknown-id', message: expect.stringContaining('fish') })
        const rally = only(order([], { start: { rally: 'fish' } }))
        expect(rally).toEqual({ code: 'unknown-id', message: expect.stringContaining('fish') })
    })

    it('rejects a tech that classifyTech rejects, naming tech and property', () => {
        const academy = stepIssue({ action: 'research', tech: 'military-academy' })
        expect(academy.code).toBe('unsupported-tech')
        expect(academy.message).toContain('military-academy')
        expect(academy.message).toContain('buildTime')
        const forestry = stepIssue({ action: 'research', tech: 'forestry' })
        expect(forestry.code).toBe('unknown-tech-effect')
        expect(forestry.message).toContain('forestry')
        expect(forestry.message).toContain('unknown')
    })

    it('accepts techs whose effects are ignored or unmodeled', () => {
        expect(issuesOf(order([{ action: 'research', tech: 'fitted-leatherwork' }, { action: 'research', tech: 'admiralty' }]))).toEqual([])
    })
})

describe('validateBuildOrder bounds', () => {
    const produce = (fields: object) => ({ action: 'produce', producer: 'capital-town-center', unit: 'villager', ...fields })
    const cases: [string, (n: number) => unknown, number[], number[]][] = [
        ['trigger.seconds', (n) => ({ ...PAUSE, trigger: { kind: 'time', seconds: n } }), [0, 3600], [-1, 3601, 1.5, Infinity]],
        ['trigger.count', (n) => ({ ...PAUSE, trigger: { kind: 'villagers', count: n } }), [1, 200], [0, 201, 2.5]],
        ['produce.count', (n) => produce({ count: n }), [1, 200], [0, 201, 2.5, Infinity]],
        ['move.count', (n) => ({ action: 'move', count: n, from: 'sheep', to: 'wood' }), [1, 200], [0, 201, 1.5]],
        ['builders', (n) => ({ action: 'build', building: 'house', builders: n, from: 'wood' }), [1, 200], [0, 201, 1.5]],
        ['instance', (n) => ({ ...PAUSE, instance: n }), [1, 200], [0, 201, 1.5, NaN]],
        ['rally walkSeconds', (n) => ({ action: 'rally', producer: 'capital-town-center', to: 'wood', walkSeconds: n }), [0, 4.5, 60], [-0.5, 60.5, Infinity, NaN]],
        ['produce walkSeconds', (n) => produce({ rally: 'wood', walkSeconds: n }), [0, 60], [-1, 61]],
        ['build walkSeconds', (n) => ({ action: 'build', building: 'house', from: 'wood', walkSeconds: n }), [0, 60], [-1, 60.5]],
        ['move walkSeconds', (n) => ({ action: 'move', count: 1, from: 'sheep', to: 'wood', walkSeconds: n }), [0, 60], [-1, 60.5]],
    ]

    it.each(cases)('checks %s', (_, step, valid, invalid) => {
        for (const n of valid) {
            expect(issuesOf(order([step(n)])), String(n)).toEqual([])
        }
        for (const n of invalid) {
            const found = stepIssue(step(n))
            expect(found.code, String(n)).toBe('out-of-range')
            expect(found.message).toContain(String(n))
        }
    })

    it('checks start.villagers values', () => {
        for (const n of [-1, 201, 1.5]) {
            const found = only(order([], { start: { villagers: { sheep: 6, wood: n }, rally: 'sheep' } }))
            expect(found.code, String(n)).toBe('out-of-range')
            expect(found.message).toContain('wood')
        }
        expect(issuesOf(order([], { start: { villagers: { sheep: 6, wood: 0 }, rally: 'sheep' } }))).toEqual([])
        expect(only(order([], { start: { villagers: { sheep: 200 }, rally: 'sheep' } })).code).toBe('invalid')
    })

    it('accepts 200 steps and gives 201 steps one out-of-range issue', () => {
        expect(issuesOf(order(Array(200).fill(PAUSE)))).toEqual([])
        expect(issuesOf(order([]))).toEqual([])
        const steps = Array(201).fill({ action: 'pause', producer: 'no-such-building' })
        expect(only(order(steps))).toEqual({ code: 'out-of-range', message: expect.stringContaining('201') })
    })

    it('hard-codes the request caps', () => {
        expect(SIM_INPUT_BOUNDS.textChars.max).toBe(20000)
        expect(Object.isFrozen(SIM_INPUT_BOUNDS) && Object.isFrozen(SIM_INPUT_BOUNDS.steps)).toBe(true)
    })
})

describe('validateBuildOrder rally and start rules', () => {
    const tcStart = (villagers: Record<string, number>) => order([], { start: { villagers, rally: 'sheep' } })

    it('requires start.villagers to sum to the civ start', () => {
        for (const villagers of [{ sheep: 5 }, { sheep: 4, wood: 3 }]) {
            const found = only(tcStart(villagers))
            expect(found.code).toBe('invalid')
            expect(found.message).toContain('start.villagers')
        }
        expect(issuesOf(tcStart({ sheep: 4, wood: 2 }))).toEqual([])
    })

    it('rejects produce walkSeconds without rally', () => {
        const step = { action: 'produce', producer: 'capital-town-center', unit: 'villager', walkSeconds: 4 }
        expect(stepIssue(step)).toEqual({ code: 'invalid', step: 0, message: expect.stringContaining('walkSeconds') })
        expect(issuesOf(order([{ ...step, rally: 'wood' }]))).toEqual([])
    })

    it('rejects rally on a produce of a non-villager', () => {
        const found = stepIssue({ action: 'produce', producer: 'capital-town-center', unit: 'scout', rally: 'wood' })
        expect(found.code).toBe('invalid')
        expect(found.message).toContain('scout')
        expect(issuesOf(order([{ action: 'produce', producer: 'capital-town-center', unit: 'scout' }]))).toEqual([])
    })

    it('rejects a rally step on a building that produces no villagers', () => {
        const found = stepIssue({ action: 'rally', producer: 'house', to: 'wood' })
        expect(found.code).toBe('invalid')
        expect(found.message).toContain('house')
        expect(issuesOf(order([{ action: 'rally', producer: 'town-center', to: 'wood' }]))).toEqual([])
    })

    it('requires start.rally while a starting building produces villagers', () => {
        for (const start of [{ villagers: { sheep: 6 } }, {}, undefined]) {
            const found = only(order([], { start }))
            expect(found).toEqual({ code: 'invalid', message: expect.stringContaining('capital-town-center') })
        }
        const noProducer = { ...data, civData: { ...data.civData, startingState: { ...data.civData.startingState, buildings: { ...data.civData.startingState.buildings, value: ['house'] } } } }
        expect(validateBuildOrder(order([], { start: undefined }), noProducer).ok).toBe(true)
    })

    describe.each(['town-center', 'kings-palace'])('build of %s', (building) => {
        const build = { action: 'build', building, from: 'wood' }
        const noRally = (steps: unknown[]) => order(steps, { start: { villagers: { sheep: 6 } } })
        const rallyStep = { action: 'rally', producer: building, to: 'wood' }
        const rallyProduce = { action: 'produce', producer: building, unit: 'villager', rally: 'wood' }

        it('fails without start.rally or an earlier baseId-wide source', () => {
            const issues = issuesOf(noRally([build]))
            expect(issues).toHaveLength(2)
            expect(issues[1]).toEqual({ code: 'invalid', step: 0, message: expect.stringContaining(building) })
        })

        it('passes with start.rally, an earlier rally step or an earlier villager produce with rally', () => {
            expect(issuesOf(order([build]))).toEqual([])
            for (const source of [rallyStep, rallyProduce]) {
                expect(issuesOf(noRally([source, build])).filter((i) => i.step !== undefined)).toEqual([])
            }
        })

        it('still fails when the earlier source has an instance or comes later', () => {
            for (const steps of [[{ ...rallyStep, instance: 1 }, build], [{ ...rallyProduce, instance: 1 }, build], [build, rallyStep]]) {
                const found = issuesOf(noRally(steps)).filter((i) => i.step !== undefined)
                expect(found).toEqual([{ code: 'invalid', step: steps.indexOf(build), message: expect.stringContaining(building) }])
            }
        })
    })
})

describe('validateBuildOrder producer capability and repeat research', () => {
    it('checks the produce producer against the unit producers', () => {
        const found = stepIssue({ action: 'produce', producer: 'house', unit: 'villager' })
        expect(found.code).toBe('invalid')
        expect(found.message).toContain('house')
        expect(found.message).toContain('villager')
        expect(issuesOf(order([{ action: 'produce', producer: 'kings-palace', unit: 'villager' }]))).toEqual([])
    })

    it('checks research at against the tech producers', () => {
        const found = stepIssue({ action: 'research', tech: 'wheelbarrow', at: 'house' })
        expect(found.code).toBe('invalid')
        expect(found.message).toContain('wheelbarrow')
        expect(found.message).toContain('house')
        expect(issuesOf(order([{ action: 'research', tech: 'wheelbarrow', at: 'mill' }]))).toEqual([])
        expect(issuesOf(order([{ action: 'research', tech: 'wheelbarrow' }]))).toEqual([])
    })

    it('runs capability only after ids resolve', () => {
        expect(stepIssue({ action: 'produce', producer: 'no-such-building', unit: 'villager' }).code).toBe('unknown-id')
        expect(stepIssue({ action: 'research', tech: 'no-such-tech', at: 'house' }).code).toBe('unknown-id')
    })

    it('rejects a repeated research on the later step, naming the first', () => {
        const wheelbarrow = { action: 'research', tech: 'wheelbarrow' }
        const found = only(order([wheelbarrow, { ...wheelbarrow, at: 'mill' }]))
        expect(found).toEqual({ code: 'invalid', step: 1, message: expect.stringContaining('wheelbarrow') })
        expect(found.message).toContain('steps[0]')
        const lined = only(order([wheelbarrow, wheelbarrow]), { lines: { start: 1, steps: [4, 7] } })
        expect(lined).toEqual({ code: 'invalid', step: 1, line: 7, message: expect.stringContaining('line 4') })
        const three = issuesOf(order([wheelbarrow, wheelbarrow, wheelbarrow]))
        expect(three.map((i) => [i.step, i.message.includes('steps[0]')])).toEqual([[1, true], [2, true]])
        expect(issuesOf(order([wheelbarrow, { action: 'research', tech: 'textiles' }]))).toEqual([])
    })

    it('ignores unknown and rejected techs for repeats', () => {
        const unknown = issuesOf(order([{ action: 'research', tech: 'no-such-tech' }, { action: 'research', tech: 'no-such-tech' }]))
        expect(unknown.map((i) => i.code)).toEqual(['unknown-id', 'unknown-id'])
        const rejected = issuesOf(order([{ action: 'research', tech: 'forestry' }, { action: 'research', tech: 'forestry' }]))
        expect(rejected.map((i) => i.code)).toEqual(['unknown-tech-effect', 'unknown-tech-effect'])
    })
})

describe('validateBuildOrder issue location and order', () => {
    const badStart = { villagers: { sheep: 5 }, rally: 'sheep' }
    const badStep = { action: 'pause', producer: 'castle' }

    it('puts no step or line on a JSON start issue', () => {
        expect(only(order([], { start: badStart }))).toEqual({ code: 'invalid', message: expect.stringContaining('start') })
    })

    it('puts lines.start on a start issue and lines.steps[i] on a step issue', () => {
        const lines: BuildOrderLines = { start: 2, steps: [5, 9] }
        const issues = issuesOf(order([PAUSE, badStep], { start: badStart }), { lines })
        expect(issues).toEqual([
            { code: 'invalid', line: 2, message: expect.stringContaining('line 2') },
            { code: 'unknown-id', step: 1, line: 9, message: expect.stringContaining('line 9') },
        ])
    })

    it('omits line when the entry is missing', () => {
        const found = only(order([PAUSE, badStep]), { lines: { steps: [3] } })
        expect(found).toEqual({ code: 'unknown-id', step: 1, message: expect.stringContaining('steps[1]') })
        expect(only(order([], { start: badStart }), { lines: { steps: [] } })).not.toHaveProperty('line')
    })

    it('puts no line on any issue without options', () => {
        const issues = issuesOf(order([badStep, badStep], { start: badStart }))
        expect(issues).toHaveLength(3)
        expect(issues.filter((i) => 'line' in i)).toEqual([])
    })

    it('orders issues top level, then start, then steps', () => {
        const issues = issuesOf({ civ: 'french', name: 1, start: badStart, steps: [badStep, 7] })
        expect(issues.map((i) => [i.code, i.step])).toEqual([
            ['unknown-id', undefined],
            ['syntax', undefined],
            ['invalid', undefined],
            ['unknown-id', 0],
            ['syntax', 1],
        ])
    })

    it('orders a step issues by field', () => {
        const step = { action: 'produce', producer: 'castle', instance: 0, unit: 'villager', count: 500, trigger: { kind: 'time', seconds: -1 } }
        expect(issuesOf(order([step])).map((i) => i.message.split(': ')[1])).toEqual([
            expect.stringContaining('trigger.seconds'),
            expect.stringContaining('castle'),
            expect.stringContaining('instance'),
            expect.stringContaining('count'),
        ])
    })

    it('never throws on hostile input', () => {
        const proto = JSON.parse('{"villagers":{"__proto__":6},"rally":"sheep"}')
        for (const input of [null, undefined, 'build', [], {}, 42, order([null]), order([], { start: proto }), order([undefined, []])]) {
            const result = validateBuildOrder(input, data)
            expect(result.ok).toBe(false)
        }
        expect(only(order([], { start: proto }))).toEqual({ code: 'unknown-id', message: expect.stringContaining('__proto__') })
    })
})

describe('resolveSimInputs', () => {
    const farm = data.base.gatherNodes.farm.trip

    it('returns the defaults, trips and walk read from data', () => {
        for (const partial of [{}, undefined, null]) {
            const result = resolveSimInputs(partial, data)
            expect(result.ok).toBe(true)
        }
        const inputs = defaults()
        expect(inputs).toEqual({
            durationSeconds: 1200,
            trips: expect.any(Object),
            walkSeconds: data.base.walkSeconds.value,
            autoHouses: true,
            houseBuilders: 1,
            houseBuilderSource: 'wood',
            influenceCoverage: { mill: 1 },
        })
        expect(Object.keys(inputs.trips).sort()).toEqual(Object.keys(data.base.gatherNodes).sort())
        expect(inputs.trips.farm).toEqual({
            walkSecondsCamp: farm.walkSecondsCamp.value,
            walkSecondsTownCenter: farm.walkSecondsTownCenter.value,
            dropOffSeconds: farm.dropOffSeconds.value,
        })
    })

    it('reads defaults from the data it is given', () => {
        const base = structuredClone(baseRules) as unknown as BaseRules
        base.walkSeconds.value = 9
        base.gatherNodes.farm.trip.walkSecondsCamp.value = 7.5
        const changed = buildGameData(
            'english',
            structuredClone(englishSnapshot) as unknown as Snapshot,
            base,
            structuredClone(englishRules) as unknown as CivData,
        )
        const result = resolveSimInputs({}, changed)
        expect(result.ok && [result.inputs.walkSeconds, result.inputs.trips.farm.walkSecondsCamp]).toEqual([9, 7.5])
    })

    it('merges trips per node then per field and influenceCoverage per key', () => {
        const result = resolveSimInputs({ trips: { farm: { walkSecondsCamp: 3 } }, influenceCoverage: { 'lumber-camp': 0.5 } }, data)
        const expected = defaults()
        expected.trips.farm.walkSecondsCamp = 3
        expected.influenceCoverage['lumber-camp'] = 0.5
        expect(result).toEqual({ ok: true, inputs: expected })
    })

    it('takes every supplied field', () => {
        const partial = { durationSeconds: 600, walkSeconds: 0, autoHouses: false, houseBuilders: 3, houseBuilderSource: 'gold', influenceCoverage: { mill: 0 } }
        const result = resolveSimInputs(partial, data)
        expect(result.ok && result.inputs).toEqual({ ...defaults(), ...partial })
    })

    it.each([
        ['durationSeconds', { durationSeconds: 59 }, { durationSeconds: 3601 }, { durationSeconds: 60.5 }, [60, 3600]],
        ['walkSeconds', { walkSeconds: -0.1 }, { walkSeconds: 60.5 }, { walkSeconds: Infinity }, [0, 60]],
        ['houseBuilders', { houseBuilders: 0 }, { houseBuilders: 201 }, { houseBuilders: 1.5 }, [1, 200]],
    ])('bounds %s', (field, ...rest) => {
        const [low, high, odd, ok] = rest as [object, object, object, number[]]
        for (const partial of [low, high, odd]) {
            expect(inputIssues(partial)).toEqual([{ code: 'out-of-range', message: expect.stringContaining(`inputs.${field}`) }])
        }
        for (const n of ok) {
            expect(inputIssues({ [field]: n })).toEqual([])
        }
    })

    it.each([
        ['walkSecondsCamp', 60, [-1, 60.5]],
        ['walkSecondsTownCenter', 60, [-1, 60.5]],
        ['dropOffSeconds', 30, [-1, 30.5]],
    ])('bounds trips.<node>.%s', (field, max, bad) => {
        for (const n of [0, max]) {
            expect(inputIssues({ trips: { wood: { [field]: n } } })).toEqual([])
        }
        for (const n of bad) {
            expect(inputIssues({ trips: { wood: { [field]: n } } })).toEqual([
                { code: 'out-of-range', message: expect.stringContaining(`inputs.trips.wood.${field}`) },
            ])
        }
    })

    it('bounds influenceCoverage values', () => {
        expect(inputIssues({ influenceCoverage: { mill: 0, 'mining-camp': 1 } })).toEqual([])
        for (const n of [-0.1, 1.1]) {
            expect(inputIssues({ influenceCoverage: { mill: n } })).toEqual([
                { code: 'out-of-range', message: expect.stringContaining('inputs.influenceCoverage.mill') },
            ])
        }
    })

    it.each([
        ['a non-object', 'fast', 'inputs'],
        ['an array', [], 'inputs'],
        ['a string durationSeconds', { durationSeconds: '600' }, 'inputs.durationSeconds'],
        ['a non-object trips', { trips: 3 }, 'inputs.trips'],
        ['a non-object trip', { trips: { farm: 3 } }, 'inputs.trips.farm'],
        ['a string trip field', { trips: { farm: { dropOffSeconds: '1' } } }, 'inputs.trips.farm.dropOffSeconds'],
        ['a string walkSeconds', { walkSeconds: '5' }, 'inputs.walkSeconds'],
        ['a string autoHouses', { autoHouses: 'yes' }, 'inputs.autoHouses'],
        ['a string houseBuilders', { houseBuilders: '1' }, 'inputs.houseBuilders'],
        ['a numeric houseBuilderSource', { houseBuilderSource: 1 }, 'inputs.houseBuilderSource'],
        ['a non-object influenceCoverage', { influenceCoverage: [] }, 'inputs.influenceCoverage'],
        ['a string coverage value', { influenceCoverage: { mill: '1' } }, 'inputs.influenceCoverage.mill'],
    ])('rejects %s as syntax', (_, partial, path) => {
        expect(inputIssues(partial)).toEqual([{ code: 'syntax', message: expect.stringContaining(`${path}:`) }])
    })

    it.each([
        ['trips node', { trips: { fish: {} } }, 'inputs.trips.fish'],
        ['__proto__ trips node', JSON.parse('{"trips":{"__proto__":{}}}'), 'inputs.trips.__proto__'],
        ['houseBuilderSource', { houseBuilderSource: 'fish' }, 'inputs.houseBuilderSource'],
        ['influenceCoverage key', { influenceCoverage: { villager: 1 } }, 'inputs.influenceCoverage.villager'],
    ])('rejects an unknown %s', (_, partial, path) => {
        expect(inputIssues(partial)).toEqual([{ code: 'unknown-id', message: expect.stringContaining(path) }])
    })

    it('reports every field in declaration order and ignores extras', () => {
        const issues = inputIssues({ influenceCoverage: { mill: 2 }, durationSeconds: 1, extra: true })
        expect(issues.map((i) => i.message.split(':')[0])).toEqual(['inputs.durationSeconds', 'inputs.influenceCoverage.mill'])
    })

    it('returns fresh copies that never share state with data', () => {
        const first = defaults()
        first.trips.farm.walkSecondsCamp = 99
        first.influenceCoverage.mill = 0
        expect(defaults().trips.farm.walkSecondsCamp).toBe(farm.walkSecondsCamp.value)
        expect(defaults().influenceCoverage).toEqual({ mill: 1 })
        expect(data.base.gatherNodes.farm.trip.walkSecondsCamp.value).not.toBe(99)
    })
})
