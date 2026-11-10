import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { loadGameData } from '../../../lib/aoe4-build-order/data'
import { parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import { buildOrderCatalog } from '../../../lib/aoe4-build-order/schema'
import { StepRunCell, StepTimes, annotationToneClass } from './step-annotation'
import styles from './step-annotation.module.css'
import { StepTable } from './step-table'
import { finishedText, formatStepTime, type BuildAnnotations, type StepAnnotation, type StepRun } from './step-annotations'

function run(overrides: Partial<StepRun> = {}): StepRun {
    return {
        runStep: 0,
        status: 'completed',
        startedAt: 65,
        completedAt: 125,
        waitSeconds: 0,
        waitBreakdown: [],
        waitingOn: null,
        blockedBy: '',
        longWait: false,
        flagged: false,
        ...overrides,
    }
}

const cell = (annotation: StepAnnotation, stale = false) => renderToStaticMarkup(createElement('table', null, createElement('tbody', null, createElement('tr', null, createElement(StepRunCell, { annotation, stale })))))
const textOf = (html: string, testId: string): string | undefined => new RegExp(`data-testid="${testId}"[^>]*>([^<]*)<`).exec(html)?.[1]
const has = (html: string, attribute: string) => html.includes(attribute)

describe('annotationToneClass', () => {
    it('keys the two tones to different class names', () => {
        expect(typeof styles.warn).toBe('string')
        expect(typeof styles.stale).toBe('string')
        expect(styles.warn).not.toBe('')
        expect(styles.stale).not.toBe('')
        expect(styles.warn).not.toBe(styles.stale)
    })

    it.each<[string, StepRun | undefined, boolean, string]>([
        ['no run', undefined, false, ''],
        ['no run, stale', undefined, true, styles.stale],
        ['completed', run(), false, ''],
        ['in-progress', run({ status: 'in-progress' }), false, ''],
        ['completed, stale', run(), true, styles.stale],
        ['not-reached', run({ status: 'not-reached' }), false, styles.warn],
        ['waiting', run({ status: 'waiting' }), false, styles.warn],
        ['flagged', run({ flagged: true }), false, styles.warn],
        ['long wait', run({ longWait: true }), false, styles.warn],
        ['not-reached, stale', run({ status: 'not-reached' }), true, `${styles.warn} ${styles.stale}`],
        ['waiting, stale', run({ status: 'waiting' }), true, `${styles.warn} ${styles.stale}`],
        ['flagged, stale', run({ flagged: true }), true, `${styles.warn} ${styles.stale}`],
        ['long wait, stale', run({ longWait: true }), true, `${styles.warn} ${styles.stale}`],
    ])('%s', (_name, input, stale, expected) => {
        expect(annotationToneClass(input, stale)).toBe(expected)
    })
})

describe('StepRunCell', () => {
    it.each<[string, StepRun, string, string, string]>([
        ['completed', run({ blockedBy: 'resources 0:05', waitSeconds: 5 }), '1:05', '2:05', 'resources 0:05'],
        ['in-progress', run({ status: 'in-progress', completedAt: null }), '1:05', 'ongoing', ''],
        ['waiting', run({ status: 'waiting', startedAt: null, completedAt: null, flagged: true, blockedBy: 'still waiting on resources' }), '–', '–', 'still waiting on resources'],
        ['not-reached', run({ status: 'not-reached', startedAt: null, completedAt: null, flagged: true, blockedBy: 'not reached (trigger)' }), '–', '–', 'not reached (trigger)'],
    ])('shows the %s run timing', (_name, input, started, finished, blockedBy) => {
        const html = cell({ kind: 'villager', run: input })
        expect(textOf(html, 'step-started')).toBe(started)
        expect(textOf(html, 'step-finished')).toBe(finished)
        expect(textOf(html, 'step-blocked-by')).toBe(blockedBy)
    })

    it('shows the kind border and badge but no times when no run aligns', () => {
        const html = cell({ kind: 'military', run: null })
        expect(html).toContain('data-kind="military"')
        expect(html).not.toContain('step-started')
        expect(html).not.toContain('step-finished')
        expect(html).not.toContain('step-blocked-by')
        expect(html).not.toContain(styles.warn)
    })

    it('has no badge for the other kind', () => {
        expect(cell({ kind: 'other', run: null })).not.toContain('step-kind-badge')
        expect(cell({ kind: 'economy', run: null })).toContain('step-kind-badge')
    })

    it('marks the cell stale only while stale', () => {
        expect(has(cell({ kind: 'villager', run: run() }, true), 'data-stale="true"')).toBe(true)
        expect(has(cell({ kind: 'villager', run: run() }, false), 'data-stale')).toBe(false)
    })

    it('takes its tone classes from annotationToneClass', () => {
        const flagged = run({ flagged: true, status: 'waiting' })
        const html = cell({ kind: 'villager', run: flagged }, true)
        expect(html).toContain(annotationToneClass(flagged, true))
    })

    it.each<[string, StepRun]>([
        ['completed', run()],
        ['in-progress', run({ status: 'in-progress', completedAt: null })],
    ])('renders the %s times through StepTimes', (_name, input) => {
        const times = renderToStaticMarkup(createElement(StepTimes, { run: input }))
        expect(textOf(times, 'step-started')).toBe(formatStepTime(input.startedAt))
        expect(textOf(times, 'step-finished')).toBe(finishedText(input))
        expect(cell({ kind: 'villager', run: input })).toContain(times)
    })
})

describe('StepTable run cells', () => {
    const catalog = buildOrderCatalog(loadGameData('english'))
    const parsed = parseBuildOrderText('start -> sheep\nproduce villager from capital-town-center -> sheep\nbuild house with 1 from sheep\nbuild house with 1 from sheep')
    if (!parsed.ok) throw new Error('fixture must parse')
    const annotations: BuildAnnotations = {
        stale: false,
        steps: [
            { kind: 'villager', run: run({ runStep: 0, longWait: true, waitSeconds: 60 }) },
            { kind: 'building', run: null },
            { kind: 'building', run: run({ runStep: 1, waitSeconds: 59.9, longWait: false }) },
        ],
    }
    const render = (props: { annotations?: BuildAnnotations | null }) =>
        renderToStaticMarkup(createElement(StepTable, { order: parsed.order, catalog, onChange: () => {}, openRows: [], onOpenRowsChange: () => {}, ...props }))
    const rows = (html: string) => html.split('data-testid="step-row"').slice(1)

    it('renders no run cell, legend or kind without annotations', () => {
        expect(parsed.order.steps.length).toBeGreaterThan(1)
        const html = render({ annotations: null })
        expect(html).not.toContain('step-run')
        expect(html).not.toContain('step-kind-legend')
        expect(html).not.toContain('data-kind')
    })

    it('puts a run cell first in each row and marks only the long wait', () => {
        const [first, second, third] = rows(render({ annotations }))
        expect(first).toContain('data-long-wait="true"')
        expect(first).toContain('data-run-step="0"')
        expect(first.indexOf('step-run')).toBeLessThan(first.indexOf('step-trigger-kind'))
        expect(second).toContain('data-kind="building"')
        expect(second).not.toContain('data-status')
        expect(second).not.toContain('data-long-wait')
        expect(second).not.toContain('step-started')
        expect(third).toContain('data-run-step="1"')
        expect(third).not.toContain('data-long-wait')
    })

    it('keeps the start row cell empty and shows the legend', () => {
        const html = render({ annotations })
        const start = html.slice(html.indexOf('step-start-row'), html.indexOf('step-row'))
        expect(start).not.toContain('step-run')
        expect(/^step-start-row"><td class="[^"]*"><\/td>/.test(start)).toBe(true)
        expect(html).toContain('data-testid="step-kind-legend"')
    })
})
