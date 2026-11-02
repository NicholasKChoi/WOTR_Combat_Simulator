# SGS-047 re-spec 1

Source: M3-designer-4 decision row 1c and design/M3.md "Time format".

- `formatMinSec` is imported from `lib/aoe4-build-order/format-time.ts` (moved by SGS-035, no re-export from `chart-rows.ts`).
- Depends on gains SGS-035. Scope item 2 updated; first acceptance criterion gains a grep that `step-timeline.tsx` does not import `chart-rows` and does import `format-time`.
- Open question removed; Open questions is now "None."
- Risk stays low (~70 lines, one component, no lib edit). On merge: none.
- Note: `format-time.ts` does not exist on main yet (SGS-035 creates it); `formatMinSec` is still in chart-rows.ts today, so the new grep criteria are checked after the change.
- No Re-spec section appended, per manager instruction.
