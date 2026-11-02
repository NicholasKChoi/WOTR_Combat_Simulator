import type { GameData, SnapshotEntry } from './data';
import { classifyTech } from './effects';
import type { BuildOrder, BuildOrderIssue, BuildOrderLines, BuildStep, GatherNodeId, SimInputs, TripInputs } from './model';

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
}

const req = (name: string, kind: FieldSpec['kind']): FieldSpec => ({ name, kind });
const opt = (name: string, kind: FieldSpec['kind']): FieldSpec => ({ name, kind, optional: true });

const STEP_FIELDS: Record<BuildStep['action'], readonly FieldSpec[]> = {
  produce: [req('producer', 'building'), opt('instance', 'instance'), req('unit', 'unit'), opt('count', 'count'), opt('rally', 'node'), opt('walkSeconds', 'walkSeconds')],
  rally: [req('producer', 'building'), opt('instance', 'instance'), req('to', 'node'), opt('walkSeconds', 'walkSeconds')],
  pause: [req('producer', 'building'), opt('instance', 'instance')],
  build: [req('building', 'building'), opt('builders', 'builders'), req('from', 'node'), opt('then', 'node'), opt('walkSeconds', 'walkSeconds')],
  research: [req('tech', 'tech'), opt('at', 'building')],
  move: [req('count', 'count'), req('from', 'node'), req('to', 'node'), opt('walkSeconds', 'walkSeconds')],
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

function isKnownId(data: GameData, kind: IdKind, id: string): boolean {
  return kind === 'node' ? Object.hasOwn(data.base.gatherNodes, id) : entriesOf(data, id, kind).length > 0;
}

function triggerShape(trigger: unknown): string | undefined {
  if (!isRecord(trigger)) return 'trigger must be an object';
  if (typeof trigger.kind !== 'string') return 'trigger.kind must be a string';
  if (trigger.kind === 'time' && typeof trigger.seconds !== 'number') return 'trigger.seconds must be a number';
  if (trigger.kind === 'villagers' && typeof trigger.count !== 'number') return 'trigger.count must be a number';
  return undefined;
}

function stepShape(step: unknown): string[] {
  if (!isRecord(step)) return ['is not an object'];
  const problems: string[] = [];
  if (step.trigger !== undefined) {
    const problem = triggerShape(step.trigger);
    if (problem) problems.push(problem);
  }
  const { action } = step;
  if (typeof action !== 'string') return [...problems, action === undefined ? 'missing action' : 'action must be a string'];
  if (!Object.hasOwn(STEP_FIELDS, action)) return [...problems, `unknown action "${action}"`];
  for (const field of STEP_FIELDS[action as BuildStep['action']]) {
    const value = step[field.name];
    const type = isBoundKey(field.kind) ? 'number' : 'string';
    if (value === undefined) {
      if (!field.optional) problems.push(`missing ${field.name}`);
    } else if (typeof value !== type) {
      problems.push(`${field.name} must be a ${type}`);
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
      else if (!isKnownId(this.data, 'node', rally)) this.issues.push(issue('unknown-id', where, `unknown node "${rally}" in start.rally`));
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
      if (!isKnownId(this.data, 'node', node)) this.issues.push(issue('unknown-id', where, `unknown node "${node}" in start.villagers`));
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
    const resolved = new Set<string>();
    for (const field of STEP_FIELDS[fields.action as BuildStep['action']]) {
      const value = fields[field.name];
      if (value !== undefined && this.checkField(field, value, where)) resolved.add(field.name);
    }
    this.checkRules(fields, resolved, index, where);
  }

  private checkTrigger(trigger: Fields | undefined, where: Where): void {
    if (trigger === undefined) return;
    if (trigger.kind !== 'time' && trigger.kind !== 'villagers') {
      this.issues.push(issue('unknown-trigger-kind', where, `unknown trigger kind "${trigger.kind}"`));
      return;
    }
    const [name, key]: [string, BoundKey] = trigger.kind === 'time' ? ['seconds', 'triggerSeconds'] : ['count', 'triggerCount'];
    const problem = outOfRange(trigger[name] as number, key);
    if (problem) this.issues.push(issue('out-of-range', where, `trigger.${name}: ${problem}`));
  }

  // True when the value is in range or resolves to a known, usable id.
  private checkField(field: FieldSpec, value: unknown, where: Where): boolean {
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
    },
  };
}
