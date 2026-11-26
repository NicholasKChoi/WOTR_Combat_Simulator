# SGS-220 ticket author report 1

Verdict: no ticket written. The item needs a design and is over one chore. Send it to triage as a milestone.

## Why

The item reads "Storage should support saving a named combination (set) of 1-3 related builds, so a user can save and reload a group of builds together and compare them side by side."

Explored at origin/main (component aoe4-build-order, docs/aoe4-build-order-ui.md):

- **Saved builds are server-backed named builds.** `lib/aoe4-build-order/named-builds.ts`, `named-builds-routes.ts` and `saved-builds.ts` hold them, each with an id and an edit secret. Only the browser's "My builds" list lives in localStorage (`my-builds-storage.ts`: zod schema, `version: 1`, max 50, backup key, newest-first, dedupe by id). A "set" needs a decision on where it lives: server or localStorage. It also needs a decision on what happens to members whose edit secrets or ids go stale, and on sharing and loading by link (`?n=` / `?b=` today). That is a storage and API contract choice, not a chore.
- **Compare is exactly two runs.** The pin vs the current run (`compare.ts`, `compare-panel.tsx`, `pin-storage.ts`). The pin is one localStorage entry holding text, duration and name. The compare table, the chart's dashed pinned series, `pinned:<key>` keys, the pinned-label rules and the legend rules in docs/aoe4-build-order-ui.md all assume one pinned run. "Compare 1-3 builds side by side" means a new N-run compare model: a new table layout, series styling and colors for 3 runs, the legend, markers, and what "current" means when a set is loaded. The UI and the visual design are undecided.
- **Other UI that needs a decision.** How a set is created and named, where it appears in the build select (the select groups My builds / Opened links / templates today), the unsaved-edit guard when switching to a set, URL addressing for a set, and the 50-entry cap.
- **Size.** Storage plus schema, a loader that runs 1-3 simulations (`use-auto-run.ts` runs one), a generalized compare model and panel, chart changes, UI for set create / rename / load, and doc updates across docs/aoe4-build-order-ui.md. That is well over 400 business-logic lines across several components and it does not fit as one chore. It also changes owner-visible behavior, so it is not a Chore.

## Suggested milestone split (for triage)

1. Design: where sets are stored and how they are addressed (localStorage only vs a server named-set API; stale-member handling; URL form).
2. Set storage and a save / load UI.
3. Generalize pin to N compared runs (table, chart series, legend), up to 3.
4. Docs.

## Open questions (owner)

- Are sets private to this browser (localStorage) or shareable by link (server)?
- Does compare replace the single pin, or does the pin become a set of 1?

## Notes

No ticket file written, no lint run, no scratch checkout made, no sibling overlap checked beyond reading the tree.
