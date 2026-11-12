# SGS-132 spec gate 2

Verdict: NEEDS_SPEC (one new gap, not owner-only; the three round-1 gaps are closed)

Read at origin/main: `save-build.tsx`, design M9 C1 and the M9.3 criteria row, and the re-spec 1 ticket.

## Round-1 gaps

1. Abort case: closed. The criterion names only an error reply and `route.abort()`.
2. Static versus stateful layout: closed. Vitest covers the no-save row. The Playwright spec covers the link order and the form, hint, notice and error being outside `save-row`.
3. Render-boundary timing: closed. It is now the property "link visible implies status non-empty", and Scope says the status is derived from `saved`, `settled` and `saving` only. The margin reset and the empty-status height check were also added.

## Gap

1. Acceptance criteria (4) and Scope (`save-status` bullet) - the property "whenever `saved-build-link` is visible, `save-status` is non-empty" and the Scope claim "non-empty exactly when the link is shown" contradict the status being empty "while a save is in flight". In `save-build.tsx`, `canSave` stays true while the link is shown. `saving` is set by `send`, but `saved` is cleared only on failure or on a settled-input change. So after a first save, clicking Save as copy and submitting again leaves `saved-build-link` visible with `saveStatusText` returning '' for the whole request. The criterion "a second save shows the new text, not the old" implies this flow. A polled "visible implies non-empty" assertion would fail intermittently, and an implementer must guess whether to hide the link while saving or to keep the status empty. Proposed fix: state the property as "whenever `saved-build-link` is visible and no save is in flight, `save-status` is non-empty; whenever the link is absent it is empty". Make the Scope sentence match. Add that during an in-flight second save the link stays shown and the status is empty. This agrees with design C1's `saveStatusText` ('' when saving), so no design change is needed. Alternatively, hide the link while saving, but that changes M8 behavior and is not recommended.

## Notes

- All other round-1 checks still hold. Named symbols and test ids exist at the base. Contract names match C1. The criteria are testable. Risk `standard` is fine. `On merge: none` is correct. The doc changes are in Scope.
- Criterion "the empty `save-status` adds no height": the `gap` caveat is covered by the check that row height equals button height within 2px.
