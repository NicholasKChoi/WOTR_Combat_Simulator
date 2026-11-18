import type { PointerEvent, ReactNode } from 'react'
import cn from 'classnames'
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

export function ChartHeaderRow({ title, bodyId, layout, controls }: ChartHeaderProps) {
    return (
        <tr data-testid="chart-header-row" data-dragging={layout?.dragging ? 'true' : undefined} className={styles.headerRow}>
            <td className={styles.cell}>
                {layout ? (
                    <button
                        type="button"
                        className={cn(styles.dragHandle, 'btn btn-sm btn-outline-secondary')}
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
            </td>
            <th scope="rowgroup" className={styles.title}>
                <h3 className="h5">{title}</h3>
            </th>
            <td className={styles.cell}>
                {layout ? <CollapseCaret expanded={!layout.collapsed} name={`${title} chart`} controlsId={bodyId} onToggle={layout.onToggle} testId="chart-collapse" /> : null}
            </td>
            <td className={styles.cell}>{controls}</td>
        </tr>
    )
}
