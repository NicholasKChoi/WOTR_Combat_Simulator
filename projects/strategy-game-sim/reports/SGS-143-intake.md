# SGS-143 lane intake

Type: Bug
Priority: medium
Milestone: none
Working title: Run bar: focus ring clipped in the capped bar; useRunBarHeight ceil leaves 1px
Source: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md)

Backlog bullets:

- components/apps/aoe4-build-order run bar (.runBar): focusing a control scrolled into the capped bar clips the top of its focus ring; `scroll-padding-block: 0.25rem` fixes it. Also `overflow-anchor: none` applies at narrow/tabs widths too - designer may want anchoring kept there. Reported by SGS-133 review-1.
- `useRunBarHeight` rounds with `Math.ceil`, which can leave the document 1px short of the bar page top; SGS-133/141 will be sensitive when bar height changes (SGS-132 implementer).
