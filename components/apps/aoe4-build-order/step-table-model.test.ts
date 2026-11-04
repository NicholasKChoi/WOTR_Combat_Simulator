import { describe, expect, it } from 'vitest'
import type { BuildOrder, BuildStep, Trigger } from '../../../lib/aoe4-build-order/model'
import { formatBuildOrderText, parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import { OPTIONAL_STEP_FIELDS, buildOrderCatalog, checkBuildOrder } from '../../../lib/aoe4-build-order/schema'
import { stepOptions } from '../../../lib/aoe4-build-order/step-options'
import { buildOrder, ENGLISH } from '../../../lib/aoe4-build-order/test-helpers'
import {
    FIELD_LABELS,
    addStartPair,
    changeAction,
    changeProducer,
    changeTriggerKind,
    defaultStep,
    defaultTrigger,
    deleteFlag,
    deleteStartPair,
    deleteStep,
    hasOptionalField,
    insertStep,
    mergeExternalEdit,
    moveStep,
    nodeLabel,
    offersEmptyChoice,
    openFlags,
    optionLabel,
    replaceStep,
    selectChoices,
    setNumberField,
    setReaction,
    setStartCount,
    setStartNode,
    setStartRally,
    setTriggerNumber,
    startPairs,
    withoutField,
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
        expect(checkBuildOrder(buildOrder([step]), buildOrderCatalog(ENGLISH)).ok).toBe(true)
        expect(reparsed([step])).toEqual([step])
    })

    it.each(KINDS)('defaultTrigger(%s) validates within the input bounds', (kind) => {
        const trigger = defaultTrigger(kind as Trigger['kind'], options)
        expect(trigger.kind).toBe(kind)
        expect(checkBuildOrder(buildOrder([{ ...produce, trigger }]), buildOrderCatalog(ENGLISH)).ok).toBe(true)
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
        const rally: BuildStep = { action: 'rally', producer: 'capital-town-center', to: 'sheep' }
        expect(changeProducer(pause, 'town-center', options)).toEqual({ ...pause, producer: 'town-center' })
        expect(changeProducer(rally, 'town-center', options)).toEqual({ ...rally, producer: 'town-center' })
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

    it.each(['9007199254740992', '1'.repeat(22)])('rejects %s, which is not a safe integer', (text) => {
        expect(setNumberField(counted, 'count', text)).toBe(counted)
        expect(setNumberField(move, 'count', text)).toBe(move)
        expect(setTriggerNumber(timed, 'seconds', text)).toBe(timed)
    })

    it('accepts the largest safe integer', () => {
        expect(setNumberField(counted, 'count', '9007199254740991')).toEqual({ ...counted, count: Number.MAX_SAFE_INTEGER })
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

describe('empty select choice', () => {
    const filled: BuildStep[] = [
        { ...produce, rally: 'gold' },
        { action: 'rally', producer: 'capital-town-center', to: 'sheep' },
        { ...build, then: 'gold' },
        { action: 'research', tech: 'wheelbarrow', at: 'mill' },
        { action: 'move', count: 2, from: 'sheep', to: 'wood' },
    ]
    const selects = filled.flatMap((step) =>
        Object.entries(step)
            .filter(([field, value]) => field !== 'action' && typeof value === 'string')
            .map(([field]) => [step, field] as const),
    )

    it.each(selects)('is offered on %j.%s only when clearing it keeps the text parseable', (step, field) => {
        const cleared = parseBuildOrderText(formatBuildOrderText(buildOrder([withoutField(step, field)])))
        expect(offersEmptyChoice(step.action, field)).toBe(cleared.ok)
    })

    it('is not offered on the rally action target', () => {
        expect(offersEmptyChoice('rally', 'to')).toBe(false)
        expect(offersEmptyChoice('produce', 'rally')).toBe(true)
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

describe('labels', () => {
    const catalog = buildOrderCatalog(ENGLISH)

    it.each([
        ['producer', 'Building'], ['instance', 'Building #'], ['unit', 'Unit'], ['count', 'Count'], ['rally', 'Rally to'],
        ['walkSeconds', 'Walk time (s)'], ['to', 'To'], ['building', 'Building'], ['builders', 'Builders'], ['from', 'From'],
        ['then', 'Then'], ['tech', 'Technology'], ['at', 'At'], ['seconds', 'Time (s)'], ['trigger-count', 'Villagers'],
        ['node', 'Node'], ['resource', 'Resource'], ['atLeast', 'At least'], ['reaction', 'Every time'],
    ])('labels %s as %s', (field, label) => {
        expect(FIELD_LABELS[field]).toBe(label)
    })

    it('has no label beyond those fields', () => {
        expect(Object.keys(FIELD_LABELS)).toHaveLength(19)
    })

    it('labels every field a row can render', () => {
        const names = ACTIONS.flatMap((action) => [...Object.keys(defaultStep(action, options)), ...OPTIONAL_STEP_FIELDS[action]]).filter((name) => name !== 'action')
        for (const name of names) expect(FIELD_LABELS[name], name).toBeTruthy()
    })

    it.each([
        ['sheep', 'Sheep'],
        ['gold', 'Gold'],
        ['gold#3', 'Gold deposit 3'],
    ])('nodeLabel(%s) is %s', (ref, label) => {
        expect(nodeLabel(ref)).toBe(label)
    })

    it('shows the data name for a listed id, a node label for a node, else the id', () => {
        const [id, name] = Object.entries(catalog.names).find(([key, value]) => key !== value) ?? ['', '']
        expect(optionLabel(id, catalog)).toBe(name)
        expect(optionLabel('villager', catalog)).toBe(catalog.names.villager)
        expect(optionLabel('gold#2', catalog)).toBe('Gold deposit 2')
        expect(optionLabel('not-listed', catalog)).toBe('not-listed')
    })
})

describe('hasOptionalField', () => {
    it.each(ACTIONS)('is false for the default %s step and true once an optional field is set', (action) => {
        const step = defaultStep(action, options)
        expect(hasOptionalField(step)).toBe(false)
        const field = OPTIONAL_STEP_FIELDS[action][0]
        expect(hasOptionalField({ ...step, [field]: 1 } as BuildStep)).toBe(true)
    })

    it('ignores the trigger and reaction', () => {
        expect(hasOptionalField({ ...produce, trigger: { kind: 'time', seconds: 5 }, reaction: true })).toBe(false)
    })
})

describe('start edits', () => {
    const catalog = buildOrderCatalog(ENGLISH)
    const withStart = (start: BuildOrder['start']): BuildOrder => ({ ...buildOrder([produce]), start })
    const { start: _start, ...bare } = buildOrder([produce])
    const full = withStart({ villagers: { sheep: 3, wood: 1 }, rally: 'sheep' })

    function roundTrips(order: BuildOrder) {
        const result = parseBuildOrderText(formatBuildOrderText(order))
        if (result.ok === false) throw new Error(JSON.stringify(result.issues))
        expect(result.order.start).toEqual(order.start)
    }

    it('lists pairs in record order', () => {
        expect(startPairs(full)).toEqual([['sheep', 3], ['wood', 1]])
        expect(startPairs(bare)).toEqual([])
    })

    it('sets a count and keeps the pair order', () => {
        const next = setStartCount(full, 1, '7')
        expect(next.start).toEqual({ villagers: { sheep: 3, wood: 7 }, rally: 'sheep' })
        roundTrips(next)
    })

    it.each(['', '-1', '2.5', 'abc', '1e3', '9007199254740992'])('rejects the count draft %j', (text) => {
        expect(setStartCount(full, 0, text)).toBe(full)
    })

    it('ignores a count edit past the last pair', () => {
        expect(setStartCount(full, 2, '1')).toBe(full)
    })

    it('changes a pair node in place and refuses a node another pair uses', () => {
        const next = setStartNode(full, 0, 'berry')
        expect(startPairs(next)).toEqual([['berry', 3], ['wood', 1]])
        roundTrips(next)
        expect(setStartNode(full, 0, 'wood')).toBe(full)
    })

    it('sets and clears the rally', () => {
        expect(setStartRally(full, 'wood').start?.rally).toBe('wood')
        const cleared = setStartRally(full, '')
        expect(cleared.start).toEqual({ villagers: { sheep: 3, wood: 1 } })
        roundTrips(cleared)
        expect(setStartRally(bare, 'wood').start).toBeUndefined()
    })

    it('adds the first unused node with a count of 1 at the end', () => {
        const next = addStartPair(full, catalog)
        const added = startPairs(next)[2]
        expect(added[1]).toBe(1)
        expect(['sheep', 'wood']).not.toContain(added[0])
        expect(added[0]).toBe(catalog.nodes.find((node) => node !== 'sheep' && node !== 'wood'))
        roundTrips(next)
    })

    it('adds nothing when every node is used or the order has no start', () => {
        const everyNode = withStart({ villagers: Object.fromEntries(catalog.nodes.map((node) => [node, 1])), rally: 'sheep' })
        expect(addStartPair(everyNode, catalog)).toBe(everyNode)
        expect(addStartPair(bare, catalog).start).toBeUndefined()
    })

    it('deletes a pair, and drops start once it has neither pairs nor rally', () => {
        const one = deleteStartPair(full, 0)
        expect(startPairs(one)).toEqual([['wood', 1]])
        roundTrips(one)
        const none = deleteStartPair(one, 0)
        expect(none.start).toEqual({ rally: 'sheep' })
        roundTrips(none)
        expect('start' in setStartRally(none, '')).toBe(false)
        expect('start' in deleteStartPair(withStart({ villagers: { sheep: 2 } }), 0)).toBe(false)
        expect(deleteStartPair(full, 5)).toBe(full)
    })

    it('does not mutate the input order', () => {
        const before = structuredClone(full)
        setStartCount(full, 0, '9')
        setStartNode(full, 0, 'berry')
        deleteStartPair(full, 0)
        addStartPair(full, catalog)
        setStartRally(full, '')
        expect(full).toEqual(before)
    })
})

describe('open flags', () => {
    const plain: BuildStep = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }
    const withCount: BuildStep = { ...plain, count: 3 }
    const withRally: BuildStep = { ...plain, rally: 'sheep' }

    it('moves a flag with its row', () => {
        expect(moveStep([true, false, false], 0, 1)).toEqual([false, true, false])
        expect(moveStep([false, false, true], 2, -1)).toEqual([false, true, false])
    })

    it('leaves the flags when the move is out of range', () => {
        expect(moveStep([true, false], 0, -1)).toEqual([true, false])
        expect(moveStep([true, false], 1, 1)).toEqual([true, false])
    })

    it('deletes only the removed row flag', () => {
        expect(deleteFlag([true, false, true], 1)).toEqual([true, true])
        expect(deleteFlag([true, false, true], 0)).toEqual([false, true])
    })

    it('reads a missing flag as whether the step sets an optional field', () => {
        expect(openFlags([false], [withCount, withCount, plain])).toEqual([false, true, false])
    })

    it('merges an external edit as old flag or content, one entry per step', () => {
        expect(mergeExternalEdit([false, true], [withCount, plain])).toEqual([true, true])
        expect(mergeExternalEdit([true, true, true], [plain, plain])).toEqual([true, true])
        expect(mergeExternalEdit([true], [plain, withRally, plain])).toEqual([true, true, false])
    })
})
