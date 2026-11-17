export const DRAG_THRESHOLD_PX = 4

export function dropIndexAt(otherMidpoints: readonly number[], pointerY: number): number {
    return otherMidpoints.filter((midpoint) => midpoint < pointerY).length
}
