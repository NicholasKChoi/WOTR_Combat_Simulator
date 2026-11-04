import { describe, expect, it } from 'vitest'
import { nextTab, type WorkbenchTab } from './workbench-tabs'

describe('nextTab', () => {
    it.each<[string, string, WorkbenchTab, boolean, WorkbenchTab | null]>([
        ['ArrowRight moves to the next tab', 'ArrowRight', 'build', true, 'results'],
        ['ArrowLeft wraps from the first tab to the last', 'ArrowLeft', 'build', true, 'results'],
        ['ArrowRight wraps from the last tab to the first', 'ArrowRight', 'results', true, 'build'],
        ['ArrowLeft moves to the previous tab', 'ArrowLeft', 'results', true, 'build'],
        ['Home goes to the first tab', 'Home', 'results', true, 'build'],
        ['End goes to the last tab', 'End', 'build', true, 'results'],
        ['ArrowRight skips the disabled Results tab', 'ArrowRight', 'build', false, null],
        ['ArrowLeft skips the disabled Results tab', 'ArrowLeft', 'build', false, null],
        ['End skips the disabled Results tab', 'End', 'build', false, null],
        ['an unrelated key is not handled', 'a', 'build', true, null],
    ])('%s', (_label, key, active, resultsEnabled, expected) => {
        expect(nextTab(key, active, resultsEnabled)).toBe(expected)
    })
})
