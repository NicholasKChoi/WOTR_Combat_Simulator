import { vi } from 'vitest'
import type { ReplyTarget } from './api-route'

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
