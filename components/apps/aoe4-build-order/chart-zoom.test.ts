import { describe, expect, it } from 'vitest'
import type { ChartRow } from './chart-rows'
import { clampWindow, panStepSeconds, panWindow, rowsInWindow, timeAtX, zoomTo } from './chart-zoom'

describe('zoomTo', () => {
    it.each([
        ['a span of 29 s', 10, 39, 600, null],
        ['a span of 30 s', 10, 40, 600, { from: 10, to: 40 }],
        ['reversed times', 40, 10, 600, { from: 10, to: 40 }],
        ['fractional times rounded', 10.4, 40.6, 600, { from: 10, to: 41 }],
        ['a start below 0 clamped before the span is judged', -50, 25, 600, null],
        ['a start below 0 clamped with a long enough span', -50, 30, 600, { from: 0, to: 30 }],
        ['an end past the game clamped before the span is judged', 580, 900, 600, null],
        ['an end past the game clamped with a long span', 500, 900, 600, { from: 500, to: 600 }],
        ['the full game', 0, 600, 600, null],
        ['the full game from clamping', -20, 700, 600, null],
    ])('%s', (_, a, b, end, expected) => {
        expect(zoomTo(a, b, end)).toEqual(expected)
    })
})

describe('clampWindow', () => {
    it.each([
        ['a null window', null, 600, null],
        ['a window inside the game', { from: 10, to: 100 }, 600, { from: 10, to: 100 }],
        ['a window past the end with a long span', { from: 500, to: 900 }, 600, { from: 500, to: 600 }],
        ['a clamped span of 29 s', { from: 571, to: 900 }, 600, null],
        ['a clamped span of 30 s', { from: 570, to: 900 }, 600, { from: 570, to: 600 }],
        ['a from at end', { from: 600, to: 900 }, 600, null],
        ['a from past end', { from: 700, to: 900 }, 600, null],
        ['a window clamping to the full game', { from: 0, to: 900 }, 600, null],
        ['the full game', { from: 0, to: 600 }, 600, null],
    ])('%s', (_, window, end, expected) => {
        expect(clampWindow(window, end)).toEqual(expected)
    })
})

describe('panWindow', () => {
    it.each([
        ['later', { from: 100, to: 160 }, 30, 600, { from: 130, to: 190 }],
        ['earlier', { from: 100, to: 160 }, -30, 600, { from: 70, to: 130 }],
        ['earlier past 0 stops at 0 and keeps the span', { from: 20, to: 80 }, -50, 600, { from: 0, to: 60 }],
        ['later past the end stops at the end and keeps the span', { from: 520, to: 580 }, 50, 600, { from: 540, to: 600 }],
        ['a fractional delta rounded up', { from: 100, to: 160 }, 10.6, 600, { from: 111, to: 171 }],
        ['a fractional delta rounded down', { from: 100, to: 160 }, -10.4, 600, { from: 90, to: 150 }],
    ])('%s', (_, window, delta, end, expected) => {
        expect(panWindow(window, delta, end)).toEqual(expected)
    })
})

describe('panStepSeconds', () => {
    it.each([
        ['an even span gives half', { from: 0, to: 60 }, 30],
        ['an odd span rounds the half up', { from: 0, to: 31 }, 16],
        ['a span of 1 s gives the floor', { from: 5, to: 6 }, 1],
        ['a span of 0 s gives the floor', { from: 5, to: 5 }, 1],
    ])('%s', (_, window, expected) => {
        expect(panStepSeconds(window)).toBe(expected)
    })
})

describe('timeAtX', () => {
    const plot = { left: 50, width: 400 }
    const shown = { from: 100, to: 200 }
    it.each([
        ['the plot left', 50, 100],
        ['the plot middle', 250, 150],
        ['the plot right', 450, 200],
        ['a quarter of the way', 150, 125],
        ['left of the plot', 10, 100],
        ['right of the plot', 900, 200],
    ])('%s', (_, x, expected) => {
        expect(timeAtX(x, plot, shown)).toBe(expected)
    })

    it('gives shown.from for a plot with no width', () => {
        expect(timeAtX(60, { left: 50, width: 0 }, shown)).toBe(100)
    })
})

describe('rowsInWindow', () => {
    const rows: ChartRow[] = [0, 10, 20, 30, 40, 50].map((t) => ({ t, v: t }))
    const ts = (shown: { from: number; to: number }, source = rows) => rowsInWindow(source, shown).map((row) => row.t)
    it.each([
        ['rows inside plus both edge rows', { from: 15, to: 35 }, [10, 20, 30, 40]],
        ['a window starting on a row adds no earlier row', { from: 20, to: 35 }, [20, 30, 40]],
        ['a window ending on a row adds no later row', { from: 15, to: 30 }, [10, 20, 30]],
        ['a window between two rows gives those two rows', { from: 12, to: 18 }, [10, 20]],
        ['a window before all rows gives the first row', { from: -30, to: -5 }, [0]],
        ['a window after all rows gives the last row', { from: 80, to: 120 }, [50]],
        ['a window covering every row gives them all', { from: 0, to: 50 }, [0, 10, 20, 30, 40, 50]],
    ])('%s', (_, shown, expected) => {
        expect(ts(shown)).toEqual(expected)
    })

    it('returns an empty array for empty rows', () => {
        expect(rowsInWindow([], { from: 0, to: 30 })).toEqual([])
    })

    it('keeps the row objects, edge values included', () => {
        expect(rowsInWindow(rows, { from: 15, to: 35 })[0]).toBe(rows[1])
    })
})
