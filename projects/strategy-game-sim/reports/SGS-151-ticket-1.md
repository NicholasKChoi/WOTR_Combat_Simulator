# SGS-151 ticket report 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-151-shared-blob-test-fake.md
Title: SGS-151: Share one in-memory Blob fake across the store tests
Type Chore, Risk low, component aoe4-build-order, Milestone none, Depends on: none. Lint passes.

Summary: Replace three hand-written in-memory @vercel/blob fakes (counterBlob in blob-build-store.test.ts, the vi.mock blocks in blob-lost-writes.acceptance.test.ts and named-build-store.acceptance.test.ts) with one shared test-support module in lib/aoe4-build-order/. The fake holds the single copy of the write rules; fault injection, weak-etag reads, the CDN cache, the read hook and the event log are opt-in or layered. Criteria: existing assertions unchanged, one implementation of the write rules, a self-test of the fake's rules, CDN and fault behaviors still covered, no production file touched, gates pass. No diagram. No open questions, no unverified assumptions.

Dependency on SGS-142: not required. This ticket touches only test fakes and no production code; SGS-142's edits to replaceNamed in blob-build-store.ts and its tests are the only overlap. Possible textual conflict is in blob-build-store.test.ts (counterBlob region vs. replaceNamed tests) and the two acceptance tests if SGS-142 edits them. If SGS-142 adds Blob-fake behavior or tests that use those fakes, SGS-151 should land after it, so the shared fake is built once against the final set. Recommend scheduling SGS-151 after SGS-142 (ordering only, not a Depends on) so it rebases once. I did not read SGS-142, which was being written in parallel.

Overlap with open tickets: none found (SGS-140, SGS-141 are unrelated).
