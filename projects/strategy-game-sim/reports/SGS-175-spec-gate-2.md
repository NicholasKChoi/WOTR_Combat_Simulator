# SGS-175 spec gate 2

**Verdict: READY**

The one gap from gate 1 is closed. Scope now carries a one-cell README edit. The file-change criterion allows only the new doc and that cell. On merge says its edits are factory-state files outside the PR.

## Checked at origin/main

- README.md line 14 reads `| StarCraft helper | /apps/starcraft-helper | none |`. The other rows use the form `[docs/x.md](docs/x.md)`, so "same form as the other rows" is unambiguous.
- `pages/apps/starcraft-helper.js` was re-read in full. Every Scope claim matches it:
  - `partnerArray` has 3 names and `mapArray` has 9 maps.
  - `GetVsText` shows the first two of the shuffled list, sorted, as "a vs. b".
  - The `GetNewPartners` retry loop.
  - The `disabled={checked.length > 2 && !checked.includes(item)}` rule.
  - The ban list is `[...checked, map]`.
  - `FAILURE` is returned only when every map is banned.
  - `DEFAULT_MAP_POSITION` is unused.
  - State starts as the empty string.
- Reachability arithmetic is correct: at most 3 struck plus the shown map is 4 of 9 banned. The all-banned case needs a strike cap of 8 or more.
- `docs/starcraft-helper.md` does not exist yet, so it is new, as the ticket says.
- No test reads the README row or the doc, as found in gate 1.
- The remaining checks pass: Risk, Invariants H1-H3, Unverified assumptions (none, no external service), Open questions, Diagrams, and a docs-only change well under the size limit.

## Notes (non-blocking)

- The README-cell criterion says "links the new doc". Using `[docs/starcraft-helper.md](docs/starcraft-helper.md)` matches the sibling rows.
- Criterion 1 ("every sentence is true of the file") is acceptable for a Docs ticket and is reviewable by reading the code.
