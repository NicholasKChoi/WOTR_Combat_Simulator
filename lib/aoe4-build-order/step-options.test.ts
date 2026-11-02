import { describe, expect, it } from 'vitest'
import { classifyTech } from './effects'
import { FINITE_NODE_REFS, NODE_REFS, RESOURCE_KINDS } from './model'
import { stepOptions } from './step-options'
import { buildOrder, editGameData, ENGLISH } from './test-helpers'
import { validateBuildOrder } from './validate'

const options = stepOptions(ENGLISH)

function lowestAge(baseId: string): number {
    return Math.min(...ENGLISH.byBaseId.get(baseId)!.map((entry) => entry.age))
}

describe('stepOptions constants', () => {
    it('lists the fixed choices in their constant order', () => {
        expect(options.actions).toEqual(['produce', 'pause', 'build', 'research', 'move', 'rally'])
        expect(options.triggerKinds).toEqual(['none', 'time', 'villagers', 'depleted', 'bank'])
        expect(options.nodes).toEqual(NODE_REFS)
        expect(options.finiteNodes).toEqual(FINITE_NODE_REFS)
        expect(options.resources).toEqual(RESOURCE_KINDS)
        expect(options.nodes.indexOf('gold#2')).toBe(options.nodes.indexOf('gold') + 1)
    })
})

describe('stepOptions from game data', () => {
    it('lists every building and the villager producers by age then baseId', () => {
        expect(options.buildings).toHaveLength(30)
        expect(options.buildings).toContain('house')
        expect(options.villagerProducers).toEqual(['capital-town-center', 'town-center', 'kings-palace'])
        expect(options.unitsByProducer['capital-town-center']).toEqual(['scout', 'villager'])
    })

    it('keeps producers, unit keys and tech sites inside the building list', () => {
        expect(options.producers.every((id) => options.buildings.includes(id))).toBe(true)
        expect(Object.keys(options.unitsByProducer).sort()).toEqual([...options.producers].sort())
        for (const sites of Object.values(options.techSites)) {
            expect(sites.every((id) => options.buildings.includes(id))).toBe(true)
        }
        expect(Object.keys(options.techSites).sort()).toEqual([...options.techs].sort())
    })

    it('lists only techs a research step validates', () => {
        expect(options.techs.length).toBeGreaterThan(0)
        for (const tech of options.techs) {
            const result = validateBuildOrder(buildOrder([{ action: 'research', tech }]), ENGLISH)
            expect(result.ok, tech).toBe(true)
        }
    })

    it('drops a tech when any of its entries is rejected', () => {
        const tech = options.techs[0]
        const data = editGameData(({ snapshot }) => {
            const entry = [...snapshot.technologies, ...snapshot.upgrades].find((e) => e.baseId === tech)
            entry!.effects = [{ property: 'woodGatherRate', select: { id: ['villager'] }, effect: 'multiply', value: 1.1, type: 'influence' }]
        })
        expect(classifyTech(data.byBaseId.get(tech)![0], data).kind).toBe('rejected')
        expect(stepOptions(data).techs).not.toContain(tech)
        expect(stepOptions(data).techSites[tech]).toBeUndefined()
    })
})

describe('stepOptions ordering and serialization', () => {
    it('sorts each id list by lowest age then baseId', () => {
        const lists = [options.buildings, options.producers, options.villagerProducers, options.techs]
        lists.push(...Object.values(options.unitsByProducer), ...Object.values(options.techSites))
        for (const list of lists) {
            list.slice(1).forEach((id, i) => {
                const prev = list[i]
                const ages = [lowestAge(prev), lowestAge(id)]
                expect(ages[0] < ages[1] || (ages[0] === ages[1] && prev < id), `${prev} before ${id}`).toBe(true)
            })
        }
    })

    it('is deterministic and survives JSON', () => {
        expect(stepOptions(ENGLISH)).toEqual(options)
        expect(JSON.parse(JSON.stringify(options))).toStrictEqual(options)
    })
})
