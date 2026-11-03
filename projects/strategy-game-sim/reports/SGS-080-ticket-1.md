# SGS-080 ticket report

Ticket: tickets/SGS-080-aoe4-one-villager-per-farm.md. Component aoe4-build-order, Risk high, about 80 lines of
business logic, no Depends on. Engine rule: a node with `gatherNodes.<node>.createdBy` (farm) holds one gatherer per
built instance; extra arrivals idle at the farm and are promoted when a farm completes; `sendWalking` takes idle first
at a capped node; new `farm-idle` warning (once per run). Docs, OpenAPI and test rule (Scope 4-5) included.

Split: build re-tuning goes to SGS-081 (manager creates it): three data files (the backlog says four; main has three),
iterative tuning to README bars plus README rewrite plus digest re-pin. Land 080 and 081 as one stack.

Overlap SGS-077: same files (simulate.ts field lists/createEngine/simulateBuildOrder tail, openapi.json version, docs,
1800 s digests); no logic conflict since creditIncome already credits only gatherers. Second to land rebases and
re-pins digests from its own output.

Not run: no criterion names a command that could be checked beyond the `'farm'` grep (0 matches in simulate.ts today).
I did not execute the engine, so how many shipped-build quality assertions break is unknown.
Open questions (owner): wait vs stay idle; warning text/severity; off-switch input.
