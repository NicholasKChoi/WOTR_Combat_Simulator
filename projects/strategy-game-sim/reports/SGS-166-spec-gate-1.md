# SGS-166 spec gate 1

**Verdict: READY**

Checked at origin/main.

- Grounded scope: ARCHITECTURE.md has a "Rules" section (line 39) that already names `acceptance/helpers.ts`. `scrollInstantly` exists at acceptance/helpers.ts:228 and `settledScrollY` at :236. The step-band spec scrolls with `scrollIntoView({ behavior: 'instant' })` at line 160, then hovers.
- Criteria are observable: the bullet states the rule and the reason, and names two files that exist. No search over code, no pinned counts, no quoted code names beyond the two examples the ticket explicitly asks to be named.
- README.md has no statement about acceptance scrolling, so it needs no change.
- No open questions, no invariants touched, no dependencies, no code. Risk low is right. On merge `none` is fine.
- Docs and other checks: no conflict found. The other checklist items do not apply to a one-bullet doc change.

## Notes (non-blocking)

- `scrollInstantly(page, top)` scrolls the window to a y offset. It does not scroll a target into view. The step-band spec uses an element `scrollIntoView` with `behavior: 'instant'`, not that helper. The ticket says "or", but the implementer should word the bullet so it does not suggest the helper scrolls to a target: for example "scroll to the targets instantly (element `scrollIntoView({ behavior: 'instant' })`, or `scrollInstantly` for a window offset)".
- The smooth-scroll source is not in repo CSS: `git grep scroll-behavior` finds nothing. It comes from Bootstrap. The bullet can say "the site's Bootstrap stylesheet scrolls smoothly".
