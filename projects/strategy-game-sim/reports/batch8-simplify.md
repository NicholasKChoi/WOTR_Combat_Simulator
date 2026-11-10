# Batch 8 simplify

## sgs-099-saved-build-record
No change. Tests/tsc not rerun (no edits). Tip 5efa6ee.

## sgs-101-build-store-and-rate-limit
- lib/aoe4-build-order/saved-builds.ts: extracted exported `base64UrlSha256`; `savedBuildId` now slices its result.
- lib/aoe4-build-order/save-rate-limit.ts: removed its duplicate hash helper, imports the shared one.
- Considered exporting `nextCounter` from build-store.ts for the Blob store; dropped because build-store.acceptance.test.ts pins the module's exports.
- Tests: `vitest run lib/aoe4-build-order` (1321 pass, 10 skipped), `npx tsc --noEmit` clean, `npm run lint:dup` 0 clones.
- New tip ce261b4.

## sgs-103-build-routes
Rebased onto ce261b4 cleanly. No change of its own (diff reviewed; nothing worth trimming).
Post-rebase: vitest lib/aoe4-build-order, tsc, lint:dup all clean. Tip: see summary below.
103 tip f931a8a
