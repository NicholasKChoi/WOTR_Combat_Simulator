# SGS-171 docs report 1

- Ticket: SGS-171. Branch: `sgs-171-split-aoe4-build-order-doc`. Tip: `124dc82cec45123fcd2ad9ab58d98fdea5aad4d9`.
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-171-split-aoe4-build-order-doc`
- Status: needs_review

## Docs touched

- `docs/aoe4-build-order.md`: keeps the model sections; new intro (reference reviews judge against, links to the other two); 3 cross-file refs turned into links.
- `docs/aoe4-build-order-format.md` (new): `#` title and intro; Build order input, Route (Builds routes, Named builds routes), Outputs text.
- `docs/aoe4-build-order-ui.md` (new): `#` title and intro; `## Page` and its three subsections (rebased `####` to `##`).
- `ARCHITECTURE.md`: App design doc row, Rules "Game rules" bullet, add-an-app step 1.

## Heading map (base heading -> doc)

- model doc: Purpose and model; Determinism, bounds and resources; Data sources; Model rules; Depletion; Severity; Technologies; CivRules seams; Extension points.
- format doc: Build order input; Route; Builds routes; Named builds routes; Outputs (its own text, up to Page).
- ui doc: Page; Saving a build and opening it by link; Saving a build from a script; Checking a deployment with the smoke test.
- The body text was moved by line range, with no wording change except the items below.

## Doc claims (sentences added or changed)

- Model intro: "The model the build order simulator follows, the data it reads, its input limits and bounds, and the seams for extending it. This is the reference reviews judge the simulator's behavior against." The model doc holds those sections; the old intro made the same judging claim.
- Format intro and UI intro: new descriptions of the sections each now holds, with links to the sibling docs. They name only the sections listed in the heading map. The format intro keeps "`docs/api/openapi.json` is the authoritative request and response contract", which is the existing Route sentence at the start of Route.
- Link conversions (text otherwise unchanged): model "reasons table (Outputs)" to `aoe4-build-order-format.md#outputs`; model "validation rules in Issues" to `#build-order-input`; model "(see Page)" to the page doc; format "see Starting state" and "Houses and supply" to `aoe4-build-order.md#model-rules`; format "See Severity" to `aoe4-build-order.md#severity`; format "see Page" to `aoe4-build-order-ui.md#page`. Each target is the section named at the base.
- ARCHITECTURE.md: the design doc may be `docs/<app>.md` or `docs/<app>-<topic>.md` files; a rules change updates "the `docs/<app>*.md` file that states the rule". This matches the split done here.

## Reflowed paragraphs (every condition and outcome kept)

- UI, step table open flags: now nine bullets, covering the initial state of a row with no flag, move, delete, add, an action change, any other table edit, the textarea or prebuilt-build edit, unparseable text, and survival across Text/Table switches, unparseable and back, and the Build/Results tabs.
- UI, pinned run on load: bullets for an invalid stored value, a text that no longer converts, a non-ok response, a network failure (keeps the stored pin, shows none), and a Pin or Unpin before the re-run finishing wins.
- UI, dimming rule: bullets for text/duration differing (including the 500 ms and `updating`), `invalid`/`rejected`/`failed`, and a select-only change not dimming. The `aria-describedby` sentence is unchanged.
- Format, check tiers: bullets for the field, cross-field, cross-step and `start` tiers, then the two trailing consequences.
- Not reflowed: other long paragraphs (the layout opening paragraph, the Page chart paragraphs). I did not find a chain I could split with certainty that no rule changed. A reviewer may name more.

## Removed claims

None.

## Search for stale references

- `grep -rn 'aoe4-build-order\.md\|docs/aoe4'` over the repo (excluding node_modules, .next, .git) finds no reference outside the docs and `ARCHITECTURE.md`. `ARCHITECTURE.md` has only the generic `docs/<app>.md` rows, now updated.
- The ticket's `README*`, `scripts/` and `acceptance/` search found no match.

## CONTEXT.md Design docs rows

The AoE4 build order row names three docs:

- `docs/aoe4-build-order.md`: simulation model, data sources, determinism and bounds, depletion, severity, technologies, seams; the doc reviews judge behavior against.
- `docs/aoe4-build-order-format.md`: build order input (JSON and paste), issues, routes, and the outputs including timing and wait reasons. `docs/api/openapi.json` stays the contract.
- `docs/aoe4-build-order-ui.md`: page behavior, saving and opening builds, script save, smoke test.

The old "timing outputs" authority is now in the format doc (Outputs).

## Lint, codegen, link check

- Lint (`tsc`, `lint:dup`) not run: docs only, no code, and `commands.codegen` is empty.
- Link check by hand: every `](...)` link in the three docs resolves to an existing file and heading (the anchors `#model-rules`, `#severity`, `#outputs`, `#build-order-input`, `#page`, `#route` all exist; checked with `grep '^## '`). `ARCHITECTURE.md` has no markdown links I added. No automated link checker exists in the repo.
- `git diff --name-only main...HEAD` lists only `ARCHITECTURE.md` and the three docs.

## Out-of-scope findings

- Within the Page text, "see below" and "above" references stay in the same file (the build select, save status, `?n=`/`?b=` links, dimming rule, chart layout), so they are unchanged.
- The model doc's "Starting state and population" and "Houses and supply" are bold paragraphs inside Model rules, not headings, so the cross-file links go to `#model-rules`.
