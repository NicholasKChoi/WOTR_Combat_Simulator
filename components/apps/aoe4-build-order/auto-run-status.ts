import type { AutoRunStatus } from './auto-run'

export function autoRunStatusMessage(status: AutoRunStatus, hasResult: boolean): string {
    switch (status) {
        case 'loading':
            return 'Loading the build.'
        case 'running':
            return 'Computing the simulation.'
        case 'current':
            return ''
        case 'updating':
            return 'Updating the results.'
        case 'invalid':
        case 'rejected':
            return hasResult ? 'The charts show the last valid build.' : 'No valid build to simulate yet.'
        case 'failed':
            return 'The simulation failed.'
    }
}
