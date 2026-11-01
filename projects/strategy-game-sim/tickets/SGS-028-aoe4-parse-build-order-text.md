# SGS-028: Parse and format the AoE4 build order paste text

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.4 (paste format)
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: changes a cross-component contract (the paste grammar is a public input and `ParseTextResult`/`BuildOrderLines` are the seam to validate and the route). Estimated 200-260 lines of business logic, over the 150-line trigger. -->
- **LOC estimate**: ~200-260 (new `lib/aoe4-build-order/parse-text.ts`: line tokenizer, per-action parsers, `start` parser, formatter; tests on top)
- **Depends on**: SGS-025 (doc grammar), SGS-026 (`BuildStart`, `rally` step, `BuildOrderLines` in `model.ts`)
- **On merge**: none
- **Source**: design/M2.md "Paste format", "Line map", Modules row `parse-text.ts`; reports/M2-designer-line-map.md; plan outline E (reports/M2-plan-2.md)

## Context

The page and the route accept a build order as paste text, one step per line, and the page seeds its textarea from a prebuilt `BuildOrder` through the formatter. This ticket turns text into a `BuildOrder` plus a line map, or into `syntax` issues that carry the line, and turns a `BuildOrder` back into text. Ids, bounds and cross-field rules are not its job (validate, SGS-029).

## Scope

New file `lib/aoe4-build-order/parse-text.ts` (no `parse-text.ts` exists on origin/main 68e004a). Types come from `model.ts` as SGS-026 defines them (`BuildOrder`, `BuildStart`, `BuildStep`, `Trigger`, `GatherNodeId`, `BuildOrderIssue`, `BuildOrderLines`); do not redefine them.

Exports, exactly as design/M2.md "Line map":

```ts
export type ParseTextResult =
  | { ok: true; order: BuildOrder; lines: BuildOrderLines }
  | { ok: false; issues: BuildOrderIssue[] }   // all code 'syntax', each with `line`
export function parseBuildOrderText(text: string): ParseTextResult
export function formatBuildOrderText(order: BuildOrder): string
```

Parse rules (grammar per design/M2.md "Paste format" and docs/aoe4-build-order.md as SGS-025 leaves it):

- Split on `\r\n` or `\n`; `\r\n` is one break. Line numbers are 1-based over every physical line, comments and blanks included. A line is ignored when it is blank or its first non-space character is `#` (whole-line comments only: `#k` inside a line is the instance suffix).
- Optional trigger prefix: `@m:ss` (`@\d+:\d\d`, seconds `00`-`59`, so `@1:61` is `syntax`, `@75:00` and `@60:00` parse) gives `{ kind: 'time', seconds: m*60+s }`; `at N vils` gives `{ kind: 'villagers', count: N }`; no prefix gives no `trigger`. Any other leading token is `syntax` (never `unknown-trigger-kind` for paste).
- Actions: `produce <unit> from <producer>[#k] [xN] [-> <node>] [walk Ns]`; `pause <producer>[#k]`; `build <building> [with N] from <node> [then <node>] [walk Ns]`; `research <tech> [at <building>]`; `move N <node> to <node> [walk Ns]`; `rally <producer>[#k] -> <node> [walk Ns]`. `produce` suffixes in any other order, `walk Ns` not last, a missing required part, trailing tokens, or an unknown action word are `syntax`.
- `produce ... -> node` sets `rally`; `walk Ns` sets `walkSeconds` (parsed even without `-> node`; the `invalid` rule is validate's). `with N` sets `builders`; `#k` sets `instance`; `xN` sets `count`.
- Tokens: ids and node names match `[a-z0-9]+(-[a-z0-9]+)*`, case-sensitive, never lowercased; keywords lowercase; numbers unsigned decimal integers (no sign, no decimals); `xN`, `walk Ns`, `#k` have no inner space; `->` is whitespace-delimited. A node name is not checked against `GatherNodeId` by the parser (validate reports `unknown-id`); the parser casts the well-formed string.
- `start [N <node>]... [-> <node>]` (at least one part): at most one, before every step line, no trigger prefix. Sets `order.start = { villagers?, rally? }`; `villagers` holds only the nodes listed. A repeated node, a second `start`, a `start` after a step line, a trigger prefix on `start`, or `start` with no parts is `syntax`.
- The parser does no id, bound or cross-field checks and imports neither `data.ts` nor `validate.ts`: `produce villager from x -> nowhere` parses; `@75:00` parses; zero or huge counts parse.
- Order metadata (respec 1): every `ok: true` order has `civ: 'english'` (the only `CivId`), `name: 'Pasted build order'` (this exact literal, per design/M2.md "Line map"), and no `source` key. The text has no civ or name line.
- Results: on success `lines.steps[i]` is the line of `order.steps[i]` and `lines.start` is present only when a `start` line exists (so `lines.steps.length === order.steps.length`). Design examples: `start 6 sheep -> sheep` / `# opener` / `@0:00 produce villager from capital-town-center x3` gives `{ start: 1, steps: [3] }`; steps on lines 1..5 with no `start` gives `{ steps: [1, 2, 3, 4, 5] }`. The returned order's `start` key is absent when there is no `start` line. Empty or comment-only text is `ok: true` with `steps: []` (validate and the route decide whether that is acceptable).
- On failure, collect every `syntax` issue (one per bad line, in line order, at most one per line), each with `line` and no `step`; the message names the line and the offending token. Parsing is a single linear pass (S3: no backtracking-prone regex on user text; the route caps text at 20,000 chars).

`formatBuildOrderText(order)` (respec 1): total, never throws. Emits `start` first when `order.start` is present and has at least one part (villager nodes in `GatherNodeId` order `sheep, berry, deer, boar, farm, wood, gold, stone`, then `-> node`), then one line per step in order with a prefix of `@m:ss` (seconds two digits; minutes not capped, so 3600 gives `@60:00`) or `at N vils`, and suffixes in the grammar order. It emits no comments and drops `civ`, `name` and `source`. It rounds nothing: every number prints as `String(n)`, so a decimal `walkSeconds: 4.5` prints `walk 4.5s` (which re-parses as `syntax`). Re-parse equality of `start` and `steps` is guaranteed only for paste-representable orders (every number a non-negative integer); the prebuilt builds' round trip is tested by the builds ticket, not here.

Doc and comments: docs/aoe4-build-order.md is updated by SGS-025 (grammar, examples); this ticket changes no doc. If the parser behavior above differs from that doc at implementation time, the doc wins and the ticket is bounced to re-spec, not silently diverged.

**Out of scope:** `validateBuildOrder`, `resolveSimInputs`, `SIM_INPUT_BOUNDS` (SGS-029); the route and the 20,000-char cap (SGS-033); the page; `model.ts` and the doc (SGS-026, SGS-025); any new issue code; trailing `# comment` after a step; community formats.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] `parseBuildOrderText` and `formatBuildOrderText` are exported from `lib/aoe4-build-order/parse-text.ts` with the `ParseTextResult` type above; `npx tsc --noEmit` passes.
- [x] (respec 1) Round trip: for a paste-representable order (every number a non-negative integer) that uses every action (`produce` with every suffix, `pause`, `build`, `research` with and without `at`, `move`, `rally`), both trigger kinds, `#k` instances and a `start` with `villagers` and `rally`, `parseBuildOrderText(formatBuildOrderText(order))` is `ok` and its `order.start` and `order.steps` deep-equal the input's.
- [x] (respec 1) Every `ok: true` result, including empty text, has `order.civ === 'english'`, `order.name === 'Pasted build order'`, and no `source` key (`'source' in order` is false).
- [x] (respec 1) `formatBuildOrderText` on an order with `civ`, `name` and `source` set emits none of them; on an order with `walkSeconds: 4.5` it returns a string containing `walk 4.5s` without throwing, and re-parsing that string gives a `syntax` issue on that line.
- [x] Line map: the two design examples above produce exactly `{ start: 1, steps: [3] }` and `{ steps: [1, 2, 3, 4, 5] }`; a text with `\r\n` breaks, blank lines and comments puts each step's physical line in `lines.steps`; a `start` line absent yields no `start` key in `lines`.
- [x] Each grammar error is a `syntax` issue carrying `line` and no `step`, with a test per case: `@1:61`; unknown prefix word; unknown action; `produce` suffixes out of order (`walk 4s` before `x3`); `walk 4 s` (space) and `walk 4.5s`; uppercase id (`Villager`); negative or decimal number; missing `from`; missing `->` target on `rally`; trailing tokens. `@60:00` and `@75:00` parse `ok`.
- [x] `start` rules: `start 4 sheep 2 wood -> sheep` parses to `{ villagers: { sheep: 4, wood: 2 }, rally: 'sheep' }`; `start -> sheep` and `start 6 sheep` parse; `start` alone, a repeated node (`start 2 sheep 3 sheep`), a second `start`, a `start` after a step line, and `@0:00 start 6 sheep` are each `syntax` with the offending line.
- [x] Multiple bad lines yield one issue each, in line order, and no `ok: true`.
- [x] No cross-checks: `produce villager from capital-town-center -> nowhere walk 4s` and `@75:00 produce villager from nowhere x999` parse `ok` with the literal values (no `unknown-id`, `out-of-range` or `invalid`).
- [x] `git grep -nE "from '\./(data|validate)'" -- lib/aoe4-build-order/parse-text.ts` finds nothing.
- [x] `formatBuildOrderText` puts `start` first with nodes in `GatherNodeId` order regardless of key order in the object, and omits it when `start` is `{}` or absent.
- [x] A 20,000-character input (many valid lines, and one long line of 20,000 non-matching characters) parses in well under 100 ms (guards backtracking).
- [x] Unit tests in `lib/aoe4-build-order/parse-text.test.ts`; `npm test` passes.
- [x] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-10-31

- Underspecified: the `civ`/`name`/`source` of a parsed order and the formatter's behavior on non-integer numbers.
- Changed: Scope and criteria now fix `civ: 'english'`, `name: 'Pasted build order'`, no `source`; the formatter is total, drops `civ`/`name`/`source`, prints numbers with `String(n)`, and guarantees round trip only for non-negative-integer orders. Both open questions closed per design/M2.md.
- Branch work: none exists for this ticket; nothing to keep or discard.
