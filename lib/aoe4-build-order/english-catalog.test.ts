import { describe, expect, it } from 'vitest'
import { checkBuildOrder } from './schema'
import { englishCatalog } from './english-catalog'
import { listBuilds } from './builds'

describe('englishCatalog', () => {
    it('returns one memoized catalog', () => {
        expect(englishCatalog()).toBe(englishCatalog())
    })

    it('knows the English unit ids of a shipped build', () => {
        const [build] = listBuilds()
        expect(checkBuildOrder(build, englishCatalog()).ok).toBe(true)
    })
})
