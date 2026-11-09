import type { SimulateError, SimulateRequest } from '../../../lib/aoe4-build-order/api'
import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model'

export function postSimulation(buildOrder: SimulateRequest['buildOrder'], durationSeconds: number, signal?: AbortSignal): Promise<Response> {
    const request: SimulateRequest = { buildOrder, inputs: { durationSeconds } }
    return fetch('/api/aoe4-build-order/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(request),
        signal,
    })
}

export async function readRejection(response: Response): Promise<{ issues: BuildOrderIssue[]; omittedIssues: number } | null> {
    let body: Partial<SimulateError> | null
    try {
        body = await response.json()
    } catch {
        return null
    }
    if (typeof body !== 'object' || body === null || !Array.isArray(body.issues) || body.issues.length === 0) return null
    return { issues: body.issues, omittedIssues: typeof body.omittedIssues === 'number' ? body.omittedIssues : 0 }
}

export function simulationFailureMessage(status: number | null): string {
    return status === null ? 'The simulation could not be run. Please try again.' : `The simulation could not be run (HTTP ${status}).`
}
