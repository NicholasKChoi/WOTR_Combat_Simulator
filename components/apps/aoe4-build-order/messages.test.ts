import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { BuildOrderNote, SimWarning, SimulationResult } from '../../../lib/aoe4-build-order/model'
import { InfoMessages, WarningMessages } from './message-lists'
import { resultMessages } from './messages'

function warning(severity: SimWarning['severity'], at: number): SimWarning {
    return { code: 'step-stuck', severity, message: `warning ${at}`, step: 0, waitingOn: 'resources', at }
}

function note(severity: BuildOrderNote['severity'], step: number): BuildOrderNote {
    return { code: 'tech-effect-ignored', severity, message: `note ${step}`, step, tech: 't', properties: [] }
}

function result(warnings: SimWarning[], notes: BuildOrderNote[]): SimulationResult {
    return { warnings, notes } as SimulationResult
}

describe('resultMessages', () => {
    it('returns empty lists for a result without messages', () => {
        expect(resultMessages(result([], []))).toEqual({ warning: [], info: [] })
    })

    it('splits by severity, warnings before notes, each in result order', () => {
        const messages = resultMessages(
            result(
                [warning('info', 1), warning('warning', 2), warning('warning', 3)],
                [note('info', 4), note('warning', 5), note('info', 6)]
            )
        )
        expect(messages.warning.map((m) => m.message)).toEqual(['warning 2', 'warning 3', 'note 5'])
        expect(messages.info.map((m) => m.message)).toEqual(['warning 1', 'note 4', 'note 6'])
    })

    it('leaves debug messages out of both lists', () => {
        const messages = resultMessages(result([warning('debug', 1), warning('warning', 2)], [note('debug', 3), note('info', 4)]))
        expect(messages.warning.map((m) => m.message)).toEqual(['warning 2'])
        expect(messages.info.map((m) => m.message)).toEqual(['note 4'])
    })

    it('renders no toggle, list or control for a result whose only messages are debug notes', () => {
        const messages = resultMessages(result([], [note('debug', 1), note('debug', 2)]))
        const html = renderToStaticMarkup(
            createElement('div', null, createElement(WarningMessages, { messages: messages.warning }), createElement(InfoMessages, { messages: messages.info, expanded: true, onToggle: () => {} }))
        )
        expect(html).toBe('<div></div>')
    })

    it('counts only info messages in the toggle label when debug notes sit beside them', () => {
        const messages = resultMessages(result([], [note('debug', 1), note('info', 2), note('debug', 3)]))
        const html = renderToStaticMarkup(createElement(InfoMessages, { messages: messages.info, expanded: false, onToggle: () => {} }))
        expect(html).toContain('Show 1 info message<')
        expect(html).not.toContain('note 1')
        expect(html).not.toContain('note 3')
    })

    it('carries severity and code on each message', () => {
        const { warning: list } = resultMessages(result([warning('warning', 1)], []))
        expect(list).toEqual([{ severity: 'warning', code: 'step-stuck', message: 'warning 1' }])
    })
})
