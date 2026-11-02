import type { GameData, SnapshotEntry } from './data';
import { classifyTech } from './effects';
import { RESOURCE_KINDS } from './model';
import type { BuildOrder, BuildOrderIssue, BuildOrderLines, BuildStep, ResourceKind, Trigger } from './model';
import { SIM_INPUT_BOUNDS, entriesOf, isBoundKey, isKnownId, isRecord, issue, nodeRefIssue, outOfRange } from './schema';
import type { BoundKey, Fields, IdKind, Where } from './schema';

export { SIM_INPUT_BOUNDS, nodeRefIssue, resolveSimInputs } from './schema';
export type { NodeRefProblem } from './schema';

export interface ValidateOptions {
  lines?: BuildOrderLines;
}

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

const VILLAGER = 'villager';

function stepWhere(index: number, lines: BuildOrderLines | undefined): Where {
  const line = lines?.steps?.[index];
  return typeof line === 'number' ? { label: `line ${line}`, step: index, line } : { label: `steps[${index}]`, step: index };
}

function producedBy(entries: readonly SnapshotEntry[]): Set<string> {
  return new Set(entries.flatMap((e) => e.producedBy));
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
