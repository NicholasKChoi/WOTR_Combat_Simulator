import { describe, it } from 'vitest'
import type { BuildOrder, BuildOrderLines, BuildStart, BuildStep } from './model'

// These pin type shapes and are enforced by `tsc --noEmit`: tsc flags any unused @ts-expect-error.
describe('rally and start model types', () => {
    it('accepts BuildStart and BuildOrderLines with every field optional except steps', () => {
        const emptyStart: BuildStart = {}
        const onlyRally: BuildStart = { rally: 'farm' }
        const onlyVillagers: BuildStart = { villagers: { berry: 6 } }
        const noStartLine: BuildOrderLines = { steps: [3, 4] }
        const withStartLine: BuildOrderLines = { start: 1, steps: [] }
        const noStart: BuildOrder = { civ: 'english', name: 'x', steps: [] }
        void [emptyStart, onlyRally, onlyVillagers, noStartLine, withStartLine, noStart]
    })

    it('rejects malformed start, lines and rally steps', () => {
        // @ts-expect-error start.rally must be a GatherNodeId
        const badRally: BuildStart = { rally: 'castle' }
        // @ts-expect-error start.villagers keys must be GatherNodeIds
        const badKey: BuildStart = { villagers: { castle: 2 } }
        // @ts-expect-error start.villagers counts must be numbers
        const badCount: BuildStart = { villagers: { sheep: '4' } }
        // @ts-expect-error BuildOrderLines requires steps
        const noSteps: BuildOrderLines = { start: 1 }
        // @ts-expect-error BuildOrderLines.steps holds numbers
        const strSteps: BuildOrderLines = { steps: ['1'] }
        // @ts-expect-error rally.to must be a GatherNodeId
        const badTo: BuildStep = { action: 'rally', producer: 'town-center', to: 'castle' }
        // @ts-expect-error rally needs a producer
        const noProducer: BuildStep = { action: 'rally', to: 'wood' }
        void [badRally, badKey, badCount, noSteps, strSteps, badTo, noProducer]
    })

    it('lets a rally step take instance, a villagers trigger and no walkSeconds', () => {
        const step: BuildStep = { trigger: { kind: 'villagers', count: 10 }, action: 'rally', producer: 'town-center', instance: 2, to: 'farm' }
        const noTrigger: BuildStep = { action: 'rally', producer: 'town-center', to: 'wood' }
        void [step, noTrigger]
    })

    it('keeps produce fields unchanged', () => {
        const p: BuildStep = { action: 'produce', producer: 'town-center', unit: 'villager', count: 3, rally: 'sheep', walkSeconds: 4 }
        const c: BuildStep = { action: 'produce', producer: 'town-center', unit: 'villager' }
        void [p, c]
    })
})
