# SGS-084 ticket report 1

Ticket: tickets/SGS-084-aoe4-gather-rate-per-villager.md. Risk high (simulateBuildOrder is a criticalPaths symbol and the public simulate response gains a required field; additive, ~40 business-logic lines). dependsOn: none (main cc9bb04). Branch: sgs-084-aoe4-gather-rate-per-villager.

Decision: engine series, not client derivation. The result has no per-resource villager count (unitsProduced has the villager total only), and per-villager rate differs per node, so it cannot be derived. Engine adds `gatherers: Record<ResourceKind, number[]>` (sum of engine.gatherers per resource over the same refs incomePerSecond uses), OpenAPI minor bump (2.2.0 to 2.3.0), client divides (0 when count 0) behind a `Per villager` checkbox on the Gather rates chart only.

Not run: criteria with commands (none are grep/mutation checks; the tests are new). Read from origin/main because the main checkout is on another branch.
Notes: simulate-house-warnings.test.ts digests need `gatherers` excluded (as with `gathered`, see backlog item); ticket says do not re-pin. Manager should delete the BACKLOG bullet. No open questions. No overlap with SGS-082; shares results.tsx with nothing in flight.
