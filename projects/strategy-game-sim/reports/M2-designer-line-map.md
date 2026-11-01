# M2 designer: line map (planner spec gap T1)

Seam: planner proposal accepted, with the third argument as an options object so the later `rules` (T3) is additive.

Names (copy verbatim):
- `model.ts` (SGS-026): `interface BuildOrderLines { start?: number; steps: number[] }`, 1-based, `steps[i]` = line of `order.steps[i]`, `start` absent = no start line.
- `parse-text.ts` (SGS-028): `parseBuildOrderText(text): ParseTextResult`; `type ParseTextResult = { ok: true; order: BuildOrder; lines: BuildOrderLines } | { ok: false; issues: BuildOrderIssue[] }`.
- `validate.ts` (SGS-029): `interface ValidateOptions { lines?: BuildOrderLines }`; `validateBuildOrder(input: unknown, data: GameData, options?: ValidateOptions)` (return shape left to the ticket).
- Route (SGS-033): text -> parse; `ok: false` -> 400 with its issues; else `validateBuildOrder(r.order, data, { lines: r.lines })`; JSON -> `validateBuildOrder(buildOrder, data)`; `resolveSimInputs` issues never carry `line`.

Rules: lines count every physical line incl. comments/blanks, `\r\n` one break; sample `start 6 sheep -> sheep` / `# opener` / `@0:00 produce ...` -> `{ start: 1, steps: [3] }`; no start, steps on lines 1..5 -> `{ steps: [1, 2, 3, 4, 5] }`; `lines.steps.length === order.steps.length`; a missing entry omits `line`.

design/M2.md edits: Modules rows model.ts, parse-text.ts, validate.ts; model.ts block (`BuildOrderLines`); new "Line map" subsection before Issue codes; Route flow sentence; Data flow edge label. No other contract changed.
