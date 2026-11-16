# SGS-171: Split the AoE4 build order design doc into model, format, and UI docs

- **Type**: Docs
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: standard
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 0 (docs only; about 1,300 doc lines are moved, and the longest condition-chain paragraphs are reflowed)
- **Depends on**: none
- **On merge**: CONTEXT.md Design docs table: the AoE4 build order row names the three docs and what each is authoritative for
- **Source**: BACKLOG.md "Split `docs/aoe4-build-order.md` into model, format, and UI docs" (owner docs review, 2026-11-15)

## Context

`docs/aoe4-build-order.md` is one file of about 1,300 lines that mixes the game model and rules, the text
format and API, and about 350 lines of page behavior. The owner wants it split so each doc has one job.
CONTEXT.md names this doc authoritative for the simulation model, data source, and timing outputs, and
reviews judge behavior against it, so no rule may change or be lost in the move.

## Scope

Base is `origin/main`. This ticket changes no code and no rule; it moves and reflows text.

Split `docs/aoe4-build-order.md` by section (headings as they read at the base):

- `docs/aoe4-build-order.md` keeps the model and rules: Purpose and model, Determinism bounds and resources,
  Data sources, Model rules, Depletion, Severity, Technologies, CivRules seams, Extension points. It stays the
  doc reviews judge against, and its intro says so and links to the other two.
- New `docs/aoe4-build-order-format.md`: Build order input, Route (with Builds routes and Named builds
  routes), and the Outputs section's own text, up to the start of its Page subsection.
- New `docs/aoe4-build-order-ui.md`: the Page subsection with its saving, script-save, and smoke-test
  subsections. Heading levels are re-based so each new doc is a well-formed doc with its own `#` title and
  intro.
- A sentence in the Page text that says "see below" or "see above" and now crosses a file becomes a relative
  link to the section in the other doc. Cross-references inside one file stay. Every moved section's inbound
  references from the other docs are re-pointed.
- Rewrite the longest condition-chain paragraphs as bullets or tables without changing any rule. The step
  table open-flag paragraph in the Page text (starts "The page keeps one open flag per step row") is the named
  example; find the others by reading for paragraphs whose sentences chain three or more conditions. Each
  rewrite keeps every condition and every outcome.
- Docs that the split makes untrue:
  - `ARCHITECTURE.md`, "App design doc" row of the layout table: it names a single `docs/<app>.md`.
  - `ARCHITECTURE.md`, Rules ("Game rules live in the design doc") and the add-an-app steps that say "Write
    `docs/<app>.md`": an app's design doc may span `docs/<app>*.md`, and a rules change updates whichever of
    them states the rule.
  - `CONTEXT.md` Design docs table (state-dir, applied through On merge).
  - Search `docs/`, `ARCHITECTURE.md`, `README*`, code comments, `scripts/`, and `acceptance/` for the names of
    the moved sections and for `aoe4-build-order.md`, and fix every reference that now points at the wrong
    file. At the base the search finds no reference outside `ARCHITECTURE.md` and the doc itself; the
    implementer reruns it, since sibling tickets may add some.
- `docs/api/openapi.json` is a contract, not a design doc. Leave it, but keep the doc's statement that it is
  authoritative with the Route text in the format doc.

**Out of scope:** any rule, value, or behavior change; code and test edits; editing `docs/combat-simulator.md`;
rewording rules beyond the condition-chain reflow; editing BACKLOG.md or the graph.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Three docs exist: `docs/aoe4-build-order.md`, `docs/aoe4-build-order-format.md`, `docs/aoe4-build-order-ui.md`. Each section named in Scope sits in the doc Scope assigns it.
- [ ] No rule is lost or added: the implementer's report lists, for each heading at the base, the doc it moved to, and states that the reflowed paragraphs keep every condition and outcome. Reviewers compare the old and new text paragraph by paragraph for the reflowed ones.
- [ ] Every markdown link and anchor in the three docs, and in `ARCHITECTURE.md`, resolves to an existing file and heading (checked with a link-check run in the implementer's checkout, result recorded in the report).
- [ ] The intro of each doc states its job and links the other two; the model doc states it is the reference reviews judge behavior against.
- [ ] No sentence in any of the three docs relies on "below" or "above" for a section that is in another doc.
- [ ] The step-table open-flag paragraph is no longer a single paragraph of chained conditions; its rules read as bullets or a table, and a reader can find each of: the initial state of a row with no flag, move, delete, add, an action change, any other table edit, and the textarea or prebuilt-build edit.
- [ ] `ARCHITECTURE.md` App design doc row and Rules allow an app's design doc to span `docs/<app>*.md`; no ARCHITECTURE.md sentence still says the design doc is a single `docs/<app>.md` file for this app.
- [ ] Doc-wording search, scoped to `docs/` and `ARCHITECTURE.md`: no reference to a moved section names the wrong file.
- [ ] No code, data, or test file changes (`git diff --name-only origin/main...HEAD` lists only `docs/` and `ARCHITECTURE.md`); the unit suite and typecheck are unaffected.
- [ ] No INVARIANTS.md regressions

## Open questions

none
