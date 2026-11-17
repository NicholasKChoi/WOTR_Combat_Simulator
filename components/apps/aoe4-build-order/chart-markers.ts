import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import type { ChartMarker, ChartMarkerKind } from '../../../lib/aoe4-build-order/model'

const LABEL_CHAR_PX = 8

export const MARKER_COLORS: Readonly<Record<ChartMarkerKind, string>> = {
    'age-up': '#b8860b',
    economy: '#008080',
    'unit-tier': '#c43bb0',
    blacksmith: '#5f7d8c',
    other: '#6b6bd6',
}

export const MARKER_KIND_LABELS: Readonly<Record<ChartMarkerKind, string>> = {
    'age-up': 'Age-up',
    economy: 'Economy',
    'unit-tier': 'Unit tier',
    blacksmith: 'Blacksmith',
    other: 'Other',
}

export const markerLabel = (marker: ChartMarker): string => `${marker.label} ${formatMinSec(marker.at)}`

export interface MarkerView {
    hidden: ReadonlySet<ChartMarkerKind>
    labelKind: ChartMarkerKind | null
}

export interface PlacedMarker {
    marker: ChartMarker
    side: 'left' | 'right'
    row: number
    dx: number
}

export const estimateLabelWidth = (label: string): number => label.length * LABEL_CHAR_PX

// Labels are stacked in rows: a marker takes the first row whose last label ends before this one starts, so
// markers close in time never share a row. A label that fits on neither side of its line is pinned to the
// plot's left edge (dx shifts it there) so it never covers the Y-axis ticks.
export function placeMarkers(
    markers: readonly ChartMarker[],
    end: number,
    plotWidth: number,
    labelWidth: (label: string) => number = estimateLabelWidth,
): PlacedMarker[] {
    const rowEnds: number[] = []
    return markers.map((marker) => {
        const width = (labelWidth(markerLabel(marker)) * end) / plotWidth
        const fitsRight = marker.at + width <= end
        const pinned = !fitsRight && marker.at - width < 0
        const side = fitsRight || pinned ? 'left' : 'right'
        const dx = pinned ? (-marker.at * plotWidth) / end : 0
        const [from, to] = pinned ? [0, width] : side === 'left' ? [marker.at, marker.at + width] : [marker.at - width, marker.at]
        let row = rowEnds.findIndex((rowEnd) => rowEnd < from)
        if (row < 0) row = rowEnds.length
        rowEnds[row] = to
        return { marker, side, row, dx }
    })
}

export const ageUpMarkers = (markers: readonly ChartMarker[]): ChartMarker[] => markers.filter((m) => m.kind === 'age-up')

const hasKind = (markers: readonly ChartMarker[], kind: ChartMarkerKind): boolean => markers.some((m) => m.kind === kind)

// `active` must be a kind that has markers; activeMarkerKind guarantees it.
export const labelledMarkers = (markers: readonly ChartMarker[], active: ChartMarkerKind | null): ChartMarker[] =>
    active === null ? ageUpMarkers(markers) : markers.filter((m) => m.kind === active)

export function activeMarkerKind(markers: readonly ChartMarker[], hoverKind: ChartMarkerKind | null, focusKind: ChartMarkerKind | null): ChartMarkerKind | null {
    return [hoverKind, focusKind].find((kind) => kind !== null && hasKind(markers, kind)) ?? null
}

// A control item that unmounts (its kind's markers are gone) fires no mouseleave or blur, so a hover or focus
// kind it left behind is reset here.
export const liveMarkerKind = (markers: readonly ChartMarker[], kind: ChartMarkerKind | null): ChartMarkerKind | null =>
    kind !== null && hasKind(markers, kind) ? kind : null

export const visibleMarkers = (markers: readonly ChartMarker[], hidden: ReadonlySet<ChartMarkerKind>): ChartMarker[] =>
    markers.filter((m) => !hidden.has(m.kind))

export const labelKindOf = (
    markers: readonly ChartMarker[],
    hidden: ReadonlySet<ChartMarkerKind>,
    hoverKind: ChartMarkerKind | null,
    focusKind: ChartMarkerKind | null,
): ChartMarkerKind | null => activeMarkerKind(visibleMarkers(markers, hidden), hoverKind, focusKind)
