import { describe, it } from 'vitest'
import type { BuildOrder, BuildStep } from './model'

describe('BuildOrder', () => {
    // Enforced by tsc, not Vitest: tsc flags the directive as unused if a rally step stops requiring to.
    it('types a start split and a rally step, and requires a rally target', () => {
        const order: BuildOrder = {
            civ: 'english',
            name: 'rally',
            start: { villagers: { sheep: 4, wood: 2 }, rally: 'sheep' },
            steps: [{ trigger: { kind: 'time', seconds: 30 }, action: 'rally', producer: 'town-center', to: 'wood', walkSeconds: 5 }],
        }
        // @ts-expect-error a rally step needs a target node
        const noTarget: BuildStep = { action: 'rally', producer: 'town-center' }
        void [order, noTarget]
    })
})
