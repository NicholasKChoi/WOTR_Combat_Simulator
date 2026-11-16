## Summary
The AoE4 auto-run first-load acceptance test already fails on hydration warnings logged to the console. It now also records uncaught page exceptions (Playwright `pageerror`) and asserts there were none, so an unrecoverable hydration failure that React rethrows as an uncaught error fails the test instead of passing unnoticed. Test-only; no production code changes. Non-goal: other tests in the spec are unchanged.

## Merge risk
**low** - acceptance spec only; a revert fully undoes it, no public surface or critical-path symbol is touched.

## Review focus
No hotspots: three added lines in a test file that carry no production behavior.

## Preview checks
- [ ] Open the AoE4 build order page on the preview deploy with the devtools console open; the page loads and auto-runs with no uncaught error in the console (confirms an uncaught load-time exception would surface as a page error, which the test now fails on).

## Reviewer guide
Reviewable change: +3/-0 LoC (acceptance test only)
- [`acceptance/aoe4-auto-run.spec.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/197/files#diff-cc57f48026aecaf04a91bdaf08e0449b65ba30a427531eedb063304a92ab1c67) - collects `pageerror` messages in the first-load test and asserts the list is empty; verify the listener is registered before `openPage`.

## Invariants and scope
Invariants touched: none

<!-- cf-stack -->
### Stack

Merge bottom-up (this PR marked `->`):

- -> #197
