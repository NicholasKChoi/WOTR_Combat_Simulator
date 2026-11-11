import { describe, expect, it, vi } from 'vitest'
import { blockUnload } from './use-discard-guard'

describe('blockUnload', () => {
    it('prevents the default once and clears returnValue', () => {
        const event = { preventDefault: vi.fn(), returnValue: 'unset' } as unknown as BeforeUnloadEvent
        blockUnload(event)
        expect(event.preventDefault).toHaveBeenCalledTimes(1)
        expect(event.returnValue).toBe('')
    })
})
