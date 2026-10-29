# Strategy Game Simulator: Invariants

Rules no change may break. Spec-review blocks on a violation; tech-lead escalates one to a human.
Each invariant is scoped to the paths it covers. A reviewer applies it only when the diff touches one
of those paths.

## Site-wide
Paths: `utils/**`, `components/layout.*`, `styles/**`, `pages/_app.js`, `pages/index.js`, and any new app.

### S1. Apps are independent
No app imports another app's code. Shared helpers live in `utils/` or `components/` (outside `components/apps/`).
Likely break: reusing one app's helper by importing it directly.

### S2. Every app is linked from the landing page and wrapped in Layout
Every page under `pages/apps/` is linked from `pages/index.js` and renders inside `Layout`.
Likely break: adding a page and forgetting the link.

### S3. Every simulation request finishes in bounded time
Every numeric input and scenario count has a cap, enforced where the simulation runs.
Likely break: a new input that's an unbounded number.

## WOTR Combat Simulator
Paths: `pages/apps/combat-simulator.js`, `components/apps/combat-simulator/**`, `lib/combat-simulator/**`, `pages/api/fight.ts`, `pages/api/models/army.ts`.

### W1. Combat follows the rules in docs/combat-simulator.md
Dice, leader rerolls, casualties, and round order match the design doc.
Likely break: changing dice or casualty logic without updating the doc.

### W2. Results are estimates from N independent battles
Each simulated battle starts from the submitted armies, and one battle's state never carries into another.
Likely break: state shared between runs, such as reusing mutated army objects across iterations.

## StarCraft Helper
Paths: `pages/apps/starcraft-helper.js`.

### H1. A Randomize click never repeats the previous result
Pairing and map picks differ from the previous result whenever another result is possible, and return
in bounded time when none is.
Likely break: a retry loop that never ends when only one result is possible.

### H2. A struck map is never picked
When every map is struck, the app tells the user plainly instead of picking a map.
Likely break: falling back to any map, or showing a placeholder string like "FAILURE".

### H3. Randomness is uniform
Every eligible player pairing and map has an equal chance.
Likely break: a hand-written shuffle bug.

## AoE4 Build Order Simulator
Paths: `pages/apps/aoe4-build-order.*`, `components/apps/aoe4-build-order/**`, `lib/aoe4-build-order/**`, `pages/api/aoe4-build-order/**`, `data/aoe4-build-order/**` (proposed).

### A1. Game numbers come only from versioned data files
Costs, build times, and gather rates are read from data files labeled with a game patch.
Likely break: writing a number straight into the simulation code.

### A2. Resources never go negative
A step that can't be afforded waits, and the wait appears in the reported timings.
Likely break: spending before checking.

### A3. The same build order and data always produce the same timings
Likely break: adding randomness or depending on wall-clock time. Revisit if the variation open question
in CONTEXT.md is decided in favor of a spread.
