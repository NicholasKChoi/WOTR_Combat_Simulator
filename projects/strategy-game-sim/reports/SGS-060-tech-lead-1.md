# Tech-lead gate: SGS-059 and SGS-060 (independent batch on main e7af539)

## Decision
NO BLOCKERS. Two independent draft PRs opened, each with base `main`. No stack and no footer.

## Opened PRs
1. SGS-059: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/74. Base `main`. Head `sgs-059-aoe4-page-posts-build-order` @ 08f5995c29438d14aa8a52b10bb438335829ef29. Draft.
   Title: "Convert the build order paste in the browser and post the checked buildOrder"

## Merge risk
**low** - a revert fully undoes it; the route and its request and response schema are unchanged (it already accepts `buildOrder`); no critical-path symbol is touched; Playwright specs pin the posted body, the no-POST rejection and both error lists.

## Review focus
No hotspots: the rejection branch copies the existing failure path (`setResult(null)`, early return before `setRunning`), and the client and server run the same `checkBuildOrder` over the same English catalog. Mutation-checked specs pin both the rejected and the posted paths.

2. SGS-060: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/75. Base `main`. Head `sgs-060-aoe4-api-specs-send-build-order` @ f3f07deb85fbe2b8116060830c62aa478833fa92. Draft.
   Title: "Send the converted buildOrder from the simulate API specs"

## Merge risk
**low** - test-only: no production, API, schema or config file changes, and a revert fully undoes it.

## Review focus
No hotspots: only acceptance specs change, and every rewritten spec runs against the unchanged route and passes.

## What I reviewed
- Both branches were local only, and I pushed them with `git push -u` (no new commits). merge-base with origin/main is e7af539 for both.
- SGS-059: origin/main..08f5995, 5 commits, 11 files, +282/-56. Hand-written logic is +50/-17: `pages/apps/aoe4-build-order.tsx`, `components/apps/aoe4-build-order/{issue-list,build-input,step-table}.tsx`. Also read: `acceptance/helpers.ts` (+29/-1), the page-spec edits, the new `acceptance/aoe4-build-order-client-check.spec.ts` (13 tests), docs +13/-10, and the lib behind it at the tip (`textToBuildOrder`, `buildOrderCatalog`).
- SGS-060: origin/main..f3f07de, 1 commit, 12 acceptance spec files, +78/-93, test-only. I checked each deleted test's lib coverage:
  - parse-text.acceptance.test.ts:75-78 covers @1:61.
  - parse-text.test.ts:111-116 and parse-text.acceptance.test.ts:101-109 cover CRLF.
  - The text-to-build.test.ts "labels check issues by paste line" table (around lines 21-45) covers the paste half.
  - The leftover `text` lines at the tip are 24: api 6, edges 3, contract 5, waits 2, checks 5, issue-shape 3.
- Invariants checked: S3 (the client enforces the 20000-character cap and the route still enforces every bound), A1-A3 (no lib or data change), S1 (no cross-app import). There are no CONTEXT open questions. M4 has no Safety and contracts section.
- PR bodies were set with `gh api -X PATCH .../pulls/<n> -F body=@file`. Both PRs read back as draft=true, base=main.

## Non-blocking notes
- SGS-059: a client rejection clears `result` but leaves `resultText`. This matches the existing server-failure path, and nothing reads `resultText` while `result` is null.
- SGS-059: `runRejected` in acceptance/helpers.ts records requests only while Run is clicked and the issue list appears. A POST sent later than that would not be caught. The page sends synchronously or not at all, so this is acceptable.
- SGS-060: the deleted CRLF spec compared full simulation results over HTTP. The lib tests cover only the parse. That is equivalent once the client converts the text, because CRLF never reaches the server again.
- No processes were started.
