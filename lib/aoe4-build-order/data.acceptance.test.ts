import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import baseRules from '../../data/aoe4-build-order/rules/base.json'
import englishRules from '../../data/aoe4-build-order/rules/english.json'
import snapshot from '../../data/aoe4-build-order/aoe4world/english.json'
import { buildGameData, loadGameData } from './data'
import type { BaseRules, CivData, Snapshot } from './data'
import { classifyTech } from './effects'
import type { CivId } from './model'

const data = loadGameData('english')
const technologies = snapshot.technologies as unknown as Snapshot['technologies']

function tally(): Record<string, string[]> {
    const out: Record<string, string[]> = {}
    for (const tech of technologies) {
        const support = classifyTech(data.byId.get(tech.id)!, data)
        const key = support.kind === 'rejected' ? `rejected/${support.code}` : support.kind
        ;(out[key] ??= []).push(tech.baseId)
    }
    return out
}

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value))
}

describe('snapshot file', () => {
    it('has exactly the documented top-level keys and entry counts', () => {
        expect(Object.keys(snapshot).sort()).toEqual(['buildings', 'source', 'technologies', 'units', 'upgrades'])
        expect([snapshot.units.length, snapshot.buildings.length, snapshot.technologies.length, snapshot.upgrades.length]).toEqual([43, 30, 69, 11])
    })

    it('records a complete source with a full commit sha', () => {
        expect(Object.keys(snapshot.source).sort()).toEqual(['commit', 'committedAt', 'fetchedAt', 'patch', 'patchSource', 'repo'])
        expect(snapshot.source.commit).toMatch(/^[0-9a-f]{40}$/)
        expect(snapshot.source.repo).toBe('aoe4world/data')
        expect(Number.isNaN(Date.parse(snapshot.source.committedAt))).toBe(false)
        expect(Number.isNaN(Date.parse(snapshot.source.fetchedAt))).toBe(false)
        expect(snapshot.source.patchSource).toMatch(/^https?:\/\//)
        expect(snapshot.source.patch.length).toBeGreaterThan(0)
    })

    it('contains only English entries, written with 2-space indent', () => {
        for (const e of [...snapshot.units, ...snapshot.buildings, ...snapshot.technologies, ...snapshot.upgrades]) {
            expect(e.civs).toContain('en')
        }
        const raw = readFileSync(new URL('../../data/aoe4-build-order/aoe4world/english.json', import.meta.url), 'utf8')
        expect(raw.trimEnd()).toBe(JSON.stringify(JSON.parse(raw), null, 2))
    })
})

describe('rules files', () => {
    const base = baseRules as unknown as BaseRules
    const civ = englishRules as unknown as CivData

    it('base.json has exactly the documented keys and values', () => {
        expect(Object.keys(base).sort()).toEqual(['builderScaling', 'gatherNodes', 'maxPopCap', 'walkSeconds'])
        expect(base.walkSeconds.value).toBe(5)
        expect(base.maxPopCap.value).toBe(200)
        expect(base.builderScaling.numerator.value).toBe(3)
        expect(base.builderScaling.offset.value).toBe(2)
        expect(Object.keys(base.gatherNodes).sort()).toEqual(['berry', 'boar', 'deer', 'farm', 'gold', 'sheep', 'stone', 'wood'])
    })

    it('gather node rates, capacities, properties, drop-offs and trip seeds match the ticket table', () => {
        const expected: Record<string, [string, number, number, string[], string[], string[], number]> = {
            sheep: ['food', 0.75, 10, ['foodGatherRate'], ['carryCapacity'], ['mill'], 2.86],
            berry: ['food', 0.69, 10, ['foodGatherRate', 'berryGatherRate'], ['carryCapacity'], ['mill'], 3.73],
            deer: ['food', 0.825, 25, ['huntGatherRate'], ['carryCapacity', 'huntCarryCapacity'], ['mill'], 5.67],
            boar: ['food', 0.9, 25, ['huntGatherRate'], ['carryCapacity', 'huntCarryCapacity'], ['mill'], 5.67],
            farm: ['food', 0.75, 10, ['foodGatherRate', 'farmGatherRate'], ['carryCapacity'], ['mill'], 3.01],
            wood: ['wood', 0.75, 10, ['woodGatherRate'], ['carryCapacity'], ['lumber-camp'], 6.02],
            gold: ['gold', 0.75, 10, ['goldGatherRate'], ['carryCapacity'], ['mining-camp'], 2.88],
            stone: ['stone', 0.75, 10, ['stoneGatherRate'], ['carryCapacity'], ['mining-camp'], 2.88],
        }
        for (const [id, [resource, rate, capacity, rateProps, capProps, dropOffs, seed]] of Object.entries(expected)) {
            const node = base.gatherNodes[id as keyof typeof base.gatherNodes]
            expect(node.resource, id).toBe(resource)
            expect(node.rate.value, id).toBe(rate)
            expect(node.capacity.value, id).toBe(capacity)
            expect(node.rateProperties, id).toEqual(rateProps)
            expect(node.capacityProperties, id).toEqual(capProps)
            expect(node.dropOffs, id).toEqual(dropOffs)
            expect(node.trip.walkSecondsCamp.value, id).toBeCloseTo(seed, 2)
            expect(node.trip.walkSecondsTownCenter.value, id).toBeCloseTo(seed, 2)
            expect(node.trip.dropOffSeconds.value, id).toBe(0)
        }
    })

    it('english.json has the documented keys, starting state, supply, overlay rows and upgrade targets', () => {
        expect(Object.keys(civ).sort()).toEqual(['effects', 'startingState', 'supply', 'upgradeTargets'])
        expect(civ.startingState.age.value).toBe(1)
        expect(civ.startingState.resources.value).toEqual({ food: 200, wood: 200, gold: 100, stone: 0 })
        expect(civ.startingState.villagers.value).toEqual({ sheep: 6, berry: 0, deer: 0, boar: 0, farm: 0, wood: 0, gold: 0, stone: 0 })
        expect(civ.startingState.units.value).toEqual({ scout: 1 })
        expect(civ.startingState.buildings.value).toEqual(['capital-town-center'])
        expect(Object.keys(civ.supply).sort()).toEqual(['capital-town-center', 'house', 'kings-palace', 'town-center'])
        expect(Object.values(civ.supply).map((s) => s.value)).toEqual([10, 10, 10, 10])
        expect(civ.effects).toHaveLength(7)
        const farm = civ.effects.filter((e) => e.property === 'farmGatherRate')
        expect(farm.map((e) => e.value)).toEqual([1.2, 1.25, 1.3, 1.3])
        expect(farm.map((e) => e.condition?.age)).toEqual([1, 2, 3, 4])
        expect(farm.every((e) => e.condition?.nearBuilding === 'mill' && e.grantedBy === 'civ')).toBe(true)
        expect(civ.effects.filter((e) => e.grantedBy === 'shaft-mining').map((e) => e.property).sort()).toEqual(['goldGatherRate', 'stoneGatherRate'])
        expect(civ.effects.filter((e) => e.grantedBy === 'kings-palace')).toMatchObject([
            { property: 'productionSpeed', value: 1.1, condition: { producer: 'kings-palace' } },
        ])
        expect(Object.keys(civ.upgradeTargets)).toHaveLength(11)
        expect(civ.upgradeTargets['elite-knights-or-lancers'].value).toBe('knight')
        expect(civ.upgradeTargets['early-men-at-arms'].value).toBe('man-at-arms')
    })

    it('every value-bearing object has a source and verified flag, false only for owner-observed capacities', () => {
        const falseAt: string[] = []
        let count = 0
        const walk = (node: unknown, path: string) => {
            if (node === null || typeof node !== 'object') return
            const obj = node as Record<string, unknown>
            if ('value' in obj) {
                count++
                expect(typeof obj.source, path).toBe('string')
                expect((obj.source as string).length, path).toBeGreaterThan(0)
                expect(typeof obj.unverified, path).toBe('boolean')
                if (obj.unverified === false) falseAt.push(path)
            }
            for (const [k, v] of Object.entries(obj)) walk(v, `${path}.${k}`)
        }
        walk(baseRules, 'base')
        walk(englishRules, 'english')
        expect(count).toBeGreaterThanOrEqual(71)
        expect(falseAt.sort()).toEqual(['base.gatherNodes.boar.capacity', 'base.gatherNodes.deer.capacity', 'base.gatherNodes.sheep.capacity'])
    })

    it('references resolve inside the snapshot', () => {
        const baseIds = (id: string) => data.byBaseId.get(id)
        for (const node of Object.values(data.base.gatherNodes)) {
            for (const d of node.dropOffs) expect(baseIds(d)?.[0].classes, d).toContain('resource_drop_off')
        }
        for (const key of data.supply.keys()) expect(baseIds(key), key).toBeDefined()
        for (const row of data.civData.effects) {
            if (row.grantedBy !== 'civ') expect(baseIds(row.grantedBy), row.grantedBy).toBeDefined()
            if (row.condition?.nearBuilding) expect(baseIds(row.condition.nearBuilding)).toBeDefined()
            if (row.condition?.producer) expect(baseIds(row.condition.producer)).toBeDefined()
        }
        for (const [upgrade, target] of data.upgradeTargets) {
            const up = baseIds(upgrade)?.[0]
            expect(up?.type, upgrade).toBe('upgrade')
            expect(baseIds(target.value)?.some((u) => u.type === 'unit' && u.age === up!.age), upgrade).toBe(true)
        }
        for (const b of data.civData.startingState.buildings.value) expect(data.supply.has(b), b).toBe(true)
    })
})

describe('classifyTech over the English technologies', () => {
    it('produces the documented counts and lists', () => {
        const t = tally()
        expect(Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.length]))).toEqual({
            'rejected/unknown-tech-effect': 7,
            'rejected/unsupported-tech': 3,
            'effects-unmodeled': 4,
            'effects-ignored': 41,
            supported: 14,
        })
        expect(t['rejected/unknown-tech-effect'].sort()).toEqual([
            'arrowslits',
            'boiling-oil',
            'cannon-emplacement',
            'forestry',
            'siege-engineering',
            'springald-emplacement',
            'tithe-barns',
        ])
        expect(t['rejected/unsupported-tech'].sort()).toEqual(['enclosures', 'lightweight-beams', 'military-academy'])
        expect(t['effects-unmodeled'].sort()).toEqual(['admiralty', 'naval-arrowslits', 'serpentine-powder', 'silk-bowstrings'])
        expect(t.supported.sort()).toEqual([
            'crosscut-saw',
            'cupellation',
            'double-broadax',
            'drift-nets',
            'extended-lines',
            'fertilization',
            'greased-axles',
            'horticulture',
            'lumber-preservation',
            'precision-cross-breeding',
            'shaft-mining',
            'specialized-pick',
            'survival-techniques',
            'wheelbarrow',
        ])
    })

    it('reports ignored properties in first-appearance order', () => {
        expect(classifyTech(data.byId.get('fitted-leatherwork-2')!, data)).toEqual({ kind: 'effects-ignored', properties: ['meleeArmor'] })
        expect(classifyTech(data.byId.get('armor-clad-3')!, data)).toEqual({ kind: 'effects-ignored', properties: ['rangedArmor', 'meleeArmor'] })
        expect(classifyTech(data.byId.get('professional-scouts-2')!, data)).toEqual({ kind: 'effects-ignored', properties: ['rangedAttack'] })
    })

    it('names buildTime as the unsupported property for military-academy', () => {
        expect(classifyTech(data.byId.get('military-academy-3')!, data)).toEqual({ kind: 'rejected', code: 'unsupported-tech', property: 'buildTime' })
    })

    it('treats a text-only tech as unmodeled once its overlay rows are gone', () => {
        const bare = { ...data, civData: { ...data.civData, effects: data.civData.effects.filter((r) => r.grantedBy !== 'shaft-mining') } }
        expect(classifyTech(data.byId.get('shaft-mining-3')!, bare)).toEqual({ kind: 'effects-unmodeled' })
    })

    it('rejects an upgrade missing from upgradeTargets and accepts a listed one', () => {
        const up = [...data.byId.values()].find((e) => e.type === 'upgrade' && e.baseId === 'elite-spearmen')!
        expect(classifyTech(up, data)).toEqual({ kind: 'supported' })
        const targets = new Map(data.upgradeTargets)
        targets.delete(up.baseId)
        expect(classifyTech(up, { ...data, upgradeTargets: targets })).toEqual({
            kind: 'rejected',
            code: 'unsupported-tech',
            property: 'upgradeTargets',
        })
    })

    it('throws naming the id for units and buildings', () => {
        expect(() => classifyTech(data.byId.get('villager-1')!, data)).toThrow(/villager-1/)
        expect(() => classifyTech(data.byId.get('house-1')!, data)).toThrow(/house-1/)
    })
})

describe('loadGameData', () => {
    it('indexes by id and by ascending-age baseId and returns one shared instance', () => {
        expect(data.byId.get('wheelbarrow-1')?.baseId).toBe('wheelbarrow')
        expect(data.byBaseId.get('villager')?.length).toBeGreaterThan(0)
        const tiers = data.byBaseId.get('man-at-arms')!.map((e) => e.age)
        expect(tiers.length).toBeGreaterThan(1)
        expect(tiers).toEqual([...tiers].sort((a, b) => a - b))
        expect(loadGameData('english')).toBe(data)
        expect(data.byId.size).toBe(153)
    })

    it('finds nothing for prototype-pollution style ids', () => {
        for (const id of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
            expect(data.byId.get(id)).toBeUndefined()
            expect(data.byBaseId.get(id)).toBeUndefined()
            expect(data.supply.get(id)).toBeUndefined()
            expect(data.upgradeTargets.get(id)).toBeUndefined()
        }
    })

    it('deep-freezes plain data at every depth and leaves the Maps unfrozen at runtime', () => {
        expect(() => {
            ;(data as { base: unknown }).base = {}
        }).toThrow(TypeError)
        expect(() => {
            ;(data.civData.startingState.age as { value: number }).value = 2
        }).toThrow(TypeError)
        expect(() => {
            ;(data.byBaseId.get('villager') as unknown as unknown[]).push(1)
        }).toThrow(TypeError)
        expect(() => {
            ;(data.byId.get('wheelbarrow-1')!.costs as { food: number }).food = 0
        }).toThrow(TypeError)
        expect(() => {
            ;(data.source as { commit: string }).commit = 'x'
        }).toThrow(TypeError)
        expect(Object.isFrozen(data.byId)).toBe(false)
    })

    it('rejects Map mutation at compile time', () => {
        // tsc flags the directive as unused if byId stops being a ReadonlyMap.
        const neverCalled = () => {
            // @ts-expect-error byId is a ReadonlyMap
            data.byId.set('x', data.byId.get('villager-1')!)
        }
        expect(typeof neverCalled).toBe('function')
    })

    it('throws for an unknown civ', () => {
        expect(() => loadGameData('x' as CivId)).toThrow(Error)
    })

    it('throws for a duplicate id, an unknown starting unit, and a non-unit starting unit', () => {
        const snap = (): Snapshot => clone(snapshot) as unknown as Snapshot
        const base = (): BaseRules => clone(baseRules) as unknown as BaseRules
        const civ = (): CivData => clone(englishRules) as unknown as CivData
        const dup = snap()
        dup.buildings.push({ ...dup.units[0] })
        expect(() => buildGameData('english', dup, base(), civ())).toThrow(Error)
        for (const key of ['scoutx', 'house']) {
            const c = civ()
            c.startingState.units.value = { [key]: 1 }
            expect(() => buildGameData('english', snap(), base(), c)).toThrow(new RegExp(key))
        }
        expect(() => buildGameData('english', snap(), base(), civ())).not.toThrow()
    })
})

describe('repository constraints', () => {
    const grep = (args: string[]) => {
        try {
            return execFileSync('git', ['grep', '-nE', ...args], { encoding: 'utf8' })
        } catch {
            return ''
        }
    }

    it('keeps gather constants out of non-test code and the app layer out of lib', () => {
        expect(grep(['\\b(0\\.75|0\\.69|0\\.825|0\\.9|1\\.15)\\b', '--', 'lib/aoe4-build-order', ':!*.test.ts'])).toBe('')
        expect(grep(["(from|import\\()\\s*['\"].*(components|pages)/apps/", '--', 'lib/aoe4-build-order'])).toBe('')
    })

    it('model.ts exports exactly the 18 documented types and no runtime code', () => {
        const src = readFileSync(new URL('./model.ts', import.meta.url), 'utf8')
        const names = [...src.matchAll(/^export (?:type|interface) ([A-Za-z]+)/gm)].map((m) => m[1]).sort()
        expect(names).toEqual([
            'BuildOrder',
            'BuildOrderIssue',
            'BuildOrderLines',
            'BuildOrderNote',
            'BuildStart',
            'BuildStep',
            'CivId',
            'GatherNodeId',
            'HandValue',
            'OverlayEffect',
            'ResourceKind',
            'SimInputs',
            'SimulationResult',
            'StepTiming',
            'TechSupport',
            'Trigger',
            'TripInputs',
            'UnitSeries',
        ])
        expect(src).not.toMatch(/^export (const|function|class|enum)/m)
        expect(src).toMatch(/effects-unmodeled/)
        expect(src).toMatch(/walkSeconds/)
    })
})
