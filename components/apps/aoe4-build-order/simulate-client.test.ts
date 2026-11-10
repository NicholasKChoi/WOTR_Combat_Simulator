import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BuildOrder, BuildOrderIssue } from '../../../lib/aoe4-build-order/model'
import { postSimulation, readRejection, simulationFailureMessage } from './simulate-client'

const buildOrder: BuildOrder = { civ: 'english', name: 'Test', start: { villagers: { sheep: 6 }, rally: 'sheep' }, steps: [] }
const issue: BuildOrderIssue = { code: 'invalid', message: 'line 2: not enough food', line: 2 }

function stubFetch() {
    const fetch = vi.fn((_url: string, init: RequestInit) =>
        init.signal?.aborted ? Promise.reject(new DOMException('aborted', 'AbortError')) : Promise.resolve(new Response('{}')),
    )
    vi.stubGlobal('fetch', fetch)
    return fetch
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('postSimulation', () => {
    it('posts the build order and duration as JSON with the given signal', async () => {
        const fetch = stubFetch()
        const signal = new AbortController().signal
        await postSimulation(buildOrder, 900, signal)
        expect(fetch).toHaveBeenCalledTimes(1)
        const [url, init] = fetch.mock.calls[0]
        expect(url).toBe('/api/aoe4-build-order/simulate')
        expect(init.method).toBe('POST')
        expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
        expect(init.body).toBe(JSON.stringify({ buildOrder, inputs: { durationSeconds: 900 } }))
        expect(init.signal).toBe(signal)
    })

    it('passes no signal when none is given', async () => {
        const fetch = stubFetch()
        await postSimulation(buildOrder, 900)
        expect(fetch.mock.calls[0][1].signal).toBeUndefined()
    })

    it('rejects with an AbortError when the signal is aborted', async () => {
        stubFetch()
        const abort = new AbortController()
        abort.abort()
        await expect(postSimulation(buildOrder, 900, abort.signal)).rejects.toMatchObject({ name: 'AbortError' })
    })
})

describe('readRejection', () => {
    const rejection = (body: string) => readRejection(new Response(body, { status: 400 }))

    it('reads the issues and the omitted count', async () => {
        expect(await rejection(JSON.stringify({ error: 'bad', issues: [issue], omittedIssues: 3 }))).toEqual({ issues: [issue], omittedIssues: 3 })
    })

    it.each([
        ['missing', {}],
        ['not a number', { omittedIssues: '3' }],
    ])('counts 0 omitted when the count is %s', async (_, extra) => {
        expect(await rejection(JSON.stringify({ error: 'bad', issues: [issue], ...extra }))).toEqual({ issues: [issue], omittedIssues: 0 })
    })

    it.each([
        ['a body that is not JSON', 'Bad Request'],
        ['a null body', 'null'],
        ['empty issues', JSON.stringify({ error: 'bad', issues: [] })],
        ['non-array issues', JSON.stringify({ error: 'bad', issues: 'x' })],
        ['missing issues', JSON.stringify({ error: 'bad' })],
    ])('gives null for %s', async (_, body) => {
        expect(await rejection(body)).toBeNull()
    })
})

describe('simulationFailureMessage', () => {
    it.each([
        [null, 'The simulation could not be run. Please try again.'],
        [500, 'The simulation could not be run (HTTP 500).'],
    ])('%s gives %j', (status, message) => {
        expect(simulationFailureMessage(status)).toBe(message)
    })
})
