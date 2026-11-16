# SGS-175 spec gate 1

**Verdict: NEEDS_SPEC** (one gap, easy fix)

## Gaps

1. **Scope / Docs (check 11)** - README.md line 14 at origin/main reads `| StarCraft helper | /apps/starcraft-helper | none |` under the "Design doc" column. Once `docs/starcraft-helper.md` lands that cell is false. The ticket excludes README ("the README entry-point rewrite links it later") and its Out of scope says README has "no StarCraft text to fix", which is wrong. An implementer either leaves a known-false cell or guesses. Proposed fix: put a one-cell README edit in Scope (`[docs/starcraft-helper.md](docs/starcraft-helper.md)`), drop the README exclusion and the "link from no file" sentence, and change the criterion "No file other than docs/starcraft-helper.md changes" to "only docs/starcraft-helper.md and the README StarCraft row change; no code or test file changes". Alternative: keep README out and state that the false cell is accepted until the backlog rewrite, but that violates check 11.

## Notes (non-blocking)

- Every code claim in Scope that I spot-checked matches `pages/apps/starcraft-helper.js` at origin/main. These were `partnerArray` (3 names), `mapArray` (9 maps), the sorted "a vs. b" output, the `GetNewPartners` retry loop, the `disabled={checked.length > 2 && ...}` rule, `[...checked, map]` as the ban list, `FAILURE` only when all are banned, and `DEFAULT_MAP_POSITION` unused. `shuffle` is a Fisher-Yates swap (H3 holds) and `.checkedItem` exists in `styles/utils.module.css`.
- The reachability arithmetic is correct: at most 4 of 9 banned, and the all-banned case needs a cap of 8 or more.
- The criterion "every sentence is true of the file" is acceptable for a Docs ticket. The code identifiers it names (`GetNewPartners`, `getMapText`) appear in Scope and criteria. Criteria 3-5 state behavior and are fine.
- The "No file other than ..." criterion should say explicitly that the On merge edits (CONTEXT.md, REPO.md, BACKLOG.md) are factory-state files outside the PR. As written it reads as contradicting On merge.
- Invariants H1-H3, Risk, Unverified assumptions (none, no external service), Open questions (none) and Diagrams (none needed) check out. H2's "tell the user plainly" is not met by the code; the ticket handles this correctly by documenting unreachability per the owner answer.
- A test reading the doc or the README row: none found, and no tests depend on the change.
