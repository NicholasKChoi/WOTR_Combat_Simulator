import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ChartMarker, ChartMarkerKind } from '../../../lib/aoe4-build-order/model'
import type { ChartSeries, PinnedSeries } from './chart-rows'
import { MarkerControl, SeriesLegend, pinnedLegendShown } from './chart-legend'

const pinnedOf = (...keys: string[]): PinnedSeries => ({ times: [0, 5], series: keys.map((key) => ({ key, name: key, values: [1, 2] })) })

describe('pinnedLegendShown', () => {
    it.each([
        ['no pinned run and no age-ups', undefined, [], 0, false],
        ['one pinned series not hidden', pinnedOf('a'), [], 0, true],
        ['the only pinned series hidden and no age-ups', pinnedOf('a'), ['a'], 0, false],
        ['the only pinned series hidden with a pinned age-up', pinnedOf('a'), ['a'], 1, true],
        ['two pinned series with one hidden', pinnedOf('a', 'b'), ['a'], 0, true],
        ['a pinned age-up and no pinned run', undefined, [], 1, true],
        ['a hidden key the pinned run does not have', pinnedOf('a'), ['b'], 0, true],
    ])('%s', (_, pinned, hidden, ageUps, expected) => {
        expect(pinnedLegendShown(pinned, new Set(hidden), ageUps)).toBe(expected)
    })
})

describe('MarkerControl markup', () => {
    const markers: ChartMarker[] = [
        { kind: 'blacksmith', label: 'steeled-arrow', at: 4 },
        { kind: 'age-up', label: 'Feudal', at: 2 },
        { kind: 'blacksmith', label: 'iron-undermesh', at: 5 },
        { kind: 'economy', label: 'Wheelbarrow', at: 3 },
    ]
    const html = (hidden: ChartMarkerKind[] = [], active: ChartMarkerKind | null = null, list: ChartMarker[] = markers) =>
        renderToStaticMarkup(createElement(MarkerControl, { markers: list, hidden: new Set(hidden), active, onToggle: () => {}, onHover: () => {}, onFocusKind: () => {} }))
    const items = (markup: string) =>
        [...markup.matchAll(/<button[^>]*data-testid="chart-marker-legend-item"[^>]*>/g)].map((m) => ({
            kind: m[0].match(/data-kind="([^"]+)"/)?.[1],
            pressed: m[0].match(/aria-pressed="([^"]+)"/)?.[1],
            name: m[0].match(/aria-label="([^"]+)"/)?.[1],
            style: m[0].match(/style="([^"]*)"/)?.[1],
            active: m[0].includes('data-active="true"'),
        }))

    it('lists one item per kind present, in kind order, named for the kind', () => {
        expect(items(html()).map((i) => [i.kind, i.name])).toEqual([
            ['age-up', 'Age-up markers'],
            ['economy', 'Economy markers'],
            ['blacksmith', 'Blacksmith markers'],
        ])
    })

    it('titles the control with an h3 Markers heading and puts the swatch before the label text', () => {
        expect(html()).toMatch(/data-testid="chart-marker-legend"[^>]*><h3 class="h6 mb-1">Markers<\/h3>/)
        expect(html()).toMatch(/data-kind="age-up"[^>]*><span[^>]*background-color:#b8860b[^>]*><\/span>Age-up<\/button>/)
    })

    it('renders nothing without markers', () => {
        expect(html([], null, [])).toBe('')
    })

    it('is pressed and full opacity while shown, not pressed and at 50% opacity while hidden', () => {
        const [shown, hidden] = [items(html()).find((i) => i.kind === 'economy'), items(html(['economy'])).find((i) => i.kind === 'economy')]
        expect(shown).toMatchObject({ pressed: 'true', style: undefined })
        expect(hidden).toMatchObject({ pressed: 'false', style: 'opacity:0.5' })
        expect(items(html(['economy'])).filter((i) => i.pressed === 'false').map((i) => i.kind)).toEqual(['economy'])
    })

    it('marks only the item whose kind is active', () => {
        expect(items(html([], 'economy')).filter((i) => i.active).map((i) => i.kind)).toEqual(['economy'])
        expect(html([], null)).not.toContain('data-active')
    })
})

describe('SeriesLegend markup', () => {
    const series: ChartSeries[] = [
        { key: 'a', name: 'A', values: [1, 2] },
        { key: 'b', name: 'B', values: [1, 2] },
    ]
    const pinned = pinnedOf('p')
    const html = (hidden: string[]) => renderToStaticMarkup(createElement(SeriesLegend, { series, pinned, hidden: new Set(hidden), onToggle: () => {} }))
    const items = (markup: string) =>
        [...markup.matchAll(/<button[^>]*data-testid="chart-series-legend-item"[^>]*>/g)].map((m) => ({
            key: m[0].match(/data-series="([^"]+)"/)?.[1],
            pressed: m[0].match(/aria-pressed="([^"]+)"/)?.[1],
            style: m[0].match(/style="([^"]*)"/)?.[1],
        }))

    it('is pressed and full opacity while shown, not pressed and at 50% opacity while hidden, including a pinned-only series', () => {
        expect(items(html([]))).toEqual([
            { key: 'a', pressed: 'true', style: undefined },
            { key: 'b', pressed: 'true', style: undefined },
            { key: 'p', pressed: 'true', style: undefined },
        ])
        expect(items(html(['b', 'p']))).toEqual([
            { key: 'a', pressed: 'true', style: undefined },
            { key: 'b', pressed: 'false', style: 'opacity:0.5' },
            { key: 'p', pressed: 'false', style: 'opacity:0.5' },
        ])
    })

    it('reads the same pressed value as the marker control for a shown and a hidden entry', () => {
        const markers: ChartMarker[] = [{ kind: 'economy', label: 'Wheelbarrow', at: 3 }]
        const markerPressed = (hidden: ChartMarkerKind[]) =>
            renderToStaticMarkup(createElement(MarkerControl, { markers, hidden: new Set(hidden), active: null, onToggle: () => {}, onHover: () => {}, onFocusKind: () => {} })).match(/aria-pressed="([^"]+)"/)?.[1]
        expect(items(html([]))[0].pressed).toBe(markerPressed([]))
        expect(items(html(['a']))[0].pressed).toBe(markerPressed(['economy']))
    })
})
