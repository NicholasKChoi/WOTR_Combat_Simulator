import { describe, expect, it } from 'vitest'
import type { BuildOrderNote, SimWarning, SimulationResult } from '../../../lib/aoe4-build-order/model'
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

    it('carries severity and code on each message', () => {
        const { warning: list } = resultMessages(result([warning('warning', 1)], []))
        expect(list).toEqual([{ severity: 'warning', code: 'step-stuck', message: 'warning 1' }])
    })
})
