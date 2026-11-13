# SGS-146 spec gate 1

Verdict: READY. Risk `low` confirmed.

Base read at origin/main (after `git fetch origin`).

## Checks

- Grounded scope: `Results.moveByKey` and `placeChart` (results.tsx lines 70-80), `useChartDrag` (`session` ref, `startIndex`, Escape handler), the `chart-header.tsx` `onKeyDown` -> `onMoveKey` path, `useChartLayout` (functional `setState` for move, moveTo and toggle), and the docs chart-controls paragraph (lines 1017-1023) all exist and match the Context text.
- Defect (1) is real. `moveByKey` and `placeChart` read `layout.order` from the render. The stored layout already composes. Defect (2) is real. Arrow keys on the handle reorder while `session.current` is set, so the `target !== startIndex` check goes stale.
- Callers of `toggle` and `moveTo` do not read render-time layout for decisions. `aoe4-build-order.tsx:438` toggles `KEY_RESULTS_PANEL_ID` and reads `collapsed` for display only. Scope's "check whether" instruction is satisfied by a quick grep.
- Tests: the existing acceptance cases (single-key moves, edge presses, drag, Escape, collapsed drag) do not depend on the change. The Scope rule for existing tests covers them. `chart-header.test.ts` and `chart-layout.test.ts` cover only pure functions.
- Criterion 3 fails at the base, because a key mid-drag reorders there. Criterion 1 targets a new helper, so it cannot already hold at the base.
- Docs: the only statements to update are in the paragraph Scope names. The help text in results.tsx ("Drag ..., or use the up and down arrow keys") stays true.
- Invariants: A1-A3 are the only entries with Paths matching the aoe4 directories. They concern the engine and data, not chart UI. `none` is acceptable.
- Open questions: none. Dependencies: none. Size: about 40 LOC. On merge: `none`. Unverified assumptions: `none` is acceptable. Pointer capture and keyboard focus on pointer down are browser behavior, but the acceptance test runs in real Chromium, so nothing is faked.
- Risk: no critical path or strongModelTriggers item applies. This is a UI-only change to local layout state with no shared contract change.

## Notes (non-blocking)

- Criterion 1 can only be tested at the helper level, since vitest runs in node with no jsdom. The stale read lives in the `Results` component. The implementer needs a way to give the second activation the post-first layout. For example, the hook can keep a ref updated synchronously inside its update path, or a pure helper like `(layout, id, direction) => { layout, toIndex } | null` can be used. Announcing from inside a `setState` updater is impure under StrictMode double-invoke, so avoid that. Review should confirm that `Results` actually uses the helper or ref, since the unit test cannot prove the wiring.
- Criterion 3's acceptance test should press the key while the mouse is down. Do this once before and once after crossing 4px. Check that the order and status text are unchanged. After `mouse.up`, check that the drop result matches the pointer height.
