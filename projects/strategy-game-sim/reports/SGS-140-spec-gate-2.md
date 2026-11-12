# SGS-140 spec gate 2

**Verdict: READY**

Read at origin/main (after `git fetch origin`): `workbench.module.css`, `step-annotation.tsx`, `build-text-editor.tsx`. Read design/M9.md (C14, line 324 `TYPICAL_LINE_CHARS = 48`, M9.8 criteria row) and MILESTONES.md M9.8.

## Gate 1 gaps

1. Annotation inner span font: closed. Scope now sets the span to 0.8 times `--editor-font-size` in both modes. It computes to today's 0.8rem at 48rem and wider. Criteria 3 and 4 check the ratio in both modes, and criterion 4 checks that no annotation is clipped.
2. Vague "pins nothing new" criterion: closed. Criterion 8 limits test edits to viewport or layout setup, requires the implementer to list each edited file, and requires gutter text readers to stay on `toHaveText` or `textContent`. That is observable, and it holds because hiding the finish time removes no DOM node.

The gate 1 notes were also folded in. These are the custom property set on `.gutter`, `.annotations` and `.textarea` (a container query cannot style the container), the Bootstrap `.form-control` font-size, the required test id on the `.editor` wrapper, the class or scoped selector for `step-finished`, the criterion 2 bound controlling over the C14 values, and the `(width < 48rem)` range form.

## New gaps

None blocking. Checked against the base:

- The `.editor` rule, the shared `.gutter, .annotations, .textarea` font rule at 1rem, `.annotations` at 17ch, and `.annotations li > span` at 0.8rem all match Scope's description of current code.
- `step-finished` is a `data-testid` on a bare span in `StepTimes`, as Scope says. In the gutter it renders unlabelled next to `step-started` (`labelled={false}`), and the table renders it labelled. So the class or scoped selector is needed, and the table-keeps-finish-time criterion can fail.
- `.editor` has no test id today, so the Scope addition is required.
- Criteria 1 and 2 follow design M9.8. `TYPICAL_LINE_CHARS = 48` is a design constant, so the pinned number is allowed.
- Risk low, Invariants none, On merge `none`, Open questions none and Unverified assumptions none are all consistent. There is no input validation, and the size is about 40 LOC.
- No overlap with another open ticket. SGS-132, SGS-133 and SGS-134 touch the same CSS file, which is a merge-conflict risk only.

## Notes (non-blocking)

- Criterion 2 has a margin of only a few pixels at the C14 values. Scope already makes the bound controlling and allows narrowing the gutter `min-width` and the annotation padding in compact mode.
- Criterion 5 says "the same text as before this change". The tests can compare against the non-compact (tabs-layout) text or the existing expected values.
- In Scope, "none found at the base" for a docs sentence on font or annotation width is a claim for the implementer to re-grep, and the ticket already says so.
