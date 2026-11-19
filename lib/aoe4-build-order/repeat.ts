import type { BuildOrder, BuildStep } from './model';

/** The actions a step may repeat (Build order input). */
export const REPEATABLE_ACTIONS: readonly BuildStep['action'][] = ['build', 'move'];

/** How many times a step runs: its repeat, or once (Build order input). */
export function repeatCount(step: BuildStep): number {
  return step.repeat ?? 1;
}

/** The number of steps an order runs once each repeat is written out (Build order input). */
export function expandedStepCount(steps: readonly BuildStep[]): number {
  return steps.reduce((sum, step) => sum + repeatCount(step), 0);
}

/** Which submitted step an expanded step copies, and which copy it is, 1-based (Outputs). */
export interface StepCopy {
  source: number;
  copy: number;
}

/** An order with each repeat written out; copies[i] describes order.steps[i] (Outputs). */
export interface ExpandedOrder {
  order: BuildOrder;
  copies: StepCopy[];
}

/** Writes out each repeated step as consecutive copies without the repeat key, keeping trigger and reaction (Ordering and triggers). */
export function expandRepeats(order: BuildOrder): ExpandedOrder {
  const steps: BuildStep[] = [];
  const copies: StepCopy[] = [];
  order.steps.forEach((step, source) => {
    const { repeat: _repeat, ...once } = step;
    for (let copy = 1; copy <= repeatCount(step); copy += 1) {
      steps.push({ ...once } as BuildStep);
      copies.push({ source, copy });
    }
  });
  return { order: { ...order, steps }, copies };
}
