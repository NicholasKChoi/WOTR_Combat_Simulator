# SGS-145 ticket author report 1

Result: no ticket written. The intake's own condition applies: the data shows Abbey of Kings trains a unit, so listing it as a production building is correct.

Evidence (read at origin/main after git fetch):

- `data/aoe4-build-order/aoe4world/english.json`: unit entry `id: king-2`, `baseId: king`, `type: unit`, `name: King`, `attribName: unit_abbey_king_2`, civ `en`, with `"producedBy": ["abbey-of-kings"]`. The description reads "A mighty King, a powerful heavy cavalry unit".
- The same file has a building entry `abbey-of-kings-1` (baseId `abbey-of-kings`), so the producer has a building entry.
- `lib/aoe4-build-order/production-buildings.ts`, `productionBuildingIds`: a building baseId is a production building when some unit entry lists it in `producedBy` and a building entry exists for it. `productionBuildingSeries` then drops buildings never completed. Abbey of Kings meets both conditions: the King lists it, and the default builds (`builds/english-1tc.json`, `builds/english-knight-longbow.json`) build it.
- `components/apps/aoe4-build-order/result-series.ts`, `buildingSeries`, only maps `result.productionBuildings`. It adds no filter of its own.

So the Buildings view lists Abbey of Kings because the snapshot data says it produces the King. The rule is data-driven and tested (`production-buildings.test.ts`: "follows the data"). No code defect.

Optional owner-side note: the King unit is not in the default build orders, so the Abbey series shows a building that produces no units in that build. That is the view's definition (a building that can produce units), not a bug.

Ticket path: none
Title: none
Risk: n/a
Component: n/a (would have been aoe4-build-order)
dependsOn: n/a
Recommendation: close SGS-145 as not a bug and drop the backlog bullet.
