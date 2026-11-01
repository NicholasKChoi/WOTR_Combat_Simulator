import { civRules } from './civ-rules';
import type { CivRuleContext, CivRules } from './civ-rules';
import type { GameData, SnapshotEntry } from './data';
import { hasBuilding, modifiedValue } from './effects';
import type { EffectState } from './effects';
import { effectiveGatherRate } from './gather';
import type { BuildOrder, BuildStep, GatherNodeId, ResourceKind, SimInputs, SimulationResult, StepTiming, Trigger, UnitSeries } from './model';

// Output resolution, not a game number.
export const SAMPLE_SECONDS = 5;

// Income credited up to the computed affordability time can land a hair under the cost in floating point.
const RESOURCE_TOLERANCE = 1e-9;

const SECONDS_PER_MINUTE = 60;
const RESOURCES: readonly ResourceKind[] = ['food', 'wood', 'gold', 'stone'];
const VILLAGER = 'villager';

export interface RallySource {
  node: GatherNodeId;
  walkSeconds?: number;
}

export interface PaidItem {
  entry: SnapshotEntry;
  complete(state: EngineState, at: BuildingInstance): void;
}

export interface ProductionOrder {
  // Index into order.steps; null is the default continuous villager order.
  step: number | null;
  unit: string;
  // Unpaid units left; null is continuous.
  remaining: number | null;
}

export interface BuildingInstance {
  baseId: string;
  // 1-based, creation order within the baseId.
  instance: number;
  // Villager producers only.
  rally: RallySource | undefined;
  order: ProductionOrder | null;
  // FIFO; paid[0] is in production while busyUntil is set.
  paid: PaidItem[];
  busyUntil: number | null;
}

export interface EngineState extends EffectState {
  readonly data: GameData;
  readonly inputs: SimInputs;
  readonly rules: CivRules;
  readonly order: BuildOrder;
  time: number;
  age: number;
  readonly resources: Record<ResourceKind, number>;
  // Completed instances per baseId.
  readonly buildings: Map<string, number>;
  readonly researched: Set<string>;
  readonly coverage: Readonly<Record<string, number>>;
  // baseId -> instances; instance k at index k - 1.
  readonly instances: Map<string, BuildingInstance[]>;
  // baseId-wide default rally for instances built later.
  readonly rallyDefaults: Map<string, RallySource>;
  // baseId -> instance k not yet built -> rally.
  readonly heldRallies: Map<string, Map<number, RallySource>>;
  readonly gatherers: Record<GatherNodeId, number>;
  // Villagers alive and walking, gathering nothing.
  walking: number;
  // Alive villagers and units plus the popcap reserved by paid items.
  population: number;
  // Capped at data.base.maxPopCap.
  supply: number;
  readonly steps: StepTiming[];
  // Events run in (time, insertion) order.
  schedule(time: number, apply: (state: EngineState) => void): void;
}

export type StepStart = { started: true } | { started: false; reserve?: Readonly<Record<ResourceKind, number>> };

export type StepHandler<A extends BuildStep['action'] = BuildStep['action']> = (
  step: Extract<BuildStep, { action: A }>,
  index: number,
  state: EngineState,
) => StepStart;

type Resources = Record<ResourceKind, number>;

interface ScheduledEvent {
  time: number;
  apply(state: EngineState): void;
}

interface Engine extends EngineState {
  // Sorted by time; ties keep schedule order.
  readonly events: ScheduledEvent[];
  readonly spawns: Map<string, { entry: SnapshotEntry; times: number[] }>;
  // First step not yet started; every earlier step has started.
  cursor: number;
  // What the armed step waits to afford, when it waits on resources alone.
  reserve: Readonly<Resources> | undefined;
  // Order payments short of resources at the latest instant.
  needs: Resources[];
}

function ruleContext(state: EngineState): CivRuleContext {
  return { data: state.data, inputs: state.inputs, time: state.time };
}

function costOf(entry: SnapshotEntry, units: number): Resources {
  const cost = {} as Resources;
  for (const kind of RESOURCES) {
    cost[kind] = entry.costs[kind] * units;
  }
  return cost;
}

function affordable(state: EngineState, cost: Readonly<Resources>): boolean {
  return RESOURCES.every((kind) => state.resources[kind] + RESOURCE_TOLERANCE >= cost[kind]);
}

function aliveVillagers(state: EngineState): number {
  return Object.values(state.gatherers).reduce((sum, n) => sum + n, state.walking);
}

function isVillagerProducer(state: EngineState, baseId: string): boolean {
  const byDefault = (state.data.byBaseId.get(VILLAGER) ?? []).some((entry) => entry.producedBy.includes(baseId));
  return state.rules.villagerProducer?.(byDefault, { ...ruleContext(state), baseId }) ?? byDefault;
}

export function addBuildingInstance(state: EngineState, baseId: string): BuildingInstance {
  const list = state.instances.get(baseId) ?? [];
  state.instances.set(baseId, list);
  const k = list.length + 1;
  const instance: BuildingInstance = { baseId, instance: k, rally: undefined, order: null, paid: [], busyUntil: null };
  if (isVillagerProducer(state, baseId)) {
    const held = state.heldRallies.get(baseId);
    const fallback = state.order.start?.rally;
    instance.rally = held?.get(k) ?? state.rallyDefaults.get(baseId) ?? (fallback === undefined ? undefined : { node: fallback });
    held?.delete(k);
    instance.order = { step: null, unit: VILLAGER, remaining: null };
  }
  list.push(instance);
  state.buildings.set(baseId, (state.buildings.get(baseId) ?? 0) + 1);
  const supply = state.data.supply.get(baseId)?.value ?? 0;
  const provided = state.rules.supplyProvider?.(supply, { ...ruleContext(state), baseId }) ?? supply;
  state.supply = Math.min(state.supply + provided, state.data.base.maxPopCap.value);
  return instance;
}

export function triggerHolds(trigger: Trigger | undefined, state: EngineState): boolean {
  if (trigger === undefined) {
    return true;
  }
  switch (trigger.kind) {
    case 'time':
      return state.time >= trigger.seconds;
    case 'villagers':
      return aliveVillagers(state) >= trigger.count;
  }
}

function targetInstances(state: EngineState, baseId: string, instance: number | undefined): BuildingInstance[] {
  const list = state.instances.get(baseId) ?? [];
  if (instance === undefined) {
    return [...list];
  }
  const one = list[instance - 1];
  return one ? [one] : [];
}

// Last writer wins, so a baseId-wide write also overrides rallies held for unbuilt instances.
function writeRally(state: EngineState, baseId: string, instance: number | undefined, source: RallySource): void {
  const targets = targetInstances(state, baseId, instance);
  targets.forEach((target) => {
    target.rally = source;
  });
  if (instance === undefined) {
    state.rallyDefaults.set(baseId, source);
    state.heldRallies.delete(baseId);
  } else if (targets.length === 0) {
    const held = state.heldRallies.get(baseId) ?? new Map<number, RallySource>();
    state.heldRallies.set(baseId, held.set(instance, source));
  }
}

function markCompleted(state: EngineState, step: number): void {
  state.steps[step].completedAt = state.time;
  state.steps[step].status = 'completed';
}

function completeIfUncarried(state: EngineState, step: number | null): void {
  if (step === null || state.steps[step].completedAt !== null) {
    return;
  }
  for (const list of state.instances.values()) {
    if (list.some((instance) => instance.order?.step === step)) {
      return;
    }
  }
  markCompleted(state, step);
}

function spawnUnit(state: EngineState, entry: SnapshotEntry, at: BuildingInstance): void {
  const { spawns } = state as Engine;
  const record = spawns.get(entry.id) ?? { entry, times: [] };
  spawns.set(entry.id, record);
  record.times.push(state.time);
  if (entry.baseId !== VILLAGER) {
    return;
  }
  const rally = at.rally;
  const moveSpeedMultiplier = modifiedValue(1, 'moveSpeed', { baseId: entry.baseId, classes: entry.classes }, state);
  state.walking += 1;
  state.schedule(state.time + (rally.walkSeconds ?? state.inputs.walkSeconds) / moveSpeedMultiplier, (s) => {
    s.walking -= 1;
    s.gatherers[rally.node] += 1;
  });
}

function payUnit(state: EngineState, instance: BuildingInstance, entry: SnapshotEntry, order: ProductionOrder): void {
  const cost = costOf(entry, 1);
  for (const kind of RESOURCES) {
    state.resources[kind] = Math.max(0, state.resources[kind] - cost[kind]);
  }
  state.population += entry.costs.popcap;
  const last = order.remaining === 0;
  instance.paid.push({
    entry,
    complete(s, at) {
      spawnUnit(s, entry, at);
      if (last && at.order === order) {
        at.order = null;
        completeIfUncarried(s, order.step);
      }
    },
  });
}

// Tier choice by researched upgrades is not modeled yet: the lowest-age entry, when the current age has it.
function unitEntry(state: EngineState, unit: string): SnapshotEntry | undefined {
  const entry = state.data.byBaseId.get(unit)?.[0];
  return entry && entry.age <= state.age ? entry : undefined;
}

const produce: StepHandler<'produce'> = (step, index, state) => {
  const targets = targetInstances(state, step.producer, step.instance);
  const entry = unitEntry(state, step.unit);
  if (targets.length === 0 || !entry || state.population + targets.length * entry.costs.popcap > state.supply) {
    return { started: false };
  }
  const total = costOf(entry, targets.length);
  if (!affordable(state, total)) {
    return { started: false, reserve: total };
  }
  const replaced = targets.map((target) => target.order?.step ?? null);
  for (const target of targets) {
    const order: ProductionOrder = { step: index, unit: step.unit, remaining: step.count === undefined ? null : step.count - 1 };
    target.order = order;
    payUnit(state, target, entry, order);
  }
  if (step.rally !== undefined) {
    writeRally(state, step.producer, step.instance, { node: step.rally, walkSeconds: step.walkSeconds });
  }
  replaced.forEach((old) => completeIfUncarried(state, old));
  return { started: true };
};

const pause: StepHandler<'pause'> = (step, index, state) => {
  const targets = targetInstances(state, step.producer, step.instance);
  const replaced = targets.map((target) => target.order?.step ?? null);
  targets.forEach((target) => {
    target.order = null;
  });
  replaced.forEach((old) => completeIfUncarried(state, old));
  markCompleted(state, index);
  return { started: true };
};

const rally: StepHandler<'rally'> = (step, index, state) => {
  writeRally(state, step.producer, step.instance, { node: step.to, walkSeconds: step.walkSeconds });
  markCompleted(state, index);
  return { started: true };
};

export const stepHandlers: { [A in BuildStep['action']]?: StepHandler<A> } = { produce, pause, rally };

function offerSteps(engine: Engine): void {
  engine.reserve = undefined;
  while (engine.cursor < engine.order.steps.length) {
    const step = engine.order.steps[engine.cursor];
    const timing = engine.steps[engine.cursor];
    if (timing.armedAt === null) {
      if (!triggerHolds(step.trigger, engine)) {
        return;
      }
      timing.armedAt = engine.time;
    }
    const handler = stepHandlers[step.action] as StepHandler | undefined;
    const outcome: StepStart = handler ? handler(step, engine.cursor, engine) : { started: false };
    if ('reserve' in outcome || outcome.started !== true) {
      engine.reserve = 'reserve' in outcome ? outcome.reserve : undefined;
      return;
    }
    timing.startedAt = engine.time;
    timing.waitSeconds = timing.startedAt - timing.armedAt;
    engine.cursor += 1;
  }
}

function applyDueEvents(engine: Engine): void {
  while (engine.events.length > 0 && engine.events[0].time <= engine.time) {
    engine.events.shift().apply(engine);
  }
}

// Under a reserve, an order payment must leave each resource the unit costs at or above the reserved amount.
function orderNeed(cost: Resources, reserve: Readonly<Resources> | undefined): Resources {
  const need = { ...cost };
  for (const kind of RESOURCES) {
    if (reserve && cost[kind] > 0) {
      need[kind] += reserve[kind];
    }
  }
  return need;
}

function payOrder(engine: Engine, instance: BuildingInstance): void {
  const order = instance.order;
  const entry = unitEntry(engine, order.unit);
  if (!entry || engine.population + entry.costs.popcap > engine.supply) {
    return;
  }
  const need = orderNeed(costOf(entry, 1), engine.reserve);
  if (!affordable(engine, need)) {
    engine.needs.push(need);
    return;
  }
  order.remaining = order.remaining === null ? null : order.remaining - 1;
  payUnit(engine, instance, entry, order);
}

function startHead(engine: Engine, instance: BuildingInstance): void {
  const item = instance.paid[0];
  const { entry } = item;
  const producer = instance.baseId;
  const speed = modifiedValue(1, 'productionSpeed', { baseId: entry.baseId, classes: entry.classes, producer }, engine);
  const seconds = entry.costs.time / speed;
  const modified = engine.rules.productionModifier?.(seconds, { ...ruleContext(engine), entry, producer }) ?? seconds;
  instance.busyUntil = engine.time + modified;
  engine.schedule(instance.busyUntil, (s) => {
    instance.paid.shift();
    item.complete(s, instance);
    instance.busyUntil = null;
  });
}

function startProduction(engine: Engine): void {
  engine.needs = [];
  for (const list of engine.instances.values()) {
    for (const instance of list) {
      if (instance.busyUntil !== null) {
        continue;
      }
      if (instance.paid.length === 0 && instance.order && instance.order.remaining !== 0) {
        payOrder(engine, instance);
      }
      if (instance.paid.length > 0) {
        startHead(engine, instance);
      }
    }
  }
}

function runInstant(engine: Engine): void {
  offerSteps(engine);
  applyDueEvents(engine);
  offerSteps(engine);
  startProduction(engine);
}

// Only gather.ts picks the walk, so a drop-off override hands it the other walk under the name it reads.
function tripView(inputs: SimInputs, node: GatherNodeId, hasDropOff: boolean): SimInputs {
  const trip = inputs.trips[node];
  const walk = hasDropOff ? { walkSecondsTownCenter: trip.walkSecondsCamp } : { walkSecondsCamp: trip.walkSecondsTownCenter };
  return { ...inputs, trips: { ...inputs.trips, [node]: { ...trip, ...walk } } };
}

function nodeRate(engine: Engine, node: GatherNodeId): number {
  const ctx = { ...ruleContext(engine), node };
  const byDefault = engine.data.base.gatherNodes[node].dropOffs.some((baseId) => hasBuilding(engine, baseId));
  const hasDropOff = engine.rules.dropOffRule?.(byDefault, ctx) ?? byDefault;
  const inputs = hasDropOff === byDefault ? engine.inputs : tripView(engine.inputs, node, hasDropOff);
  const rate = effectiveGatherRate(node, engine, inputs);
  return engine.rules.gatherRateModifier?.(rate, ctx) ?? rate;
}

function incomePerSecond(engine: Engine): Resources {
  const income = { food: 0, wood: 0, gold: 0, stone: 0 };
  for (const node of Object.keys(engine.gatherers) as GatherNodeId[]) {
    if (engine.gatherers[node] > 0) {
      income[engine.data.base.gatherNodes[node].resource] += engine.gatherers[node] * nodeRate(engine, node);
    }
  }
  return income;
}

function affordableAt(engine: Engine, need: Readonly<Resources>, income: Resources): number {
  let at = engine.time;
  for (const kind of RESOURCES) {
    const shortfall = need[kind] - engine.resources[kind];
    if (shortfall > RESOURCE_TOLERANCE) {
      at = Math.max(at, engine.time + shortfall / income[kind]);
    }
  }
  return at;
}

// Events due now are handled by the caller; this is the next later time anything can change.
function nextWake(engine: Engine, income: Resources, nextSample: number): number {
  const candidates = [nextSample];
  if (engine.events.length > 0) {
    candidates.push(engine.events[0].time);
  }
  const trigger = engine.order.steps[engine.cursor]?.trigger;
  if (trigger?.kind === 'time' && engine.steps[engine.cursor].armedAt === null) {
    candidates.push(trigger.seconds);
  }
  const needs = engine.reserve ? [engine.reserve, ...engine.needs] : engine.needs;
  candidates.push(...needs.map((need) => affordableAt(engine, need, income)));
  return Math.min(...candidates.filter((time) => time > engine.time));
}

function sampleTimes(durationSeconds: number): number[] {
  const times: number[] = [];
  for (let t = 0; t <= durationSeconds; t += SAMPLE_SECONDS) {
    times.push(t);
  }
  if (times[times.length - 1] !== durationSeconds) {
    times.push(durationSeconds);
  }
  return times;
}

function createEngine(order: BuildOrder, data: GameData, inputs: SimInputs, rules: CivRules): Engine {
  const civStart = data.civData.startingState;
  const start = rules.startingState?.(civStart, { data, inputs, time: 0 }) ?? civStart;
  const gatherers = {} as Record<GatherNodeId, number>;
  for (const node of Object.keys(data.base.gatherNodes) as GatherNodeId[]) {
    gatherers[node] = 0;
  }
  Object.assign(gatherers, order.start?.villagers ?? start.villagers.value);
  const units = Object.values(start.units.value).reduce((sum, n) => sum + n, 0);
  const engine: Engine = {
    data,
    inputs,
    rules,
    order,
    time: 0,
    age: start.age.value,
    resources: { ...start.resources.value },
    buildings: new Map(),
    researched: new Set(),
    coverage: inputs.influenceCoverage,
    instances: new Map(),
    rallyDefaults: new Map(),
    heldRallies: new Map(),
    gatherers,
    walking: 0,
    population: 0,
    supply: 0,
    steps: order.steps.map((_, step) => ({ step, status: 'not-reached', armedAt: null, startedAt: null, completedAt: null, waitSeconds: 0 })),
    schedule(time, apply) {
      let i = engine.events.length;
      while (i > 0 && engine.events[i - 1].time > time) {
        i -= 1;
      }
      engine.events.splice(i, 0, { time, apply });
    },
    events: [],
    spawns: new Map(),
    cursor: 0,
    reserve: undefined,
    needs: [],
  };
  engine.population = aliveVillagers(engine) + units;
  start.buildings.value.forEach((baseId) => addBuildingInstance(engine, baseId));
  return engine;
}

function finalStatus(timing: StepTiming): StepTiming['status'] {
  if (timing.armedAt === null) {
    return 'not-reached';
  }
  if (timing.startedAt === null) {
    return 'waiting';
  }
  return timing.completedAt === null ? 'in-progress' : 'completed';
}

function unitSeries(engine: Engine, times: number[]): UnitSeries[] {
  const byFirstSpawn = [...engine.spawns.values()].sort(
    (a, b) => a.times[0] - b.times[0] || (a.entry.id < b.entry.id ? -1 : a.entry.id > b.entry.id ? 1 : 0),
  );
  return byFirstSpawn.map(({ entry, times: spawned }) => ({
    unitId: entry.id,
    baseId: entry.baseId,
    name: entry.name,
    tier: entry.age,
    counts: times.map((t) => spawned.filter((at) => at <= t).length),
  }));
}

export function simulateBuildOrder(order: BuildOrder, data: GameData, inputs: SimInputs, rules: CivRules = civRules(order.civ)): SimulationResult {
  const engine = createEngine(order, data, inputs, rules);
  const startAge = engine.age;
  const times = sampleTimes(inputs.durationSeconds);
  const gatherRates = { food: [], wood: [], gold: [], stone: [] } as Record<ResourceKind, number[]>;
  const floating = { food: [], wood: [], gold: [], stone: [] } as Record<ResourceKind, number[]>;
  let sample = 0;
  while (sample < times.length) {
    runInstant(engine);
    if (engine.events.length > 0 && engine.events[0].time <= engine.time) {
      continue;
    }
    const income = incomePerSecond(engine);
    for (; sample < times.length && times[sample] <= engine.time; sample += 1) {
      for (const kind of RESOURCES) {
        gatherRates[kind].push(income[kind] * SECONDS_PER_MINUTE);
        floating[kind].push(engine.resources[kind]);
      }
    }
    if (sample === times.length) {
      break;
    }
    const next = nextWake(engine, income, times[sample]);
    for (const kind of RESOURCES) {
      engine.resources[kind] += income[kind] * (next - engine.time);
    }
    engine.time = next;
  }
  engine.steps.forEach((timing) => {
    timing.status = finalStatus(timing);
  });
  return {
    civ: order.civ,
    durationSeconds: inputs.durationSeconds,
    sampleSeconds: SAMPLE_SECONDS,
    times,
    unitsProduced: unitSeries(engine, times),
    gatherRates,
    floating,
    steps: engine.steps,
    ages: [{ age: startAge, reachedAt: 0 }],
    notes: [],
  };
}
