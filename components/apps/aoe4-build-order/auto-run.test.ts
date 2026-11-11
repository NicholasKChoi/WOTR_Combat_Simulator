import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SimulateRequest, SimulateResponse } from '../../../lib/aoe4-build-order/api'
import { loadGameData } from '../../../lib/aoe4-build-order/data'
import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model'
import { SIM_INPUT_BOUNDS, buildOrderCatalog } from '../../../lib/aoe4-build-order/schema'
import { AUTO_RUN_DEBOUNCE_MS, createAutoRunController, durationError, requestKey, resultsStale, type AutoRunController, type AutoRunState, type LiveInput } from './auto-run'
import { simulationFailureMessage } from './simulate-client'

const catalog = buildOrderCatalog(loadGameData('english'))

const VALID = 'start -> sheep'
const OTHER = 'start -> sheep\nproduce villager from capital-town-center'
const THIRD = 'start -> sheep\nproduce villager from capital-town-center\nproduce villager from capital-town-center'
const INVALID = 'start -> sheep\nproduce knigt from stable'

const live = (text = VALID, duration = '1200', selected = 'English 1 TC'): LiveInput => ({ text, duration, selected })

interface Deferred<T> {
    promise: Promise<T>
    resolve(value: T): void
    reject(reason: unknown): void
}

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void
    let reject!: (reason: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

function reply(status: number, body: unknown): Response {
    return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response
}

function unreadable(status: number): Response {
    return { ok: status >= 200 && status < 300, status, json: () => Promise.reject(new SyntaxError('Unexpected token')) } as Response
}

const result = (name: string) => ({ name }) as unknown as SimulateResponse
const issue: BuildOrderIssue = { code: 'invalid', message: 'line 1: rejected by the server', line: 1 }

async function settle(): Promise<void> {
    for (let i = 0; i < 10; i++) await Promise.resolve()
}

interface Call {
    request: SimulateRequest
    signal: AbortSignal
    response: Deferred<Response>
}

function setup(initial: LiveInput = live(), held = false) {
    const calls: Call[] = []
    const post = vi.fn((request: SimulateRequest, signal: AbortSignal) => {
        const response = deferred<Response>()
        calls.push({ request, signal, response })
        return response.promise
    })
    const history: AutoRunState[] = []
    const controller = createAutoRunController({ catalog, post }, initial, held, (state) => history.push(state))
    const state = () => controller.getState()
    const answer = async (index: number, response: Response) => {
        calls[index].response.resolve(response)
        await settle()
    }
    return { controller, calls, post, history, state, answer }
}

async function withResult(text = VALID) {
    const harness = setup(live(text))
    await harness.answer(0, reply(200, result(text)))
    expect(harness.state().status).toBe('current')
    return harness
}

async function withRejection(text = VALID) {
    const harness = setup(live(text))
    await harness.answer(0, reply(400, { error: 'bad', issues: [issue], omittedIssues: 2 }))
    expect(harness.state().status).toBe('rejected')
    return harness
}

async function withFailure() {
    const harness = setup()
    await harness.answer(0, reply(500, {}))
    expect(harness.state().status).toBe('failed')
    return harness
}

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

describe('durationError', () => {
    const { min, max } = SIM_INPUT_BOUNDS.durationSeconds
    const outOfBounds = `Duration must be a whole number of seconds from ${min} to ${max}.`

    it.each([
        ['60', null],
        ['3600', null],
        ['', 'Duration is required.'],
        ['   ', 'Duration is required.'],
        ['59', outOfBounds],
        ['3601', outOfBounds],
        ['61.5', outOfBounds],
        ['abc', outOfBounds],
    ])('%j gives %j', (duration, expected) => {
        expect(durationError(duration)).toBe(expected)
    })
})

describe('requestKey', () => {
    const keyOf = (input: LiveInput) => {
        const request = setup(input, true).state().request
        if (request === null) throw new Error('expected a valid request')
        return requestKey(request)
    }

    it('ignores selected', () => {
        expect(keyOf(live(VALID, '1200', 'B'))).toBe(keyOf(live(VALID, '1200', 'A')))
    })

    it.each([
        ['text content', live(OTHER)],
        ['duration', live(VALID, '1300')],
    ])('differs by %s', (_, input) => {
        expect(keyOf(input)).not.toBe(keyOf(live()))
    })

    it('sends one POST for inputs that differ only in selected', () => {
        const { controller, post } = setup(live(VALID, '1200', 'A'))
        controller.flush(live(VALID, '1200', 'B'))
        expect(post).toHaveBeenCalledTimes(1)
    })
})

describe('create', () => {
    it('held: loading, settled initial, no timer, no POST', () => {
        const initial = live(OTHER, '900')
        const { post, state } = setup(initial, true)
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS * 4)
        expect(vi.getTimerCount()).toBe(0)
        expect(post).not.toHaveBeenCalled()
        expect(state().status).toBe('loading')
        expect(state().settled).toEqual(initial)
    })

    it.each([
        [true, 'loading'],
        [false, 'running'],
    ])('held %s: never calls onChange during create and returns the %s state', (held, status) => {
        const { history, state } = setup(live(), held)
        expect(history).toEqual([])
        expect(state().status).toBe(status)
    })

    it('not held: posts once at once with the initial duration', () => {
        const { post, calls, state } = setup(live(VALID, '900'))
        expect(post).toHaveBeenCalledTimes(1)
        expect(calls[0].request.inputs?.durationSeconds).toBe(900)
        expect(state().status).toBe('running')
    })
})

describe('input', () => {
    it('not held: settles on a trailing timer from the last input', async () => {
        const { controller, post, calls, state } = await withResult()
        controller.input(live(OTHER))
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS - 1)
        expect(post).toHaveBeenCalledTimes(1)
        expect(state().settled.text).toBe(VALID)
        vi.advanceTimersByTime(1)
        expect(post).toHaveBeenCalledTimes(2)
        expect(state().settled.text).toBe(OTHER)
        expect(calls[1].request).toEqual(state().request)
    })

    it('not held: inputs under the debounce apart post once, for the last', async () => {
        const { controller, post, state } = await withResult()
        controller.input(live(OTHER))
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS - 100)
        controller.input(live(THIRD))
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS - 100)
        controller.input(live(OTHER, '900'))
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS)
        expect(post).toHaveBeenCalledTimes(2)
        expect(state().settled).toEqual(live(OTHER, '900'))
    })

    it('an equal input restarts the timer, and its fire posts nothing', async () => {
        const { controller, post, answer, state, history } = await withResult()
        controller.input(live(OTHER))
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS - 100)
        controller.input(live(OTHER))
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS - 1)
        expect(post).toHaveBeenCalledTimes(1)
        vi.advanceTimersByTime(1)
        expect(post).toHaveBeenCalledTimes(2)
        await answer(1, reply(200, result(OTHER)))
        const changes = history.length
        controller.input(live(OTHER))
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS)
        expect(post).toHaveBeenCalledTimes(2)
        expect(state().status).toBe('current')
        expect(history).toHaveLength(changes)
    })

    it('held: records the input only', () => {
        const { controller, post, state } = setup(live(), true)
        controller.input(live(OTHER))
        expect(vi.getTimerCount()).toBe(0)
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS)
        expect(post).not.toHaveBeenCalled()
        expect(state().settled.text).toBe(VALID)
    })
})

describe('flush', () => {
    it('not held: fires at once with the given input and cancels the timer', async () => {
        const { controller, post, state } = await withResult()
        controller.input(live(THIRD))
        controller.flush(live(OTHER))
        expect(post).toHaveBeenCalledTimes(2)
        expect(state().settled.text).toBe(OTHER)
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS * 2)
        expect(post).toHaveBeenCalledTimes(2)
    })

    it('not held, no argument: settles the last recorded input; the pending timer posts no second time', async () => {
        const { controller, post, state } = await withResult()
        controller.input(live(OTHER))
        controller.flush()
        expect(post).toHaveBeenCalledTimes(2)
        expect(state().settled.text).toBe(OTHER)
        expect(vi.getTimerCount()).toBe(0)
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS * 2)
        expect(post).toHaveBeenCalledTimes(2)
    })

    it('repeated with no change after a result posts nothing and ends current', async () => {
        const { controller, post, state } = await withResult()
        controller.flush()
        controller.flush()
        expect(post).toHaveBeenCalledTimes(1)
        expect(state().status).toBe('current')
    })

    it('held: records the given input, posts nothing, stays loading', () => {
        const { controller, post, state } = setup(live(), true)
        controller.flush(live(OTHER))
        expect(post).not.toHaveBeenCalled()
        expect(state().status).toBe('loading')
    })
})

describe('release', () => {
    it.each([
        ['input', (c: ReturnType<typeof setup>['controller']) => c.input(live(OTHER))],
        ['flush', (c: ReturnType<typeof setup>['controller']) => c.flush(live(OTHER))],
    ])('held: settles the input recorded by %s and posts at once', (_, record) => {
        const { controller, post, calls, state } = setup(live(), true)
        record(controller)
        controller.release()
        expect(vi.getTimerCount()).toBe(0)
        expect(post).toHaveBeenCalledTimes(1)
        expect(state().settled.text).toBe(OTHER)
        expect(calls[0].request).toEqual(state().request)
        expect(state().status).toBe('running')
    })

    it('not held: no state change and no POST', async () => {
        const { controller, post, history, state } = await withResult()
        controller.input(live(OTHER))
        const before = state()
        const changes = history.length
        controller.release()
        expect(post).toHaveBeenCalledTimes(1)
        expect(state()).toBe(before)
        expect(history).toHaveLength(changes)
    })
})

describe('fire', () => {
    it.each([
        ['invalid text', live(INVALID)],
        ['an invalid duration', live(VALID, '59')],
    ])('rule 1: %s aborts the in-flight request and posts nothing', (_, input) => {
        const { controller, post, calls, state } = setup()
        controller.flush(input)
        expect(calls[0].signal.aborted).toBe(true)
        expect(post).toHaveBeenCalledTimes(1)
        expect(state().status).toBe('invalid')
        expect(state().request).toBeNull()
        expect(state().result).toBeNull()
        expect(state().shown).toBeNull()
    })

    it('rule 2: settling the in-flight key again neither posts nor aborts, and its response applies', async () => {
        const { controller, post, calls, answer, state } = setup()
        controller.input(live(OTHER))
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS - 1)
        controller.input(live(VALID, '1200', 'Another build'))
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS)
        expect(post).toHaveBeenCalledTimes(1)
        expect(calls[0].signal.aborted).toBe(false)
        expect(state().status).toBe('running')
        await answer(0, reply(200, result('A')))
        expect(state().status).toBe('current')
        expect(state().result).toEqual(result('A'))
    })

    it('rule 3: an edit then an undo inside the debounce posts nothing and ends current', async () => {
        const { controller, post, state } = await withResult()
        controller.input(live(OTHER))
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS - 1)
        controller.input(live())
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS)
        expect(post).toHaveBeenCalledTimes(1)
        expect(state().status).toBe('current')
    })

    it.each([
        ['a comment-only edit', live(`${VALID}\n# opening`)],
        ['a select change to a build with equal content', live(VALID, '1200', 'Saved copy')],
    ])('rule 3: %s posts nothing and follows the editor in shown', async (_, input) => {
        const { controller, post, state } = await withResult()
        const { result: before, resultRequestKey } = state()
        controller.flush(input)
        expect(post).toHaveBeenCalledTimes(1)
        expect(state().status).toBe('current')
        expect(state().shown).toEqual({ text: input.text, durationSeconds: 1200, selected: input.selected })
        expect(state().result).toBe(before)
        expect(state().resultRequestKey).toBe(resultRequestKey)
    })

    it('rule 3: aborts a request for a different key and drops its late response', async () => {
        const { controller, calls, answer, state } = await withResult()
        controller.flush(live(OTHER))
        expect(state().status).toBe('updating')
        controller.flush(live())
        expect(calls[1].signal.aborted).toBe(true)
        expect(state().status).toBe('current')
        await answer(1, reply(200, result(OTHER)))
        expect(state().status).toBe('current')
        expect(state().result).toEqual(result(VALID))
    })

    it('rule 4: settling the rejected key again posts nothing and keeps the issues; a different key posts and clears them', async () => {
        const { controller, post, state } = await withRejection()
        controller.flush()
        expect(post).toHaveBeenCalledTimes(1)
        expect(state().status).toBe('rejected')
        expect(state().serverIssues).toEqual([issue])
        controller.flush(live(OTHER))
        expect(post).toHaveBeenCalledTimes(2)
        expect(state().status).toBe('running')
        expect(state().serverIssues).toEqual([])
        expect(state().omittedIssues).toBe(0)
    })

    it('rejected key lifetime: a failure clears it, so settling it again posts', async () => {
        const { controller, post, answer, state } = await withRejection()
        controller.flush(live(OTHER))
        await answer(1, reply(500, {}))
        expect(state().status).toBe('failed')
        expect(state().serverIssues).toEqual([])
        controller.flush(live())
        expect(post).toHaveBeenCalledTimes(3)
        expect(post.mock.calls[2][0]).toEqual(post.mock.calls[0][0])
        expect(state().status).toBe('running')
    })

    it('rejected key lifetime: an edit and an undo inside the debounce keep rejected with its issues', async () => {
        const { controller, post, state } = await withRejection()
        controller.input(live(OTHER))
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS - 1)
        controller.input(live())
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS)
        expect(post).toHaveBeenCalledTimes(1)
        expect(state().status).toBe('rejected')
        expect(state().serverIssues).toEqual([issue])
        expect(state().omittedIssues).toBe(2)
    })

    it.each([
        ['rule 1', live(INVALID), 'invalid'],
        ['rule 3', live(), 'current'],
    ])('rejected key lifetime: %s clears it', async (_, input, status) => {
        const harness = await withResult()
        harness.controller.flush(live(OTHER))
        await harness.answer(1, reply(400, { error: 'bad', issues: [issue] }))
        harness.controller.flush(input)
        expect(harness.state().status).toBe(status)
        expect(harness.state().serverIssues).toEqual([])
        harness.controller.flush(live(OTHER))
        expect(harness.post).toHaveBeenCalledTimes(3)
    })

    describe('rule order', () => {
        it('rule 1 before rule 2: an invalid input while a request is in flight aborts it', () => {
            const { controller, calls, state } = setup()
            controller.flush(live(VALID, 'abc'))
            expect(calls[0].signal.aborted).toBe(true)
            expect(state().status).toBe('invalid')
        })

        it.each([
            ['no result', false, 'running'],
            ['an older result', true, 'updating'],
        ])('rule 5 with %s is %s', async (_, shown, status) => {
            const harness = shown ? await withResult() : setup(live(), true)
            harness.controller.flush(live(OTHER))
            harness.controller.release()
            expect(harness.state().status).toBe(status)
        })

        it('each rule 5 passes a fresh signal and aborts the previous one', () => {
            const { controller, calls } = setup()
            controller.flush(live(OTHER))
            controller.flush(live(THIRD))
            expect(calls).toHaveLength(3)
            expect(new Set(calls.map((call) => call.signal)).size).toBe(3)
            expect(calls.map((call) => call.signal.aborted)).toEqual([true, true, false])
        })
    })
})

describe('responses', () => {
    it('drops a superseded response and applies the latest', async () => {
        const { controller, answer, history, state } = await withResult()
        controller.flush(live(OTHER))
        controller.flush(live(THIRD))
        const before = state()
        const changes = history.length
        const json = vi.fn(() => Promise.resolve(result(OTHER)))
        await answer(1, { ok: true, status: 200, json } as unknown as Response)
        expect(json).not.toHaveBeenCalled()
        expect(state()).toBe(before)
        expect(history).toHaveLength(changes)
        expect(state().status).toBe('updating')
        await answer(2, reply(200, result(THIRD)))
        expect(state().result).toEqual(result(THIRD))
        expect(state().status).toBe('current')
    })

    it.each([
        ['rule 1', live(INVALID)],
        ['rule 3', live()],
    ])('drops a response that %s aborted even when post ignores the signal', async (_, input) => {
        const { controller, answer, history, state } = await withResult()
        controller.flush(live(OTHER))
        controller.flush(input)
        const before = state()
        const changes = history.length
        await answer(1, reply(200, result(OTHER)))
        expect(state()).toBe(before)
        expect(history).toHaveLength(changes)
    })

    it('drops a stale AbortError silently', async () => {
        const { controller, calls, history, state } = setup()
        controller.flush(live(OTHER))
        const before = state()
        const changes = history.length
        calls[0].response.reject(new DOMException('x', 'AbortError'))
        await settle()
        expect(state()).toBe(before)
        expect(history).toHaveLength(changes)
        expect(state().errorMessage).toBeNull()
    })

    it('treats an AbortError the controller did not cause as a network error', async () => {
        const { controller, calls, post, state } = setup()
        calls[0].response.reject(new DOMException('x', 'AbortError'))
        await settle()
        expect(state().status).toBe('failed')
        expect(state().errorMessage).toBe(simulationFailureMessage(null))
        controller.flush()
        expect(post).toHaveBeenCalledTimes(2)
    })

    describe.each([
        ['a 200 body', 200, result('late')],
        ['a 400 body', 400, { error: 'bad', issues: [issue] }],
    ])('drops %s read after', (_, status, body) => {
        it.each([
            ['an edit', (c: ReturnType<typeof setup>['controller']) => c.flush(live(OTHER))],
            ['dispose', (c: ReturnType<typeof setup>['controller']) => c.dispose()],
        ])('%s', async (_, act) => {
            const { controller, calls, history, state } = await withResult()
            controller.flush(live(THIRD))
            const json = deferred<unknown>()
            calls[1].response.resolve({ ok: status === 200, status, json: () => json.promise } as Response)
            await settle()
            act(controller)
            const before = state()
            const changes = history.length
            json.resolve(body)
            await settle()
            expect(state()).toBe(before)
            expect(history).toHaveLength(changes)
            expect(state().result).toEqual(result(VALID))
            expect(state().serverIssues).toEqual([])
        })
    })

    it('a 200 shows the input captured when the request was sent', async () => {
        const { controller, answer, state } = setup(live(VALID, '1200', 'A'))
        controller.flush(live(VALID, '1200', 'B'))
        controller.input(live(OTHER))
        expect(state().shown).toBeNull()
        await answer(0, reply(200, result('A')))
        expect(state()).toMatchObject({
            status: 'current',
            result: result('A'),
            resultRequestKey: requestKey(state().request!),
            shown: { text: VALID, durationSeconds: 1200, selected: 'A' },
            serverIssues: [],
            errorMessage: null,
        })
    })

    it('a readable 400 is rejected and keeps the earlier result', async () => {
        const { controller, calls, answer, state } = await withResult()
        controller.flush(live(OTHER))
        await answer(1, reply(400, { error: 'bad', issues: [issue], omittedIssues: 4 }))
        expect(state()).toMatchObject({ status: 'rejected', serverIssues: [issue], omittedIssues: 4, result: result(VALID), shown: { text: VALID } })
        controller.flush(live(THIRD))
        expect(calls[1].signal.aborted).toBe(false)
    })

    it.each([
        ['a TypeError', (call: Call) => call.response.reject(new TypeError('fetch failed')), null],
        ['a 500', (call: Call) => call.response.resolve(reply(500, {})), 500],
        ['a 404', (call: Call) => call.response.resolve(reply(404, {})), 404],
        ['a 400 that is not JSON', (call: Call) => call.response.resolve(unreadable(400)), 400],
        ['a 400 with no issues', (call: Call) => call.response.resolve(reply(400, { error: 'bad', issues: [] })), 400],
        ['a 200 that is not JSON', (call: Call) => call.response.resolve(unreadable(200)), null],
    ])('%s fails and keeps the result', async (_, fail, status) => {
        const { controller, calls, post, state } = await withResult()
        controller.flush(live(OTHER))
        fail(calls[1])
        await settle()
        expect(state()).toMatchObject({ status: 'failed', errorMessage: simulationFailureMessage(status), result: result(VALID), serverIssues: [] })
        controller.flush()
        expect(post).toHaveBeenCalledTimes(3)
        expect(calls[1].signal.aborted).toBe(false)
    })
})

describe('retry', () => {
    it('in failed: posts once for the settled key', async () => {
        const { controller, post, answer, state } = await withResult()
        controller.flush(live(OTHER))
        await answer(1, reply(500, {}))
        controller.retry()
        expect(post).toHaveBeenCalledTimes(3)
        expect(post.mock.calls[2][0]).toEqual(state().request)
        expect(state().status).toBe('updating')
        expect(state().errorMessage).toBeNull()
    })

    it.each([
        ['current', async () => withResult()],
        ['invalid', async () => {
            const harness = await withResult()
            harness.controller.flush(live(INVALID))
            return harness
        }],
        ['rejected', async () => withRejection()],
        ['running', async () => setup()],
        ['updating', async () => {
            const harness = await withResult()
            harness.controller.flush(live(OTHER))
            return harness
        }],
        ['loading', async () => setup(live(), true)],
    ])('in %s: does nothing', async (status, make) => {
        const { controller, post, history, state } = await make()
        expect(state().status).toBe(status)
        const before = state()
        const calls = post.mock.calls.length
        const changes = history.length
        controller.retry()
        expect(post).toHaveBeenCalledTimes(calls)
        expect(state()).toBe(before)
        expect(history).toHaveLength(changes)
    })
})

describe('dispose', () => {
    it('clears a pending timer', async () => {
        const { controller, post } = await withResult()
        controller.input(live(OTHER))
        controller.dispose()
        expect(vi.getTimerCount()).toBe(0)
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS * 2)
        expect(post).toHaveBeenCalledTimes(1)
    })

    it.each([
        ['a 200', reply(200, result('late'))],
        ['a failure', reply(500, {})],
    ])('aborts the request in flight and ignores %s arriving later', async (_, response) => {
        const { controller, calls, answer, history, state } = setup()
        controller.dispose()
        expect(calls[0].signal.aborted).toBe(true)
        const before = state()
        await answer(0, response)
        expect(state()).toBe(before)
        expect(history).toEqual([])
    })

    it.each([
        ['input', async () => withResult(), (controller: AutoRunController) => controller.input(live(OTHER))],
        ['flush', async () => withResult(), (controller: AutoRunController) => controller.flush(live(OTHER))],
        ['release', async () => setup(live(), true), (controller: AutoRunController) => controller.release()],
        ['retry', async () => withFailure(), (controller: AutoRunController) => controller.retry()],
    ])('ignores a later %s', async (_, make, call) => {
        const { controller, post, history, state } = await make()
        const before = state()
        const calls = post.mock.calls.length
        const changes = history.length
        controller.dispose()
        call(controller)
        vi.advanceTimersByTime(AUTO_RUN_DEBOUNCE_MS)
        expect(post).toHaveBeenCalledTimes(calls)
        expect(state()).toBe(before)
        expect(history).toHaveLength(changes)
    })
})

describe('resultsStale', () => {
    const result = { steps: [] } as unknown as SimulateResponse
    const shown = { text: VALID, durationSeconds: 1200, selected: 'English 1 TC' }
    const statuses = ['loading', 'running', 'current', 'updating', 'invalid', 'rejected', 'failed'] as const
    const broken = new Set(['invalid', 'rejected', 'failed'])

    it.each(statuses)('%s with no result is never stale', (status) => {
        expect(resultsStale({ status, result: null, shown: null }, live(OTHER))).toBe(false)
    })

    it.each(statuses)('%s with live equal to shown is stale only for a broken status', (status) => {
        expect(resultsStale({ status, result, shown }, live())).toBe(broken.has(status))
    })

    it.each(statuses)('%s with differing text is stale', (status) => {
        expect(resultsStale({ status, result, shown }, live(OTHER))).toBe(true)
    })

    it.each([['1201'], [''], ['abc']])('current with duration %j is stale', (duration) => {
        expect(resultsStale({ status: 'current', result, shown }, live(VALID, duration))).toBe(true)
    })

    it('treats an empty duration as different even when the shown duration is zero', () => {
        expect(resultsStale({ status: 'current', result, shown: { ...shown, durationSeconds: 0 } }, live(VALID, ''))).toBe(true)
    })

    it('ignores a change of selected alone', () => {
        expect(resultsStale({ status: 'current', result, shown }, live(VALID, '1200', 'Other'))).toBe(false)
    })
})
