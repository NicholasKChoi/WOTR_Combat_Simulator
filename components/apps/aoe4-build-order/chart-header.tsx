import type { PointerEvent, ReactNode } from 'react'
import { CollapseCaret } from './collapse-caret'
import styles from './chart-header.module.css'

export interface ChartControls {
    collapsed: boolean
    dragging: boolean
    reorderHelpId: string
    onToggle(): void
    onMoveKey(direction: 'up' | 'down'): void
    onHandlePointerDown(event: PointerEvent<HTMLButtonElement>): void
}

export function chartHandleKey(key: string): 'up' | 'down' | null {
    if (key === 'ArrowUp') return 'up'
    if (key === 'ArrowDown') return 'down'
    return null
}

interface ChartHeaderProps {
    title: string
    bodyId: string
    layout?: ChartControls
    controls?: ReactNode
}

export function ChartHeader({ title, bodyId, layout, controls }: ChartHeaderProps) {
    return (
        <div className={styles.chartHeader}>
            {layout ? (
                <button
                    type="button"
                    className={`btn btn-sm btn-outline-secondary ${styles.dragHandle}`}
                    data-testid="chart-drag-handle"
                    aria-label={`Reorder ${title} chart`}
                    aria-keyshortcuts="ArrowUp ArrowDown"
                    aria-describedby={layout.reorderHelpId}
                    onPointerDown={layout.onHandlePointerDown}
                    onKeyDown={(event) => {
                        const direction = chartHandleKey(event.key)
                        if (direction === null) return
                        event.preventDefault()
                        layout.onMoveKey(direction)
                    }}
                >
                    <span aria-hidden="true">⠿</span>
                </button>
            ) : null}
            <h3 className="h5">{title}</h3>
            {layout ? <CollapseCaret expanded={!layout.collapsed} name={`${title} chart`} controlsId={bodyId} onToggle={layout.onToggle} testId="chart-collapse" /> : null}
            {controls}
        </div>
    )
}
