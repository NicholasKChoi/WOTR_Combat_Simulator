# SGS-176: Add one-line doc comments to exported lib/ functions and types

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: W1 and W2 (paths `lib/combat-simulator/**`) and the AoE4 simulation invariants on `lib/aoe4-build-order/**` are adjacent by path only; comments change no behavior
- **Unverified assumptions**: none
- **LOC estimate**: 280 (one comment line per exported function or type; snapshot: about 310 `export` lines under `lib/` at origin/main, of which about 32 are in the excluded test-support modules; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md bullet "One-line doc comments on exported `lib/` functions" (owner docs review in chat, 2026-11-15)

## Context

Few exported `lib/` symbols say what they do or which design-doc section they implement (snapshot at origin/main, not a coverage list: `parse-text.ts`, `named-builds-routes.ts`, `battle.ts` and `data-schema.ts` have many exports and almost no comments). A reader has to open the body to learn the job. The change is comments only; no behavior changes. The component field names the larger of the two owners; the change also touches `lib/combat-simulator/**` (wotr-combat-simulator).

## Scope

Behavior-neutral: this ticket changes no behavior the owner sees.

- For every exported function, class, constant, and type in the source files under `lib/combat-simulator/` and `lib/aoe4-build-order/` (the file set is defined below), add a one-line `/** ... */` comment directly above it that names its job. Where the symbol implements a rule or section in `docs/combat-simulator.md` or `docs/aoe4-build-order.md`, the comment names that section by its heading. Where no section applies, say nothing about one.
- Start with the files named in the backlog item (examples: `parse-text.ts`, `named-builds-routes.ts`, `battle.ts`, `data-schema.ts`), then cover every other file with exports (`model.ts`, `schema.ts`, `named-builds.ts`, `saved-builds.ts`, `depletion.ts`, `simulate.ts`, and so on); the file list is found by searching `export` in `lib/`.
- An export that already has an adjacent comment (for example the one above `formatBuildOrderText` in `parse-text.ts`) keeps its fact. If that comment already states the job, leave it as is; otherwise turn it into the `/** */` comment or extend it. Editing or deleting such an existing comment above an export is allowed so that two comments never say the same thing; no code line changes.
- File set: every `lib/**/*.ts` file except `*.test.ts` (this covers `*.acceptance.test.ts` and `*.live.test.ts`) and the three test-support modules `lib/aoe4-build-order/test-helpers.ts`, `route-test-support.ts` and `blob-fake-test-helpers.ts`, which are out of scope like test files.
- A single `export` statement that declares several names (`export const a = 1, b = 2` or `export { a, b }` of local symbols) gets one comment above the statement naming each job. For an overload group, comment the first signature only.
- Follow common.md Comment bar: state the job, not the name. A comment that only restates the identifier (`/** Parses the text. */` over `parseText`) does not count. Where a symbol is obvious and a section heading is the only fact worth stating, state that. Skip re-exports (`export { x } from`) and exports whose job is already fully stated by an adjacent comment.
- Do not rename, move, reorder, or edit any code line. Do not add, remove, or edit comments inside function bodies.
- Do not put ticket ids, invariant numbers, or factory file names in the comments.
- Generated or data files (`.json`), test files, and the three test-support modules above are out of scope.

**Out of scope:** behavior or signature changes; `components/`, `pages/`, `utils/`, `acceptance/`; test files; comments on non-exported symbols; editing the design docs; any refactor the comments suggest.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Every exported function, class, constant, and type in the file set defined in Scope has a `/** */` comment directly above it, except (a) re-export statements (`export ... from`, including multi-line `export type { ... } from`) and (b) symbols whose adjacent existing comment already states the job. A reviewer lists `export` lines whose preceding line does not end a comment and checks each against these two exemptions. (respec 1)
- [ ] Each added comment states the symbol's job, and names the design-doc section heading when one covers it; none merely restates the identifier. Every heading a comment quotes exists verbatim in `docs/combat-simulator.md` or `docs/aoe4-build-order.md`, and no comment cites a heading the symbol does not implement. (respec 1)
- [ ] The diff against the base changes only comment lines in `lib/`: comment lines may be added, and existing comment lines above exports may be edited or removed per Scope; no code line is added, removed, or changed, and no file outside `lib/` is touched. (respec 1)
- [ ] `npx tsc --noEmit` and `npm test` pass, and no test file is edited (pre-existing tests keep their assertions).
- [ ] No comment contains a ticket id, invariant number, or factory file name. (respec 1)

## Open questions

none

## Re-spec 1 - 2026-11-15

- Underspecified: whether existing comments may be edited or removed, whether test-support modules are in scope, how multi-name and re-export statements count, and stale snapshot numbers.
- Changed: criteria 1 to 3 now define the file set, the exemptions, and comment-only edits; headings must exist verbatim; the INVARIANTS criterion is removed; counts are labeled snapshots.
- Stands: no branch work existed.
