import { useState } from 'react'

import type { BuildOrder, BuildStep, Trigger } from '../../../lib/aoe4-build-order/model'
import { formatBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import type { BuildOrderCatalog } from '../../../lib/aoe4-build-order/schema'
import type { StepOptions } from '../../../lib/aoe4-build-order/step-options'
import {
    changeAction,
    changeProducer,
    changeTriggerKind,
    defaultStep,
    deleteStep,
    insertStep,
    moveStep,
    offersEmptyChoice,
    replaceStep,
    selectChoices,
    setNumberField,
    setReaction,
    setTriggerNumber,
    withoutField,
} from './step-table-model'

interface StepTableProps {
    order: BuildOrder
    catalog: BuildOrderCatalog
    onChange: (next: BuildOrder) => void
}

type FieldDef = { name: string; kind: 'number' } | { name: string; kind: 'select'; choices: readonly string[] }

const num = (name: string): FieldDef => ({ name, kind: 'number' })
const pick = (name: string, choices: readonly string[]): FieldDef => ({ name, kind: 'select', choices })

function actionFields(step: BuildStep, options: StepOptions): FieldDef[] {
    switch (step.action) {
        case 'produce':
            return [
                pick('producer', options.producers),
                num('instance'),
                pick('unit', options.unitsByProducer[step.producer] ?? []),
                num('count'),
                pick('rally', options.nodes),
                num('walkSeconds'),
            ]
        case 'rally':
            return [pick('producer', options.villagerProducers), num('instance'), pick('to', options.nodes), num('walkSeconds')]
        case 'pause':
            return [pick('producer', options.producers), num('instance')]
        case 'build':
            return [
                pick('building', options.buildings),
                num('builders'),
                pick('from', options.nodes),
                pick('then', options.nodes),
                num('walkSeconds'),
            ]
        case 'research':
            return [pick('tech', options.techs), pick('at', options.techSites[step.tech] ?? [])]
        case 'move':
            return [num('count'), pick('from', options.nodes), pick('to', options.nodes), num('walkSeconds')]
    }
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="d-inline-flex align-items-center gap-1 me-2 mb-1">
            <span className="small text-muted">{label}</span>
            {children}
        </label>
    )
}

function SelectControl(props: {
    testId: string
    value: string | undefined
    choices: readonly string[]
    allowEmpty?: boolean
    onChange: (value: string) => void
}) {
    return (
        <select
            data-testid={props.testId}
            className="form-select form-select-sm w-auto"
            value={props.value ?? ''}
            onChange={(e) => props.onChange(e.target.value)}
        >
            {props.allowEmpty ? <option value="">(none)</option> : null}
            {selectChoices(props.value, props.choices).map(({ id, unknown }) => (
                <option key={id} value={id} data-unknown={unknown ? 'true' : undefined}>
                    {unknown ? `${id} (unknown)` : id}
                </option>
            ))}
        </select>
    )
}

function NumberControl({ testId, value, onType }: { testId: string; value: number | string | undefined; onType: (text: string) => void }) {
    const [draft, setDraft] = useState<string | null>(null)
    return (
        <input
            type="text"
            inputMode="numeric"
            data-testid={testId}
            className="form-control form-control-sm"
            style={{ width: '5rem' }}
            value={draft ?? String(value ?? '')}
            onChange={(e) => {
                setDraft(e.target.value)
                onType(e.target.value)
            }}
            onBlur={() => setDraft(null)}
        />
    )
}

function TriggerFields({ step, options, onEdit }: { step: BuildStep; options: StepOptions; onEdit: (next: BuildStep) => void }) {
    const trigger = step.trigger
    const setTrigger = (next: Trigger) => onEdit({ ...step, trigger: next })
    switch (trigger?.kind) {
        case 'time':
            return (
                <Labeled label="seconds">
                    <NumberControl testId="step-field-seconds" value={trigger.seconds} onType={(t) => onEdit(setTriggerNumber(step, 'seconds', t))} />
                </Labeled>
            )
        case 'villagers':
            return (
                <Labeled label="villagers">
                    <NumberControl testId="step-field-trigger-count" value={trigger.count} onType={(t) => onEdit(setTriggerNumber(step, 'count', t))} />
                </Labeled>
            )
        case 'depleted':
            return (
                <>
                    <Labeled label="node">
                        <SelectControl
                            testId="step-field-node"
                            value={trigger.node}
                            choices={options.finiteNodes}
                            onChange={(node) => setTrigger({ ...trigger, node: node as typeof trigger.node })}
                        />
                    </Labeled>
                    <Labeled label="reaction">
                        <input
                            type="checkbox"
                            data-testid="step-field-reaction"
                            className="form-check-input"
                            checked={step.reaction === true}
                            onChange={(e) => onEdit(setReaction(step, e.target.checked))}
                        />
                    </Labeled>
                </>
            )
        case 'bank':
            return (
                <>
                    <Labeled label="resource">
                        <SelectControl
                            testId="step-field-resource"
                            value={trigger.resource}
                            choices={options.resources}
                            onChange={(resource) => setTrigger({ ...trigger, resource: resource as typeof trigger.resource })}
                        />
                    </Labeled>
                    <Labeled label="atLeast">
                        <NumberControl testId="step-field-atLeast" value={trigger.atLeast} onType={(t) => onEdit(setTriggerNumber(step, 'atLeast', t))} />
                    </Labeled>
                </>
            )
        default:
            return null
    }
}

function ActionFields({ step, options, onEdit }: { step: BuildStep; options: StepOptions; onEdit: (next: BuildStep) => void }) {
    const values = step as unknown as Record<string, string | number | undefined>
    return (
        <>
            {actionFields(step, options).map((field) => (
                <Labeled key={field.name} label={field.name}>
                    {field.kind === 'number' ? (
                        <NumberControl testId={`step-field-${field.name}`} value={values[field.name]} onType={(t) => onEdit(setNumberField(step, field.name, t))} />
                    ) : (
                        <SelectControl
                            testId={`step-field-${field.name}`}
                            value={values[field.name] as string | undefined}
                            choices={field.choices}
                            allowEmpty={offersEmptyChoice(step.action, field.name)}
                            onChange={(value) => {
                                if (field.name === 'producer') onEdit(changeProducer(step, value, options))
                                else if (value === '') onEdit(withoutField(step, field.name))
                                else onEdit({ ...step, [field.name]: value } as BuildStep)
                            }}
                        />
                    )}
                </Labeled>
            ))}
        </>
    )
}

export function StepTable({ order, catalog, onChange }: StepTableProps) {
    const { steps } = order
    const commit = (next: BuildStep[]) => {
        if (next !== steps) onChange({ ...order, steps: next })
    }
    const start = order.start === undefined ? null : formatBuildOrderText({ ...order, steps: [] })

    return (
        <div data-testid="step-table" className="mb-3">
            {start === null ? null : <pre className="mb-2 small">{start}</pre>}
            <table className="table table-sm align-middle">
                <tbody>
                    {steps.map((step, index) => {
                        const edit = (next: BuildStep) => {
                            if (next !== step) commit(replaceStep(steps, index, next))
                        }
                        return (
                            <tr key={index} data-testid="step-row" data-step={index}>
                                <td>
                                    <select
                                        data-testid="step-trigger-kind"
                                        aria-label="trigger"
                                        className="form-select form-select-sm w-auto mb-1"
                                        value={step.trigger?.kind ?? 'none'}
                                        onChange={(e) => edit(changeTriggerKind(step, e.target.value as Trigger['kind'] | 'none', catalog))}
                                    >
                                        {catalog.triggerKinds.map((kind) => (
                                            <option key={kind} value={kind}>
                                                {kind}
                                            </option>
                                        ))}
                                    </select>
                                    <TriggerFields step={step} options={catalog} onEdit={edit} />
                                </td>
                                <td>
                                    <select
                                        data-testid="step-action"
                                        aria-label="action"
                                        className="form-select form-select-sm w-auto mb-1"
                                        value={step.action}
                                        onChange={(e) => edit(changeAction(step, e.target.value as BuildStep['action'], catalog))}
                                    >
                                        {catalog.actions.map((action) => (
                                            <option key={action} value={action}>
                                                {action}
                                            </option>
                                        ))}
                                    </select>
                                    <ActionFields step={step} options={catalog} onEdit={edit} />
                                </td>
                                <td className="text-nowrap">
                                    <button type="button" data-testid="step-move-up" className="btn btn-sm btn-outline-secondary me-1" disabled={index === 0} onClick={() => commit(moveStep(steps, index, -1))}>
                                        Up
                                    </button>
                                    <button type="button" data-testid="step-move-down" className="btn btn-sm btn-outline-secondary me-1" disabled={index === steps.length - 1} onClick={() => commit(moveStep(steps, index, 1))}>
                                        Down
                                    </button>
                                    <button type="button" data-testid="step-delete" className="btn btn-sm btn-outline-danger" onClick={() => commit(deleteStep(steps, index))}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            <button
                type="button"
                data-testid="step-add"
                className="btn btn-sm btn-outline-primary"
                onClick={() => commit(insertStep(steps, steps.length, defaultStep('produce', catalog)))}
            >
                Add step
            </button>
        </div>
    )
}
