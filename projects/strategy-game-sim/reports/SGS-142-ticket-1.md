# SGS-142 ticket report

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-142-replace-named-missing-key-conflict.md
Title: SGS-142: Answer conflict when a named build is deleted mid-update
Type Bug, Priority high, Risk standard, Component aoe4-build-order, Milestone none, Depends on none, On merge none.

Summary: replaceNamed (lib/aoe4-build-order/blob-build-store.ts, read at origin/main) rethrows the plain BlobError the SDK raises for ifMatch on a missing key, so the PUT route answers 503 instead of 409. Fix: on a non-landed, non-known put error, head the key; BlobNotFoundError from head returns conflict, anything else rethrows the original put error. Do not reuse `exists` (it maps every head failure to absent). Live test 1 asserts the exact class. Unit rows in blob-build-store.test.ts that assert head is never called change. About 15 lines of business logic.

Diagrams: none required. Open questions: none. Overlap with open tickets: none found.
Lint: ticket-lint.py clean. No criterion names a runnable search or mutation command; I did not run the live test (needs the owner's store).
Unverified assumptions listed: head on an absent key rejects BlobNotFoundError; the plain BlobError for put ifMatch on a missing key is one owner observation.
Risk is standard, not low, because it changes store concurrency semantics behind a public route reply (503 to 409 on an edge path); no criticalPaths or strongModelTriggers apply.
