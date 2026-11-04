import { HOUSE_ID, VILLAGER_ID } from '../../../lib/aoe4-build-order/engine-common'
import type { BuildOrder, BuildStart, BuildStep, NodeRef, Trigger } from '../../../lib/aoe4-build-order/model'
import { OPTIONAL_STEP_FIELDS, type BuildOrderCatalog } from '../../../lib/aoe4-build-order/schema'
import type { StepOptions } from '../../../lib/aoe4-build-order/step-options'

type Action = BuildStep['action']
type TriggerKind = Trigger['kind']

export function defaultStep(action: Action, options: StepOptions): BuildStep {
    const producer = options.villagerProducers[0]
    switch (action) {
        case 'produce':
            return { action, producer, unit: VILLAGER_ID }
        case 'pause':
            return { action, producer }
        case 'rally':
            return { action, producer, to: options.nodes[0] }
        case 'build':
            return { action, building: HOUSE_ID, from: 'wood' }
        case 'research':
            return { action, tech: options.techs[0] }
        case 'move':
            return { action, count: 1, from: options.nodes[0], to: 'wood' }
    }
}

export function defaultTrigger(kind: TriggerKind, options: StepOptions): Trigger {
    switch (kind) {
        case 'time':
            return { kind, seconds: 0 }
        case 'villagers':
            return { kind, count: 1 }
        case 'depleted':
            return { kind, node: options.finiteNodes[0] }
        case 'bank':
            return { kind, resource: options.resources[0], atLeast: 100 }
    }
}

function inRange(steps: readonly BuildStep[], index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < steps.length
}

export function insertStep(steps: readonly BuildStep[], index: number, step: BuildStep): BuildStep[] {
    if (!Number.isInteger(index) || index < 0 || index > steps.length) return steps as BuildStep[]
    return [...steps.slice(0, index), step, ...steps.slice(index)]
}

export function deleteStep(steps: readonly BuildStep[], index: number): BuildStep[] {
    if (!inRange(steps, index)) return steps as BuildStep[]
    return steps.filter((_, i) => i !== index)
}

export function replaceStep(steps: readonly BuildStep[], index: number, step: BuildStep): BuildStep[] {
    if (!inRange(steps, index)) return steps as BuildStep[]
    return steps.map((s, i) => (i === index ? step : s))
}

export function moveStep(steps: readonly BuildStep[], index: number, delta: -1 | 1): BuildStep[] {
    const target = index + delta
    if (!inRange(steps, index) || !inRange(steps, target)) return steps as BuildStep[]
    const next = [...steps]
    next[index] = steps[target]
    next[target] = steps[index]
    return next
}

export function changeAction(step: BuildStep, action: Action, options: StepOptions): BuildStep {
    if (step.action === action) return step
    const next: BuildStep = defaultStep(action, options)
    if (step.trigger !== undefined) next.trigger = step.trigger
    if (step.reaction !== undefined) next.reaction = step.reaction
    return next
}

export function changeProducer(step: BuildStep, producer: string, options: StepOptions): BuildStep {
    if (step.action === 'pause' || step.action === 'rally') return { ...step, producer }
    if (step.action !== 'produce') return step
    const units = options.unitsByProducer[producer] ?? []
    const unit = units.includes(step.unit) || units.length === 0 ? step.unit : units[0]
    return { ...step, producer, unit }
}

export function changeTriggerKind(step: BuildStep, kind: 'none' | TriggerKind, options: StepOptions): BuildStep {
    if ((step.trigger?.kind ?? 'none') === kind) return step
    const { trigger: _trigger, ...rest } = step
    const next = (kind === 'none' ? rest : { ...rest, trigger: defaultTrigger(kind, options) }) as BuildStep
    if (step.trigger?.kind === 'depleted') delete next.reaction
    return next
}

export function setReaction(step: BuildStep, reaction: boolean): BuildStep {
    const { reaction: _reaction, ...rest } = step
    return (reaction ? { ...rest, reaction: true } : rest) as BuildStep
}

const OPTIONAL_SELECTS: Partial<Record<Action, readonly string[]>> = { produce: ['rally'], build: ['then'], research: ['at'] }

export function offersEmptyChoice(action: Action, field: string): boolean {
    return OPTIONAL_SELECTS[action]?.includes(field) ?? false
}

export function selectChoices(value: string | undefined, choices: readonly string[]): { id: string; unknown: boolean }[] {
    const listed = choices.map((id) => ({ id, unknown: false }))
    return value === undefined || choices.includes(value) ? listed : [...listed, { id: value, unknown: true }]
}

export function withoutField(step: BuildStep, field: string): BuildStep {
    const { [field]: _removed, ...rest } = step as Record<string, unknown>
    return rest as BuildStep
}

const UNSIGNED_INTEGER = /^\d+$/

// Above MAX_SAFE_INTEGER a value can print in exponent form, which the text grammar does not read.
function parseUnsigned(text: string): number | undefined {
    const value = UNSIGNED_INTEGER.test(text) ? Number(text) : NaN
    return Number.isSafeInteger(value) ? value : undefined
}

// A rejected draft leaves the step unchanged; an empty draft deletes an optional field.
export function setNumberField(step: BuildStep, field: string, text: string): BuildStep {
    const isMoveCount = step.action === 'move' && field === 'count'
    if (text === '') return isMoveCount ? step : withoutField(step, field)
    if (isMoveCount && text === 'all') return { ...step, count: 'all' }
    const value = parseUnsigned(text)
    return value === undefined ? step : ({ ...step, [field]: value } as BuildStep)
}

export function setTriggerNumber(step: BuildStep, field: 'seconds' | 'count' | 'atLeast', text: string): BuildStep {
    const value = parseUnsigned(text)
    if (step.trigger === undefined || value === undefined || !(field in step.trigger)) return step
    return { ...step, trigger: { ...step.trigger, [field]: value } as Trigger }
}

export const FIELD_LABELS: Readonly<Record<string, string>> = {
    producer: 'Building',
    instance: 'Building #',
    unit: 'Unit',
    count: 'Count',
    rally: 'Rally to',
    walkSeconds: 'Walk time (s)',
    to: 'To',
    building: 'Building',
    builders: 'Builders',
    from: 'From',
    then: 'Then',
    tech: 'Technology',
    at: 'At',
    seconds: 'Time (s)',
    'trigger-count': 'Villagers',
    node: 'Node',
    resource: 'Resource',
    atLeast: 'At least',
    reaction: 'Every time',
}

export const TRIGGER_KIND_LABELS: Readonly<Record<'none' | TriggerKind, string>> = {
    none: 'Right away',
    time: 'At time',
    villagers: 'At villager count',
    depleted: 'When node runs out',
    bank: 'When bank reaches',
}

export const ACTION_LABELS: Readonly<Record<Action, string>> = {
    produce: 'Produce',
    pause: 'Pause',
    build: 'Build',
    research: 'Research',
    move: 'Move villagers',
    rally: 'Set rally',
}

export function nodeLabel(ref: string): string {
    const [kind, deposit] = ref.split('#')
    const name = kind.charAt(0).toUpperCase() + kind.slice(1)
    return deposit === undefined ? name : `${name} deposit ${deposit}`
}

export function optionLabel(id: string, catalog: BuildOrderCatalog): string {
    if (Object.hasOwn(catalog.names, id)) return catalog.names[id]
    return (catalog.nodes as readonly string[]).includes(id) ? nodeLabel(id) : id
}

export function hasOptionalField(step: BuildStep): boolean {
    const values = step as unknown as Record<string, unknown>
    return OPTIONAL_STEP_FIELDS[step.action].some((field) => values[field] !== undefined)
}

export function openFlags(flags: readonly boolean[], steps: readonly BuildStep[]): boolean[] {
    return steps.map((step, i) => flags[i] ?? hasOptionalField(step))
}

export function moveFlag(flags: readonly boolean[], index: number, delta: -1 | 1): boolean[] {
    const target = index + delta
    if (index < 0 || index >= flags.length || target < 0 || target >= flags.length) return [...flags]
    const next = [...flags]
    next[index] = flags[target]
    next[target] = flags[index]
    return next
}

export function deleteFlag(flags: readonly boolean[], index: number): boolean[] {
    return flags.filter((_, i) => i !== index)
}

export function mergeExternalEdit(flags: readonly boolean[], steps: readonly BuildStep[]): boolean[] {
    return steps.map((step, i) => (flags[i] ?? false) || hasOptionalField(step))
}

type StartPair = [NodeRef, number]

export function startPairs(order: BuildOrder): StartPair[] {
    return Object.entries(order.start?.villagers ?? {}) as StartPair[]
}

function withStart(order: BuildOrder, pairs: readonly StartPair[], rally: NodeRef | undefined): BuildOrder {
    const { start: _start, ...rest } = order
    const start: BuildStart = {}
    if (pairs.length > 0) start.villagers = Object.fromEntries(pairs)
    if (rally !== undefined) start.rally = rally
    return start.villagers === undefined && start.rally === undefined ? rest : { ...rest, start }
}

export function setStartRally(order: BuildOrder, rally: string): BuildOrder {
    if (order.start === undefined) return order
    return withStart(order, startPairs(order), rally === '' ? undefined : (rally as NodeRef))
}

export function setStartCount(order: BuildOrder, index: number, text: string): BuildOrder {
    const pairs = startPairs(order)
    const count = parseUnsigned(text)
    if (count === undefined || index < 0 || index >= pairs.length) return order
    return withStart(order, pairs.map((pair, i): StartPair => (i === index ? [pair[0], count] : pair)), order.start?.rally)
}

export function setStartNode(order: BuildOrder, index: number, node: string): BuildOrder {
    const pairs = startPairs(order)
    if (index < 0 || index >= pairs.length || pairs.some(([used], i) => used === node && i !== index)) return order
    return withStart(order, pairs.map((pair, i): StartPair => (i === index ? [node as NodeRef, pair[1]] : pair)), order.start?.rally)
}

export function firstUnusedStartNode(order: BuildOrder, catalog: BuildOrderCatalog): NodeRef | undefined {
    const used = new Set<string>(startPairs(order).map(([node]) => node))
    return catalog.nodes.find((node) => !used.has(node))
}

export function addStartPair(order: BuildOrder, catalog: BuildOrderCatalog): BuildOrder {
    const node = firstUnusedStartNode(order, catalog)
    if (order.start === undefined || node === undefined) return order
    return withStart(order, [...startPairs(order), [node, 1]], order.start.rally)
}

export function deleteStartPair(order: BuildOrder, index: number): BuildOrder {
    const pairs = startPairs(order)
    if (index < 0 || index >= pairs.length) return order
    return withStart(order, pairs.filter((_, i) => i !== index), order.start?.rally)
}
