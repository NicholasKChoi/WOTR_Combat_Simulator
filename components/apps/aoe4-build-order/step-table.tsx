import cn from 'classnames'
import { useState } from 'react'

import type { BuildOrder, BuildStep, Trigger } from '../../../lib/aoe4-build-order/model'
import { OPTIONAL_STEP_FIELDS, type BuildOrderCatalog } from '../../../lib/aoe4-build-order/schema'
import type { StepOptions } from '../../../lib/aoe4-build-order/step-options'
import styles from './step-table.module.css'
import {
    ACTION_LABELS,
    FIELD_LABELS,
    TRIGGER_KIND_LABELS,
    addStartPair,
    changeAction,
    changeProducer,
    changeTriggerKind,
    defaultStep,
    deleteFlag,
    deleteStartPair,
    deleteStep,
    firstUnusedStartNode,
    hasOptionalField,
    insertStep,
    moveStep,
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

interface StepTableProps {
    order: BuildOrder
    catalog: BuildOrderCatalog
    onChange: (next: BuildOrder) => void
    openRows: readonly boolean[]
    onOpenRowsChange: (next: boolean[]) => void
    disabled?: boolean
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

function Labeled({ field, children }: { field: string; children: React.ReactNode }) {
    return (
        <label className="d-flex d-md-inline-flex align-items-center gap-1 me-2 mb-1">
            <span className="small text-muted">{FIELD_LABELS[field]}</span>
            {children}
        </label>
    )
}

function SelectControl(props: {
    testId: string
    value: string | undefined
    choices: readonly string[]
    label: (id: string) => string
    allowEmpty?: boolean
    index?: number
    onChange: (value: string) => void
}) {
    return (
        <select
            data-testid={props.testId}
            data-index={props.index}
            className="form-select form-select-sm w-auto"
            value={props.value ?? ''}
            onChange={(e) => props.onChange(e.target.value)}
        >
            {props.allowEmpty ? <option value="">(none)</option> : null}
            {selectChoices(props.value, props.choices).map(({ id, unknown }) => (
                <option key={id} value={id} data-unknown={unknown ? 'true' : undefined}>
                    {unknown ? `${id} (unknown)` : props.label(id)}
                </option>
            ))}
        </select>
    )
}

function NumberControl({ testId, value, index, onType }: { testId: string; value: number | string | undefined; index?: number; onType: (text: string) => void }) {
    const [draft, setDraft] = useState<string | null>(null)
    return (
        <input
            type="text"
            inputMode="numeric"
            data-testid={testId}
            data-index={index}
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

function TriggerFields({ step, options, onEdit }: { step: BuildStep; options: BuildOrderCatalog; onEdit: (next: BuildStep) => void }) {
    const trigger = step.trigger
    const setTrigger = (next: Trigger) => onEdit({ ...step, trigger: next })
    switch (trigger?.kind) {
        case 'time':
            return (
                <Labeled field="seconds">
                    <NumberControl testId="step-field-seconds" value={trigger.seconds} onType={(t) => onEdit(setTriggerNumber(step, 'seconds', t))} />
                </Labeled>
            )
        case 'villagers':
            return (
                <Labeled field="trigger-count">
                    <NumberControl testId="step-field-trigger-count" value={trigger.count} onType={(t) => onEdit(setTriggerNumber(step, 'count', t))} />
                </Labeled>
            )
        case 'depleted':
            return (
                <>
                    <Labeled field="node">
                        <SelectControl
                            testId="step-field-node"
                            value={trigger.node}
                            choices={options.finiteNodes}
                            label={(id) => optionLabel(id, options)}
                            onChange={(node) => setTrigger({ ...trigger, node: node as typeof trigger.node })}
                        />
                    </Labeled>
                    <Labeled field="reaction">
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
                    <Labeled field="resource">
                        <SelectControl
                            testId="step-field-resource"
                            value={trigger.resource}
                            choices={options.resources}
                            label={(id) => optionLabel(id, options)}
                            onChange={(resource) => setTrigger({ ...trigger, resource: resource as typeof trigger.resource })}
                        />
                    </Labeled>
                    <Labeled field="atLeast">
                        <NumberControl testId="step-field-atLeast" value={trigger.atLeast} onType={(t) => onEdit(setTriggerNumber(step, 'atLeast', t))} />
                    </Labeled>
                </>
            )
        default:
            return null
    }
}

function ActionFields(props: { step: BuildStep; options: BuildOrderCatalog; expanded: boolean; onToggle: () => void; onEdit: (next: BuildStep) => void }) {
    const { step, options, expanded, onToggle, onEdit } = props
    const values = step as unknown as Record<string, string | number | undefined>
    const optional = OPTIONAL_STEP_FIELDS[step.action]
    const shown = actionFields(step, options).filter((field) => expanded || !optional.includes(field.name))
    return (
        <>
            {shown.map((field) => (
                <Labeled key={field.name} field={field.name}>
                    {field.kind === 'number' ? (
                        <NumberControl testId={`step-field-${field.name}`} value={values[field.name]} onType={(t) => onEdit(setNumberField(step, field.name, t))} />
                    ) : (
                        <SelectControl
                            testId={`step-field-${field.name}`}
                            value={values[field.name] as string | undefined}
                            choices={field.choices}
                            label={(id) => optionLabel(id, options)}
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
            <button type="button" data-testid="step-more" className="btn btn-sm btn-link p-0 mb-1" aria-expanded={expanded} onClick={onToggle}>
                {expanded ? 'Fewer options' : 'More options'}
            </button>
        </>
    )
}

function StartRow({ order, catalog, onChange }: { order: BuildOrder; catalog: BuildOrderCatalog; onChange: (next: BuildOrder) => void }) {
    const pairs = startPairs(order)
    return (
        <tr data-testid="step-start-row">
            <td>
                <span className="small text-muted me-2">Start</span>
                {order.start === undefined ? (
                    <button type="button" data-testid="start-customize" className="btn btn-sm btn-outline-secondary" onClick={() => onChange({ ...order, start: catalog.defaultStart })}>
                        Customize start
                    </button>
                ) : (
                    <Labeled field="rally">
                        <SelectControl
                            testId="start-field-rally"
                            value={order.start.rally}
                            choices={catalog.nodes}
                            label={(id) => optionLabel(id, catalog)}
                            allowEmpty
                            onChange={(rally) => onChange(setStartRally(order, rally))}
                        />
                    </Labeled>
                )}
            </td>
            <td colSpan={2}>
                {order.start === undefined ? null : (
                    <>
                        {pairs.map(([node, count], index) => (
                            <span key={node} className="d-inline-flex align-items-center gap-1 me-2 mb-1">
                                <NumberControl testId="start-villagers-count" index={index} value={count} onType={(t) => onChange(setStartCount(order, index, t))} />
                                <SelectControl
                                    testId="start-villagers-node"
                                    index={index}
                                    value={node}
                                    choices={catalog.nodes.filter((other) => other === node || !pairs.some(([used]) => used === other))}
                                    label={(id) => optionLabel(id, catalog)}
                                    onChange={(next) => onChange(setStartNode(order, index, next))}
                                />
                                <button type="button" data-testid="start-villagers-delete" data-index={index} className="btn btn-sm btn-outline-danger" aria-label="Delete villagers" onClick={() => onChange(deleteStartPair(order, index))}>
                                    {'\u2715'}
                                </button>
                            </span>
                        ))}
                        <button
                            type="button"
                            data-testid="start-villagers-add"
                            className="btn btn-sm btn-outline-secondary mb-1"
                            disabled={firstUnusedStartNode(order, catalog) === undefined}
                            onClick={() => onChange(addStartPair(order, catalog))}
                        >
                            Add villagers
                        </button>
                    </>
                )}
            </td>
        </tr>
    )
}

export function StepTable({ order, catalog, onChange, openRows, onOpenRowsChange, disabled = false }: StepTableProps) {
    const { steps } = order
    const open = openFlags(openRows, steps)
    const commit = (next: BuildStep[], nextOpen: boolean[] = open) => {
        onOpenRowsChange(nextOpen)
        if (next !== steps) onChange({ ...order, steps: next })
    }
    const setOpen = (index: number, value: boolean) => onOpenRowsChange(open.map((was, i) => (i === index ? value : was)))

    return (
        <fieldset data-testid="step-table" disabled={disabled} aria-busy={disabled ? 'true' : undefined} className={cn('mb-3', styles.fieldset)}>
            <table className={cn(styles.table, 'table table-sm align-middle')}>
                <tbody>
                    <StartRow order={order} catalog={catalog} onChange={onChange} />
                    {steps.map((step, index) => {
                        const edit = (next: BuildStep) => {
                            if (next === step) return
                            commit(replaceStep(steps, index, next), next.action === step.action ? open : open.map((was, i) => i !== index && was))
                        }
                        return (
                            <tr key={index} data-testid="step-row" data-step={index}>
                                <td>
                                    <select
                                        data-testid="step-trigger-kind"
                                        aria-label="Trigger"
                                        className="form-select form-select-sm w-auto mb-1"
                                        value={step.trigger?.kind ?? 'none'}
                                        onChange={(e) => edit(changeTriggerKind(step, e.target.value as Trigger['kind'] | 'none', catalog))}
                                    >
                                        {catalog.triggerKinds.map((kind) => (
                                            <option key={kind} value={kind}>
                                                {TRIGGER_KIND_LABELS[kind]}
                                            </option>
                                        ))}
                                    </select>
                                    <TriggerFields step={step} options={catalog} onEdit={edit} />
                                </td>
                                <td>
                                    <select
                                        data-testid="step-action"
                                        aria-label="Action"
                                        className="form-select form-select-sm w-auto mb-1"
                                        value={step.action}
                                        onChange={(e) => edit(changeAction(step, e.target.value as BuildStep['action'], catalog))}
                                    >
                                        {catalog.actions.map((action) => (
                                            <option key={action} value={action}>
                                                {ACTION_LABELS[action]}
                                            </option>
                                        ))}
                                    </select>
                                    <ActionFields step={step} options={catalog} expanded={open[index]} onToggle={() => setOpen(index, !open[index])} onEdit={edit} />
                                </td>
                                <td className="text-nowrap">
                                    <button type="button" data-testid="step-move-up" aria-label="Move up" className="btn btn-sm btn-outline-secondary me-1" disabled={index === 0} onClick={() => commit(moveStep(steps, index, -1), moveStep(open, index, -1))}>
                                        {'\u25B2'}
                                    </button>
                                    <button type="button" data-testid="step-move-down" aria-label="Move down" className="btn btn-sm btn-outline-secondary me-1" disabled={index === steps.length - 1} onClick={() => commit(moveStep(steps, index, 1), moveStep(open, index, 1))}>
                                        {'\u25BC'}
                                    </button>
                                    <button type="button" data-testid="step-delete" aria-label="Delete step" className="btn btn-sm btn-outline-danger" onClick={() => commit(deleteStep(steps, index), deleteFlag(open, index))}>
                                        {'\u2715'}
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
                onClick={() => {
                    const added = defaultStep('produce', catalog)
                    commit(insertStep(steps, steps.length, added), [...open, hasOptionalField(added)])
                }}
            >
                Add step
            </button>
        </fieldset>
    )
}
