// Paste text <-> BuildOrder. Grammar only: ids, bounds and cross-field rules are checked by validation.
import { formatMinSec } from './format-time';
import type { BuildOrder, BuildOrderIssue, BuildOrderLines, BuildStart, BuildStep, GatherNodeId, Trigger } from './model';

export type ParseTextResult =
  | { ok: true; order: BuildOrder; lines: BuildOrderLines }
  | { ok: false; issues: BuildOrderIssue[] };

type StepOf<A extends BuildStep['action']> = Extract<BuildStep, { action: A }>;

const PASTED_ORDER_NAME = 'Pasted build order';
// Keys are the canonical start order; `satisfies` makes a new GatherNodeId a compile error instead of a silently dropped node.
const GATHER_NODE_ORDER = Object.keys({ sheep: 0, berry: 0, deer: 0, boar: 0, farm: 0, wood: 0, gold: 0, stone: 0 } satisfies Record<GatherNodeId, 0>) as GatherNodeId[];

// Every pattern is anchored with no nested quantifier over the same characters, so matching is linear.
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INSTANCE_REF = /^([a-z0-9]+(?:-[a-z0-9]+)*)(?:#(\d+))?$/;
const NUMBER = /^\d+$/;
const TIME = /^@(\d+):(\d\d)$/;
const COUNT = /^x(\d+)$/;
const SECONDS = /^(\d+)s$/;
// \r is whitespace, so a CRLF break needs no separate split and a stray \r never joins a token.
const WHITESPACE = /[ \t\r]+/;
const MAX_QUOTED_LENGTH = 40;

class LineError extends Error {}

function quote(token: string | undefined): string {
  if (token === undefined) {
    return 'end of line';
  }
  return token.length > MAX_QUOTED_LENGTH ? `'${token.slice(0, MAX_QUOTED_LENGTH)}...'` : `'${token}'`;
}

class Tokens {
  private index = 0;

  constructor(private readonly tokens: string[]) {}

  peek(): string | undefined {
    return this.tokens[this.index];
  }

  accept(word: string): boolean {
    if (this.peek() !== word) {
      return false;
    }
    this.index++;
    return true;
  }

  optional(pattern: RegExp): RegExpExecArray | null {
    const token = this.peek();
    const match = token === undefined ? null : pattern.exec(token);
    if (match) {
      this.index++;
    }
    return match;
  }

  take(what: string, pattern: RegExp): RegExpExecArray {
    const match = this.optional(pattern);
    if (!match) {
      throw new LineError(`expected ${what}, got ${quote(this.peek())}`);
    }
    return match;
  }

  keyword(word: string): void {
    if (!this.accept(word)) {
      throw new LineError(`expected '${word}', got ${quote(this.peek())}`);
    }
  }

  id(what: string): string {
    return this.take(what, ID)[0];
  }

  node(): GatherNodeId {
    return this.take('a node name', ID)[0] as GatherNodeId;
  }

  number(what: string): number {
    return Number(this.take(what, NUMBER)[0]);
  }

  producer(): { producer: string; instance?: number } {
    const match = this.take('a producer id', INSTANCE_REF);
    return match[2] === undefined ? { producer: match[1] } : { producer: match[1], instance: Number(match[2]) };
  }

  end(): void {
    if (this.peek() !== undefined) {
      throw new LineError(`unexpected token ${quote(this.peek())}`);
    }
  }
}

function withWalk<S extends { walkSeconds?: number }>(t: Tokens, step: S): S {
  if (t.accept('walk')) {
    step.walkSeconds = Number(t.take('walk seconds like 4s', SECONDS)[1]);
  }
  return step;
}

function parseProduce(t: Tokens): BuildStep {
  const unit = t.id('a unit id');
  t.keyword('from');
  const step: StepOf<'produce'> = { action: 'produce', ...t.producer(), unit };
  const count = t.optional(COUNT);
  if (count) {
    step.count = Number(count[1]);
  }
  if (t.accept('->')) {
    step.rally = t.node();
  }
  return withWalk(t, step);
}

function parsePause(t: Tokens): BuildStep {
  return { action: 'pause', ...t.producer() };
}

function parseBuild(t: Tokens): BuildStep {
  const building = t.id('a building id');
  const builders = t.accept('with') ? t.number('a builder count') : undefined;
  t.keyword('from');
  const step: StepOf<'build'> = { action: 'build', building, from: t.node() };
  if (builders !== undefined) {
    step.builders = builders;
  }
  if (t.accept('then')) {
    step.then = t.node();
  }
  return withWalk(t, step);
}

function parseResearch(t: Tokens): BuildStep {
  const step: StepOf<'research'> = { action: 'research', tech: t.id('a technology id') };
  if (t.accept('at')) {
    step.at = t.id('a building id');
  }
  return step;
}

function parseMove(t: Tokens): BuildStep {
  const count = t.number('a villager count');
  const from = t.node();
  t.keyword('to');
  const step: StepOf<'move'> = { action: 'move', count, from, to: t.node() };
  return withWalk(t, step);
}

function parseRally(t: Tokens): BuildStep {
  const ref = t.producer();
  t.keyword('->');
  const step: StepOf<'rally'> = { action: 'rally', ...ref, to: t.node() };
  return withWalk(t, step);
}

const ACTIONS = new Map<string, (t: Tokens) => BuildStep>([
  ['produce', parseProduce],
  ['pause', parsePause],
  ['build', parseBuild],
  ['research', parseResearch],
  ['move', parseMove],
  ['rally', parseRally],
]);

function parseTrigger(t: Tokens): Trigger | undefined {
  if (t.peek()?.startsWith('@')) {
    const match = t.take('a time like @1:30', TIME);
    const seconds = Number(match[2]);
    if (seconds > 59) {
      throw new LineError(`seconds over 59 in ${quote(match[0])}`);
    }
    return { kind: 'time', seconds: Number(match[1]) * 60 + seconds };
  }
  if (t.accept('at')) {
    const count = t.number('a villager count');
    t.keyword('vils');
    return { kind: 'villagers', count };
  }
  return undefined;
}

function parseAction(t: Tokens, trigger: Trigger | undefined): BuildStep {
  const word = t.peek();
  const parse = word === undefined ? undefined : ACTIONS.get(word);
  if (!parse) {
    throw new LineError(`expected ${trigger ? 'an action' : 'a trigger or action'}, got ${quote(word)}`);
  }
  t.accept(word);
  const step = parse(t);
  return trigger ? { trigger, ...step } : step;
}

function parseStart(t: Tokens): BuildStart {
  const start: BuildStart = {};
  while (NUMBER.test(t.peek() ?? '')) {
    const count = t.number('a villager count');
    const node = t.node();
    start.villagers ??= {};
    if (Object.hasOwn(start.villagers, node)) {
      throw new LineError(`repeated start node ${quote(node)}`);
    }
    start.villagers[node] = count;
  }
  if (t.accept('->')) {
    start.rally = t.node();
  }
  if (start.villagers === undefined && start.rally === undefined) {
    throw new LineError(`expected a villager count or '->' after 'start', got ${quote(t.peek())}`);
  }
  return start;
}

export function parseBuildOrderText(text: string): ParseTextResult {
  const steps: BuildStep[] = [];
  const lines: BuildOrderLines = { steps: [] };
  const issues: BuildOrderIssue[] = [];
  let start: BuildStart | undefined;
  let sawStart = false;
  let sawStep = false;

  text.split('\n').forEach((raw, index) => {
    const line = index + 1;
    const tokens = raw.split(WHITESPACE).filter((token) => token !== '');
    if (tokens.length === 0 || tokens[0].startsWith('#')) {
      return;
    }
    let isStart = false;
    try {
      const t = new Tokens(tokens);
      const trigger = parseTrigger(t);
      if (t.accept('start')) {
        isStart = true;
        if (trigger) {
          throw new LineError(`'start' takes no trigger, got ${quote(tokens[0])}`);
        }
        if (sawStart) {
          throw new LineError(`second 'start' line`);
        }
        if (sawStep) {
          throw new LineError(`'start' must come before every step`);
        }
        const parsed = parseStart(t);
        t.end();
        start = parsed;
        lines.start = line;
      } else {
        const step = parseAction(t, trigger);
        t.end();
        steps.push(step);
        lines.steps.push(line);
      }
    } catch (error) {
      if (!(error instanceof LineError)) {
        throw error;
      }
      issues.push({ code: 'syntax', message: `line ${line}: ${error.message}`, line });
    }
    sawStart ||= isStart;
    sawStep ||= !isStart;
  });

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  const order: BuildOrder = { civ: 'english', name: PASTED_ORDER_NAME, steps };
  if (start !== undefined) {
    order.start = start;
  }
  return { ok: true, order, lines };
}

function words(...parts: (string | undefined)[]): string {
  return parts.filter((part) => part !== undefined).join(' ');
}

function ref(producer: string, instance: number | undefined): string {
  return instance === undefined ? producer : `${producer}#${instance}`;
}

function walk(seconds: number | undefined): string | undefined {
  return seconds === undefined ? undefined : `walk ${seconds}s`;
}

function formatStart(start: BuildStart): string | undefined {
  const villagers = start.villagers ?? {};
  const parts = GATHER_NODE_ORDER.filter((node) => villagers[node] !== undefined).map((node) => `${villagers[node]} ${node}`);
  if (start.rally !== undefined) {
    parts.push(`-> ${start.rally}`);
  }
  return parts.length > 0 ? `start ${parts.join(' ')}` : undefined;
}

function formatTrigger(trigger: Trigger | undefined): string | undefined {
  switch (trigger?.kind) {
    case 'time':
      return `@${formatMinSec(trigger.seconds)}`;
    case 'villagers':
      return `at ${trigger.count} vils`;
    default:
      return undefined;
  }
}

function formatAction(step: BuildStep): string {
  switch (step.action) {
    case 'produce':
      return words(
        'produce',
        step.unit,
        'from',
        ref(step.producer, step.instance),
        step.count === undefined ? undefined : `x${step.count}`,
        step.rally === undefined ? undefined : `-> ${step.rally}`,
        walk(step.walkSeconds),
      );
    case 'pause':
      return words('pause', ref(step.producer, step.instance));
    case 'build':
      return words(
        'build',
        step.building,
        step.builders === undefined ? undefined : `with ${step.builders}`,
        'from',
        step.from,
        step.then === undefined ? undefined : `then ${step.then}`,
        walk(step.walkSeconds),
      );
    case 'research':
      return words('research', step.tech, step.at === undefined ? undefined : `at ${step.at}`);
    case 'move':
      return words('move', String(step.count), step.from, 'to', step.to, walk(step.walkSeconds));
    case 'rally':
      return words('rally', ref(step.producer, step.instance), '->', step.to, walk(step.walkSeconds));
    default:
      return String((step as { action?: unknown }).action);
  }
}

// Total: never throws. Numbers print as String(n), so only non-negative integer orders re-parse equal.
export function formatBuildOrderText(order: BuildOrder): string {
  const out: string[] = [];
  const start = order.start === undefined ? undefined : formatStart(order.start);
  if (start !== undefined) {
    out.push(start);
  }
  for (const step of order.steps) {
    out.push(words(formatTrigger(step.trigger), formatAction(step)));
  }
  return out.join('\n');
}
