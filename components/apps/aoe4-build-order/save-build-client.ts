const GENERIC_FAILURE = 'The build could not be saved. Try again.'

function plural(count: number, unit: string): string {
    return `${count} ${unit}${count === 1 ? '' : 's'}`
}

function retryWait(retryAfter: string | null): string {
    const seconds = retryAfter !== null && /^\d+$/.test(retryAfter) ? Number(retryAfter) : 0
    if (seconds < 1) return 'later'
    return `in ${seconds < 60 ? plural(seconds, 'second') : plural(Math.ceil(seconds / 60), 'minute')}`
}

function firstIssueMessage(body: unknown): string | null {
    if (typeof body !== 'object' || body === null || !('issues' in body) || !Array.isArray(body.issues)) return null
    const first: unknown = body.issues[0]
    if (typeof first !== 'object' || first === null || !('message' in first) || typeof first.message !== 'string') return null
    return first.message
}

export function saveFailureMessage(status: number | null, retryAfter: string | null, body: unknown): string {
    switch (status) {
        case 400: {
            const message = firstIssueMessage(body)
            return message === null ? GENERIC_FAILURE : `The build could not be saved: ${message}`
        }
        case 413:
            return 'The build is too large to save.'
        case 429:
            return `Too many saves. Try again ${retryWait(retryAfter)}.`
        case 503:
            return 'Saving is unavailable right now. Try again later.'
        default:
            return GENERIC_FAILURE
    }
}
