import { z } from 'zod';
import type { GameData, SnapshotEntry } from './data';
import { classifyTech } from './effects';
import { VILLAGER_ID } from './engine-common';
import { FINITE_NODE_REFS, GATHER_NODES, MAX_DEPOSITS, NODE_REFS, RESOURCE_KINDS, nodeKindOf } from './model';
import type {
  BuildOrderIssue,
  BuildOrderLines,
  CivId,
  FiniteNodeRef,
  GatherNodeId,
  NodeRef,
  ResourceKind,
  SimInputs,
  TripInputs,
} from './model';
import { stepOptions, type StepOptions } from './step-options';

interface InputBound {
  readonly min: number;
  readonly max: number;
  readonly integer: boolean;
}

function bound(min: number, max: number, integer = true): InputBound {
  return Object.freeze({ min, max, integer });
}

// Request-size caps that keep every run bounded, not game numbers: the 200 caps are fixed here rather than read
// from maxPopCap so a data change cannot loosen them.
export const SIM_INPUT_BOUNDS = Object.freeze({
  textChars: bound(0, 20000),
  steps: bound(0, 200),
  durationSeconds: bound(60, 3600),
  triggerSeconds: bound(0, 3600),
  triggerCount: bound(1, 200),
  triggerAtLeast: bound(0, 100000),
  count: bound(1, 200),
  builders: bound(1, 200),
  houseBuilders: bound(1, 200),
  instance: bound(1, 200),
  walkSeconds: bound(0, 60, false),
  startVillagers: bound(0, 200),
  walkSecondsCamp: bound(0, 60, false),
  walkSecondsTownCenter: bound(0, 60, false),
  dropOffSeconds: bound(0, 30, false),
  influenceCoverage: bound(0, 1, false),
  nodeAmount: bound(0, 100000),
});

export type BoundKey = keyof typeof SIM_INPUT_BOUNDS;

export const INPUT_DEFAULTS = Object.freeze({
  durationSeconds: 1200,
  autoHouses: true,
  houseBuilders: 1,
  houseBuilderSource: 'wood' as GatherNodeId,
  influenceCoverage: Object.freeze({ mill: 1 }) as Readonly<Record<string, number>>,
});

const TRIP_FIELDS = ['walkSecondsCamp', 'walkSecondsTownCenter', 'dropOffSeconds'] as const;

export const OPTIONAL_STEP_FIELDS: Readonly<Record<BuildStep['action'], readonly string[]>> = {
  produce: ['instance', 'count', 'rally', 'walkSeconds'],
  rally: ['instance', 'walkSeconds'],
  pause: ['instance'],
  build: ['builders', 'then', 'walkSeconds'],
  research: ['at'],
  move: ['walkSeconds'],
};

export type IdKind = 'building' | 'unit' | 'tech' | 'node';

const ENTRY_TYPES: Record<Exclude<IdKind, 'node'>, readonly SnapshotEntry['type'][]> = {
  building: ['building'],
  unit: ['unit'],
  tech: ['technology', 'upgrade'],
};

export type Fields = Record<string, unknown>;

export interface Where {
  label: string;
  step?: number;
  line?: number;
}

export function isRecord(value: unknown): value is Fields {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function issue(code: BuildOrderIssue['code'], where: Where, text: string): BuildOrderIssue {
  const found: BuildOrderIssue = { code, message: `${where.label}: ${text}` };
  if (where.step !== undefined) found.step = where.step;
  if (where.line !== undefined) found.line = where.line;
  return found;
}

export function outOfRange(value: number, key: BoundKey): string | undefined {
  const { min, max, integer } = SIM_INPUT_BOUNDS[key];
  if (!Number.isFinite(value)) return `${value} is not a finite number`;
  if (integer && !Number.isInteger(value)) return `${value} is not an integer`;
  if (value < min || value > max) return `${value} is outside ${min}..${max}`;
  return undefined;
}

export function entriesOf(data: GameData, baseId: string, kind: Exclude<IdKind, 'node'>): readonly SnapshotEntry[] {
  return (data.byBaseId.get(baseId) ?? []).filter((e) => ENTRY_TYPES[kind].includes(e.type));
}

export interface NodeRefProblem {
  code: 'syntax' | 'unknown-id' | 'out-of-range' | 'invalid';
  reason: string;
}

const DEPOSIT_NUMBER = /^(0|[1-9][0-9]*)$/;

function isGatherNode(id: string): id is GatherNodeId {
  return (GATHER_NODES as readonly string[]).includes(id);
}

// Returns null for a valid ref. finiteOnly also rejects farm and wood, which never run dry.
export function nodeRefIssue(value: unknown, finiteOnly: boolean): NodeRefProblem | null {
  if (typeof value !== 'string') return { code: 'syntax', reason: 'node must be a string' };
  const [node, ...suffix] = value.split('#');
  if (!isGatherNode(node)) return { code: 'unknown-id', reason: `unknown node "${value}"` };
  if (suffix.length === 0) {
    const infinite = finiteOnly && (node === 'farm' || node === 'wood');
    return infinite ? { code: 'invalid', reason: `node "${value}" never runs out` } : null;
  }
  if (suffix.length > 1 || !DEPOSIT_NUMBER.test(suffix[0])) {
    return { code: 'syntax', reason: `node "${value}" is not a node or a numbered deposit such as gold#2` };
  }
  if (node !== 'gold') return { code: 'invalid', reason: `node "${value}": only gold has numbered deposits` };
  const deposit = Number(suffix[0]);
  if (deposit === 1) return { code: 'invalid', reason: `node "${value}": deposit 1 is written gold` };
  if (deposit < 1 || deposit > MAX_DEPOSITS) {
    return { code: 'out-of-range', reason: `node "${value}": deposit number is outside 2..${MAX_DEPOSITS}` };
  }
  return null;
}

type RejectedTech = { code: 'unsupported-tech' | 'unknown-tech-effect'; property: string };

export interface BuildOrderCatalog extends StepOptions {
  civ: CivId;
  startVillagerTotal: number;
  // The civ's starting split with the rally on its most-staffed node; inserted when a start is added in the table.
  defaultStart: BuildStart;
  // Starting buildings that produce villagers: start.rally is required when non-empty.
  startVillagerProducers: readonly string[];
  // Every tech baseId with an entry classifyTech rejects, with the first rejection by age.
  rejectedTechs: Readonly<Record<string, RejectedTech>>;
  // Every unit baseId, producible or not, so an unproducible unit reads "cannot produce" rather than unknown.
  units: readonly string[];
  // The inputs defaults that come from the data rather than INPUT_DEFAULTS.
  inputDefaults: Readonly<Pick<SimInputs, 'trips' | 'walkSeconds' | 'nodeAmounts'>>;
}

function rejectedTechsOf(data: GameData): Record<string, RejectedTech> {
  const rejected: Record<string, RejectedTech> = {};
  for (const baseId of data.byBaseId.keys()) {
    for (const entry of entriesOf(data, baseId, 'tech')) {
      const support = classifyTech(entry, data);
      if (support.kind === 'rejected') {
        rejected[baseId] = { code: support.code, property: support.property };
        break;
      }
    }
  }
  return rejected;
}

function inputDefaultsOf(data: GameData): BuildOrderCatalog['inputDefaults'] {
  const nodes = Object.entries(data.base.gatherNodes);
  return {
    trips: Object.fromEntries(
      nodes.map(([node, { trip }]) => [
        node,
        { walkSecondsCamp: trip.walkSecondsCamp.value, walkSecondsTownCenter: trip.walkSecondsTownCenter.value, dropOffSeconds: trip.dropOffSeconds.value },
      ]),
    ) as Record<GatherNodeId, TripInputs>,
    walkSeconds: data.base.walkSeconds.value,
    nodeAmounts: Object.fromEntries(
      FINITE_NODE_REFS.map((ref) => [ref, data.base.gatherNodes[nodeKindOf(ref)].amount?.value ?? null]),
    ) as Record<FiniteNodeRef, number | null>,
  };
}

export function buildOrderCatalog(data: GameData): BuildOrderCatalog {
  const options = stepOptions(data);
  const { villagers, buildings } = data.civData.startingState;
  const split = Object.entries(villagers.value).filter(([, count]) => count > 0);
  const startVillagerProducers = buildings.value.filter((building) => options.villagerProducers.includes(building));
  const busiest = [...split].sort(([, a], [, b]) => b - a)[0]?.[0] as NodeRef | undefined;
  const defaultStart: BuildStart = { villagers: Object.fromEntries(split) };
  if (startVillagerProducers.length > 0 && busiest !== undefined) defaultStart.rally = busiest;
  return {
    ...options,
    civ: data.civ,
    startVillagerTotal: Object.values(villagers.value).reduce((sum, count) => sum + count, 0),
    defaultStart,
    startVillagerProducers,
    rejectedTechs: rejectedTechsOf(data),
    units: [...data.byBaseId].filter(([, entries]) => entries.some((entry) => entry.type === 'unit')).map(([baseId]) => baseId),
    inputDefaults: inputDefaultsOf(data),
  };
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

export function nearestId(value: string, choices: readonly string[]): string | undefined {
  const wanted = value.toLowerCase();
  let best: string | undefined;
  const threshold = Math.max(1, Math.floor(value.length / 3));
  let bestDistance = threshold + 1;
  for (const choice of choices) {
    // The edit distance is at least the length difference, so this skips only candidates that cannot win.
    const candidate = choice.toLowerCase();
    if (Math.abs(wanted.length - candidate.length) > threshold) continue;
    const distance = editDistance(wanted, candidate);
    if (distance < bestDistance) {
      best = choice;
      bestDistance = distance;
    }
  }
  return best;
}

interface Problem {
  code: BuildOrderIssue['code'];
  text: string;
  suggestion?: string;
}

type Check = (value: unknown) => Problem | undefined;

// Marks issues the cross-step pass and the issue order treat apart from field issues.
type Scope = 'cross-field' | 'cross-step';

const syntax = (text: string): Problem => ({ code: 'syntax', text });

function report(payload: z.core.ParsePayload, problem: Problem, path: PropertyKey[] = [], scope?: Scope): void {
  const params = { code: problem.code, suggestion: problem.suggestion, scope };
  payload.issues.push({ code: 'custom', message: problem.text, input: payload.value, path, params });
}

// Zod reports every field problem as a custom issue carrying today's message text and issue code.
function field<T>(check: Check): z.ZodType<T> {
  return z.custom<T>().check((payload) => {
    const problem = check(payload.value);
    if (problem) report(payload, problem);
  });
}

function typed(name: string, type: 'string' | 'number', then?: Check, options: { missing?: boolean; all?: boolean } = {}): Check {
  return (value) => {
    if (value === undefined && options.missing !== false) return syntax(`missing ${name}`);
    if (options.all && value === 'all') return undefined;
    if (typeof value !== type) return syntax(`${name} must be a ${type}${options.all ? ' or "all"' : ''}`);
    return then?.(value);
  };
}

function inRange(name: string, key: BoundKey): Check {
  return (value) => {
    const problem = outOfRange(value as number, key);
    return problem === undefined ? undefined : { code: 'out-of-range', text: `${name}: ${problem}` };
  };
}

function nodeAt(name: string, finiteOnly: boolean): Check {
  return (value) => {
    const problem = nodeRefIssue(value, finiteOnly);
    if (problem === null) return undefined;
    const choices = finiteOnly ? FINITE_NODE_REFS : NODE_REFS;
    const suggestion = problem.code === 'unknown-id' ? nearestId(value as string, choices) : undefined;
    return { code: problem.code, text: `${problem.reason} in ${name}`, suggestion };
  };
}

type CatalogKind = Exclude<IdKind, 'node'>;

function knownId(name: string, kind: CatalogKind, catalog: BuildOrderCatalog | undefined): Check {
  return (value) => {
    if (catalog === undefined) return undefined;
    const id = value as string;
    if (kind === 'tech' && Object.hasOwn(catalog.rejectedTechs, id)) {
      const { code, property } = catalog.rejectedTechs[id];
      return { code, text: `technology "${id}" is not supported: property ${property}` };
    }
    const ids = { building: catalog.buildings, unit: catalog.units, tech: catalog.techs }[kind];
    if (ids.includes(id)) return undefined;
    return { code: 'unknown-id', text: `unknown ${kind} "${id}" in ${name}`, suggestion: nearestId(id, ids) };
  };
}

const TRIGGER_KINDS = ['time', 'villagers', 'depleted', 'bank'] as const;

const triggerNumber = (name: string, key: BoundKey) => field<number>(typed(`trigger.${name}`, 'number', inRange(`trigger.${name}`, key), { missing: false }));

const knownResource: Check = (value) =>
  RESOURCE_KINDS.includes(value as ResourceKind) ? undefined : { code: 'unknown-id', text: `unknown resource "${value}" in trigger.resource` };

const triggerKindCheck: Check = (trigger) => {
  if (!isRecord(trigger)) return syntax('trigger must be an object');
  const { kind } = trigger;
  if (typeof kind !== 'string') return syntax('trigger.kind must be a string');
  if ((TRIGGER_KINDS as readonly string[]).includes(kind)) return undefined;
  return {
    code: 'unknown-trigger-kind',
    text: `unknown trigger kind "${kind}"; the kinds are ${TRIGGER_KINDS.join(', ')}`,
    suggestion: nearestId(kind, TRIGGER_KINDS),
  };
};

// An omitted trigger means the step has no condition. bank holds while the stock of resource is at least atLeast.
const triggerSchema = z
  .unknown()
  .check((payload) => {
    const problem = triggerKindCheck(payload.value);
    if (problem) report(payload, problem);
  })
  .pipe(
    z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('time'), seconds: triggerNumber('seconds', 'triggerSeconds') }),
      z.object({ kind: z.literal('villagers'), count: triggerNumber('count', 'triggerCount') }),
      z.object({
        kind: z.literal('depleted'),
        node: field<FiniteNodeRef>(typed('trigger.node', 'string', nodeAt('trigger.node', true), { missing: false })),
      }),
      z.object({
        kind: z.literal('bank'),
        resource: field<ResourceKind>(typed('trigger.resource', 'string', knownResource, { missing: false })),
        atLeast: triggerNumber('atLeast', 'triggerAtLeast'),
      }),
    ]),
  );

function stepProblem(step: unknown): string {
  if (!isRecord(step)) return 'is not an object';
  const { action } = step;
  if (action === undefined) return 'missing action';
  return typeof action === 'string' ? `unknown action "${action}"` : 'action must be a string';
}

function crossFieldProblems(step: BuildStep, catalog: BuildOrderCatalog): string[] {
  const problems: string[] = [];
  if (step.reaction === true && step.trigger?.kind !== 'depleted') problems.push('only a step triggered by a node running out can be a reaction');
  if (step.action === 'produce') {
    const { producer, unit, rally } = step;
    if (!(Object.hasOwn(catalog.unitsByProducer, producer) && catalog.unitsByProducer[producer].includes(unit))) {
      problems.push(`${producer} cannot produce ${unit}`);
    }
    if (step.walkSeconds !== undefined && rally === undefined) problems.push('walkSeconds without rally');
    if (rally !== undefined && unit !== VILLAGER_ID) problems.push(`rally on ${unit}, which is not a villager`);
  } else if (step.action === 'rally' && !catalog.villagerProducers.includes(step.producer)) {
    problems.push(`rally on ${step.producer}, which produces no villagers`);
  } else if (step.action === 'research' && step.at !== undefined) {
    const sites = Object.hasOwn(catalog.techSites, step.tech) ? catalog.techSites[step.tech] : [];
    if (!sites.includes(step.at)) problems.push(`${step.tech} cannot be researched at ${step.at}`);
  }
  return problems;
}

function stepUnion(catalog: BuildOrderCatalog | undefined) {
  const id = (name: string, kind: CatalogKind) => field<string>(typed(name, 'string', knownId(name, kind, catalog)));
  const node = (name: string) => field<NodeRef>(typed(name, 'string', nodeAt(name, false)));
  const count = (name: BoundKey) => field<number>(typed(name, 'number', inRange(name, name)));
  // A reaction (depleted trigger only) arms when its trigger holds, without waiting for earlier steps.
  const common = {
    trigger: triggerSchema.optional(),
    reaction: z.literal(true, { error: 'reaction must be true' }).optional(),
  };
  return z.discriminatedUnion(
    'action',
    [
      // No count means continuous production; rally only for villagers and sets the producer's rally; walkSeconds only with rally.
      z.object({
        ...common,
        action: z.literal('produce'),
        producer: id('producer', 'building'),
        instance: count('instance').optional(),
        unit: id('unit', 'unit'),
        count: count('count').optional(),
        rally: node('rally').optional(),
        walkSeconds: count('walkSeconds').optional(),
      }),
      // Rallies villagers that start from this step on; costs nothing.
      z.object({ ...common, action: z.literal('rally'), producer: id('producer', 'building'), instance: count('instance').optional(), to: node('to'), walkSeconds: count('walkSeconds').optional() }),
      z.object({ ...common, action: z.literal('pause'), producer: id('producer', 'building'), instance: count('instance').optional() }),
      // builders defaults to 1, then defaults to from.
      z.object({
        ...common,
        action: z.literal('build'),
        building: id('building', 'building'),
        builders: count('builders').optional(),
        from: node('from'),
        then: node('then').optional(),
        walkSeconds: count('walkSeconds').optional(),
      }),
      // Technologies and unit upgrades (veterancy tiers).
      z.object({ ...common, action: z.literal('research'), tech: id('tech', 'tech'), at: id('at', 'building').optional() }),
      // all takes every villager at from when the step starts, gathering or idle.
      z.object({
        ...common,
        action: z.literal('move'),
        count: field<number | 'all'>(typed('count', 'number', inRange('count', 'count'), { all: true })),
        from: node('from'),
        to: node('to'),
        walkSeconds: count('walkSeconds').optional(),
      }),
    ],
    { error: (found) => stepProblem(found.input) },
  );
}

export type Trigger = z.output<typeof triggerSchema>;
export type BuildStep = z.output<ReturnType<typeof stepUnion>>;

function stepSchema(catalog: BuildOrderCatalog | undefined): z.ZodType<BuildStep> {
  const step = stepUnion(catalog);
  if (catalog === undefined) return step;
  return step.superRefine((checked, payload) => {
    for (const text of crossFieldProblems(checked, catalog)) report(payload, { code: 'invalid', text }, [], 'cross-field');
  });
}

const stepsSchema = (catalog: BuildOrderCatalog | undefined): z.ZodType<BuildStep[]> =>
  z
    .unknown()
    .check((payload) => {
      const { max } = SIM_INPUT_BOUNDS.steps;
      if (!Array.isArray(payload.value)) report(payload, syntax('must be an array'));
      else if (payload.value.length > max) report(payload, { code: 'out-of-range', text: `${payload.value.length} steps, more than ${max}` });
    })
    .pipe(z.array(stepSchema(catalog)));

const startVillagersSchema = z.custom<Partial<Record<NodeRef, number>>>().check((payload) => {
  if (!isRecord(payload.value)) {
    report(payload, syntax('start.villagers must be an object'));
    return;
  }
  for (const [node, count] of Object.entries(payload.value)) {
    const name = `start.villagers.${node}`;
    const problems = [typed(name, 'number', inRange(name, 'startVillagers'), { missing: false })(count), nodeAt('start.villagers', false)(node)];
    for (const problem of problems) if (problem) report(payload, problem);
  }
});

// The t=0 villager split (absent means the civ's default split) and the rally in effect at t=0.
const startSchema = z.object(
  {
    villagers: startVillagersSchema.optional(),
    rally: field<NodeRef>(typed('start.rally', 'string', nodeAt('start.rally', false))).optional(),
  },
  { error: 'must be an object' },
);

export type BuildStart = z.output<typeof startSchema>;

const text = <T extends string = string>(then?: Check) => field<T>((value) => (typeof value === 'string' ? then?.(value) : syntax('must be a string')));

function startProblems(start: BuildStart | undefined, catalog: BuildOrderCatalog): [string, string][] {
  const problems: [string, string][] = [];
  if (start?.villagers !== undefined) {
    const total = Object.values(start.villagers).reduce((sum, count) => sum + count, 0);
    if (total !== catalog.startVillagerTotal) problems.push(['villagers', `start.villagers sums to ${total}, the civ starts with ${catalog.startVillagerTotal}`]);
  }
  if (start?.rally === undefined && catalog.startVillagerProducers.length > 0) {
    problems.push(['rally', `no start.rally while starting building ${catalog.startVillagerProducers.join(', ')} produces villagers`]);
  }
  return problems;
}

// A step's rally sets where later villagers from that producer go; any start.rally, even a bad one, covers every producer.
function crossStepProblems(order: Fields, steps: readonly BuildStep[], catalog: BuildOrderCatalog): [number, Problem & { earlier?: number }][] {
  const hasStartRally = isRecord(order.start) && order.start.rally !== undefined;
  const rallySources = new Set<string>();
  const researched = new Map<string, number>();
  const problems: [number, Problem & { earlier?: number }][] = [];
  steps.forEach((step, index) => {
    if (step.action === 'produce' && step.rally !== undefined && step.unit === VILLAGER_ID && step.instance === undefined) rallySources.add(step.producer);
    if (step.action === 'rally' && step.instance === undefined) rallySources.add(step.producer);
    if (step.action === 'build' && catalog.villagerProducers.includes(step.building) && !hasStartRally && !rallySources.has(step.building)) {
      problems.push([index, { code: 'invalid', text: `build ${step.building} with no start.rally and no earlier rally for every ${step.building}` }]);
    }
    if (step.action !== 'research') return;
    const earlier = researched.get(step.tech);
    if (earlier === undefined) researched.set(step.tech, index);
    else problems.push([index, { code: 'invalid', text: `${step.tech} is already researched by `, earlier }]);
  });
  return problems;
}

function orderObject(catalog: BuildOrderCatalog | undefined) {
  return z.object(
    {
      civ: text<CivId>((civ) => (catalog === undefined || civ === catalog.civ ? undefined : { code: 'unknown-id', text: `unknown civ "${civ}"` })),
      name: text(),
      source: text().optional(),
      start: startSchema.optional(),
      steps: stepsSchema(catalog),
    },
    { error: 'must be an object' },
  );
}

export type BuildOrder = z.output<ReturnType<typeof orderObject>>;

function orderSchema(catalog: BuildOrderCatalog | undefined): z.ZodType<BuildOrder> {
  const order = orderObject(catalog);
  if (catalog === undefined) return order;
  return order.superRefine(
    (value, payload) => {
      if (!isRecord(value)) return;
      const failed = (key: string) => payload.issues.some((found) => found.path?.[0] === key && paramsOf(found).scope === undefined);
      if (!failed('start')) {
        for (const [key, text] of startProblems(value.start, catalog)) report(payload, { code: 'invalid', text }, ['start', key]);
      }
      if (failed('steps') || !Array.isArray(value.steps)) return;
      for (const [index, problem] of crossStepProblems(value, value.steps, catalog)) {
        payload.issues.push({ code: 'custom', message: problem.text, input: value, path: ['steps', index], params: { code: problem.code, scope: 'cross-step', earlier: problem.earlier } });
      }
    },
    { when: () => true },
  );
}

export const buildOrderShape: z.ZodType<BuildOrder> = orderSchema(undefined);

export function buildOrderSchema(catalog: BuildOrderCatalog): z.ZodType<BuildOrder> {
  return orderSchema(catalog);
}

const ORDER_KEYS = ['civ', 'name', 'source', 'steps', 'start'];
const STEP_RANK = ORDER_KEYS.length + 1;
const CROSS_STEP_RANK = STEP_RANK + SIM_INPUT_BOUNDS.steps.max + 1;

function located(fallback: string, line: number | undefined, step?: number): Where {
  const where: Where = { label: line === undefined ? fallback : `line ${line}`, step };
  if (line !== undefined) where.line = line;
  return where;
}

type ZodIssue = z.core.$ZodIssue;

interface IssueParams {
  code?: BuildOrderIssue['code'];
  suggestion?: string;
  scope?: Scope;
  earlier?: number;
}

function paramsOf(found: ZodIssue | z.core.$ZodRawIssue): IssueParams {
  return (found as { params?: IssueParams }).params ?? {};
}

function rankOf(found: ZodIssue): number {
  const [head, index] = found.path;
  if (head === 'steps' && typeof index === 'number') return (paramsOf(found).scope === 'cross-step' ? CROSS_STEP_RANK : STEP_RANK) + index;
  return found.path.length === 0 ? 0 : ORDER_KEYS.indexOf(String(head)) + 1;
}

function toOrderIssue(found: ZodIssue, lines: BuildOrderLines | undefined): BuildOrderIssue {
  const params = paramsOf(found);
  const [head, index] = found.path;
  const stepLabel = (step: number) => located(`steps[${step}]`, lines?.steps[step], step);
  let where: Where;
  if (head === 'steps' && typeof index === 'number') where = stepLabel(index);
  else if (head === 'start' && found.path.length > 1) where = located('start', lines?.start);
  else where = { label: found.path.length === 0 ? 'build order' : String(head) };
  const text = params.earlier === undefined ? found.message : found.message + stepLabel(params.earlier).label;
  const result = issue(params.code ?? 'syntax', where, text);
  if (params.suggestion !== undefined) result.suggestion = params.suggestion;
  return result;
}

export function checkBuildOrder(
  value: unknown,
  catalog: BuildOrderCatalog,
  lines?: BuildOrderLines,
): { ok: true; order: BuildOrder } | { ok: false; issues: BuildOrderIssue[] } {
  const result = orderSchema(catalog).safeParse(value);
  if (result.success) return { ok: true, order: result.data };
  const issues = [...result.error.issues].sort((a, b) => rankOf(a) - rankOf(b));
  return { ok: false, issues: issues.map((found) => toOrderIssue(found, lines)) };
}

const inputNumber = (key: BoundKey): Check => (value) => {
  if (typeof value !== 'number') return syntax('must be a number');
  const problem = outOfRange(value, key);
  return problem === undefined ? undefined : { code: 'out-of-range', text: problem };
};

// A record whose keys are checked first; an unknown key skips its value.
function keyedRecord<T>(keyProblem: (key: string) => Problem | undefined, item: z.ZodType<T>): z.ZodType<Record<string, T>> {
  return z.custom<Record<string, T>>().check((payload) => {
    if (!isRecord(payload.value)) {
      report(payload, syntax('must be an object'));
      return;
    }
    for (const [key, value] of Object.entries(payload.value)) {
      const problem = keyProblem(key);
      if (problem) {
        report(payload, problem, [key]);
        continue;
      }
      const parsed = item.safeParse(value);
      if (!parsed.success) payload.issues.push(...parsed.error.issues.map((found) => ({ ...found, input: value, path: [key, ...found.path] }) as z.core.$ZodRawIssue));
    }
  });
}

export function simInputsSchema(catalog: BuildOrderCatalog) {
  const nodes = Object.keys(catalog.inputDefaults.trips);
  const unknownNode = (node: string): Problem | undefined => (nodes.includes(node) ? undefined : { code: 'unknown-id', text: `unknown node "${node}"` });
  const number = (key: BoundKey) => field<number>(inputNumber(key)).optional();
  const trip = z.object(
    { walkSecondsCamp: number('walkSecondsCamp'), walkSecondsTownCenter: number('walkSecondsTownCenter'), dropOffSeconds: number('dropOffSeconds') },
    { error: 'must be an object' },
  );
  return z.object(
    {
      durationSeconds: number('durationSeconds'),
      trips: keyedRecord(unknownNode, trip).optional(),
      walkSeconds: number('walkSeconds'),
      autoHouses: z.boolean({ error: 'must be a boolean' }).optional(),
      houseBuilders: number('houseBuilders'),
      houseBuilderSource: field<GatherNodeId>((value) => (typeof value === 'string' ? unknownNode(value) : syntax('must be a string'))).optional(),
      influenceCoverage: keyedRecord(
        (building) => (catalog.buildings.includes(building) ? undefined : { code: 'unknown-id', text: `unknown building "${building}"` }),
        field<number>(inputNumber('influenceCoverage')),
      ).optional(),
      nodeAmounts: keyedRecord(
        (ref) => {
          const problem = nodeRefIssue(ref, true);
          return problem === null ? undefined : { code: problem.code, text: problem.reason };
        },
        field<number | null>((value) => (value === null ? undefined : inputNumber('nodeAmount')(value))),
      ).optional(),
    },
    { error: 'must be an object' },
  );
}

export function checkSimInputs(value: unknown, catalog: BuildOrderCatalog): { ok: true; inputs: SimInputs } | { ok: false; issues: BuildOrderIssue[] } {
  const result = simInputsSchema(catalog).safeParse(value ?? {});
  if (!result.success) {
    const issues = result.error.issues.map((found) => ({ code: paramsOf(found).code ?? 'syntax', message: `${['inputs', ...found.path].join('.')}: ${found.message}` }));
    return { ok: false, issues };
  }
  const given = result.data;
  const defaults = catalog.inputDefaults;
  const trips = {} as Record<GatherNodeId, TripInputs>;
  for (const [node, trip] of Object.entries(defaults.trips) as [GatherNodeId, TripInputs][]) {
    const override = given.trips?.[node];
    trips[node] = { ...trip };
    for (const name of TRIP_FIELDS) if (override?.[name] !== undefined) trips[node][name] = override[name];
  }
  return {
    ok: true,
    inputs: {
      durationSeconds: given.durationSeconds ?? INPUT_DEFAULTS.durationSeconds,
      trips,
      walkSeconds: given.walkSeconds ?? defaults.walkSeconds,
      autoHouses: given.autoHouses ?? INPUT_DEFAULTS.autoHouses,
      houseBuilders: given.houseBuilders ?? INPUT_DEFAULTS.houseBuilders,
      houseBuilderSource: given.houseBuilderSource ?? INPUT_DEFAULTS.houseBuilderSource,
      influenceCoverage: { ...INPUT_DEFAULTS.influenceCoverage, ...given.influenceCoverage },
      nodeAmounts: { ...defaults.nodeAmounts, ...given.nodeAmounts },
    },
  };
}

export function resolveSimInputs(partial: unknown, data: GameData): ReturnType<typeof checkSimInputs> {
  return checkSimInputs(partial, buildOrderCatalog(data));
}
