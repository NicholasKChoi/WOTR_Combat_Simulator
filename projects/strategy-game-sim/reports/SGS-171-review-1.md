# SGS-171 review 1

- Branch: `sgs-171-split-aoe4-build-order-doc`, tip `124dc82cec45123fcd2ad9ab58d98fdea5aad4d9`, base `origin/main`. Full review (not delta).
- Type: Docs. Diff: `ARCHITECTURE.md`, `docs/aoe4-build-order.md`, new `docs/aoe4-build-order-format.md`, new `docs/aoe4-build-order-ui.md`.

## Verdict: APPROVE

## Blocking findings

None.

## Method

- Diffed the base `docs/aoe4-build-order.md` against the concatenation of the three new docs (model + format + ui). Every hunk is one of: the three new intros, the two new `#` titles, the CivRules seams / Extension points block moving from the file's end to the model doc's end, 8 cross-file references turned into links (text otherwise unchanged), the four reflowed paragraphs, and the three `####` to `##` heading changes in the ui doc. No other line differs, so no other rule text changed or was lost.
- Read each reflowed paragraph against its base text clause by clause (below).
- Wrote and ran a link checker (GitHub-style slugs, fenced code skipped) over the three docs and `ARCHITECTURE.md`: 14 relative links, 0 missing files, 0 missing anchors.
- Grepped the three docs for `below`/`above` and for every moved section name; grepped the repo (excluding node_modules, .next, .git) for `aoe4-build-order.md` and the new names.

## Docs check (every changed sentence against the code / docs at tip)

- Model intro: "its input limits and bounds" - the model doc keeps "Determinism, bounds and resources" with the `SIM_INPUT_BOUNDS` table; "the reference reviews judge ... against" matches the base intro's claim. Links to format and page docs resolve. True.
- Format intro: names input (JSON, paste), issues, simulate/builds/named-builds routes, and the result; all are in the file (`## Build order input`, `**Issues.**`, `## Route`, `### Builds routes`, `#### Named builds routes`, `## Outputs`). Keeps "`docs/api/openapi.json` is the authoritative request and response contract", as the ticket requires. True.
- UI intro: layout, editor and step table, charts, pinning/comparing, saving and opening, "the script and smoke-test routes to the same save" - the smoke test's first step posts to the same builds route (ui doc `## Checking a deployment with the smoke test`, step 1). True.
- Reflow, step-table open flags (ui doc): all base clauses present - initial no-flag state, move swaps, delete removes, add starts closed, action change closes, other table edits leave flags (with the "value is cleared" consequence), textarea/prebuilt edit rule (open-or-now-sets, drop past last), unparseable text leaves flags, survival across Text/Table, unparseable-and-back, Build/Results tabs. Unchanged in meaning.
- Reflow, pinned run on load: invalid stored value ignored and left; non-converting text drops; non-ok (400/5xx) drops; network failure keeps the stored pin and shows none; Pin/Unpin before the re-run wins. Unchanged in meaning.
- Reflow, dimming: the base "That includes the 500 ms ... and while `updating`" is now attached to the text-or-duration bullet. Checked against `resultsStale` (`components/apps/aoe4-build-order/auto-run.ts:59-64`): staleness is `invalid`/`rejected`/`failed`, or live text/duration differing from `shown`; there is no separate `updating` term, so the attachment is accurate. "A change to the select alone does not dim" matches (`selected` is not read). True.
- Reflow, check tiers (format doc): four bullets carry the same four clauses and the two trailing consequences. Matches the base text word for word apart from list markup.
- Cross-file links: model "reasons table (Outputs)" -> `format#outputs`; "Issues" -> `format#build-order-input` (Issues is a bold paragraph inside that section); "(see Page)" -> `ui#page`; format "Starting state and population" and "Houses and supply" -> `model#model-rules` (both are bold paragraphs in Model rules); "Severity" -> `model#severity`; format "see Page" -> `ui#page`. Each target holds the referenced text.
- ARCHITECTURE.md: App design doc row, Rules bullet ("updates the `docs/<app>*.md` file that states the rule"), and Adding an app step 1 all allow a split matching `docs/<app>-<topic>.md`; the new files follow that pattern. No ARCHITECTURE.md sentence still says the design doc is a single file.

## Acceptance criteria

1. Three docs exist, each Scope section in its assigned doc - PASS (headings: model 9 sections; format Build order input, Route, Builds routes, Named builds routes, Outputs; ui Page and its three subsections).
2. No rule lost or added; heading map and reflow statement in the implementer's report - PASS (docs report "Heading map" and "Reflowed paragraphs"; whole-file diff above shows no other text change; reflows compared clause by clause).
3. Every markdown link/anchor in the three docs and ARCHITECTURE.md resolves - PASS (implementer checked by hand and recorded it; my scripted check: 14 links, 0 bad).
4. Each intro states its job and links the other two; model doc states it is the reference reviews judge against - PASS.
5. No "below"/"above" for a section in another doc - PASS (every remaining below/above refers to text in the same file: build select, save status, `?n=`/`?b=` links, dimming rule, Node references, step-life diagram, series, Extension points table, farm rule).
6. Open-flag paragraph is bullets; each named case findable - PASS (initial no-flag, move, delete, add, action change, other table edit, textarea/prebuilt edit each a bullet).
7. ARCHITECTURE.md row and Rules allow `docs/<app>*.md` - PASS.
8. Doc-wording search scoped to docs/ and ARCHITECTURE.md: no reference names the wrong file - PASS (grep finds `aoe4-build-order.md` and the new names only in the three docs; all moved-section names in the docs are either same-file or links to the right file).
9. Only `docs/` and `ARCHITECTURE.md` change; typecheck unaffected - PASS (`git diff --name-only origin/main...HEAD`; `tsc --noEmit` clean, `lint:dup` 0 clones). Unit suite not run: no code changed.
10. No INVARIANTS.md regressions - PASS. No invariant's `Paths:` covers `docs/**` or `ARCHITECTURE.md`; W1 names `docs/combat-simulator.md`, untouched.

## Invariants touched

None by path. A1-A3 (AoE4) unaffected: no code or data change; their doc statements ("Determinism, bounds and resources") are unchanged in the model doc.

## Lint

`npx tsc --noEmit && npm run lint:dup` in the review scratch: clean (0 clones in 162 files).

## Bot reconciliation

No `reviewBot.cli` or `rulesFile` in REPO.md; section skipped.

## Non-blocking notes

- `docs/aoe4-build-order-format.md:~716` - "Checks run in three tiers:" now introduces four bullets (field; per-step cross-field; cross-step; `start`). The sentence is unchanged from the base (which listed the same four in prose), and the code (`lib/aoe4-build-order/schema.ts`, `crossFieldProblems`/`startProblems` vs `crossStepProblems`) supports reading per-step and `start` rules as one tier, so it is not false. The bullets make the count mismatch more visible to a reader; a later docs pass could say "three tiers (step and `start` rules share the second)" if the owner wants. Out of this ticket's no-rewording scope.
- `docs/aoe4-build-order-ui.md:242,318,354` - the three subsections that were `####` under `### Page` are now `##` siblings of `## Page` rather than `###` children. The ticket's "re-based" reads most naturally as one level up for all (`###`), but the result is a well-formed doc and changes no rule. Optional.
- `docs/aoe4-build-order.md:535` (Extension points) - "plus its row in the validation kind table" refers to a table now in the format doc, unlinked. It names no section and uses no below/above, so no criterion covers it; a link to `aoe4-build-order-format.md#build-order-input` would help a reader.
- Only four paragraphs were reflowed; the implementer named others it left (layout opening paragraph, chart paragraphs). The ticket only requires the named open-flag paragraph; no further reflow demanded here.

## For the manager (state dir, not this diff)

- CONTEXT.md Design docs row: apply the On merge rows from the docs report (`SGS-171-docs-1.md`, "CONTEXT.md Design docs rows"); "timing outputs" authority moves to the format doc.
- REPO.md still says `docs/<app>.md` for the design doc (Conventions) and the AoE4 review checklist names only `docs/aoe4-build-order.md` as the design doc. Page/UI reviews should now judge against `docs/aoe4-build-order-ui.md`, and input/route/output reviews against `docs/aoe4-build-order-format.md`. Consider updating REPO.md alongside the CONTEXT.md On merge.

## Coverage

- Reviewed: all four changed files in full via the whole-file diff; reflowed paragraphs read line by line; `ARCHITECTURE.md` diff; `resultsStale` in `components/apps/aoe4-build-order/auto-run.ts`; `lib/aoe4-build-order/schema.ts` structure for the tiers sentence.
- UI inspection not run: docs-only diff, no rendered UI changes.
- REPO.md "Every diff" (`next build`, load touched pages): not applicable, no page or code touched. AoE4 build order checklist section: its paths (`lib/`, `components/`, `pages/`, `data/`) are not touched.
- Link check was scripted in the review scratch (`.review/links.cjs`, deleted with the scratch).
