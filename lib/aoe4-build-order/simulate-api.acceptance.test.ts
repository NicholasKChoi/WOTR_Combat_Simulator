import type { NextApiRequest, NextApiResponse } from 'next'
import { describe, expect, it } from 'vitest'
import handler from '../../pages/api/aoe4-build-order/simulate'
import { listBuilds } from './builds'
import { loadGameData } from './data'
import { simulateBuildOrder } from './simulate'
import { inputsFor } from './test-helpers'

function send(method: string, body: unknown): { status: number; headers: Record<string, string>; body: unknown } {
    const sent = { status: 0, headers: {} as Record<string, string>, body: undefined as unknown }
    const res = {
        setHeader: (name: string, value: string) => {
            sent.headers[name] = value
            return res
        },
        status: (code: number) => {
            sent.status = code
            return res
        },
        json: (payload: unknown) => {
            sent.body = payload
        },
    }
    handler({ method, body } as NextApiRequest, res as unknown as NextApiResponse)
    return sent
}

const post = (body: unknown) => send('POST', body)

describe.each(listBuilds().map((build) => [build.name, build] as const))('simulate API with the shipped build %s', (_, build) => {
    it('answers 200 with exactly what the engine produces for the default inputs', () => {
        const data = loadGameData('english')
        const sent = post({ buildOrder: build })
        expect(sent.status).toBe(200)
        expect(JSON.stringify(sent.body)).toBe(JSON.stringify(simulateBuildOrder(build, data, inputsFor(data))))
    })

    it('answers 200 with autoHouses off, with no production-time or rally error', () => {
        expect(post({ buildOrder: build, inputs: { autoHouses: false } }).status).toBe(200)
    })
})

describe('simulate API with an order the engine would reject', () => {
    it('answers 400 for a start without a rally instead of reaching the engine', () => {
        const build = listBuilds()[0]
        const sent = post({ buildOrder: { ...build, start: {} } })
        expect(sent.status).toBe(400)
    })
})

describe('simulate API route answers', () => {
    it('answers GET with 405, Allow: POST and the method text', () => {
        expect(send('GET', undefined)).toStrictEqual({ status: 405, headers: { Allow: 'POST' }, body: { error: 'method GET is not allowed; use POST' } })
    })

    it('answers a body that is an array with the not-an-object 400', () => {
        const sent = post([])
        expect(sent.status).toBe(400)
        expect(sent.body).toStrictEqual({ error: 'request body: must be a JSON object', issues: [{ code: 'syntax', message: 'request body: must be a JSON object' }] })
    })
})
