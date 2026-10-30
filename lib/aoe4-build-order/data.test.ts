import { describe, expect, it } from 'vitest'
import englishSnapshot from '../../data/aoe4-build-order/aoe4world/english.json'
import baseRules from '../../data/aoe4-build-order/rules/base.json'
import englishRules from '../../data/aoe4-build-order/rules/english.json'
import { BaseRules, CivData, GameData, Snapshot, SnapshotEntry, buildGameData, loadGameData } from './data'
import { SUPPORTED_EFFECT_PROPERTIES } from './effects'
import type { CivId, GatherNodeId } from './model'

const KINDS = ['units', 'buildings', 'technologies', 'upgrades'] as const
const GATHER_NODES: GatherNodeId[] = ['sheep', 'berry', 'deer', 'boar', 'farm', 'wood', 'gold', 'stone']

const data = loadGameData('english')

function freshInputs() {
    return {
        snapshot: structuredClone(englishSnapshot) as unknown as Snapshot,
        base: structuredClone(baseRules) as unknown as BaseRules,
        civData: structuredClone(englishRules) as unknown as CivData,
    }
}

function handValues(node: unknown, path: string, found: { path: string; value: Record<string, unknown> }[] = []) {
    if (node !== null && typeof node === 'object') {
        if (!Array.isArray(node) && 'value' in node) {
            found.push({ path, value: node as Record<string, unknown> })
        }
        for (const [key, child] of Object.entries(node)) {
            handValues(child, `${path}.${key}`, found)
        }
    }
    return found
}

function resolves(baseId: string) {
    return (data.byBaseId.get(baseId) ?? []).length > 0
}

// Never called: it only has to type-check, which it does while byId is a ReadonlyMap.
function byIdIsReadOnly(game: GameData, entry: SnapshotEntry) {
    // @ts-expect-error byId is typed ReadonlyMap
    game.byId.set('x', entry)
}
void byIdIsReadOnly

describe('snapshot', () => {
    it('records where it came from and which patch it reflects', () => {
        const { source } = data
        for (const field of ['repo', 'commit', 'committedAt', 'fetchedAt', 'patch', 'patchSource'] as const) {
            expect(source[field], field).toEqual(expect.any(String))
            expect(source[field].length, field).toBeGreaterThan(0)
        }
        expect(source.commit).toMatch(/^[0-9a-f]{40}$/)
        expect(source.patchSource.startsWith('http')).toBe(true)
    })

    it('holds only English entries, each id unique', () => {
        const entries = KINDS.flatMap((kind) => englishSnapshot[kind] as { id: string; civs: string[] }[])
        expect(entries.filter((e) => !e.civs.includes('en'))).toEqual([])
        expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length)
        expect(data.byId.size).toBe(entries.length)
    })
})

describe('hand-entered values', () => {
    const found = [...handValues(data.base, 'base'), ...handValues(data.civData, 'english')]
    const ownerObserved = new Set(['base.gatherNodes.sheep.capacity', 'base.gatherNodes.deer.capacity', 'base.gatherNodes.boar.capacity'])

    it('finds every value in both rules files', () => {
        expect(handValues(data.base, 'base').length).toBeGreaterThanOrEqual(44)
        expect(handValues(data.civData, 'english').length).toBeGreaterThanOrEqual(27)
        expect(found.length).toBeGreaterThanOrEqual(71)
    })

    it('labels every value with a source and whether it is verified', () => {
        for (const { path, value } of found) {
            expect(typeof value.source === 'string' && value.source.length > 0, `${path}.source`).toBe(true)
            expect(typeof value.unverified, `${path}.unverified`).toBe('boolean')
        }
    })

    it('marks only the owner-observed carry capacities as verified', () => {
        for (const { path, value } of found) {
            expect(value.unverified, path).toBe(!ownerObserved.has(path))
        }
        for (const path of ownerObserved) {
            expect(found.find((f) => f.path === path)?.value.source).toBe('owner, in-game observation 2026-10-30')
        }
    })
})

describe('rules references', () => {
    it('drop-offs are resource drop-off buildings', () => {
        for (const node of GATHER_NODES) {
            for (const baseId of data.base.gatherNodes[node].dropOffs) {
                const entry = data.byBaseId.get(baseId)?.[0]
                expect(entry?.type, `${node} -> ${baseId}`).toBe('building')
                expect(entry?.classes).toContain('resource_drop_off')
            }
        }
    })

    it('supply rows and starting buildings name buildings, and every starting building supplies', () => {
        for (const baseId of data.supply.keys()) {
            expect(data.byBaseId.get(baseId)?.[0].type, baseId).toBe('building')
        }
        for (const baseId of data.civData.startingState.buildings.value) {
            expect(resolves(baseId), baseId).toBe(true)
            expect(data.supply.has(baseId), baseId).toBe(true)
        }
    })

    it('starting units are a single scout that resolves to a unit', () => {
        const units = data.civData.startingState.units.value
        expect(units).toEqual({ scout: 1 })
        for (const baseId of Object.keys(units)) {
            expect(data.byBaseId.get(baseId)?.[0].type, baseId).toBe('unit')
        }
    })

    it('overlay rows use supported properties and resolvable buildings and techs', () => {
        for (const row of data.civData.effects) {
            expect(SUPPORTED_EFFECT_PROPERTIES.has(row.property), row.property).toBe(true)
            if (row.grantedBy !== 'civ') {
                expect(resolves(row.grantedBy), row.grantedBy).toBe(true)
            }
            for (const baseId of [row.condition?.nearBuilding, row.condition?.producer].filter(Boolean)) {
                expect(data.byBaseId.get(baseId)?.[0].type, baseId).toBe('building')
            }
        }
    })

    it('every upgrade has a target unit with an entry at the upgrade age', () => {
        const upgrades = englishSnapshot.upgrades as unknown as SnapshotEntry[]
        expect([...data.upgradeTargets.keys()].sort()).toEqual(upgrades.map((u) => u.baseId).sort())
        for (const [upgradeId, target] of data.upgradeTargets) {
            const upgrade = data.byBaseId.get(upgradeId)?.[0]
            expect(upgrade?.type, upgradeId).toBe('upgrade')
            const tiers = data.byBaseId.get(target.value) ?? []
            expect(tiers.some((t) => t.type === 'unit' && t.age === upgrade.age), `${upgradeId} -> ${target.value}`).toBe(true)
        }
    })
})

describe('loadGameData', () => {
    it('indexes entries by id and by baseId in ascending age', () => {
        expect(data.byId.get('wheelbarrow-1')?.baseId).toBe('wheelbarrow')
        expect(data.byBaseId.get('villager')?.[0].id).toBe('villager-1')
        const ages = data.byBaseId.get('man-at-arms').map((e) => e.age)
        expect(ages.length).toBeGreaterThan(1)
        expect(ages).toEqual([...ages].sort((a, b) => a - b))
    })

    it('returns the same instance on every call', () => {
        expect(loadGameData('english')).toBe(data)
    })

    it('freezes the shared data so a write throws', () => {
        expect(() => {
            data.civData.startingState.age.value = 2
        }).toThrow(TypeError)
        expect(() => (data.byBaseId.get('man-at-arms') as SnapshotEntry[]).push(data.byId.get('villager-1'))).toThrow(TypeError)
        expect(() => {
            data.byId.get('villager-1').costs.food = 0
        }).toThrow(TypeError)
        expect(() => {
            data.base.gatherNodes.wood.rate.value = 1
        }).toThrow(TypeError)
    })

    it('finds nothing for prototype names', () => {
        expect(data.byId.get('constructor')).toBeUndefined()
        expect(data.byBaseId.get('__proto__')).toBeUndefined()
        expect(data.supply.get('constructor')).toBeUndefined()
    })

    it('throws for a civ with no data', () => {
        expect(() => loadGameData('x' as CivId)).toThrow(Error)
        expect(() => loadGameData('constructor' as CivId)).toThrow(Error)
    })
})

describe('buildGameData', () => {
    it('rejects a duplicate id across kinds', () => {
        const { snapshot, base, civData } = freshInputs()
        snapshot.upgrades.push({ ...snapshot.technologies[0] })
        expect(() => buildGameData('english', snapshot, base, civData)).toThrow(snapshot.technologies[0].id)
    })

    it('rejects a starting unit that is not in the snapshot', () => {
        const { snapshot, base, civData } = freshInputs()
        civData.startingState.units.value = { scoutx: 1 }
        expect(() => buildGameData('english', snapshot, base, civData)).toThrow('scoutx')
    })

    it('rejects a starting unit that names a building', () => {
        const { snapshot, base, civData } = freshInputs()
        civData.startingState.units.value = { house: 1 }
        expect(() => buildGameData('english', snapshot, base, civData)).toThrow('house')
    })

    it('builds supply and upgrade-target maps from the civ file', () => {
        const { snapshot, base, civData } = freshInputs()
        const built = buildGameData('english', snapshot, base, civData)
        expect(built.supply.get('house')?.value).toBe(civData.supply.house.value)
        expect(built.upgradeTargets.get('veteran-longbowmen')?.value).toBe('longbowman')
    })
})
