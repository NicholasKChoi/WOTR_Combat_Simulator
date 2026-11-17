## Summary
Reorders the steps of the English Knight/Longbow and Council Hall prebuilt builds so blacksmith research follows the farms and production steps it currently precedes. No step is added, removed, or retriggered; only list position moves. A later change makes each research block later steps while its building is busy, and these builds would miss their production floors and floating-resource cap in their old order. Every existing floor, cap and bar in the build tests passes unchanged.

Because `veteran-longbowmen` now completes earlier in Knight/Longbow, the one test that pinned its completion window to fixed times is re-pinned to derive its sample times from the completion. The Council Hall README entry is corrected to the new order and names the reorder as a transcription choice. The Knight/Longbow README entry is unchanged: its placement sentences still hold.

Non-goals: no engine, API or UI change; no floor, cap or bar change; the Spear/Longbow build is untouched.

## Merge risk
**low** - data-file step reorder and one test re-pin; a revert undoes it, no public surface or `criticalPaths` symbol is touched, and the build tests pin floors and the floating cap for both builds.

## Review focus
No hotspots: pure list reordering of data steps with each step object unchanged; the production-floor, floating-cap and no-waiting tests in `builds.test.ts` run over both builds and fail if the order breaks them.

## Reviewer guide
Reviewable change: +66/-60 LoC (data reorders, one README paragraph, one test re-pin)
- [`data/aoe4-build-order/builds/english-knight-longbow.json`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/198/files#diff-0309020fecb4b302ae4d112611984d5155e6e1a8272acff083d9324beca1f485) - blacksmith techs moved after the farms and the third stable; verify every research still follows `build kings-palace` and the step multiset is unchanged.
- [`data/aoe4-build-order/builds/english-1tc-council-hall.json`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/198/files#diff-d6344ef16c5d6a1fdc3714f3f9f26dd2b75f9553c35b2615532bc2cd3f955a1b) - `iron-undermesh`, `bloomery`, `fitted-leatherwork` and the Castle techs moved later; verify nothing added or removed.
- [`lib/aoe4-build-order/research.acceptance.test.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/198/files#diff-fec3a142122cfd44efa214d496879247a261096543d319239378b81d3b5aef3c) - the conversion test takes its sample times from the `veteran-longbowmen` completion instead of fixed 840/845 s; verify it still fails when any tier-2 longbowman is left after completion.
- [`data/aoe4-build-order/README.md`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/198/files#diff-ea915f4df34c77545319f28e3fb2e5b316b9c955210235f51d95d519d608a25f) - Council Hall "Added after the guide" paragraph rewritten to the new order.

## Invariants and scope
Invariants touched: none. Timings stay deterministic for a given build and data; no engine, rule or data number changes.

<!-- cf-stack -->
### Stack

Merge bottom-up (this PR marked `->`):

- -> #198
