import type { GameData, SnapshotEntry } from './data';
import { classifyTech } from './effects';
import { FINITE_NODE_REFS, GATHER_NODES, MAX_DEPOSITS, RESOURCE_KINDS, nodeKindOf } from './model';
import type { BuildOrder, BuildOrderIssue, BuildOrderLines, BuildStep, FiniteNodeRef, GatherNodeId, ResourceKind, SimInputs, Trigger, TripInputs } from './model';

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

type BoundKey = keyof typeof SIM_INPUT_BOUNDS;

const INPUT_DEFAULTS = Object.freeze({
  durationSeconds: 1200,
  autoHouses: true,
  houseBuilders: 1,
  houseBuilderSource: 'wood' as GatherNodeId,
  influenceCoverage: Object.freeze({ mill: 1 }) as Readonly<Record<string, number>>,
});

const TRIP_FIELDS = ['walkSecondsCamp', 'walkSecondsTownCenter', 'dropOffSeconds'] as const;

export interface ValidateOptions {
  lines?: BuildOrderLines;
}

type IdKind = 'building' | 'unit' | 'tech' | 'node';

interface FieldSpec {
  name: string;
  kind: IdKind | BoundKey;
  optional?: boolean;
  // Also accepts the string 'all'.
  all?: boolean;
}

const req = (name: string, kind: FieldSpec['kind']): FieldSpec => ({ name, kind });
const opt = (name: string, kind: FieldSpec['kind']): FieldSpec => ({ name, kind, optional: true });

const STEP_FIELDS: Record<BuildStep['action'], readonly FieldSpec[]> = {
  produce: [req('producer', 'building'), opt('instance', 'instance'), req('unit', 'unit'), opt('count', 'count'), opt('rally', 'node'), opt('walkSeconds', 'walkSeconds')],
  rally: [req('producer', 'building'), opt('instance', 'instance'), req('to', 'node'), opt('walkSeconds', 'walkSeconds')],
  pause: [req('producer', 'building'), opt('instance', 'instance')],
  build: [req('building', 'building'), opt('builders', 'builders'), req('from', 'node'), opt('then', 'node'), opt('walkSeconds', 'walkSeconds')],
  research: [req('tech', 'tech'), opt('at', 'building')],
  move: [{ ...req('count', 'count'), all: true }, req('from', 'node'), req('to', 'node'), opt('walkSeconds', 'walkSeconds')],
};

const ENTRY_TYPES: Record<Exclude<IdKind, 'node'>, readonly SnapshotEntry['type'][]> = {
  building: ['building'],
  unit: ['unit'],
  tech: ['technology', 'upgrade'],
};

const VILLAGER = 'villager';

type Fields = Record<string, unknown>;

interface Where {
  label: string;
  step?: number;
  line?: number;
}

function isRecord(value: unknown): value is Fields {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isBoundKey(kind: string): kind is BoundKey {
  return Object.hasOwn(SIM_INPUT_BOUNDS, kind);
}

function issue(code: BuildOrderIssue['code'], where: Where, text: string): BuildOrderIssue {
  const found: BuildOrderIssue = { code, message: `${where.label}: ${text}` };
  if (where.step !== undefined) found.step = where.step;
  if (where.line !== undefined) found.line = where.line;
  return found;
}

function outOfRange(value: number, key: BoundKey): string | undefined {
  const { min, max, integer } = SIM_INPUT_BOUNDS[key];
  if (!Number.isFinite(value)) return `${value} is not a finite number`;
  if (integer && !Number.isInteger(value)) return `${value} is not an integer`;
  if (value < min || value > max) return `${value} is outside ${min}..${max}`;
  return undefined;
}

function stepWhere(index: number, lines: BuildOrderLines | undefined): Where {
  const line = lines?.steps?.[index];
  return typeof line === 'number' ? { label: `line ${line}`, step: index, line } : { label: `steps[${index}]`, step: index };
}

function entriesOf(data: GameData, baseId: string, kind: Exclude<IdKind, 'node'>): readonly SnapshotEntry[] {
  return (data.byBaseId.get(baseId) ?? []).filter((e) => ENTRY_TYPES[kind].includes(e.type));
}

function producedBy(entries: readonly SnapshotEntry[]): Set<string> {
  return new Set(entries.flatMap((e) => e.producedBy));
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

function isKnownId(data: GameData, kind: IdKind, id: string): boolean {
  return kind === 'node' ? Object.hasOwn(data.base.gatherNodes, id) : entriesOf(data, id, kind).length > 0;
}

const TRIGGER_FIELDS: Readonly<Record<Trigger['kind'], [string, 'number' | 'string'][]>> = {
  time: [['seconds', 'number']],
  villagers: [['count', 'number']],
  depleted: [['node', 'string']],
  bank: [
    ['resource', 'string'],
    ['atLeast', 'number'],
  ],
};

function isTriggerKind(kind: unknown): kind is Trigger['kind'] {
  return typeof kind === 'string' && Object.hasOwn(TRIGGER_FIELDS, kind);
}

function triggerShape(trigger: unknown): string | undefined {
  if (!isRecord(trigger)) return 'trigger must be an object';
  if (typeof trigger.kind !== 'string') return 'trigger.kind must be a string';
  const wrong = isTriggerKind(trigger.kind) ? TRIGGER_FIELDS[trigger.kind].find(([name, type]) => typeof trigger[name] !== type) : undefined;
  return wrong && `trigger.${wrong[0]} must be a ${wrong[1]}`;
}

type TriggerProblem = [BuildOrderIssue['code'], string] | null;

function rangeProblem(value: unknown, key: BoundKey, path: string): TriggerProblem {
  const problem = outOfRange(value as number, key);
  return problem ? ['out-of-range', `${path}: ${problem}`] : null;
}

const TRIGGER_CHECKS: Readonly<Record<Trigger['kind'], (trigger: Fields) => TriggerProblem>> = {
  time: (trigger) => rangeProblem(trigger.seconds, 'triggerSeconds', 'trigger.seconds'),
  villagers: (trigger) => rangeProblem(trigger.count, 'triggerCount', 'trigger.count'),
  depleted: (trigger) => {
    const problem = nodeRefIssue(trigger.node, true);
    return problem && [problem.code, `${problem.reason} in trigger.node`];
  },
  bank: (trigger) =>
    RESOURCE_KINDS.includes(trigger.resource as ResourceKind)
      ? rangeProblem(trigger.atLeast, 'triggerAtLeast', 'trigger.atLeast')
      : ['unknown-id', `unknown resource "${trigger.resource}" in trigger.resource`],
};

function stepShape(step: unknown): string[] {
  if (!isRecord(step)) return ['is not an object'];
  const problems: string[] = [];
  if (step.trigger !== undefined) {
    const problem = triggerShape(step.trigger);
    if (problem) problems.push(problem);
  }
  if (step.reaction !== undefined && step.reaction !== true) problems.push('reaction must be true');
  const { action } = step;
  if (typeof action !== 'string') return [...problems, action === undefined ? 'missing action' : 'action must be a string'];
  if (!Object.hasOwn(STEP_FIELDS, action)) return [...problems, `unknown action "${action}"`];
  for (const field of STEP_FIELDS[action as BuildStep['action']]) {
    const value = step[field.name];
    const type = isBoundKey(field.kind) ? 'number' : 'string';
    if (value === undefined) {
      if (!field.optional) problems.push(`missing ${field.name}`);
    } else if (typeof value !== type && !(field.all && value === 'all')) {
      problems.push(`${field.name} must be a ${type}${field.all ? ' or "all"' : ''}`);
    }
  }
  return problems;
}

class OrderChecker {
  readonly issues: BuildOrderIssue[] = [];
  private readonly villagerProducers: Set<string>;
  private readonly rallySources = new Set<string>();
  private readonly researched = new Map<string, number>();
  private hasStartRally = false;

  constructor(
    private readonly data: GameData,
    private readonly lines: BuildOrderLines | undefined,
  ) {
    this.villagerProducers = producedBy(entriesOf(data, VILLAGER, 'unit'));
  }

  check(input: unknown): void {
    if (!isRecord(input)) {
      this.issues.push(issue('syntax', { label: 'build order' }, 'must be an object'));
      return;
    }
    const { civ, name, source, start, steps } = input;
    if (typeof civ !== 'string') this.issues.push(issue('syntax', { label: 'civ' }, 'must be a string'));
    else if (civ !== this.data.civ) this.issues.push(issue('unknown-id', { label: 'civ' }, `unknown civ "${civ}"`));
    if (typeof name !== 'string') this.issues.push(issue('syntax', { label: 'name' }, 'must be a string'));
    if (source !== undefined && typeof source !== 'string') this.issues.push(issue('syntax', { label: 'source' }, 'must be a string'));
    const startShaped = start === undefined || isRecord(start);
    if (!startShaped) this.issues.push(issue('syntax', { label: 'start' }, 'must be an object'));
    if (!Array.isArray(steps)) this.issues.push(issue('syntax', { label: 'steps' }, 'must be an array'));
    else if (steps.length > SIM_INPUT_BOUNDS.steps.max) {
      this.issues.push(issue('out-of-range', { label: 'steps' }, `${steps.length} steps, more than ${SIM_INPUT_BOUNDS.steps.max}`));
    }
    if (startShaped) this.checkStart(start as Fields | undefined);
    if (Array.isArray(steps) && steps.length <= SIM_INPUT_BOUNDS.steps.max) {
      for (let index = 0; index < steps.length; index++) {
        this.checkStep(steps[index], index);
      }
    }
  }

  private checkStart(start: Fields | undefined): void {
    const line = this.lines?.start;
    const where: Where = typeof line === 'number' ? { label: `line ${line}`, line } : { label: 'start' };
    const villagers = start?.villagers;
    if (villagers !== undefined) this.checkStartVillagers(villagers, where);
    const rally = start?.rally;
    if (rally !== undefined) {
      this.hasStartRally = true;
      if (typeof rally !== 'string') this.issues.push(issue('syntax', where, 'start.rally must be a string'));
      else this.checkNode(rally, 'start.rally', where);
      return;
    }
    const producers = this.data.civData.startingState.buildings.value.filter((b) => this.villagerProducers.has(b));
    if (producers.length > 0) {
      this.issues.push(issue('invalid', where, `no start.rally while starting building ${producers.join(', ')} produces villagers`));
    }
  }

  private checkStartVillagers(villagers: unknown, where: Where): void {
    if (!isRecord(villagers)) {
      this.issues.push(issue('syntax', where, 'start.villagers must be an object'));
      return;
    }
    const before = this.issues.length;
    let total = 0;
    for (const [node, count] of Object.entries(villagers)) {
      if (typeof count !== 'number') {
        this.issues.push(issue('syntax', where, `start.villagers.${node} must be a number`));
      } else {
        const problem = outOfRange(count, 'startVillagers');
        if (problem) this.issues.push(issue('out-of-range', where, `start.villagers.${node}: ${problem}`));
        total += count;
      }
      this.checkNode(node, 'start.villagers', where);
    }
    const expected = Object.values(this.data.civData.startingState.villagers.value).reduce((sum, n) => sum + n, 0);
    if (this.issues.length === before && total !== expected) {
      this.issues.push(issue('invalid', where, `start.villagers sums to ${total}, the civ starts with ${expected}`));
    }
  }

  private checkStep(step: unknown, index: number): void {
    const where = stepWhere(index, this.lines);
    const problems = stepShape(step);
    if (problems.length > 0) {
      this.issues.push(...problems.map((p) => issue('syntax', where, p)));
      return;
    }
    const fields = step as Fields;
    this.checkTrigger(fields.trigger as Fields | undefined, where);
    if (fields.reaction === true) this.checkReaction(fields.trigger as Fields | undefined, where);
    const resolved = new Set<string>();
    for (const field of STEP_FIELDS[fields.action as BuildStep['action']]) {
      const value = fields[field.name];
      if (value !== undefined && this.checkField(field, value, where)) resolved.add(field.name);
    }
    this.checkRules(fields, resolved, index, where);
  }

  private checkTrigger(trigger: Fields | undefined, where: Where): void {
    if (trigger === undefined) return;
    if (!isTriggerKind(trigger.kind)) {
      const kinds = Object.keys(TRIGGER_CHECKS).join(', ');
      this.issues.push(issue('unknown-trigger-kind', where, `unknown trigger kind "${trigger.kind}"; the kinds are ${kinds}`));
      return;
    }
    const problem = TRIGGER_CHECKS[trigger.kind](trigger);
    if (problem) this.issues.push(issue(problem[0], where, problem[1]));
  }

  // An unknown trigger kind is already reported by checkTrigger.
  private checkReaction(trigger: Fields | undefined, where: Where): void {
    const kind = trigger?.kind;
    if (kind === 'depleted' || (kind !== undefined && !isTriggerKind(kind))) return;
    this.issues.push(issue('invalid', where, 'only a step triggered by a node running out can be a reaction'));
  }

  private checkNode(value: unknown, path: string, where: Where): boolean {
    const problem = nodeRefIssue(value, false);
    if (problem) this.issues.push(issue(problem.code, where, `${problem.reason} in ${path}`));
    return problem === null;
  }

  // True when the value is in range or resolves to a known, usable id.
  private checkField(field: FieldSpec, value: unknown, where: Where): boolean {
    if (field.kind === 'node') return this.checkNode(value, field.name, where);
    if (field.all && value === 'all') return true;
    if (isBoundKey(field.kind)) {
      const problem = outOfRange(value as number, field.kind);
      if (problem) this.issues.push(issue('out-of-range', where, `${field.name}: ${problem}`));
      return !problem;
    }
    const id = value as string;
    if (!isKnownId(this.data, field.kind, id)) {
      this.issues.push(issue('unknown-id', where, `unknown ${field.kind} "${id}" in ${field.name}`));
      return false;
    }
    if (field.kind !== 'tech') return true;
    for (const entry of entriesOf(this.data, id, 'tech')) {
      const support = classifyTech(entry, this.data);
      if (support.kind === 'rejected') {
        this.issues.push(issue(support.code, where, `technology "${id}" is not supported: property ${support.property}`));
        return false;
      }
    }
    return true;
  }

  private checkRules(step: Fields, resolved: Set<string>, index: number, where: Where): void {
    const invalid = (text: string) => this.issues.push(issue('invalid', where, text));
    const { action, producer, unit, instance } = step as { action: string; producer: string; unit: string; instance?: number };
    if (action === 'produce') {
      if (resolved.has('producer') && resolved.has('unit') && !entriesOf(this.data, unit, 'unit').some((e) => e.producedBy.includes(producer))) {
        invalid(`${producer} cannot produce ${unit}`);
      }
      if (step.walkSeconds !== undefined && step.rally === undefined) invalid('walkSeconds without rally');
      if (step.rally !== undefined && resolved.has('unit') && unit !== VILLAGER) invalid(`rally on ${unit}, which is not a villager`);
      if (step.rally !== undefined && unit === VILLAGER && instance === undefined) this.rallySources.add(producer);
    } else if (action === 'rally') {
      if (resolved.has('producer') && !this.villagerProducers.has(producer)) invalid(`rally on ${producer}, which produces no villagers`);
      if (instance === undefined) this.rallySources.add(producer);
    } else if (action === 'build') {
      const building = step.building as string;
      if (resolved.has('building') && this.villagerProducers.has(building) && !this.hasStartRally && !this.rallySources.has(building)) {
        invalid(`build ${building} with no start.rally and no earlier rally for every ${building}`);
      }
    } else if (action === 'research' && resolved.has('tech')) {
      this.checkResearch(step.tech as string, step.at as string | undefined, resolved, index, invalid);
    }
  }

  private checkResearch(tech: string, at: string | undefined, resolved: Set<string>, index: number, invalid: (text: string) => void): void {
    if (at !== undefined && resolved.has('at') && !entriesOf(this.data, tech, 'tech').some((e) => e.producedBy.includes(at))) {
      invalid(`${tech} cannot be researched at ${at}`);
    }
    const earlier = this.researched.get(tech);
    if (earlier === undefined) this.researched.set(tech, index);
    else invalid(`${tech} is already researched by ${stepWhere(earlier, this.lines).label}`);
  }
}

export function validateBuildOrder(
  input: unknown,
  data: GameData,
  options?: ValidateOptions,
): { ok: true; order: BuildOrder } | { ok: false; issues: BuildOrderIssue[] } {
  const checker = new OrderChecker(data, options?.lines);
  checker.check(input);
  return checker.issues.length === 0 ? { ok: true, order: input as BuildOrder } : { ok: false, issues: checker.issues };
}

function inputIssue(code: BuildOrderIssue['code'], path: string, text: string): BuildOrderIssue {
  return { code, message: `inputs.${path}: ${text}` };
}

function readNumber(source: Fields, name: string, path: string, key: BoundKey, issues: BuildOrderIssue[]): number | undefined {
  const value = source[name];
  if (value === undefined) return undefined;
  if (typeof value !== 'number') {
    issues.push(inputIssue('syntax', path, 'must be a number'));
    return undefined;
  }
  const problem = outOfRange(value, key);
  if (problem) issues.push(inputIssue('out-of-range', path, problem));
  return value;
}

function readRecord(source: Fields, name: string, path: string, issues: BuildOrderIssue[]): Fields | undefined {
  const value = source[name];
  if (value === undefined) return undefined;
  if (isRecord(value)) return value;
  issues.push(inputIssue('syntax', path, 'must be an object'));
  return undefined;
}

function resolveTrips(overrides: Fields | undefined, data: GameData, issues: BuildOrderIssue[]): Record<GatherNodeId, TripInputs> {
  const trips = {} as Record<GatherNodeId, TripInputs>;
  for (const [node, rules] of Object.entries(data.base.gatherNodes) as [GatherNodeId, (typeof data.base.gatherNodes)[GatherNodeId]][]) {
    trips[node] = {
      walkSecondsCamp: rules.trip.walkSecondsCamp.value,
      walkSecondsTownCenter: rules.trip.walkSecondsTownCenter.value,
      dropOffSeconds: rules.trip.dropOffSeconds.value,
    };
  }
  for (const node of Object.keys(overrides ?? {})) {
    if (!isKnownId(data, 'node', node)) {
      issues.push(inputIssue('unknown-id', `trips.${node}`, `unknown node "${node}"`));
      continue;
    }
    const trip = readRecord(overrides, node, `trips.${node}`, issues) ?? {};
    for (const field of TRIP_FIELDS) {
      const value = readNumber(trip, field, `trips.${node}.${field}`, field, issues);
      if (value !== undefined) trips[node as GatherNodeId][field] = value;
    }
  }
  return trips;
}

function resolveNodeAmounts(overrides: Fields | undefined, data: GameData, issues: BuildOrderIssue[]): Record<FiniteNodeRef, number | null> {
  const amounts = {} as Record<FiniteNodeRef, number | null>;
  for (const ref of FINITE_NODE_REFS) {
    amounts[ref] = data.base.gatherNodes[nodeKindOf(ref)].amount?.value ?? null;
  }
  for (const ref of Object.keys(overrides ?? {})) {
    const path = `nodeAmounts.${ref}`;
    const problem = nodeRefIssue(ref, true);
    if (problem) {
      issues.push(inputIssue(problem.code, path, problem.reason));
    } else if (overrides[ref] === null) {
      amounts[ref as FiniteNodeRef] = null;
    } else {
      const value = readNumber(overrides, ref, path, 'nodeAmount', issues);
      if (value !== undefined) amounts[ref as FiniteNodeRef] = value;
    }
  }
  return amounts;
}

function resolveInfluence(overrides: Fields | undefined, data: GameData, issues: BuildOrderIssue[]): Record<string, number> {
  const coverage: Record<string, number> = { ...INPUT_DEFAULTS.influenceCoverage };
  for (const building of Object.keys(overrides ?? {})) {
    const path = `influenceCoverage.${building}`;
    if (!isKnownId(data, 'building', building)) {
      issues.push(inputIssue('unknown-id', path, `unknown building "${building}"`));
      continue;
    }
    const value = readNumber(overrides, building, path, 'influenceCoverage', issues);
    if (value !== undefined) coverage[building] = value;
  }
  return coverage;
}

export function resolveSimInputs(partial: unknown, data: GameData): { ok: true; inputs: SimInputs } | { ok: false; issues: BuildOrderIssue[] } {
  const given = partial ?? {};
  if (!isRecord(given)) {
    return { ok: false, issues: [{ code: 'syntax', message: 'inputs: must be an object' }] };
  }
  const issues: BuildOrderIssue[] = [];
  const durationSeconds = readNumber(given, 'durationSeconds', 'durationSeconds', 'durationSeconds', issues);
  const trips = resolveTrips(readRecord(given, 'trips', 'trips', issues), data, issues);
  const walkSeconds = readNumber(given, 'walkSeconds', 'walkSeconds', 'walkSeconds', issues);
  const { autoHouses, houseBuilderSource } = given;
  if (autoHouses !== undefined && typeof autoHouses !== 'boolean') issues.push(inputIssue('syntax', 'autoHouses', 'must be a boolean'));
  const houseBuilders = readNumber(given, 'houseBuilders', 'houseBuilders', 'houseBuilders', issues);
  if (typeof houseBuilderSource === 'string') {
    if (!isKnownId(data, 'node', houseBuilderSource)) {
      issues.push(inputIssue('unknown-id', 'houseBuilderSource', `unknown node "${houseBuilderSource}"`));
    }
  } else if (houseBuilderSource !== undefined) {
    issues.push(inputIssue('syntax', 'houseBuilderSource', 'must be a string'));
  }
  const influenceCoverage = resolveInfluence(readRecord(given, 'influenceCoverage', 'influenceCoverage', issues), data, issues);
  const nodeAmounts = resolveNodeAmounts(readRecord(given, 'nodeAmounts', 'nodeAmounts', issues), data, issues);
  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    inputs: {
      durationSeconds: durationSeconds ?? INPUT_DEFAULTS.durationSeconds,
      trips,
      walkSeconds: walkSeconds ?? data.base.walkSeconds.value,
      autoHouses: (autoHouses as boolean | undefined) ?? INPUT_DEFAULTS.autoHouses,
      houseBuilders: houseBuilders ?? INPUT_DEFAULTS.houseBuilders,
      houseBuilderSource: (houseBuilderSource as GatherNodeId | undefined) ?? INPUT_DEFAULTS.houseBuilderSource,
      influenceCoverage,
      nodeAmounts,
    },
  };
}
