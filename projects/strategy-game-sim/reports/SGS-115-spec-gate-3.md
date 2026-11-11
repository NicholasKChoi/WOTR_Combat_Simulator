# SGS-115 spec gate, round 3

Verdict: READY

Scope of this round: re-spec 2 changes only (criterion 2 and the precondition line at ticket line 77-85). The rest was
passed in round 2 and is unchanged.

## Checked

- Branch `sgs-115-split-scroll` tip 637e1ad: `acceptance/aoe4-split-scroll.spec.ts` line 67 is exactly the text the ticket
  calls "today" (`document.documentElement.scrollHeight > window.innerHeight`), so the verbatim replacement is
  unambiguous. (Path is repo-root `acceptance/`, matching the ticket's `acceptance/aoe4-split-scroll.spec.ts`.)
- `.column` in `workbench.module.css` line 26 has `overscroll-behavior: contain`, so the mutation step is well defined.
- The page starts at `scrollY` 0 (`openPage`, no scrolling in `openLongBuild`), and the split workbench is one viewport
  high below the bar, so the page has room to scroll; the new precondition holds on the unmutated run and the wheel is
  meaningful. With `contain` removed, a wheel on a column already at its end chains to the window, so `window.scrollY`
  changes and the "unchanged" assertion fails, as the ticket predicts.
- The new precondition is observable (a poll on `scrollY < scrollHeight - innerHeight`), and the criterion states the
  mutation, the failing assertion and the recording duty. No stale numbers.
- Remaining checks 1, 3-13 unaffected by re-spec 2 (no new contracts, risk, docs or invariants touched).

## Notes (non-blocking)

- Round-2 notes still apply: criterion 8 "first element" wording (use document order), and the hover criterion should
  state the page scroll position.
