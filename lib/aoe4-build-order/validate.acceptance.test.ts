import { describe, expect, it } from 'vitest'
import baseRules from '../../data/aoe4-build-order/rules/base.json'
import englishRules from '../../data/aoe4-build-order/rules/english.json'
import englishSnapshot from '../../data/aoe4-build-order/aoe4world/english.json'
import { BaseRules, CivData, Snapshot, buildGameData, loadGameData } from './data'
import * as validateModule from './validate'
import { SIM_INPUT_BOUNDS, resolveSimInputs, validateBuildOrder } from './validate'

// Drives the module exports the way the route (SGS-033) will: unknown input in, ok/issues out.
const data = loadGameData('english')
const START = { villagers: { sheep: 6 }, rally: 'sheep' }
const PAUSE = { action: 'pause', producer: 'capital-town-center' }
const order = (steps: unknown[], extra: Record<string, unknown> = {}) => ({ civ: 'english', name: 't', start: START, steps, ...extra })

function issues(input: unknown, lines?: { start?: number; steps: number[] }) {
    const r = validateBuildOrder(input, data, lines ? { lines } : undefined)
    return r.ok === false ? r.issues : []
}
function inIssues(partial: unknown) {
    const r = resolveSimInputs(partial, data)
    return r.ok === false ? r.issues : []
}

describe('acceptance: exports', () => {
    it('exports exactly the runtime names validateBuildOrder, resolveSimInputs, SIM_INPUT_BOUNDS', () => {
        expect(Object.keys(validateModule).sort()).toEqual(['SIM_INPUT_BOUNDS', 'resolveSimInputs', 'validateBuildOrder'])
    })
})

describe('acceptance: valid order', () => {
    it('accepts the ticket example and returns the order', () => {
        const input = order([
            { action: 'produce', producer: 'capital-town-center', unit: 'villager' },
            { action: 'rally', producer: 'capital-town-center', to: 'wood' },
            { action: 'build', building: 'house', from: 'wood' },
            { action: 'research', tech: 'wheelbarrow', at: 'mill' },
            { action: 'research', tech: 'survival-techniques' },
            { action: 'research', tech: 'bloomery' },
            { action: 'research', tech: 'shaft-mining' },
        ])
        expect(validateBuildOrder(input, data)).toEqual({ ok: true, order: input })
    })
})

describe('acceptance: issue codes', () => {
    it.each([
        ['syntax', order([5]), 'syntax'],
        ['syntax unknown action', order([{ action: 'dance' }]), 'syntax'],
        ['syntax bad trigger', order([{ ...PAUSE, trigger: 'now' }]), 'syntax'],
        ['trigger kind', order([{ ...PAUSE, trigger: { kind: 'resource' } }]), 'unknown-trigger-kind'],
        ['unit', order([{ action: 'produce', producer: 'capital-town-center', unit: 'dragon' }]), 'unknown-id'],
        ['civ', order([], { civ: 'french' }), 'unknown-id'],
        ['forestry-1 is not a baseId', order([{ action: 'research', tech: 'forestry-1' }]), 'unknown-id'],
        ['rally.to', order([{ action: 'rally', producer: 'capital-town-center', to: 'moon' }]), 'unknown-id'],
        ['forestry', order([{ action: 'research', tech: 'forestry' }]), 'unknown-tech-effect'],
        ['military-academy', order([{ action: 'research', tech: 'military-academy' }]), 'unsupported-tech'],
        ['out-of-range', order([{ ...PAUSE, instance: 0 }]), 'out-of-range'],
        ['invalid', order([{ action: 'produce', producer: 'capital-town-center', unit: 'villager', walkSeconds: 1 }]), 'invalid'],
    ])('%s -> %s', (_, input, code) => {
        const found = issues(input)
        expect(found).toHaveLength(1)
        expect(found[0].code).toBe(code)
        if (input.steps.length) expect(found[0].message).toContain('steps[0]')
    })

    it('names the property of a rejected tech', () => {
        expect(issues(order([{ action: 'research', tech: 'military-academy' }]))[0].message).toContain('buildTime')
    })
})

describe('acceptance: bounds', () => {
    const one = (step: Record<string, unknown>) => issues(order([step]))
    const cases: [string, (n: number) => Record<string, unknown>, number, number][] = [
        ['trigger.seconds', (n) => ({ ...PAUSE, trigger: { kind: 'time', seconds: n } }), 0, 3600],
        ['trigger.count', (n) => ({ ...PAUSE, trigger: { kind: 'villagers', count: n } }), 1, 200],
        ['instance', (n) => ({ ...PAUSE, instance: n }), 1, 200],
        ['produce.count', (n) => ({ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: n }), 1, 200],
        ['move.count', (n) => ({ action: 'move', count: n, from: 'wood', to: 'gold' }), 1, 200],
        ['builders', (n) => ({ action: 'build', building: 'house', builders: n, from: 'wood' }), 1, 200],
        ['rally walkSeconds', (n) => ({ action: 'rally', producer: 'capital-town-center', to: 'wood', walkSeconds: n }), 0, 60],
        ['move walkSeconds', (n) => ({ action: 'move', count: 1, from: 'wood', to: 'gold', walkSeconds: n }), 0, 60],
    ]
    it.each(cases)('%s accepts min and max, rejects just outside', (_, make, min, max) => {
        expect(one(make(min))).toEqual([])
        expect(one(make(max))).toEqual([])
        for (const bad of [min - 1, max + 1]) expect(one(make(bad)).map((i) => i.code)).toEqual(['out-of-range'])
    })

    it('rejects 60.5 walkSeconds, a non-integer count and Infinity', () => {
        expect(one({ action: 'rally', producer: 'capital-town-center', to: 'wood', walkSeconds: 60.5 })[0].code).toBe('out-of-range')
        expect(one({ action: 'move', count: 1.5, from: 'wood', to: 'gold' })[0].code).toBe('out-of-range')
        expect(one({ action: 'move', count: Infinity, from: 'wood', to: 'gold' })[0].code).toBe('out-of-range')
    })

    it('rejects start.villagers values -1 and 201', () => {
        for (const n of [-1, 201]) {
            const found = issues(order([], { start: { villagers: { sheep: n }, rally: 'sheep' } }))
            expect(found.some((i) => i.code === 'out-of-range')).toBe(true)
        }
    })

    it('200 steps pass; 201 steps give exactly one out-of-range issue', () => {
        const steps = (n: number) => Array.from({ length: n }, () => ({ action: 'move', count: 1, from: 'wood', to: 'gold' }))
        expect(issues(order(steps(200)))).toEqual([])
        const over = issues(order([...steps(200), 5]))
        expect(over.map((i) => i.code)).toEqual(['out-of-range'])
    })

    it('table carries the design rows', () => {
        const b = SIM_INPUT_BOUNDS
        expect([b.textChars.max, b.steps.max, b.durationSeconds.min, b.durationSeconds.max, b.dropOffSeconds.max, b.influenceCoverage.max]).toEqual([20000, 200, 60, 3600, 30, 1])
        expect([b.influenceCoverage.integer, b.walkSeconds.integer, b.count.integer, b.startVillagers.max]).toEqual([false, false, true, 200])
    })
})

describe('acceptance: invalid rules', () => {
    const codes = (input: unknown) => issues(input).map((i) => i.code)
    const rallyStep = { action: 'rally', producer: 'town-center', to: 'wood' }
    const noStartRally = { start: { villagers: { sheep: 6 } } }

    it('start.villagers sum 5 and 7 fail, 6 passes', () => {
        expect(codes(order([], { start: { villagers: { sheep: 5 }, rally: 'sheep' } }))).toEqual(['invalid'])
        expect(codes(order([], { start: { villagers: { sheep: 7 }, rally: 'sheep' } }))).toEqual(['invalid'])
        expect(codes(order([], { start: { villagers: { sheep: 3, berry: 3 }, rally: 'sheep' } }))).toEqual([])
    })
    it('produce walkSeconds needs rally', () => {
        const p = { action: 'produce', producer: 'capital-town-center', unit: 'villager', walkSeconds: 2 }
        expect(codes(order([p]))).toEqual(['invalid'])
        expect(codes(order([{ ...p, rally: 'wood' }]))).toEqual([])
    })
    it('rally on scout fails, villager passes', () => {
        const p = { action: 'produce', producer: 'capital-town-center', unit: 'scout', rally: 'wood' }
        expect(codes(order([p]))).toEqual(['invalid'])
        expect(codes(order([{ ...p, unit: 'villager' }]))).toEqual([])
    })
    it('rally step on house fails, on town-center passes', () => {
        expect(codes(order([{ ...rallyStep, producer: 'house' }]))).toEqual(['invalid'])
        expect(codes(order([rallyStep]))).toEqual([])
    })
    it('missing start.rally fails naming capital-town-center; no start also fails', () => {
        const a = issues(order([], noStartRally))
        expect(a.map((i) => i.code)).toEqual(['invalid'])
        expect(a[0].message).toContain('capital-town-center')
        expect(codes(order([], { start: {} }))).toEqual(['invalid'])
        expect(codes(order([], { start: undefined }))).toEqual(['invalid'])
    })
    it.each(['town-center', 'kings-palace'])('build %s without start.rally needs an earlier baseId-wide rally source', (b) => {
        // start rally missing itself yields one invalid; compare against the baseline order with no steps
        const base = codes(order([], noStartRally)).length
        const build = { action: 'build', building: b, from: 'wood' }
        const rallyStep = { action: 'rally', producer: b, to: 'wood' }
        const total = (steps: unknown[]) => codes(order(steps, noStartRally)).length
        expect(total([build])).toBe(base + 1)
        expect(total([rallyStep, build])).toBe(base)
        expect(total([{ action: 'produce', producer: b, unit: 'villager', rally: 'wood' }, build])).toBe(base)
        expect(total([{ ...rallyStep, instance: 2 }, build])).toBe(base + 1)
        expect(total([{ action: 'produce', producer: b, instance: 2, unit: 'villager', rally: 'wood' }, build])).toBe(base + 1)
        expect(total([build, rallyStep])).toBe(base + 1)
        expect(codes(order([build]))).toEqual([])
    })
    it('produce villager from house fails naming both; kings-palace passes', () => {
        const found = issues(order([{ action: 'produce', producer: 'house', unit: 'villager' }]))
        expect(found.map((i) => i.code)).toEqual(['invalid'])
        expect(found[0].message).toContain('house')
        expect(found[0].message).toContain('villager')
        expect(codes(order([{ action: 'produce', producer: 'kings-palace', unit: 'villager' }]))).toEqual([])
    })
    it('research wheelbarrow at house fails, at mill and no at pass', () => {
        const found = issues(order([{ action: 'research', tech: 'wheelbarrow', at: 'house' }]))
        expect(found.map((i) => i.code)).toEqual(['invalid'])
        expect(found[0].message).toContain('wheelbarrow')
        expect(found[0].message).toContain('house')
        expect(codes(order([{ action: 'research', tech: 'wheelbarrow', at: 'mill' }]))).toEqual([])
        expect(codes(order([{ action: 'research', tech: 'wheelbarrow' }]))).toEqual([])
    })
    it('repeat research: one issue on the later step naming the earlier; at does not matter; other tech fine', () => {
        const w = { action: 'research', tech: 'wheelbarrow' }
        const found = issues(order([w, { ...w, at: 'mill' }]))
        expect(found).toHaveLength(1)
        expect(found[0]).toMatchObject({ code: 'invalid', step: 1 })
        expect(found[0].message).toContain('wheelbarrow')
        expect(found[0].message).toContain('steps[0]')
        expect(issues(order([w, w], {}), { steps: [7, 9] })[0].message).toContain('line 7')
        expect(codes(order([w, { action: 'research', tech: 'textiles' }]))).toEqual([])
        const three = issues(order([w, w, w]))
        expect(three.map((i) => [i.step, i.message.includes('steps[0]')])).toEqual([[1, true], [2, true]])
    })
    it('capability and repeat checks wait for ids', () => {
        expect(issues(order([{ action: 'produce', producer: 'no-such-building', unit: 'villager' }])).map((i) => i.code)).toEqual(['unknown-id'])
        expect(issues(order([{ action: 'research', tech: 'no-such-tech', at: 'house' }])).map((i) => i.code)).toEqual(['unknown-id'])
        const t = { action: 'research', tech: 'no-such-tech' }
        expect(issues(order([t, t])).map((i) => i.code)).toEqual(['unknown-id', 'unknown-id'])
    })
})

describe('acceptance: issue location', () => {
    it('JSON start issue has no step or line', () => {
        const [i] = issues(order([], { start: { villagers: { sheep: 5 }, rally: 'sheep' } }))
        expect(i.step).toBeUndefined()
        expect(i.line).toBeUndefined()
    })
    it('lines add line to start and step issues; short lines.steps omits line; no options no line', () => {
        const input = order([PAUSE, { ...PAUSE, instance: 0 }, { ...PAUSE, instance: 0 }], { start: { villagers: { sheep: 5 }, rally: 'sheep' } })
        const found = issues(input, { start: 2, steps: [4, 5] })
        expect(found[0]).toMatchObject({ code: 'invalid', line: 2 })
        expect(found[0].step).toBeUndefined()
        expect(found[1]).toMatchObject({ step: 1, line: 5 })
        expect(found[1].message).toContain('line 5')
        expect(found[2].step).toBe(2)
        expect(found[2].line).toBeUndefined()
        for (const i of issues(input)) expect(i.line).toBeUndefined()
    })
})

describe('acceptance: hostile input', () => {
    it.each([null, 'x', [], {}, 5, undefined])('rejects %j without throwing', (v) => {
        const r = validateBuildOrder(v, data)
        expect(r.ok).toBe(false)
    })
    it('rejects a step list containing null', () => {
        expect(validateBuildOrder(order([null]), data).ok).toBe(false)
    })
    it('treats an own __proto__ start.villagers key as unknown', () => {
        const input = JSON.parse('{"civ":"english","name":"x","start":{"villagers":{"__proto__":6},"rally":"sheep"},"steps":[]}')
        const r = validateBuildOrder(input, data)
        expect(r.ok === false && r.issues.some((i) => i.code === 'unknown-id')).toBe(true)
    })
})

describe('acceptance: resolveSimInputs', () => {
    const clone = () => structuredClone(baseRules) as unknown as BaseRules
    it.each([undefined, null, {}])('%j gives the defaults from data', (v) => {
        const r = resolveSimInputs(v, data)
        expect(r.ok === true && r.inputs).toMatchObject({
            durationSeconds: 1200, autoHouses: true, houseBuilders: 1, houseBuilderSource: 'wood', influenceCoverage: { mill: 1 },
            walkSeconds: data.base.walkSeconds.value,
        })
        expect(r.ok === true && r.inputs.trips.farm.walkSecondsCamp).toBe(data.base.gatherNodes.farm.trip.walkSecondsCamp.value)
    })
    it('reads walkSeconds and trips from the data it is given', () => {
        const base = clone()
        base.walkSeconds.value = 7.5
        base.gatherNodes.farm.trip.walkSecondsCamp.value = 4.25
        const changed = buildGameData('english', structuredClone(englishSnapshot) as unknown as Snapshot, base, structuredClone(englishRules) as unknown as CivData)
        const r = resolveSimInputs({}, changed)
        expect(r.ok === true && [r.inputs.walkSeconds, r.inputs.trips.farm.walkSecondsCamp]).toEqual([7.5, 4.25])
    })
    it('merges trips per node then per field and influenceCoverage per key', () => {
        const r = resolveSimInputs({ trips: { farm: { walkSecondsCamp: 3 } }, influenceCoverage: { 'town-center': 0.5 } }, data)
        const d = resolveSimInputs({}, data)
        if (r.ok !== true || d.ok !== true) throw new Error('rejected')
        expect(r.inputs.trips.farm).toEqual({ ...d.inputs.trips.farm, walkSecondsCamp: 3 })
        expect(r.inputs.trips.wood).toEqual(d.inputs.trips.wood)
        expect(r.inputs.influenceCoverage).toEqual({ mill: 1, 'town-center': 0.5 })
    })
    it.each([
        ['durationSeconds', { durationSeconds: 59 }, 'out-of-range', 'inputs.durationSeconds'],
        ['durationSeconds hi', { durationSeconds: 3601 }, 'out-of-range', 'inputs.durationSeconds'],
        ['durationSeconds type', { durationSeconds: '5' }, 'syntax', 'inputs.durationSeconds'],
        ['walkSeconds', { walkSeconds: 61 }, 'out-of-range', 'inputs.walkSeconds'],
        ['houseBuilders', { houseBuilders: 0 }, 'out-of-range', 'inputs.houseBuilders'],
        ['houseBuilders frac', { houseBuilders: 1.5 }, 'out-of-range', 'inputs.houseBuilders'],
        ['autoHouses', { autoHouses: 'yes' }, 'syntax', 'inputs.autoHouses'],
        ['houseBuilderSource', { houseBuilderSource: 'moon' }, 'unknown-id', 'inputs.houseBuilderSource'],
        ['trips node', { trips: { moon: {} } }, 'unknown-id', 'inputs.trips.moon'],
        ['camp', { trips: { farm: { walkSecondsCamp: 61 } } }, 'out-of-range', 'inputs.trips.farm.walkSecondsCamp'],
        ['tc', { trips: { farm: { walkSecondsTownCenter: -1 } } }, 'out-of-range', 'inputs.trips.farm.walkSecondsTownCenter'],
        ['dropoff', { trips: { farm: { dropOffSeconds: 31 } } }, 'out-of-range', 'inputs.trips.farm.dropOffSeconds'],
        ['coverage key', { influenceCoverage: { moon: 1 } }, 'unknown-id', 'inputs.influenceCoverage.moon'],
        ['coverage range', { influenceCoverage: { mill: 1.5 } }, 'out-of-range', 'inputs.influenceCoverage.mill'],
    ])('%s is rejected with a path-naming message', (_, partial, code, path) => {
        const found = inIssues(partial)
        expect(found.length).toBeGreaterThan(0)
        expect(found[0].code).toBe(code)
        expect(found[0].message).toContain(path)
        expect(found[0].step).toBeUndefined()
        expect(found[0].line).toBeUndefined()
    })
    it('rejects a non-object', () => {
        expect(inIssues('x')[0].code).toBe('syntax')
        expect(inIssues(5)[0].code).toBe('syntax')
    })
    it('accepts bound edges for inputs', () => {
        const r = resolveSimInputs({ durationSeconds: 60, walkSeconds: 60, houseBuilders: 200, trips: { farm: { dropOffSeconds: 30 } }, influenceCoverage: { mill: 0 } }, data)
        expect(r.ok).toBe(true)
    })
    it('returns fresh copies: mutating the result leaves data and later results unchanged', () => {
        const before = data.base.gatherNodes.farm.trip.walkSecondsCamp.value
        const a = resolveSimInputs({}, data)
        if (a.ok !== true) throw new Error('rejected')
        a.inputs.trips.farm.walkSecondsCamp = 99
        a.inputs.influenceCoverage.mill = 0
        const b = resolveSimInputs({}, data)
        expect(b.ok === true && b.inputs.trips.farm.walkSecondsCamp).toBe(before)
        expect(b.ok === true && b.inputs.influenceCoverage.mill).toBe(1)
        expect(data.base.gatherNodes.farm.trip.walkSecondsCamp.value).toBe(before)
    })
})
