export function dropIndexAt(otherMidpoints: readonly number[], pointerY: number): number {
    return otherMidpoints.filter((midpoint) => midpoint < pointerY).length
}
