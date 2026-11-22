import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PopoverLines, placePopover, type PlacementRects } from './annotation-popover'

const render = (text: string) => renderToStaticMarkup(createElement(PopoverLines, { text }))

describe('PopoverLines', () => {
    it('renders one block element per line, in order', () => {
        expect(render('first\nsecond\nthird')).toBe('<div>first</div><div>second</div><div>third</div>')
    })

    it('renders one element for a text without a line break', () => {
        expect(render('only line')).toBe('<div>only line</div>')
    })
})

const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height })

const rects = (overrides: Partial<PlacementRects> = {}): PlacementRects => ({
    anchor: rect(40, 300, 60, 20),
    textarea: rect(100, 200, 500, 400),
    popover: rect(0, 0, 200, 60),
    viewport: { width: 1200, height: 800 },
    ...overrides,
})

describe('placePopover', () => {
    it('opens past the textarea right edge, level with the anchor, when there is room', () => {
        const input = rects()
        expect(input.anchor.left).toBeLessThan(input.textarea.right)
        expect(placePopover(input)).toEqual({ left: input.textarea.right + 4, top: input.anchor.top })
    })

    it('ignores the anchor left edge when placing beside the textarea', () => {
        const near = placePopover(rects({ anchor: rect(40, 300, 60, 20) }))
        const far = placePopover(rects({ anchor: rect(300, 300, 60, 20) }))
        expect(far.left).toBe(near.left)
    })

    it('falls back to the viewport clamp below the anchor when too little room is right of the textarea', () => {
        const input = rects({ textarea: rect(100, 200, 900, 400), viewport: { width: 1200, height: 800 } })
        const placed = placePopover(input)
        expect(input.textarea.right + 4 + input.popover.width).toBeGreaterThan(input.viewport.width - 8)
        expect(placed).toEqual({ left: input.anchor.left, top: input.anchor.bottom + 4 })
        expect(placed.left + input.popover.width).toBeLessThanOrEqual(input.viewport.width)
    })

    it('keeps a fallback popover inside the viewport when the anchor is near the right edge', () => {
        const input = rects({ textarea: rect(100, 200, 1000, 400), anchor: rect(1150, 300, 40, 20) })
        expect(placePopover(input)).toEqual({ left: 1200 - 200 - 8, top: 324 })
    })

    it('clamps a beside placement vertically when the anchor is near the viewport bottom', () => {
        const input = rects({ anchor: rect(40, 780, 60, 20) })
        expect(placePopover(input)).toEqual({ left: input.textarea.right + 4, top: 800 - 60 - 8 })
    })

    it('clamps a beside placement vertically when the anchor is above the viewport top margin', () => {
        expect(placePopover(rects({ anchor: rect(40, -10, 60, 20) })).top).toBe(8)
    })

    it('puts a fallback popover above the anchor when it does not fit below', () => {
        const input = rects({ textarea: rect(100, 200, 900, 400), anchor: rect(40, 760, 60, 20) })
        expect(placePopover(input).top).toBe(760 - 4 - 60)
    })

    it('clamps a fallback popover to the top margin when it fits neither below nor above the anchor', () => {
        const input = rects({ textarea: rect(100, 20, 900, 60), anchor: rect(40, 30, 60, 20), viewport: { width: 1200, height: 100 } })
        expect(placePopover(input).top).toBe(8)
    })
})
