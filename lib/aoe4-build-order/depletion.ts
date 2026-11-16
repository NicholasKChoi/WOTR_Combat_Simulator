import { RESOURCE_TOLERANCE } from './engine-common';
import { formatMinSec } from './format-time';
import { FINITE_GATHER_NODES, FINITE_NODE_REFS } from './model';
import type { BuildOrder, FiniteNodeRef, NodeDepletion, NodeRef, SimWarning } from './model';

/** When villagers first arrived at a depleted node and how many have arrived in all (Depletion). */
export interface IdleArrival {
  at: number;
  idleVillagers: number;
}

/** The stock of one finite node ref: starting amount, what remains, when it ran out and the villagers left idle (Depletion). */
export interface RefStock {
  // null is infinite.
  amount: number | null;
  remaining: number | null;
  depletedAt: number | null;
  // Idle count at the end of the run-out instant.
  idleAtRunOut: number;
  idleArrival: IdleArrival | null;
}

/** The stock of every finite ref a run names (Depletion). */
export type NodeStock = Map<FiniteNodeRef, RefStock>;

/** The part of SimInputs that sets each ref's starting amount (Depletion). */
export interface NodeStockInputs {
  nodeAmounts: Readonly<Record<FiniteNodeRef, number | null>>;
}

/** Villagers gathering each node ref. */
export type Gatherers = Readonly<Partial<Record<NodeRef, number>>>;
/** A ref's gather rate per villager, in resource per second. */
export type RateOf = (ref: FiniteNodeRef) => number;

const STEP_NODE_FIELDS = ['rally', 'to', 'from', 'then'] as const;

/** The finite node refs a build order names, in FINITE_NODE_REFS order (Depletion). */
export function runRefs(order: BuildOrder): FiniteNodeRef[] {
  const named = new Set<unknown>(FINITE_GATHER_NODES);
  Object.keys(order.start?.villagers ?? {}).forEach((node) => named.add(node));
  named.add(order.start?.rally);
  for (const step of order.steps) {
    const fields = step as Partial<Record<(typeof STEP_NODE_FIELDS)[number], unknown>>;
    STEP_NODE_FIELDS.forEach((field) => named.add(fields[field]));
    if (step.trigger?.kind === 'depleted') {
      named.add(step.trigger.node);
    }
  }
  // Anything that is not a finite ref (farm, wood, or a value validation rejects) drops out here.
  return FINITE_NODE_REFS.filter((ref) => named.has(ref));
}

/** Creates full stocks for the given refs from the starting amounts in the inputs (Depletion). */
export function createNodeStock(refs: readonly FiniteNodeRef[], inputs: NodeStockInputs): NodeStock {
  const stock: NodeStock = new Map();
  for (const ref of refs) {
    const amount = inputs.nodeAmounts[ref];
    stock.set(ref, { amount, remaining: amount, depletedAt: null, idleAtRunOut: 0, idleArrival: null });
  }
  return stock;
}

/** Whether a ref's stock has reached 0; a ref with infinite or no stock never has (Depletion). */
export function isDepleted(stock: NodeStock, ref: FiniteNodeRef): boolean {
  return stock.get(ref)?.remaining === 0;
}

function drawable(stock: NodeStock): [FiniteNodeRef, RefStock][] {
  return [...stock].filter(([, entry]) => entry.remaining !== null && entry.remaining > 0);
}

/** Takes seconds of gathering out of each stock and returns what each ref actually lost, which is what its gatherers earn (Depletion). */
export function drawDown(stock: NodeStock, gatherers: Gatherers, rateOf: RateOf, seconds: number): Partial<Record<FiniteNodeRef, number>> {
  const drawn: Partial<Record<FiniteNodeRef, number>> = {};
  for (const [ref, entry] of drawable(stock)) {
    const wanted = (gatherers[ref] ?? 0) * rateOf(ref) * seconds;
    if (!(wanted > 0)) {
      continue;
    }
    const taken = Math.min(wanted, entry.remaining!);
    const left = entry.remaining! - taken;
    entry.remaining = left <= RESOURCE_TOLERANCE ? 0 : left;
    drawn[ref] = taken;
  }
  return drawn;
}

/** The earliest time a stock being drawn reaches 0 at the current gatherers and rates, or null when none will (Depletion). */
export function nextRunOut(stock: NodeStock, gatherers: Gatherers, rateOf: RateOf, now: number): number | null {
  let earliest: number | null = null;
  for (const [ref, entry] of drawable(stock)) {
    const perSecond = (gatherers[ref] ?? 0) * rateOf(ref);
    if (perSecond > 0) {
      const at = now + entry.remaining! / perSecond;
      earliest = earliest === null ? at : Math.min(earliest, at);
    }
  }
  return earliest;
}

/** Records when a depleted ref ran out and how many villagers were idle; the first record wins (Depletion). */
export function recordRunOut(stock: NodeStock, ref: FiniteNodeRef, at: number, idleVillagers: number): void {
  const entry = stock.get(ref)!;
  if (!isDepleted(stock, ref) || entry.depletedAt !== null) {
    return;
  }
  entry.depletedAt = at;
  entry.idleAtRunOut = idleVillagers;
}

/** Records villagers arriving at a depleted ref; ignores a count of 0 or a ref that has not run out (Depletion). */
export function recordIdleArrival(stock: NodeStock, ref: FiniteNodeRef, at: number, count: number): void {
  if (count <= 0 || !isDepleted(stock, ref)) {
    return;
  }
  const entry = stock.get(ref)!;
  entry.idleArrival = addIdleArrival(entry.idleArrival, at, count);
}

/** Adds an arrival to an idle record: the first arrival's at is kept and idleVillagers adds up every arrival (Depletion). */
export function addIdleArrival(record: IdleArrival | null, at: number, count: number): IdleArrival {
  return { at: record?.at ?? at, idleVillagers: (record?.idleVillagers ?? 0) + count };
}

function villagers(count: number): string {
  return count === 1 ? '1 villager' : `${count} villagers`;
}

function runOutWarning(ref: FiniteNodeRef, at: number, idle: number): SimWarning {
  const tail = idle > 0 ? `${villagers(idle)} ${idle === 1 ? 'is' : 'are'} idle there.` : 'no villagers were left idle.';
  return {
    code: 'node-depleted',
    severity: idle > 0 ? 'warning' : 'info',
    message: `${ref} ran out at ${formatMinSec(at)}; ${tail}`,
    node: ref,
    at,
    idleVillagers: idle,
  };
}

function idleArrivalWarning(ref: FiniteNodeRef, at: number, idle: number): SimWarning {
  return {
    code: 'idle-arrival',
    severity: 'warning',
    message: `${villagers(idle)} arrived at depleted ${ref} from ${formatMinSec(at)} on and ${idle === 1 ? 'is' : 'are'} idle.`,
    node: ref,
    at,
    idleVillagers: idle,
  };
}

/** The farm-idle warning for villagers that found no free farm, or an empty list when none did. */
export function farmIdleWarnings(record: IdleArrival | null): SimWarning[] {
  if (record === null) {
    return [];
  }
  const { at, idleVillagers } = record;
  return [
    {
      code: 'farm-idle',
      severity: 'warning',
      message: `${villagers(idleVillagers)} arrived at farm from ${formatMinSec(at)} on with no free farm and ${idleVillagers === 1 ? 'waits' : 'wait'} idle until one is built.`,
      at,
      idleVillagers,
    },
  ];
}

/** Builds the per-ref depletions and the node-depleted and idle-arrival warnings from the stocks (Depletion). */
export function depletionResults(stock: NodeStock): { depletions: NodeDepletion[]; warnings: SimWarning[] } {
  const depletions: NodeDepletion[] = [];
  const warnings: SimWarning[] = [];
  for (const ref of FINITE_NODE_REFS) {
    const entry = stock.get(ref);
    if (!entry) {
      continue;
    }
    depletions.push({ node: ref, amount: entry.amount, depletedAt: entry.depletedAt });
    if (entry.depletedAt !== null) {
      warnings.push(runOutWarning(ref, entry.depletedAt, entry.idleAtRunOut));
    }
    if (entry.idleArrival) {
      warnings.push(idleArrivalWarning(ref, entry.idleArrival.at, entry.idleArrival.idleVillagers));
    }
  }
  return { depletions, warnings };
}

// At one instant: node warnings by FINITE_NODE_REFS order, node-depleted before idle-arrival, then farm-idle, then
// step-stuck by step.
function tieRank(warning: SimWarning): number[] {
  if (warning.code === 'farm-idle') {
    return [0, FINITE_NODE_REFS.length, 0];
  }
  if (warning.code === 'step-stuck') {
    return [1, warning.step, 0];
  }
  return [0, FINITE_NODE_REFS.indexOf(warning.node), warning.code === 'node-depleted' ? 0 : 1];
}

/** Orders warnings by time; at one instant node warnings come first, then farm-idle, then step-stuck by step. */
export function sortWarnings(warnings: readonly SimWarning[]): SimWarning[] {
  return [...warnings].sort((a, b) => {
    if (a.at !== b.at) {
      return a.at - b.at;
    }
    const rankA = tieRank(a);
    const rankB = tieRank(b);
    const differs = rankA.findIndex((value, i) => value !== rankB[i]);
    return differs === -1 ? 0 : rankA[differs] - rankB[differs];
  });
}
