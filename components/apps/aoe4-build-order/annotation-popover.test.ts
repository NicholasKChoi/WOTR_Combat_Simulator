import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PopoverLines } from './annotation-popover'

const render = (text: string) => renderToStaticMarkup(createElement(PopoverLines, { text }))

describe('PopoverLines', () => {
    it('renders one block element per line, in order', () => {
        expect(render('first\nsecond\nthird')).toBe('<div>first</div><div>second</div><div>third</div>')
    })

    it('renders one element for a text without a line break', () => {
        expect(render('only line')).toBe('<div>only line</div>')
    })
})
