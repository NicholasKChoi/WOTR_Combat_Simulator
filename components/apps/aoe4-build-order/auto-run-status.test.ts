import { describe, expect, it } from 'vitest'
import type { AutoRunStatus } from './auto-run'
import { autoRunStatusMessage } from './auto-run-status'

describe('autoRunStatusMessage', () => {
    it.each<[AutoRunStatus, boolean, string]>([
        ['loading', false, 'Loading the build.'],
        ['loading', true, 'Loading the build.'],
        ['running', false, 'Computing the simulation.'],
        ['running', true, 'Computing the simulation.'],
        ['current', false, ''],
        ['current', true, ''],
        ['updating', false, 'Updating the results.'],
        ['updating', true, 'Updating the results.'],
        ['invalid', true, 'The charts show the last valid build.'],
        ['invalid', false, 'No valid build to simulate yet.'],
        ['rejected', true, 'The charts show the last valid build.'],
        ['rejected', false, 'No valid build to simulate yet.'],
        ['failed', false, 'The simulation failed.'],
        ['failed', true, 'The simulation failed.'],
    ])('%s with hasResult %s reads %j', (status, hasResult, text) => {
        expect(autoRunStatusMessage(status, hasResult)).toBe(text)
    })
})
