import { describe, expect, it } from 'vitest'
import type { ChartMarker, ChartMarkerKind } from '../../../lib/aoe4-build-order/model'
import { PALETTE } from './chart-rows'
import {
    MARKER_COLORS,
    MARKER_KIND_LABELS,
    type PlacedMarker,
    TIME_MARK_COLOR,
    activeMarkerKind,
    ageUpMarkers,
    labelKindOf,
    labelledMarkers,
    liveMarkerKind,
    markerLabel,
    placeMarkers,
    timeMarkLabel,
    timeMarkLabelPosition,
    visibleMarkers,
} from './chart-markers'

const luminance = (hex: string): number => {
    const [r, g, b] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string): number => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
}

describe('marker styling', () => {
    it('pins the color and legend name of every kind', () => {
        expect(MARKER_COLORS).toEqual({
            'age-up': '#b8860b',
            economy: '#008080',
            'unit-tier': '#c43bb0',
            blacksmith: '#5f7d8c',
            other: '#6b6bd6',
        })
        expect(MARKER_KIND_LABELS).toEqual({
            'age-up': 'Age-up',
            economy: 'Economy',
            'unit-tier': 'Unit tier',
            blacksmith: 'Blacksmith',
            other: 'Other',
        })
    })

    it('keeps every marker color readable on white and on dark text and apart from the series palette', () => {
        for (const color of Object.values(MARKER_COLORS)) {
            expect(contrast(color, '#ffffff')).toBeGreaterThanOrEqual(3)
            expect(contrast(color, '#212529')).toBeGreaterThanOrEqual(3)
            expect(PALETTE).not.toContain(color)
        }
    })

    it('labels a marker with its name and m:ss time', () => {
        expect(markerLabel({ kind: 'age-up', label: 'Castle', at: 804 })).toBe('Castle 13:24')
        expect(markerLabel({ kind: 'unit-tier', label: 'veteran-longbowmen', at: 870 })).toBe('veteran-longbowmen 14:30')
    })
})

describe('ageUpMarkers', () => {
    it('keeps only age-up markers, in order', () => {
        const markers: ChartMarker[] = [
            { kind: 'age-up', label: 'Feudal', at: 2 },
            { kind: 'economy', label: 'Wheelbarrow', at: 3 },
            { kind: 'age-up', label: 'Castle', at: 4 },
            { kind: 'other', label: 'x', at: 5 },
        ]
        expect(ageUpMarkers(markers).map((m) => m.label)).toEqual(['Feudal', 'Castle'])
    })
})

describe('placeMarkers', () => {
    const marker = (at: number, label = 'A very long marker label'): ChartMarker => ({ kind: 'other', label, at })
    const range = (p: PlacedMarker, end: number, plotWidth: number, px = 8) => {
        const width = (markerLabel(p.marker).length * px * end) / plotWidth
        return p.side === 'left' ? [p.marker.at, p.marker.at + width] : [p.marker.at - width, p.marker.at]
    }

    it('never puts intersecting labels in the same row', () => {
        const markers = [0, 100, 200, 300, 400, 500].map((at) => marker(at))
        const placed = placeMarkers(markers, 1000, 600)
        expect(Math.max(...placed.map((p) => p.row))).toBeGreaterThan(0)
        for (const [i, p] of placed.entries()) {
            for (const q of placed.slice(i + 1).filter((o) => o.row === p.row)) {
                const [a, b] = [range(p, 1000, 600), range(q, 1000, 600)]
                expect(a[1] <= b[0] || b[1] <= a[0]).toBe(true)
            }
        }
    })

    it('keeps a label that fits in row 0 and reuses row 0 once an earlier label has ended', () => {
        const placed = placeMarkers([marker(0, 'x'), marker(500, 'y'), marker(900, 'z')], 1000, 1000)
        expect(placed.map((p) => p.row)).toEqual([0, 0, 0])
    })

    it('uses more rows when labels are estimated wider', () => {
        const markers = [0, 100, 200].map((at) => marker(at, 'abc'))
        const rows = (width: (l: string) => number) => Math.max(...placeMarkers(markers, 1000, 1000, width).map((p) => p.row))
        expect(rows(() => 10)).toBe(0)
        expect(rows(() => 250)).toBe(2)
    })

    it('pins a label that fits on neither side to the left edge', () => {
        const [p] = placeMarkers([marker(100, 'x')], 200, 200, () => 150)
        expect(p).toMatchObject({ side: 'left', dx: -100 })
    })

    it('measures a marker from the origin, so a label pinned over the full game fits unpinned once the origin moves', () => {
        const [full] = placeMarkers([marker(100, 'x')], 200, 200, () => 150)
        const [windowed] = placeMarkers([marker(100, 'x')], 200, 200, () => 150, 90)
        expect(full).toMatchObject({ side: 'left', dx: -100 })
        expect(windowed).toMatchObject({ side: 'left', dx: 0 })
    })
})

describe('marker labelling', () => {
    const markers: ChartMarker[] = [
        { kind: 'economy', label: 'Wheelbarrow', at: 1 },
        { kind: 'age-up', label: 'Feudal', at: 2 },
        { kind: 'economy', label: 'Horticulture', at: 3 },
        { kind: 'age-up', label: 'Castle', at: 4 },
    ]
    const labels = (list: ChartMarker[]) => list.map((m) => m.label)

    it.each([
        [null, ['Feudal', 'Castle']],
        ['economy', ['Wheelbarrow', 'Horticulture']],
        ['age-up', ['Feudal', 'Castle']],
        ['blacksmith', []],
    ] as const)('labelledMarkers(markers, %s) keeps exactly that set, in input order', (active, expected) => {
        expect(labels(labelledMarkers(markers, active))).toEqual(expected)
    })

    it.each<[string, ChartMarkerKind | null, ChartMarkerKind | null, ChartMarkerKind | null]>([
        ['neither set', null, null, null],
        ['hover with markers', 'economy', null, 'economy'],
        ['hover without markers, no focus', 'blacksmith', null, null],
        ['hover without markers, focus with markers', 'blacksmith', 'age-up', 'age-up'],
        ['hover and focus both with markers', 'economy', 'age-up', 'economy'],
        ['focus only, with markers', null, 'age-up', 'age-up'],
        ['focus without markers', null, 'other', null],
    ])('activeMarkerKind: %s', (_name, hover, focus, expected) => {
        expect(activeMarkerKind(markers, hover, focus)).toBe(expected)
    })

    it.each<[string, ChartMarkerKind | null, ChartMarkerKind | null]>([
        ['null kind', null, null],
        ['kind with markers', 'economy', 'economy'],
        ['kind with no markers left', 'blacksmith', null],
    ])('liveMarkerKind: %s', (_name, kind, expected) => {
        expect(liveMarkerKind(markers, kind)).toBe(expected)
    })

    it.each<[string, ChartMarkerKind[], string[]]>([
        ['nothing hidden', [], ['Wheelbarrow', 'Feudal', 'Horticulture', 'Castle']],
        ['economy hidden', ['economy'], ['Feudal', 'Castle']],
        ['age-up hidden', ['age-up'], ['Wheelbarrow', 'Horticulture']],
        ['a kind with no markers hidden', ['blacksmith'], ['Wheelbarrow', 'Feudal', 'Horticulture', 'Castle']],
        ['every kind hidden', ['economy', 'age-up'], []],
    ])('visibleMarkers: %s keeps the rest in input order', (_name, hidden, expected) => {
        expect(labels(visibleMarkers(markers, new Set(hidden)))).toEqual(expected)
    })

    it.each<[string, ChartMarkerKind[], ChartMarkerKind | null, ChartMarkerKind | null, ChartMarkerKind | null]>([
        ['hover on a shown kind', [], 'economy', null, 'economy'],
        ['hover on a hidden kind falls back to nothing', ['economy'], 'economy', null, null],
        ['hover on a hidden kind falls back to a focused shown kind', ['economy'], 'economy', 'age-up', 'age-up'],
        ['focus on a hidden kind', ['economy'], null, 'economy', null],
        ['age-up hidden and nothing hovered', ['age-up'], null, null, null],
        ['age-up hidden and age-up hovered', ['age-up'], 'age-up', null, null],
        ['age-up hidden and economy hovered', ['age-up'], 'economy', null, 'economy'],
    ])('labelKindOf: %s', (_name, hidden, hover, focus, expected) => {
        expect(labelKindOf(markers, new Set(hidden), hover, focus)).toBe(expected)
    })
})

describe('time mark', () => {
    it('keeps its color readable on white and apart from the marker colors and the series palette', () => {
        expect(TIME_MARK_COLOR).toBe('#a52a2a')
        expect(contrast(TIME_MARK_COLOR, '#ffffff')).toBeGreaterThanOrEqual(3)
        expect(Object.values(MARKER_COLORS)).not.toContain(TIME_MARK_COLOR)
        expect(PALETTE).not.toContain(TIME_MARK_COLOR)
    })

    it.each([0, 59, 1095, 3725])('labels the mark with the m:ss a marker of the same time gets, at %i s', (at) => {
        const marker = markerLabel({ kind: 'other', label: 'Population cap', at })
        expect(timeMarkLabel({ at, label: 'Population cap' })).toBe(marker)
    })

    it('reads Population cap 18:15 for a cap at 1095 s', () => {
        expect(timeMarkLabel({ at: 1095, label: 'Population cap' })).toBe('Population cap 18:15')
    })

    // The label spans 100 / 500 of the 1000 s plot, which is 200 s.
    it.each([
        ['at 0', 0, 0, 'insideBottomLeft'],
        ['well before the end', 400, 0, 'insideBottomLeft'],
        ['a label that ends exactly at the end', 800, 0, 'insideBottomLeft'],
        ['a label that passes the end', 801, 0, 'insideBottomRight'],
        ['at the end', 1000, 0, 'insideBottomRight'],
        ['a window origin of 200 (at 900)', 900, 200, 'insideBottomLeft'],
        ['a window origin of 0 (at 900)', 900, 0, 'insideBottomRight'],
        ['a label that ends exactly at the end of a window', 1000, 200, 'insideBottomLeft'],
    ] as const)('places the label for %s', (_label, at, origin, position) => {
        expect(timeMarkLabelPosition(at, 1000, 500, 100, origin)).toBe(position)
    })
})
