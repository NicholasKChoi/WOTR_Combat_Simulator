# SGS-147 ticket report

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-147-browser-storage-edge-cases.md
Title: SGS-147: Keep an unreadable pin, pick up a cross-tab clear, cap My builds on create
Type Bug, Priority low, Risk low, Component aoe4-build-order, Milestone none, Depends on none, On merge none, LOC ~40.

Summary: three storage edges at origin/main. (1) `readStoredPin` removes an invalid stored pin; it should return null and leave it. (2) The page's `storage` listener ignores events with `key === null` (another tab's `localStorage.clear()`), so My builds goes stale until reload. (3) `recordCreated` prepends to the whole entries list and never caps My builds at 50 in-tab; fix via a pure helper in `build-library.ts` (placement first among `mine`, replace duplicate key, cap at `MY_BUILDS_MAX`, keep new and selected entry). Docs and the old `pin-storage.test.ts` removal assertion are in Scope. Out of scope: unmount-before-201, the page's own clearStoredPin on non-convertible/non-ok re-run, pin cross-tab sync.

Diagrams: none (single component). Open questions: none. Overlap: no open ticket touches these files (grepped SGS-14x/15x tickets). Lint passes.
Note: the intake's file line numbers are stale; symbols verified at origin/main. The unit and acceptance code path for the cross-tab clear is a two-tab Playwright case (acceptance/aoe4-my-builds.spec.ts already uses context.newPage()).
