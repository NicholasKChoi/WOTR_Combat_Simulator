import { describe, expect, it } from 'vitest'
import type { BuildStep, Trigger } from '../../../lib/aoe4-build-order/model'
import { formatBuildOrderText, parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import { stepOptions } from '../../../lib/aoe4-build-order/step-options'
import { buildOrder, ENGLISH } from '../../../lib/aoe4-build-order/test-helpers'
import { validateBuildOrder } from '../../../lib/aoe4-build-order/validate'
import {
    changeAction,
    changeProducer,
    changeTriggerKind,
    defaultStep,
    defaultTrigger,
    deleteStep,
    insertStep,
    moveStep,
    replaceStep,
    selectChoices,
    setNumberField,
    setReaction,
    setTriggerNumber,
} from './step-table-model'

const options = stepOptions(ENGLISH)
const ACTIONS = options.actions
const KINDS = options.triggerKinds.filter((kind) => kind !== 'none')

const produce: BuildStep = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }
const build: BuildStep = { action: 'build', building: 'house', from: 'wood' }
const pause: BuildStep = { action: 'pause', producer: 'capital-town-center' }
const steps = [produce, build, pause]

function reparsed(next: BuildStep[]): BuildStep[] {
    const result = parseBuildOrderText(formatBuildOrderText(buildOrder(next)))
    if (result.ok === false) throw new Error(JSON.stringify(result.issues))
    return result.order.steps
}

describe('defaults', () => {
    it.each(ACTIONS)('defaultStep(%s) has no trigger, validates and round-trips through the text', (action) => {
        const step = defaultStep(action, options)
        expect(step.trigger).toBeUndefined()
        expect(validateBuildOrder(buildOrder([step]), ENGLISH).ok).toBe(true)
        expect(reparsed([step])).toEqual([step])
    })

    it.each(KINDS)('defaultTrigger(%s) validates within the input bounds', (kind) => {
        const trigger = defaultTrigger(kind as Trigger['kind'], options)
        expect(trigger.kind).toBe(kind)
        expect(validateBuildOrder(buildOrder([{ ...produce, trigger }]), ENGLISH).ok).toBe(true)
    })
})

describe('list edits', () => {
    it('inserts, deletes, replaces and moves without mutating the input', () => {
        const before = [...steps]
        expect(insertStep(steps, 3, pause)).toHaveLength(4)
        expect(insertStep(steps, 0, pause)[0]).toBe(pause)
        expect(deleteStep(steps, 1)).toEqual([produce, pause])
        expect(replaceStep(steps, 1, pause)).toEqual([produce, pause, pause])
        expect(moveStep(steps, 1, -1)).toEqual([build, produce, pause])
        expect(moveStep(steps, 1, 1)).toEqual([produce, pause, build])
        expect(steps).toEqual(before)
    })

    it('returns the same array for an out-of-range index or a move off either end', () => {
        expect(moveStep(steps, 0, -1)).toBe(steps)
        expect(moveStep(steps, 2, 1)).toBe(steps)
        for (const index of [-1, 3, 1.5]) {
            expect(deleteStep(steps, index)).toBe(steps)
            expect(replaceStep(steps, index, pause)).toBe(steps)
            expect(moveStep(steps, index, 1)).toBe(steps)
        }
        expect(insertStep(steps, 4, pause)).toBe(steps)
        expect(insertStep(steps, -1, pause)).toBe(steps)
    })

    it('deletes the only step down to an empty list', () => {
        expect(deleteStep([produce], 0)).toEqual([])
    })
})

describe('changeAction', () => {
    it('keeps trigger and reaction and replaces the rest with the new default', () => {
        const step: BuildStep = { ...produce, count: 3, trigger: { kind: 'depleted', node: 'gold' }, reaction: true }
        expect(changeAction(step, 'build', options)).toEqual({ ...defaultStep('build', options), trigger: step.trigger, reaction: true })
    })

    it('returns the same object for the same action', () => {
        expect(changeAction(produce, 'produce', options)).toBe(produce)
    })

    it('does not add absent trigger or reaction keys', () => {
        const next = changeAction(produce, 'pause', options)
        expect('trigger' in next || 'reaction' in next).toBe(false)
    })
})

describe('changeProducer', () => {
    it('keeps a unit the new producer lists', () => {
        expect(changeProducer(produce, 'kings-palace', options)).toEqual({ ...produce, producer: 'kings-palace' })
    })

    it('takes the first unit of a producer that does not list the unit', () => {
        const next = changeProducer(produce, 'barracks', options)
        expect(next).toEqual({ ...produce, producer: 'barracks', unit: options.unitsByProducer.barracks[0] })
        expect(options.unitsByProducer.barracks).not.toContain('villager')
    })

    it('only swaps the producer on pause and rally', () => {
        expect(changeProducer(pause, 'town-center', options)).toEqual({ ...pause, producer: 'town-center' })
    })
})

describe('trigger kind and reaction', () => {
    const depleted: BuildStep = { ...produce, trigger: { kind: 'depleted', node: 'gold' }, reaction: true }

    it('sets the default trigger of the chosen kind', () => {
        expect(changeTriggerKind(produce, 'bank', options).trigger).toEqual(defaultTrigger('bank', options))
    })

    it('removes the trigger for none', () => {
        expect('trigger' in changeTriggerKind({ ...produce, trigger: { kind: 'time', seconds: 5 } }, 'none', options)).toBe(false)
    })

    it('removes the reaction when leaving depleted', () => {
        expect('reaction' in changeTriggerKind(depleted, 'time', options)).toBe(false)
        expect('reaction' in changeTriggerKind(depleted, 'none', options)).toBe(false)
    })

    it('returns the same step for the current kind', () => {
        expect(changeTriggerKind(depleted, 'depleted', options)).toBe(depleted)
        expect(changeTriggerKind(produce, 'none', options)).toBe(produce)
    })

    it('sets reaction true and deletes the key for false', () => {
        expect(setReaction(produce, true).reaction).toBe(true)
        expect('reaction' in setReaction(depleted, false)).toBe(false)
    })
})

describe('number fields', () => {
    const counted: BuildStep = { ...produce, count: 3, instance: 2 }
    const move: BuildStep = { action: 'move', count: 4, from: 'sheep', to: 'wood' }
    const timed: BuildStep = { ...produce, trigger: { kind: 'time', seconds: 90 } }

    it.each([
        ['7', 7],
        ['0', 0],
        ['007', 7],
    ])('accepts %s on an optional field', (text, value) => {
        expect(setNumberField(counted, 'count', text)).toEqual({ ...counted, count: value })
    })

    it('deletes an optional field on empty input', () => {
        const next = setNumberField(counted, 'count', '')
        expect('count' in next).toBe(false)
        expect(next).toEqual({ ...produce, instance: 2 })
    })

    it('leaves the step unchanged on empty input for move.count and trigger fields', () => {
        expect(setNumberField(move, 'count', '')).toBe(move)
        expect(setTriggerNumber(timed, 'seconds', '')).toBe(timed)
    })

    it.each(['-5', '4.5', '1e3', ' 5', '5x', 'all', 'abc'])('rejects %j', (text) => {
        expect(setNumberField(counted, 'count', text)).toBe(counted)
        expect(setNumberField(move, 'count', text === 'all' ? 'x' : text)).toBe(move)
        expect(setTriggerNumber(timed, 'seconds', text)).toBe(timed)
    })

    it('accepts all only on move.count', () => {
        expect(setNumberField(move, 'count', 'all')).toEqual({ ...move, count: 'all' })
    })

    it('sets a trigger number and leaves other trigger kinds alone', () => {
        expect(setTriggerNumber(timed, 'seconds', '120').trigger).toEqual({ kind: 'time', seconds: 120 })
        expect(setTriggerNumber(timed, 'atLeast', '5')).toBe(timed)
        expect(setTriggerNumber(produce, 'seconds', '5')).toBe(produce)
    })
})

describe('selectChoices', () => {
    it('appends an unknown value at the end', () => {
        expect(selectChoices('foo', ['a', 'b'])).toEqual([
            { id: 'a', unknown: false },
            { id: 'b', unknown: false },
            { id: 'foo', unknown: true },
        ])
    })

    it('adds nothing for a listed or undefined value', () => {
        expect(selectChoices('a', ['a', 'b'])).toHaveLength(2)
        expect(selectChoices(undefined, ['a', 'b'])).toHaveLength(2)
    })
})

describe('text round trip', () => {
    const everyForm: BuildStep[] = [
        { ...produce, count: 2, rally: 'gold#2', walkSeconds: 3, instance: 2 },
        { action: 'rally', producer: 'town-center', to: 'sheep' },
        { ...pause, trigger: { kind: 'villagers', count: 8 } },
        { ...build, builders: 2, then: 'gold#2', trigger: { kind: 'time', seconds: 90 } },
        { action: 'research', tech: options.techs[0], trigger: { kind: 'bank', resource: 'wood', atLeast: 400 } },
        { action: 'move', count: 'all', from: 'gold', to: 'gold#2', trigger: { kind: 'depleted', node: 'gold' }, reaction: true },
        { action: 'move', count: 1, from: 'sheep', to: 'wood', trigger: { kind: 'depleted', node: 'sheep' } },
    ]

    it('re-parses the full order and after every edit', () => {
        expect(reparsed(everyForm)).toEqual(everyForm)
        const edited = [
            insertStep(everyForm, 2, defaultStep('move', options)),
            deleteStep(everyForm, 0),
            moveStep(everyForm, 5, -1),
            replaceStep(everyForm, 0, changeProducer(everyForm[0], 'kings-palace', options)),
            replaceStep(everyForm, 5, setReaction(everyForm[5], false)),
            replaceStep(everyForm, 5, changeTriggerKind(everyForm[5], 'bank', options)),
            replaceStep(everyForm, 3, setNumberField(everyForm[3], 'builders', '')),
            replaceStep(everyForm, 0, changeAction(everyForm[0], 'research', options)),
        ]
        for (const next of edited) {
            expect(reparsed(next)).toEqual(next)
        }
    })
})
