# SGS-171 spec gate 1

Verdict: READY

Checked at origin/main (git fetch done). Read-only; no scratch checkout made.

## Checks
- Grounded scope: every section named exists at the base (Purpose and model, Determinism, Data sources, Model rules, Depletion, Severity, Technologies, Build order input, Route, Builds routes, Named builds routes, Outputs, Page, the three Page subsections, CivRules seams, Extension points). The doc is 1297 lines. The open-flag paragraph starts at line 961 as quoted, and the ARCHITECTURE.md rows named exist (line 30 App design doc row, line 46 Rules, line 63 add-an-app step).
- Criteria are observable: file and heading checks, a link check, a `git diff --name-only` check, and a bullets-or-table check. None is a code search, and no number or list goes stale.
- No code, test, or data change, so no test depends on it. Risk `standard` and Invariants `none` fit a docs-only change, although the AoE4 invariants A1-A3 are adjacent, and the "No rule is lost" criterion covers them.
- Docs: the CONTEXT.md Design docs row (line 35) is handled through On merge, and the ARCHITECTURE.md rows are in Scope. No file outside the doc references `aoe4-build-order.md` or its sections.
- On merge uses the `;`-separated form correctly.

## Notes (non-blocking)
1. Scope says the base search finds a reference in `ARCHITECTURE.md`. It finds none. ARCHITECTURE.md only has the generic `docs/<app>.md` rows. The implementer's rerun is correct either way.
2. Many cross-references in the model doc use a section name, not "below" or "above". They now cross files: "see Page" (Severity, around line 457 and line 850) and "see Node references" and "see Paste format" (Build order input, around lines 518-519 and 657, which stay together in the format doc). Scope's "inbound references re-pointed" covers the cross-file ones. The implementer should turn each of them into a relative link, not only the ones that say "see below". Consider adding "name-only references that now cross files also become links" to Scope.
3. The open-flag criterion lists seven things a reader must find. The paragraph also says that unparseable text leaves the flags unchanged and that the flags survive Text/Table and tab switches. The "keeps every condition and outcome" criterion covers these. Say that the list is a minimum.
4. The "below"/"above" criterion applies to all three docs, but Scope only names the Page text. Model-doc uses such as "the trip model below" (around line 106) and "farm (below)" (around line 423) stay within the model doc, so they are fine. Page uses such as "see below" and "see the dimming rule below" stay within the UI doc. Only a Page sentence that points at the format or model docs needs a link.
