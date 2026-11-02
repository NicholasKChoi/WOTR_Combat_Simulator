import { HOUSE_ID, VILLAGER_ID } from '../../../lib/aoe4-build-order/engine-common'
import type { BuildStep, Trigger } from '../../../lib/aoe4-build-order/model'
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

export function selectChoices(value: string | undefined, choices: readonly string[]): { id: string; unknown: boolean }[] {
    const listed = choices.map((id) => ({ id, unknown: false }))
    return value === undefined || choices.includes(value) ? listed : [...listed, { id: value, unknown: true }]
}

export function withoutField(step: BuildStep, field: string): BuildStep {
    const { [field]: _removed, ...rest } = step as Record<string, unknown>
    return rest as BuildStep
}

const UNSIGNED_INTEGER = /^\d+$/

// A rejected draft leaves the step unchanged; an empty draft deletes an optional field.
export function setNumberField(step: BuildStep, field: string, text: string): BuildStep {
    const isMoveCount = step.action === 'move' && field === 'count'
    if (text === '') return isMoveCount ? step : withoutField(step, field)
    if (isMoveCount && text === 'all') return { ...step, count: 'all' }
    return UNSIGNED_INTEGER.test(text) ? ({ ...step, [field]: Number(text) } as BuildStep) : step
}

export function setTriggerNumber(step: BuildStep, field: 'seconds' | 'count' | 'atLeast', text: string): BuildStep {
    if (step.trigger === undefined || !UNSIGNED_INTEGER.test(text) || !(field in step.trigger)) return step
    return { ...step, trigger: { ...step.trigger, [field]: Number(text) } as Trigger }
}
