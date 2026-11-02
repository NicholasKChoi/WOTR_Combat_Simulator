import type { Severity, SimulationResult } from '../../../lib/aoe4-build-order/model'

export interface ResultMessage {
    severity: Severity
    code: string
    message: string
}

export function resultMessages(result: SimulationResult): Record<'warning' | 'info', ResultMessage[]> {
    const lists: Record<'warning' | 'info', ResultMessage[]> = { warning: [], info: [] }
    for (const { severity, code, message } of [...result.warnings, ...result.notes]) {
        if (severity === 'warning' || severity === 'info') {
            lists[severity].push({ severity, code, message })
        }
    }
    return lists
}
