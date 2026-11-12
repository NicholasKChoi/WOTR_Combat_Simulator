# SGS-140 ticket re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-140-editor-compact-mode.md
Findings: reports/SGS-140-spec-gate-1.md (NEEDS_SPEC, 2 gaps, 7 notes)

## Summary

SGS-140, "Add a compact text-editor mode below 48rem of editor width", aoe4-build-order, about 40 LOC of CSS plus a test id in `build-text-editor.tsx` and at most a class in `step-annotation.tsx`. Depends on SGS-128. It covers M9.8. A container query on `.editor` switches the editor to compact mode below 48rem: the font drops to 0.875rem, the annotation column narrows to 8ch, and the gutter finish time is hidden. 11 criteria: textarea width at 390x844 and at 1280x800 (48-char probe), the wide layout unchanged, the gutter-only hide, row alignment, the highlight and stale tone kept, rules for editing tests, docs, gates, and invariants.

## Gaps folded in

1. Annotation span font: now 0.8 times `--editor-font-size` in both modes. It still computes to 0.8rem at 48rem and wider. Criterion 3 (respec 1) checks the ratio in the wide layout. Criterion 4 (respec 1) checks the ratio in compact mode and that no visible annotation text is clipped (`scrollWidth <= clientWidth`).
2. Criterion 8: now says no existing test is edited except to change its viewport or the layout setup it reads, and each edit is listed with its reason. Gutter timing readers stay on `toHaveText`/`textContent` and keep their expected values. Criterion 7 also lost the vague second half. Checked at origin/main: `aoe4-compact-view.spec.ts` and `aoe4-step-annotations.spec.ts` read `step-finished` with `textContent`/`toHaveText`. The existing `innerText` readers read table `step-run` only, which this change leaves alone.

## Notes folded in

- `--editor-font-size` is set on `.gutter`, `.annotations` and `.textarea`, not on the container.
- Bootstrap `.form-control` sets `font-size: 1rem` and must not win the font.
- `step-finished` is a testid, so the hide rule needs a class or a scoped attribute selector.
- The editor wrapper's test id is now required, not optional.
- The criterion 2 bound controls, not the C14 values. The implementer records the measured widths.
- The query is `(width < 48rem)`, the same boundary as C14's `max-width: 47.99rem`.
- Docs scope names the one stale sentence the gate found and points to SGS-141's later docs pass.

## Diagrams

None. The change stays in one component and is outside the core control loop.

## Open questions

none

## Overlap

SGS-132, SGS-133 and SGS-134 also edit `workbench.module.css`. That is a merge-conflict risk only, with no throwaway work; the ticket's Scope now says so. SGS-141 does a final docs pass that includes this ticket.

## Lint

ticket-lint.py: no errors.
