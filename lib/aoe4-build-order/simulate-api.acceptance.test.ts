import type { NextApiRequest, NextApiResponse } from 'next'
import { describe, expect, it } from 'vitest'
import handler from '../../pages/api/aoe4-build-order/simulate'
import { listBuilds } from './builds'
import { loadGameData } from './data'
import { simulateBuildOrder } from './simulate'
import { inputsFor } from './test-helpers'

function post(body: unknown): { status: number; body: unknown } {
    const sent = { status: 0, body: undefined as unknown }
    const res = {
        setHeader: () => res,
        status: (code: number) => {
            sent.status = code
            return res
        },
        json: (payload: unknown) => {
            sent.body = payload
        },
    }
    handler({ method: 'POST', body } as NextApiRequest, res as unknown as NextApiResponse)
    return sent
}

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
