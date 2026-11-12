import { vi } from 'vitest'
import type { ReplyTarget } from './api-route'
import type { BuildStore } from './build-store'
import { listBuilds } from './builds'

const [firstBuild] = listBuilds()
const VALID_DURATION_SECONDS = 600

export const bigSource = { ...firstBuild, source: '€'.repeat(30_000) }

export const getterFor = (store: BuildStore) => vi.fn(() => Promise.resolve(store))
export const rejectingGetter = () => vi.fn(() => Promise.reject(new Error('no blob')))
export const withBroken = (store: BuildStore, broken: Partial<BuildStore>): BuildStore => ({ ...store, ...broken })

export const INVALID_SAVE_BODIES: [string, unknown, number][] = [
    ['an array body', [], 400],
    [
        'an unknown unit id',
        { buildOrder: { ...firstBuild, steps: [{ action: 'produce', producer: 'capital-town-center', unit: 'knigt' }] }, durationSeconds: VALID_DURATION_SECONDS },
        400,
    ],
    ['a duration of 59', { buildOrder: firstBuild, durationSeconds: 59 }, 400],
    ['a name of 101 characters', { buildOrder: { ...firstBuild, name: 'n'.repeat(101) }, durationSeconds: VALID_DURATION_SECONDS }, 400],
    ['a record over the byte cap', { buildOrder: bigSource, durationSeconds: VALID_DURATION_SECONDS }, 413],
]

export function recordingTarget<Body = unknown>() {
    const calls: string[] = []
    const target: ReplyTarget<Body> = {
        status: vi.fn((code: number) => {
            calls.push(`status ${code}`)
            return target
        }),
        setHeader: vi.fn((name: string, value: string) => {
            calls.push(`header ${name}=${value}`)
        }),
        json: vi.fn((body: Body) => {
            calls.push(`json ${JSON.stringify(body)}`)
        }),
        end: vi.fn((chunk?: string) => {
            calls.push(chunk === undefined ? 'end' : `end ${chunk}`)
        }),
    }
    return { target, calls }
}
