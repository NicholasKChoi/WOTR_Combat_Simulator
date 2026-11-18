export const DRAG_THRESHOLD_PX = 4

export function dropIndexAt(otherMidpoints: readonly number[], pointerY: number): number {
    return otherMidpoints.filter((midpoint) => midpoint < pointerY).length
}

export interface GroupRect {
    top: number
    bottom: number
}

export interface DropSlot {
    index: number
    boundaryY: number | null
}

export function dropSlotAt(others: readonly GroupRect[], pointerY: number): DropSlot {
    const index = dropIndexAt(
        others.map((rect) => rect.top + (rect.bottom - rect.top) / 2),
        pointerY,
    )
    if (others.length === 0) return { index, boundaryY: null }
    if (index === 0) return { index, boundaryY: others[0].top }
    if (index === others.length) return { index, boundaryY: others[index - 1].bottom }
    return { index, boundaryY: (others[index - 1].bottom + others[index].top) / 2 }
}
