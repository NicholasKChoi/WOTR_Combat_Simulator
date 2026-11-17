import { describe, expect, it } from 'vitest'
import type { SnapshotEntry } from './data'
import { unitLineName } from './unit-lines'
import { ENGLISH } from './test-helpers'

const entry = (name: string, age: number): SnapshotEntry => ({
    id: `${name}-${age}`,
    baseId: 'x',
    name,
    type: 'unit',
    civs: [],
    age,
    classes: [],
    producedBy: [],
    costs: { food: 0, wood: 0, gold: 0, stone: 0, popcap: 1, time: 1 },
})

const unitLines = new Map<string, SnapshotEntry[]>()
for (const e of ENGLISH.byId.values()) {
    if (e.type === 'unit') {
        unitLines.set(e.baseId, [...(unitLines.get(e.baseId) ?? []), e])
    }
}

describe('unitLineName', () => {
    it('gives every English unit line a non-empty whole-word suffix of each tier name', () => {
        expect(unitLines.size).toBeGreaterThan(5)
        for (const [baseId, entries] of unitLines) {
            const name = unitLineName(entries)
            expect(name, baseId).not.toBe('')
            for (const e of entries) {
                expect(` ${e.name}`.endsWith(` ${name}`), `${baseId}: ${e.name}`).toBe(true)
            }
        }
    })

    it.each([
        ['spearman', 'Spearman'],
        ['man-at-arms', 'Man-at-Arms'],
        ['longbowman', 'Longbowman'],
        ['knight', 'Knight'],
        ['villager', 'Villager'],
    ])('names the %s line %s', (baseId, name) => {
        expect(unitLineName(unitLines.get(baseId)!)).toBe(name)
    })

    it('falls back to the lowest-age name when no final word is shared, whatever the entry order', () => {
        const entries = [entry('Elite Archer', 4), entry('Rider', 2), entry('Hardened Scout', 3)]
        expect(unitLineName(entries)).toBe('Rider')
    })

    it('shares whole words only, not trailing characters', () => {
        expect(unitLineName([entry('Xspearman', 3), entry('Spearman', 2)])).toBe('Spearman')
        expect(unitLineName([entry('Xspearman', 2), entry('Spearman', 3)])).toBe('Xspearman')
    })

    it('returns a one-entry line whole and takes the longest shared run of words', () => {
        expect(unitLineName([entry('Royal Knight', 3)])).toBe('Royal Knight')
        expect(unitLineName([entry('Old Man-at-Arms', 1), entry('Elite Man-at-Arms', 2)])).toBe('Man-at-Arms')
        expect(unitLineName([entry('Horse Archer', 2), entry('Mounted Horse Archer', 3)])).toBe('Horse Archer')
    })
})
