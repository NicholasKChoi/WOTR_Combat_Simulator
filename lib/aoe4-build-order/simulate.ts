import { civRules } from './civ-rules';
import type { CivRuleContext, CivRules } from './civ-rules';
import { constructionSeconds } from './construction';
import type { GameData, SnapshotEntry } from './data';
import { addIdleArrival, createNodeStock, depletionResults, drawDown, farmIdleWarnings, isDepleted, nextRunOut, recordIdleArrival, recordRunOut, runRefs, sortWarnings } from './depletion';
import type { IdleArrival, NodeStock } from './depletion';
import { hasBuilding, modifiedValue } from './effects';
import type { EffectState } from './effects';
import type { Resources } from './engine-common';
import { HOUSE_ID, RESOURCE_TOLERANCE, VILLAGER_ID, canAfford, costOf, markCompleted, payCost, recordUnits, villagerWalkSeconds } from './engine-common';
import { formatMinSec } from './format-time';
import { effectiveGatherRate } from './gather';
import { planAutoHouse } from './houses';
import type { HouseDemand } from './houses';
import { isLandmark } from './landmarks';
import { ageMarker, compareMarkers } from './markers';
import { FINITE_NODE_REFS, NODE_REFS, RESOURCE_KINDS, nodeKindOf } from './model';
import { productionBuildingSeries } from './production-buildings';
import type { BuildOrder, BuildStep, ChartMarker, FiniteNodeRef, GatherNodeId, NodeRef, ResourceKind, SimInputs, SimulationResult, SimWarning, SpendCategory, StepTiming, StepWait, Trigger, UnitSeries } from './model';
import { researchHandler, researchNotes, resolveUnitEntry } from './research';

// Output resolution, not a game number.
export const SAMPLE_SECONDS = 5;

const SECONDS_PER_MINUTE = 60;

export interface RallySource {
  node: NodeRef;
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

interface UnitChange {
  time: number;
  delta: number;
}

interface SpawnedUnits {
  entry: SnapshotEntry;
  held: number;
  changes: UnitChange[];
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
  readonly researchedIds: Set<string>;
  readonly markers: ChartMarker[];
  readonly coverage: Readonly<Record<string, number>>;
  // baseId -> instances; instance k at index k - 1.
  readonly instances: Map<string, BuildingInstance[]>;
  // baseId-wide default rally for instances built later.
  readonly rallyDefaults: Map<string, RallySource>;
  // baseId -> instance k not yet built -> rally.
  readonly heldRallies: Map<string, Map<number, RallySource>>;
  readonly gatherers: Record<NodeRef, number>;
  // Alive at a depleted ref, or at a building-created node with every slot taken, gathering nothing. A step moves
  // them on; at a building-created node a newly built slot also takes them.
  readonly idle: Record<NodeRef, number>;
  // Villagers that arrived, or started, at a building-created node with no free slot.
  farmIdle: IdleArrival | null;
  readonly stock: NodeStock;
  // Villagers alive and walking, gathering nothing.
  walking: number;
  // Alive villagers and units plus the popcap reserved by paid items.
  population: number;
  // Capped at data.base.maxPopCap.
  supply: number;
  readonly steps: StepTiming[];
  // Resources paid so far, summed over the four kinds.
  readonly spent: Record<SpendCategory, number>;
  // Popcap of spawned, living villagers and units; paid units still in production are in population only.
  spawnedPopulation: number;
  // Unit entry id -> spawned units at that entry's tier; starting units are not in it. changes is in time
  // order, so the units at time t are the sum of the deltas at or before t.
  readonly spawned: Map<string, SpawnedUnits>;
  // Events run in (time, insertion) order.
  schedule(time: number, apply: (state: EngineState) => void): void;
}

export type StepStart =
  | { started: true }
  | { started: false; waitingOn: StepWait; reserve?: Readonly<Record<ResourceKind, number>> };

export type StepHandler<A extends BuildStep['action'] = BuildStep['action']> = (
  step: Extract<BuildStep, { action: A }>,
  index: number,
  state: EngineState,
) => StepStart;


interface ScheduledEvent {
  time: number;
  apply(state: EngineState): void;
}

interface Engine extends EngineState {
  readonly gathered: Resources;
  // Instant spawnedPopulation first reached data.base.maxPopCap.
  populationCapReachedAt: number | null;
  // Sorted by time; ties keep schedule order.
  readonly events: ScheduledEvent[];
  // First non-reaction step not yet started; every earlier non-reaction step has started.
  cursor: number;
  // What the armed cursor step waits to afford, when it waits on resources alone.
  reserve: Readonly<Resources> | undefined;
  // What armed reactions wait to afford; a wake time only, never reserved.
  reactionNeeds: Readonly<Resources>[];
  // Order payments and auto-houses short of resources at the latest instant.
  needs: Resources[];
  // Buildings under construction, explicit or auto.
  readonly constructing: { baseId: string; completesAt: number }[];
  readonly ages: SimulationResult['ages'];
  // Run refs that ran out this instant, recorded once the instant ends.
  readonly runOuts: FiniteNodeRef[];
  // Auto-house fallback candidates: every node ref but the deposits the order never names.
  readonly houseSources: readonly NodeRef[];
}

function ruleContext(state: EngineState): CivRuleContext {
  return { data: state.data, inputs: state.inputs, time: state.time };
}

function aliveVillagers(state: EngineState): number {
  return NODE_REFS.reduce((sum, ref) => sum + state.gatherers[ref] + state.idle[ref], state.walking);
}

// The default villager order (step null) pays only while fewer than data.base.villagerTarget villagers are alive or
// paid for; a produce step's villager order is not capped.
function defaultVillagersDone(state: EngineState, order: ProductionOrder): boolean {
  if (order.step !== null || order.unit !== VILLAGER_ID) {
    return false;
  }
  let paid = 0;
  for (const list of state.instances.values()) {
    for (const instance of list) {
      paid += instance.paid.filter((item) => item.entry.baseId === VILLAGER_ID).length;
    }
  }
  return aliveVillagers(state) + paid >= state.data.base.villagerTarget.value;
}

// farm, wood and refs the order never names have no stock and never run out.
function isDry(state: EngineState, ref: NodeRef): boolean {
  return isDepleted(state.stock, ref as FiniteNodeRef);
}

function createdByOf(state: EngineState, ref: NodeRef): string | undefined {
  return state.data.base.gatherNodes[nodeKindOf(ref)].createdBy;
}

// One gatherer per built instance of the node's createdBy building; Infinity for a node no building creates.
function slotsAt(state: EngineState, ref: NodeRef): number {
  const createdBy = createdByOf(state, ref);
  return createdBy === undefined ? Infinity : (state.buildings.get(createdBy) ?? 0);
}

function availableAt(state: EngineState, ref: NodeRef): number {
  return state.gatherers[ref] + state.idle[ref];
}

function waitForSlot(state: EngineState, ref: NodeRef, count: number): void {
  if (count > 0) {
    state.idle[ref] += count;
    state.farmIdle = addIdleArrival(state.farmIdle, state.time, count);
  }
}

// Every arrival at a ref goes through here.
export function assignGatherers(state: EngineState, ref: NodeRef, count: number): void {
  if (isDry(state, ref)) {
    state.idle[ref] += count;
    recordIdleArrival(state.stock, ref as FiniteNodeRef, state.time, count);
    return;
  }
  const fits = Math.min(count, slotsAt(state, ref) - state.gatherers[ref]);
  state.gatherers[ref] += fits;
  waitForSlot(state, ref, count - fits);
}

// Gatherers first, then idle ones; at a building-created node idle ones first, so a villager idles there only while
// every slot is taken.
function sendWalking(state: EngineState, ref: NodeRef, count: number): void {
  const fromIdle = createdByOf(state, ref) === undefined ? count - Math.min(count, state.gatherers[ref]) : Math.min(count, state.idle[ref]);
  state.idle[ref] -= fromIdle;
  state.gatherers[ref] -= count - fromIdle;
  state.walking += count;
}

function fillSlots(state: EngineState, baseId: string): void {
  for (const ref of NODE_REFS) {
    if (createdByOf(state, ref) === baseId) {
      const promoted = Math.min(state.idle[ref], slotsAt(state, ref) - state.gatherers[ref]);
      state.idle[ref] -= promoted;
      state.gatherers[ref] += promoted;
    }
  }
}

// Runs once the starting buildings are added, so the slots are the starting instances.
function capStartGatherers(state: EngineState): void {
  for (const ref of NODE_REFS) {
    const excess = Math.max(0, state.gatherers[ref] - slotsAt(state, ref));
    state.gatherers[ref] -= excess;
    waitForSlot(state, ref, excess);
  }
}

function isVillagerProducer(state: EngineState, baseId: string): boolean {
  const byDefault = (state.data.byBaseId.get(VILLAGER_ID) ?? []).some((entry) => entry.producedBy.includes(baseId));
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
    instance.order = { step: null, unit: VILLAGER_ID, remaining: null };
  }
  list.push(instance);
  state.buildings.set(baseId, (state.buildings.get(baseId) ?? 0) + 1);
  state.supply = Math.min(state.supply + supplyOf(state, baseId), state.data.base.maxPopCap.value);
  return instance;
}

function supplyOf(state: EngineState, baseId: string): number {
  const supply = state.data.supply.get(baseId)?.value ?? 0;
  return state.rules.supplyProvider?.(supply, { ...ruleContext(state), baseId }) ?? supply;
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
    case 'depleted':
      return isDepleted(state.stock, trigger.node);
    case 'bank':
      return state.resources[trigger.resource] + RESOURCE_TOLERANCE >= trigger.atLeast;
  }
}

// The next instant the trigger can start to hold on its own; null when only another event can make it hold.
export function triggerWakeAt(trigger: Trigger | undefined, state: EngineState, income: Readonly<Resources>): number | null {
  switch (trigger?.kind) {
    case 'time':
      return trigger.seconds;
    case 'bank': {
      const shortfall = trigger.atLeast - state.resources[trigger.resource];
      const perSecond = income[trigger.resource];
      return perSecond > 0 && shortfall > RESOURCE_TOLERANCE ? state.time + shortfall / perSecond : null;
    }
    default:
      return null;
  }
}

function isReaction(step: BuildStep): boolean {
  return step.reaction === true;
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

function noteCapReached(engine: Engine): void {
  if (engine.populationCapReachedAt === null && engine.spawnedPopulation >= engine.data.base.maxPopCap.value) {
    engine.populationCapReachedAt = engine.time;
  }
}

function spawnUnit(state: EngineState, entry: SnapshotEntry, at: BuildingInstance): void {
  const resolved = resolveUnitEntry(entry.baseId, state);
  recordUnits(state, resolved && resolved.age >= entry.age ? resolved : entry, 1);
  state.spawnedPopulation += entry.costs.popcap;
  noteCapReached(state as Engine);
  if (entry.baseId !== VILLAGER_ID) {
    return;
  }
  const rally = at.rally;
  if (!rally) {
    throw new Error(`building "${at.baseId}" instance ${at.instance} spawned a villager but has no rally`);
  }
  const moveSpeedMultiplier = modifiedValue(1, 'moveSpeed', { baseId: entry.baseId, classes: entry.classes }, state);
  state.walking += 1;
  state.schedule(state.time + (rally.walkSeconds ?? state.inputs.walkSeconds) / moveSpeedMultiplier, (s) => {
    s.walking -= 1;
    assignGatherers(s, rally.node, 1);
  });
}

function payUnit(state: EngineState, instance: BuildingInstance, entry: SnapshotEntry, order: ProductionOrder): void {
  payCost(state, costOf(entry, 1), entry.baseId === VILLAGER_ID ? 'villagers' : 'military');
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

const produce: StepHandler<'produce'> = (step, index, state) => {
  const targets = targetInstances(state, step.producer, step.instance);
  const entry = resolveUnitEntry(step.unit, state);
  if (targets.length === 0 || !entry || entry.age > state.age) {
    return { started: false, waitingOn: 'prerequisite' };
  }
  if (state.population + targets.length * entry.costs.popcap > state.supply) {
    return { started: false, waitingOn: 'population' };
  }
  const total = costOf(entry, targets.length);
  if (!canAfford(state.resources, total)) {
    return { started: false, waitingOn: 'resources', reserve: total };
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

interface Construction {
  entry: SnapshotEntry;
  builders: number;
  from: NodeRef;
  then: NodeRef;
  walkSeconds: number | undefined;
  // null for an auto-house.
  step: number | null;
}

function startConstruction(state: EngineState, job: Construction): void {
  payCost(state, costOf(job.entry, 1), 'buildings');
  sendWalking(state, job.from, job.builders);
  const done = state.time + villagerWalkSeconds(state, job.walkSeconds ?? state.inputs.walkSeconds) + constructionSeconds(job.entry.costs.time, job.builders, state.data);
  (state as Engine).constructing.push({ baseId: job.entry.baseId, completesAt: done });
  state.schedule(done, (s) => completeConstruction(s, job, done));
}

function completeConstruction(state: EngineState, job: Construction, completesAt: number): void {
  const { constructing, ages } = state as Engine;
  const { entry } = job;
  constructing.splice(constructing.findIndex((item) => item.baseId === entry.baseId && item.completesAt === completesAt), 1);
  const built = addBuildingInstance(state, entry.baseId);
  fillSlots(state, entry.baseId);
  state.rules.onBuildingComplete?.(state, { ...ruleContext(state), baseId: entry.baseId, instance: built.instance });
  if (entry.age === state.age && isLandmark(entry)) {
    state.age += 1;
    ages.push({ age: state.age, reachedAt: state.time });
    state.markers.push(ageMarker(state.age, state.time));
    state.rules.onAgeAdvance?.(state, { ...ruleContext(state), age: state.age });
  }
  if (job.step !== null) {
    markCompleted(state, job.step);
  }
  const arrive = (s: EngineState) => {
    s.walking -= job.builders;
    assignGatherers(s, job.then, job.builders);
  };
  if (state.data.base.gatherNodes[nodeKindOf(job.then)].createdBy === entry.baseId) {
    arrive(state);
  } else {
    state.schedule(state.time + villagerWalkSeconds(state, job.walkSeconds ?? state.inputs.walkSeconds), arrive);
  }
}

const build: StepHandler<'build'> = (step, index, state) => {
  const entry = state.data.byBaseId.get(step.building)?.[0];
  const builders = step.builders ?? 1;
  if (!entry || entry.age > state.age) {
    return { started: false, waitingOn: 'prerequisite' };
  }
  if (availableAt(state, step.from) < builders) {
    return { started: false, waitingOn: 'villagers' };
  }
  const cost = costOf(entry, 1);
  if (!canAfford(state.resources, cost)) {
    return { started: false, waitingOn: 'resources', reserve: cost };
  }
  startConstruction(state, { entry, builders, from: step.from, then: step.then ?? step.from, walkSeconds: step.walkSeconds, step: index });
  return { started: true };
};

const move: StepHandler<'move'> = (step, index, state) => {
  const available = availableAt(state, step.from);
  const count = step.count === 'all' ? available : step.count;
  if (available < count) {
    return { started: false, waitingOn: 'villagers' };
  }
  if (count === 0) {
    markCompleted(state, index);
    return { started: true };
  }
  sendWalking(state, step.from, count);
  state.schedule(state.time + villagerWalkSeconds(state, step.walkSeconds ?? state.inputs.walkSeconds), (s) => {
    s.walking -= count;
    assignGatherers(s, step.to, count);
    markCompleted(s, index);
  });
  return { started: true };
};

export const stepHandlers: { [A in BuildStep['action']]?: StepHandler<A> } = { produce, pause, rally, research: researchHandler, build, move };

// Arms the step if its trigger holds, then tries to start it; null while it stays unarmed.
function offerStep(engine: Engine, index: number): StepStart | null {
  const step = engine.order.steps[index];
  const timing = engine.steps[index];
  if (timing.armedAt === null) {
    if (!triggerHolds(step.trigger, engine)) {
      return null;
    }
    timing.armedAt = engine.time;
  }
  const handler = stepHandlers[step.action] as StepHandler | undefined;
  const outcome: StepStart = handler ? handler(step, index, engine) : { started: false, waitingOn: 'prerequisite' };
  if (outcome.started === false) {
    timing.waitingOn = outcome.waitingOn;
    return outcome;
  }
  timing.waitingOn = null;
  timing.startedAt = engine.time;
  timing.waitSeconds = timing.startedAt - timing.armedAt;
  return outcome;
}

function offerReactions(engine: Engine): void {
  engine.reactionNeeds = [];
  engine.order.steps.forEach((step, index) => {
    if (!isReaction(step) || engine.steps[index].startedAt !== null) {
      return;
    }
    const outcome = offerStep(engine, index);
    if (outcome?.started === false && outcome.reserve) {
      engine.reactionNeeds.push(outcome.reserve);
    }
  });
}

function offerSteps(engine: Engine): void {
  engine.reserve = undefined;
  offerReactions(engine);
  const steps = engine.order.steps;
  for (; engine.cursor < steps.length; engine.cursor += 1) {
    if (isReaction(steps[engine.cursor])) {
      continue;
    }
    const outcome = offerStep(engine, engine.cursor);
    if (outcome === null) {
      return;
    }
    if (outcome.started === false) {
      engine.reserve = outcome.reserve;
      return;
    }
  }
}

function applyDueEvents(engine: Engine): void {
  while (engine.events.length > 0 && engine.events[0].time <= engine.time) {
    engine.events.shift()!.apply(engine);
  }
}

// Under a reserve, an order payment must leave each resource the unit costs at or above the reserved amount.
// Villager payments ignore the reserve: a player keeps the Town Center busy while saving for a step.
function orderNeed(cost: Resources, reserve: Readonly<Resources> | undefined): Resources {
  const need = { ...cost };
  for (const kind of RESOURCE_KINDS) {
    if (reserve && cost[kind] > 0) {
      need[kind] += reserve[kind];
    }
  }
  return need;
}

function payOrder(engine: Engine, instance: BuildingInstance): void {
  const order = instance.order!;
  const entry = resolveUnitEntry(order.unit, engine);
  if (!entry || entry.age > engine.age || defaultVillagersDone(engine, order) || engine.population + entry.costs.popcap > engine.supply) {
    return;
  }
  const need = orderNeed(costOf(entry, 1), entry.baseId === VILLAGER_ID ? undefined : engine.reserve);
  if (!canAfford(engine.resources, need)) {
    engine.needs.push(need);
    return;
  }
  order.remaining = order.remaining === null ? null : order.remaining - 1;
  payUnit(engine, instance, entry, order);
}

function productionSeconds(state: EngineState, entry: SnapshotEntry, producer: string): number {
  const speed = modifiedValue(1, 'productionSpeed', { baseId: entry.baseId, classes: entry.classes, producer }, state);
  const base = entry.costs.time / speed;
  const seconds = state.rules.productionModifier?.(base, { ...ruleContext(state), entry, producer }) ?? base;
  if (entry.type === 'unit' && !(Number.isFinite(seconds) && seconds > 0)) {
    throw new Error(`production time for "${entry.baseId}" at "${producer}" must be a positive finite number, got ${seconds}`);
  }
  return seconds;
}

function startHead(engine: Engine, instance: BuildingInstance): void {
  const item = instance.paid[0];
  instance.busyUntil = engine.time + productionSeconds(engine, item.entry, instance.baseId);
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
      if (instance.order === null && isVillagerProducer(engine, instance.baseId)) {
        instance.order = { step: null, unit: VILLAGER_ID, remaining: null };
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

function houseDemand(engine: Engine): HouseDemand {
  const pending = engine.constructing.map(({ baseId, completesAt }) => ({ supply: supplyOf(engine, baseId), completesAt }));
  let populationPerSecond = 0;
  for (const list of engine.instances.values()) {
    for (const instance of list) {
      const order = instance.order;
      const entry = order && order.remaining !== 0 ? resolveUnitEntry(order.unit, engine) : undefined;
      if (entry && !defaultVillagersDone(engine, order!)) {
        populationPerSecond += entry.costs.popcap / productionSeconds(engine, entry, instance.baseId);
      }
    }
  }
  return { pending, populationPerSecond };
}

// The source is picked by gatherers only; at a building-created node, startConstruction takes waiting idle villagers first.
function houseBuilderSource(engine: Engine): NodeRef | undefined {
  const { gatherers, inputs } = engine;
  if (gatherers[inputs.houseBuilderSource] >= inputs.houseBuilders) {
    return inputs.houseBuilderSource;
  }
  const fullest = engine.houseSources.reduce((best, ref) => (gatherers[ref] > gatherers[best] ? ref : best));
  return gatherers[fullest] >= inputs.houseBuilders ? fullest : undefined;
}

// Not an order payment: a waiting step's reserve does not hold houses back.
function startAutoHouses(engine: Engine): void {
  const house = engine.data.byBaseId.get(HOUSE_ID)?.[0];
  if (!engine.inputs.autoHouses || !house) {
    return;
  }
  const cost = costOf(house, 1);
  const count = planAutoHouse(engine, engine.inputs, engine.data, houseDemand(engine));
  for (let i = 0; i < count; i += 1) {
    const from = houseBuilderSource(engine);
    if (from === undefined) {
      return;
    }
    if (!canAfford(engine.resources, cost)) {
      engine.needs.push(cost);
      return;
    }
    startConstruction(engine, { entry: house, builders: engine.inputs.houseBuilders, from, then: from, walkSeconds: undefined, step: null });
  }
}

// Runs before anything else in the instant, so steps and arrivals at this instant already see the ref dry.
function collectRunOuts(engine: Engine): void {
  for (const ref of FINITE_NODE_REFS) {
    if (isDepleted(engine.stock, ref) && engine.stock.get(ref)!.depletedAt === null && !engine.runOuts.includes(ref)) {
      engine.idle[ref] += engine.gatherers[ref];
      engine.gatherers[ref] = 0;
      engine.runOuts.push(ref);
    }
  }
}

function recordRunOuts(engine: Engine): void {
  for (const ref of engine.runOuts) {
    recordRunOut(engine.stock, ref, engine.time, engine.idle[ref]);
  }
  engine.runOuts.length = 0;
}

function runInstant(engine: Engine): void {
  collectRunOuts(engine);
  offerSteps(engine);
  applyDueEvents(engine);
  // A step refused for supply in the first pass is offered again after this instant's houses complete.
  offerSteps(engine);
  startProduction(engine);
  startAutoHouses(engine);
}

// Only gather.ts picks the walk, so a drop-off override hands it the other walk under the name it reads.
function tripView(inputs: SimInputs, node: GatherNodeId, hasDropOff: boolean): SimInputs {
  const trip = inputs.trips[node];
  const walk = hasDropOff ? { walkSecondsTownCenter: trip.walkSecondsCamp } : { walkSecondsCamp: trip.walkSecondsTownCenter };
  return { ...inputs, trips: { ...inputs.trips, [node]: { ...trip, ...walk } } };
}

function nodeRate(engine: Engine, ref: NodeRef): number {
  const node = nodeKindOf(ref);
  const ctx = { ...ruleContext(engine), node };
  const byDefault = engine.data.base.gatherNodes[node].dropOffs.some((baseId) => hasBuilding(engine, baseId));
  const hasDropOff = engine.rules.dropOffRule?.(byDefault, ctx) ?? byDefault;
  const inputs = hasDropOff === byDefault ? engine.inputs : tripView(engine.inputs, node, hasDropOff);
  const rate = effectiveGatherRate(node, engine, inputs);
  return engine.rules.gatherRateModifier?.(rate, ctx) ?? rate;
}

type RefRate = (ref: NodeRef) => number;

// Per-villager rate of each ref someone gathers.
function gatherRatesOf(engine: Engine): RefRate {
  const rates = new Map<NodeRef, number>();
  for (const ref of NODE_REFS) {
    if (engine.gatherers[ref] > 0) {
      rates.set(ref, nodeRate(engine, ref));
    }
  }
  return (ref) => rates.get(ref) ?? 0;
}

function hasStock(engine: Engine, ref: NodeRef): boolean {
  return (engine.stock.get(ref as FiniteNodeRef)?.remaining ?? null) !== null;
}

function incomePerSecond(engine: Engine, rateOf: RefRate, include: (ref: NodeRef) => boolean = () => true): Resources {
  const income = { food: 0, wood: 0, gold: 0, stone: 0 };
  for (const ref of NODE_REFS) {
    if (engine.gatherers[ref] > 0 && include(ref)) {
      income[engine.data.base.gatherNodes[nodeKindOf(ref)].resource] += engine.gatherers[ref] * rateOf(ref);
    }
  }
  return income;
}

function gathererCounts(engine: Engine): Resources {
  const counts = { food: 0, wood: 0, gold: 0, stone: 0 };
  for (const ref of NODE_REFS) {
    if (engine.gatherers[ref] > 0) {
      counts[engine.data.base.gatherNodes[nodeKindOf(ref)].resource] += engine.gatherers[ref];
    }
  }
  return counts;
}

// A stocked ref pays only what it still holds.
function creditIncome(engine: Engine, rateOf: RefRate, seconds: number): void {
  const unstocked = incomePerSecond(engine, rateOf, (ref) => !hasStock(engine, ref));
  for (const kind of RESOURCE_KINDS) {
    engine.resources[kind] += unstocked[kind] * seconds;
    engine.gathered[kind] += unstocked[kind] * seconds;
  }
  const drawn = drawDown(engine.stock, engine.gatherers, rateOf, seconds);
  for (const ref of engine.stock.keys()) {
    const kind = engine.data.base.gatherNodes[nodeKindOf(ref)].resource;
    engine.resources[kind] += drawn[ref] ?? 0;
    engine.gathered[kind] += drawn[ref] ?? 0;
  }
}

function affordableAt(engine: Engine, need: Readonly<Resources>, income: Resources): number {
  let at = engine.time;
  for (const kind of RESOURCE_KINDS) {
    const shortfall = need[kind] - engine.resources[kind];
    if (shortfall > RESOURCE_TOLERANCE) {
      at = Math.max(at, engine.time + shortfall / income[kind]);
    }
  }
  return at;
}

// Events due now are handled by the caller; this is the next later time anything can change.
function nextWake(engine: Engine, income: Resources, rateOf: RefRate, nextSample: number): number {
  const candidates = [nextSample];
  const runOut = nextRunOut(engine.stock, engine.gatherers, rateOf, engine.time);
  if (runOut !== null) {
    candidates.push(runOut);
  }
  if (engine.events.length > 0) {
    candidates.push(engine.events[0].time);
  }
  const triggerWake = engine.steps[engine.cursor]?.armedAt === null ? triggerWakeAt(engine.order.steps[engine.cursor].trigger, engine, income) : null;
  if (triggerWake !== null) {
    candidates.push(triggerWake);
  }
  const needs = [...(engine.reserve ? [engine.reserve] : []), ...engine.needs, ...engine.reactionNeeds];
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

function startUnitPopulation(data: GameData, units: Readonly<Record<string, number>>): number {
  let total = 0;
  for (const [baseId, count] of Object.entries(units)) {
    const entry = data.byBaseId.get(baseId)?.[0];
    if (!entry) {
      throw new Error(`startingState.units: "${baseId}" is not a unit baseId in the snapshot`);
    }
    total += count * entry.costs.popcap;
  }
  return total;
}

function createEngine(order: BuildOrder, data: GameData, inputs: SimInputs, rules: CivRules): Engine {
  const civStart = data.civData.startingState;
  const start = rules.startingState?.(civStart, { data, inputs, time: 0 }) ?? civStart;
  const gatherers = {} as Record<NodeRef, number>;
  const idle = {} as Record<NodeRef, number>;
  for (const ref of NODE_REFS) {
    gatherers[ref] = 0;
    idle[ref] = 0;
  }
  Object.assign(gatherers, order.start?.villagers ?? start.villagers.value);
  const runOrderRefs = runRefs(order);
  const named = new Set<NodeRef>(runOrderRefs);
  const units = Object.values(start.units.value).reduce((sum, n) => sum + n, 0);
  const engine: Engine = {
    data,
    inputs,
    rules,
    order,
    time: 0,
    age: start.age.value,
    resources: { ...start.resources.value },
    gathered: { food: 0, wood: 0, gold: 0, stone: 0 },
    buildings: new Map(),
    researched: new Set(),
    researchedIds: new Set(),
    coverage: inputs.influenceCoverage,
    instances: new Map(),
    rallyDefaults: new Map(),
    heldRallies: new Map(),
    gatherers,
    idle,
    farmIdle: null,
    stock: createNodeStock(runOrderRefs, inputs),
    walking: 0,
    population: 0,
    supply: 0,
    steps: order.steps.map((_, step) => ({ step, status: 'not-reached', armedAt: null, startedAt: null, completedAt: null, waitSeconds: 0, waitingOn: null, waitBreakdown: {} })),
    spent: { villagers: 0, military: 0, buildings: 0, research: 0 },
    spawnedPopulation: 0,
    populationCapReachedAt: null,
    schedule(time, apply) {
      let i = engine.events.length;
      while (i > 0 && engine.events[i - 1].time > time) {
        i -= 1;
      }
      engine.events.splice(i, 0, { time, apply });
    },
    events: [],
    spawned: new Map(),
    cursor: 0,
    reserve: undefined,
    reactionNeeds: [],
    needs: [],
    constructing: [],
    ages: [{ age: start.age.value, reachedAt: 0 }],
    runOuts: [],
    houseSources: NODE_REFS.filter((ref) => nodeKindOf(ref) === ref || named.has(ref)),
    markers: [],
  };
  engine.population = aliveVillagers(engine) + units;
  engine.spawnedPopulation = aliveVillagers(engine) + startUnitPopulation(data, start.units.value);
  noteCapReached(engine);
  start.buildings.value.forEach((baseId) => addBuildingInstance(engine, baseId));
  capStartGatherers(engine);
  return engine;
}

const BREAKDOWN_REASONS: readonly StepWait[] = ['resources', 'villagers', 'population', 'prerequisite'];

export function accrueWait(engine: Pick<Engine, 'steps'>, stepIndexes: readonly number[], seconds: number): void {
  for (const index of stepIndexes) {
    const timing = engine.steps[index];
    const reason = timing.waitingOn;
    if (reason !== null && BREAKDOWN_REASONS.includes(reason) && seconds > 0) {
      const key = reason as keyof StepTiming['waitBreakdown'];
      timing.waitBreakdown[key] = (timing.waitBreakdown[key] ?? 0) + seconds;
    }
  }
}

// The armed cursor step and every armed reaction not yet started.
function waitingSteps(engine: Engine): number[] {
  return engine.steps.filter((timing) => timing.armedAt !== null && timing.startedAt === null).map((timing) => timing.step);
}

function stepStuckWarning(timing: StepTiming, engine: Engine): SimWarning {
  const { waitingOn, armedAt } = timing;
  const action = engine.order.steps[timing.step].action;
  return {
    code: 'step-stuck',
    severity: 'warning',
    message: `step ${timing.step + 1} (${action}) was still waiting on ${waitingOn} at ${formatMinSec(engine.inputs.durationSeconds)}, from ${formatMinSec(armedAt!)}.`,
    step: timing.step,
    waitingOn: waitingOn!,
    at: armedAt!,
  };
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

// After all of an instant's changes, so a tier passed through within one instant is never held.
function firstHeldAt(changes: readonly UnitChange[]): number | undefined {
  let held = 0;
  for (const [i, change] of changes.entries()) {
    held += change.delta;
    if (held > 0 && changes[i + 1]?.time !== change.time) {
      return change.time;
    }
  }
  return undefined;
}

function unitSeries(engine: Engine, times: number[]): UnitSeries[] {
  const held = [...engine.spawned.values()].flatMap((record) => {
    const first = firstHeldAt(record.changes);
    return first === undefined ? [] : [{ ...record, first }];
  });
  const byFirstHeld = held.sort((a, b) => a.first - b.first || (a.entry.id < b.entry.id ? -1 : a.entry.id > b.entry.id ? 1 : 0));
  return byFirstHeld.map(({ entry, changes }) => ({
    unitId: entry.id,
    baseId: entry.baseId,
    name: entry.name,
    tier: entry.age,
    counts: times.map((t) => changes.reduce((sum, change) => (change.time <= t ? sum + change.delta : sum), 0)),
  }));
}

export function simulateBuildOrder(order: BuildOrder, data: GameData, inputs: SimInputs, rules: CivRules = civRules(order.civ)): SimulationResult {
  const engine = createEngine(order, data, inputs, rules);
  const times = sampleTimes(inputs.durationSeconds);
  const gatherRates = { food: [], wood: [], gold: [], stone: [] } as Record<ResourceKind, number[]>;
  const gatherers = { food: [], wood: [], gold: [], stone: [] } as Record<ResourceKind, number[]>;
  const floating = { food: [], wood: [], gold: [], stone: [] } as Record<ResourceKind, number[]>;
  const gathered = { food: [], wood: [], gold: [], stone: [] } as Record<ResourceKind, number[]>;
  const spent: Record<SpendCategory, number[]> = { villagers: [], military: [], buildings: [], research: [] };
  const spawnedPopulation: number[] = [];
  const buildingSamples: ReadonlyMap<string, number>[] = [];
  let sample = 0;
  while (sample < times.length) {
    runInstant(engine);
    if (engine.events.length > 0 && engine.events[0].time <= engine.time) {
      continue;
    }
    recordRunOuts(engine);
    const rateOf = gatherRatesOf(engine);
    const income = incomePerSecond(engine, rateOf);
    const counts = gathererCounts(engine);
    for (; sample < times.length && times[sample] <= engine.time; sample += 1) {
      for (const kind of RESOURCE_KINDS) {
        gatherRates[kind].push(income[kind] * SECONDS_PER_MINUTE);
        gatherers[kind].push(counts[kind]);
        floating[kind].push(engine.resources[kind]);
        gathered[kind].push(engine.gathered[kind]);
      }
      for (const category of Object.keys(spent) as SpendCategory[]) {
        spent[category].push(engine.spent[category]);
      }
      spawnedPopulation.push(engine.spawnedPopulation);
      buildingSamples.push(new Map(engine.buildings));
    }
    if (sample === times.length) {
      break;
    }
    const next = nextWake(engine, income, rateOf, times[sample]);
    creditIncome(engine, rateOf, next - engine.time);
    accrueWait(engine, waitingSteps(engine), next - engine.time);
    engine.time = next;
  }
  engine.steps.forEach((timing) => {
    timing.status = finalStatus(timing);
    if (timing.status === 'not-reached') {
      timing.waitingOn = timing.step === engine.cursor || isReaction(order.steps[timing.step]) ? 'trigger' : 'earlier-step';
    }
  });
  const nodeResults = depletionResults(engine.stock);
  const stuck = engine.steps.filter((timing) => timing.status === 'waiting').map((timing) => stepStuckWarning(timing, engine));
  const warnings = sortWarnings([...nodeResults.warnings, ...stuck, ...farmIdleWarnings(engine.farmIdle)]);
  const { depletions } = nodeResults;
  return {
    civ: order.civ,
    durationSeconds: inputs.durationSeconds,
    sampleSeconds: SAMPLE_SECONDS,
    times,
    unitsProduced: unitSeries(engine, times),
    productionBuildings: productionBuildingSeries(data, buildingSamples),
    gatherRates,
    gatherers,
    floating,
    gathered,
    spent,
    spawnedPopulation,
    populationCapReachedAt: engine.populationCapReachedAt,
    steps: engine.steps,
    ages: engine.ages,
    notes: researchNotes(order, data),
    depletions,
    warnings,
    markers: [...engine.markers].sort(compareMarkers),
  };
}
