import { describe, expect, it } from 'vitest'
import { GameData, SnapshotEntry, loadGameData } from './data'
import { IGNORED_EFFECT_PROPERTIES, SUPPORTED_EFFECT_PROPERTIES, classifyTech } from './effects'

const data = loadGameData('english')
const technologies = [...data.byId.values()].filter((e) => e.type === 'technology')

function classify(id: string, game: GameData = data) {
    return classifyTech(data.byId.get(id), game)
}

function withoutOverlayFrom(baseId: string): GameData {
    return { ...data, civData: { ...data.civData, effects: data.civData.effects.filter((row) => row.grantedBy !== baseId) } }
}

describe('effect property sets', () => {
    it('cover every property used by English technologies except unknown and buildTime', () => {
        const used = new Set(technologies.flatMap((t) => (t.effects ?? []).map((e) => e.property)))
        const unclassified = [...used].filter(
            (p) => !SUPPORTED_EFFECT_PROPERTIES.has(p) && !IGNORED_EFFECT_PROPERTIES.has(p) && p !== 'unknown' && p !== 'buildTime',
        )
        expect(unclassified).toEqual([])
    })

    it('do not overlap', () => {
        expect([...SUPPORTED_EFFECT_PROPERTIES].filter((p) => IGNORED_EFFECT_PROPERTIES.has(p))).toEqual([])
    })
})

describe('classifyTech', () => {
    it('supports a tech whose effects are all supported', () => {
        expect(classify('wheelbarrow-1')).toEqual({ kind: 'supported' })
    })

    it('rejects a tech with an unknown effect', () => {
        expect(classify('forestry-1')).toEqual({ kind: 'rejected', code: 'unknown-tech-effect', property: 'unknown' })
    })

    it('rejects a supported property with a non-passive type', () => {
        expect(classify('enclosures-4')).toEqual({ kind: 'rejected', code: 'unsupported-tech', property: 'goldGatherRate' })
    })

    it('rejects buildTime, which is neither supported nor ignored', () => {
        expect(classify('military-academy-3')).toEqual({ kind: 'rejected', code: 'unsupported-tech', property: 'buildTime' })
    })

    it('lists distinct ignored properties in order of first appearance', () => {
        expect(classify('fitted-leatherwork-2')).toEqual({ kind: 'effects-ignored', properties: ['meleeArmor'] })
        expect(classify('armor-clad-3')).toEqual({ kind: 'effects-ignored', properties: ['rangedArmor', 'meleeArmor'] })
    })

    it('reports only the ignored properties of a mixed tech', () => {
        expect(classify('professional-scouts-2')).toEqual({ kind: 'effects-ignored', properties: ['rangedAttack'] })
    })

    it('supports a tech with empty effects when an overlay row grants its effect', () => {
        expect(data.byId.get('shaft-mining-3').effects).toEqual([])
        expect(classify('shaft-mining-3')).toEqual({ kind: 'supported' })
        expect(classify('shaft-mining-3', withoutOverlayFrom('shaft-mining'))).toEqual({ kind: 'effects-unmodeled' })
    })

    it('marks a tech with empty effects and no overlay as unmodeled', () => {
        expect(classify('admiralty-2')).toEqual({ kind: 'effects-unmodeled' })
    })

    it('supports an upgrade only while it has an upgrade target', () => {
        expect(classify('veteran-longbowmen-3')).toEqual({ kind: 'supported' })
        const upgradeTargets = new Map(data.upgradeTargets)
        upgradeTargets.delete('veteran-longbowmen')
        expect(classify('veteran-longbowmen-3', { ...data, upgradeTargets })).toEqual({
            kind: 'rejected',
            code: 'unsupported-tech',
            property: 'upgradeTargets',
        })
    })

    it('rejects a supported property typed influence on a fixture tech', () => {
        const fixture: SnapshotEntry = {
            ...data.byId.get('wheelbarrow-1'),
            effects: [{ property: 'woodGatherRate', select: { id: ['villager'] }, effect: 'multiply', value: 1.1, type: 'influence' }],
        }
        expect(classifyTech(fixture, data)).toEqual({ kind: 'rejected', code: 'unsupported-tech', property: 'woodGatherRate' })
    })

    it('throws for a unit or a building', () => {
        expect(() => classify('villager-1')).toThrow('villager-1')
        expect(() => classify('house-1')).toThrow('house-1')
    })

    it('classifies every English technology into the expected groups', () => {
        const groups: Record<string, string[]> = {}
        for (const tech of technologies) {
            const support = classifyTech(tech, data)
            const key = support.kind === 'rejected' ? `rejected/${support.code}` : support.kind
            ;(groups[key] ??= []).push(tech.baseId)
        }
        expect(groups['rejected/unknown-tech-effect'].sort()).toEqual([
            'arrowslits', 'boiling-oil', 'cannon-emplacement', 'forestry', 'siege-engineering', 'springald-emplacement', 'tithe-barns',
        ])
        expect(groups['rejected/unsupported-tech'].sort()).toEqual(['enclosures', 'lightweight-beams', 'military-academy'])
        expect(groups['effects-unmodeled'].sort()).toEqual(['admiralty', 'naval-arrowslits', 'serpentine-powder', 'silk-bowstrings'])
        expect(groups['effects-ignored']).toHaveLength(41)
        expect(groups.supported.sort()).toEqual([
            'crosscut-saw', 'cupellation', 'double-broadax', 'drift-nets', 'extended-lines', 'fertilization', 'greased-axles',
            'horticulture', 'lumber-preservation', 'precision-cross-breeding', 'shaft-mining', 'specialized-pick',
            'survival-techniques', 'wheelbarrow',
        ])
    })
})
