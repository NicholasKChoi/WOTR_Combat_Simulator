import { describe, expect, it } from 'vitest'
import { saveFailureMessage } from './save-build-client'

const GENERIC = 'The build could not be saved. Try again.'

describe('saveFailureMessage', () => {
    const issues = { issues: [{ code: 'out-of-range', message: 'name: 117 characters, more than 100' }, { code: 'invalid', message: 'second' }] }

    it.each<[string, number | null, string | null, unknown, string]>([
        ['400 with issues gives the first issue', 400, null, issues, 'The build could not be saved: name: 117 characters, more than 100'],
        ['400 with an empty issues array', 400, null, { issues: [] }, GENERIC],
        ['400 without a readable body', 400, null, undefined, GENERIC],
        ['400 whose issue has no message', 400, null, { issues: [{}] }, GENERIC],
        ['413', 413, null, undefined, 'The build is too large to save.'],
        ['429 with 1 second', 429, '1', undefined, 'Too many saves. Try again in 1 second.'],
        ['429 with 59 seconds', 429, '59', undefined, 'Too many saves. Try again in 59 seconds.'],
        ['429 with 60 seconds', 429, '60', undefined, 'Too many saves. Try again in 1 minute.'],
        ['429 with 61 seconds rounds minutes up', 429, '61', undefined, 'Too many saves. Try again in 2 minutes.'],
        ['429 with 3600 seconds', 429, '3600', undefined, 'Too many saves. Try again in 60 minutes.'],
        ['429 without a header', 429, null, undefined, 'Too many saves. Try again later.'],
        ['429 with a word', 429, 'abc', undefined, 'Too many saves. Try again later.'],
        ['429 with 0', 429, '0', undefined, 'Too many saves. Try again later.'],
        ['429 with a fraction', 429, '1.5', undefined, 'Too many saves. Try again later.'],
        ['503', 503, null, undefined, 'Saving is unavailable right now. Try again later.'],
        ['another status', 500, null, undefined, GENERIC],
        ['a network error', null, null, undefined, GENERIC],
    ])('%s', (_label, status, retryAfter, body, expected) => {
        expect(saveFailureMessage(status, retryAfter, body)).toBe(expected)
    })
})
