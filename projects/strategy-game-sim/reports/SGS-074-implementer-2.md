# SGS-074 implementer 2 (rework 1)
Branch sgs-074-aoe4-m4-docs-audit-playwright, tip 103871ed84220bac1b47d5d237bc3cb45cc7aaec (new commit on 6465ca8).
Files: acceptance/aoe4-build-order-m4-flow.spec.ts (storage-null assert before reload, listener removed in finally), docs/aoe4-build-order.md (two sentences).
Mutation: removed clearStoredPin from unpin(): flow spec failed at the new localStorage assertion; reverted.
Repeat: --repeat-each=10 with pin-compare spec in parallel on shared server: 10 passed. Full acceptance 690 passed (includes contract spec). tsc and lint:dup clean.
Docs re-audit: fixed ~822 (view survives runs and tab switches, tab follows each run, reload starts on Build) and ~932 (400 messages start with a line/step/field path/request body; pinned Results still shows compare panel without table). Other tab/view sentences (815-835, 847-848, M4.md:480) checked, correct.
Port 4211 free.
