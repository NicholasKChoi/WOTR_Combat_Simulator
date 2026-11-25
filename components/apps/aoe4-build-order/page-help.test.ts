import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PageHelp } from './page-help'
import { STEP_KINDS } from './step-annotations'

const html = renderToStaticMarkup(createElement(PageHelp))
const dialog = (/<dialog[^>]*>[\s\S]*<\/dialog>/.exec(html) ?? [''])[0]
const sections = dialog.split('<section ').slice(1).map((chunk) => chunk.split('</section>')[0])

describe('PageHelp markup', () => {
    it('renders the dialog closed, labelled by its heading', () => {
        const tag = /<dialog[^>]*>/.exec(html)?.[0] ?? ''
        expect(tag).toContain('data-testid="help-modal"')
        expect(tag).not.toMatch(/\sopen[\s=>]/)
        const labelledBy = /aria-labelledby="([^"]+)"/.exec(tag)?.[1]
        expect(dialog).toMatch(new RegExp(`<h2 id="${labelledBy}"[^>]*>How this page works</h2>`))
    })

    it('puts the close button before everything else in the dialog', () => {
        const body = dialog.replace(/^<dialog[^>]*>/, '')
        expect(body.startsWith('<button type="button" data-testid="help-close"')).toBe(true)
        expect(body).toContain('aria-label="Close"')
    })

    it('has seven sections, each labelled by an h3 inside it', () => {
        expect(sections).toHaveLength(7)
        for (const section of sections) {
            const labelledBy = /^[^>]*aria-labelledby="([^"]+)"/.exec(section)?.[1]
            expect(labelledBy).toBeTruthy()
            expect(section).toMatch(new RegExp(`<h3 id="${labelledBy}"`))
        }
    })

    it('holds the step kind legend with the six kinds in the third section', () => {
        const labels = Object.values(STEP_KINDS).filter((label) => label !== null)
        expect(labels).toHaveLength(6)
        expect(sections[2]).toContain('data-testid="step-kind-legend"')
        for (const label of labels) expect(sections[2]).toContain(`>${label}</span>`)
        expect(dialog.split('step-kind-legend')).toHaveLength(2)
    })

    it('holds the warn swatch in the fourth section only', () => {
        expect(sections[3]).toContain('data-testid="help-warn-tint"')
        expect(dialog.split('help-warn-tint')).toHaveLength(2)
    })

    it('names the Population chart and its cap line in the Charts section', () => {
        const charts = sections.find((section) => section.includes('id="help-charts"')) ?? ''
        const text = charts.replace(/<[^>]*>/g, '').replace(/&#x27;|&apos;/g, "'")
        expect(text).toMatch(/Population chart/)
        expect(text).toMatch(/population cap was reached/)
        expect(text).toMatch(/Markers list cannot switch it off/)
        expect(text).toMatch(/pinned build gets no such line/)
    })
})
