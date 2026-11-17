# SGS-189 ticket report

File: projects/strategy-game-sim/tickets/SGS-189-reorder-knight-longbow-council-hall-builds.md (lint clean)

Summary: "Reorder the Knight/Longbow and Council Hall prebuilt builds", Feature, M11, aoe4-build-order, risk low, 0 business-logic lines (two JSON reorders per OD3b option B, two README entries, one test re-pin in research.acceptance.test.ts). Depends on none; On merge none. Criteria cover: step order and unchanged step multiset, all builds.test.ts cases unchanged, the re-pinned longbow tier-conversion test, no other test assertion moved, the named acceptance specs, README statements. Step counts verified at origin/main 87f0cd7 (Knight/Longbow 74, Council Hall 61), matching the design's index ranges.

Diagrams: none (single-component, outside the control loop).
Open questions: none. Overlap: none with open tickets; the Spear/Longbow edit and the re-pin again to 841.2 s stay in the rule ticket (B).
No scratch checkout made; no mutation criterion.
