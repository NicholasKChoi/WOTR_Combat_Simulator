# SGS-130 ticket author, re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-130-blob-landed-write-retry-cap.md
Lint: `ticket-lint.py` clean (no output).

## Summary

SGS-130 "Blob store: cap SDK retries, treat a landed build write as success, verify the missing-key rule live" (aoe4-build-order, M9.10, risk high, ~55 business-logic lines, depends on SGS-127, SGS-128). Re-spec 1 folds in the tech-lead blocker (counter read-back lets parallel same-client saves pass `SAVE_RATE_LIMIT`) and owner decision 7 (Q59 A) from `design/M9.md`. `bumpCounter` no longer calls `landed`: a 412, or a key that now exists when `current === null`, goes to the next attempt with a new read; anything else rethrows; `'contended'` after 3. `create` and `replaceNamed` keep `landed`. Scope now says the SDK retry cap covers `put`, `head` and `del`, and that `get` (so `read` and `landed`) is never retried. It quotes the design's worst-case counts: counter 3 x (read 1 + put 2 + head 2 when creating); replaceNamed put 2 + read 1; create the same plus head 2. I checked against `@vercel/blob` 2.9.0 in node_modules: `requestApi` reads `VERCEL_BLOB_RETRIES`, and `get` is a plain `fetch`.

Criteria changed or added with `(respec 1)`:
- No read-back in `bumpCounter`: a 412 while the stored value is the exact JSON that was sent still goes to the next attempt, and `get` runs once per attempt.
- Two parallel bumps over the same count, for an update and for a create: one update and one retry, so the stored count rises by two.
- Counter failure paths: an update with a non-412 error rethrows even when the JSON matches; a create where the key now exists goes to the next attempt, and one where it is absent rethrows; three 412s give contended.
- Route-level counter cases in `blob-lost-writes.acceptance.test.ts`: a lost response on a first save gets 201 and at most one extra count; a dropped response on a counter update gets 503 and stores no build; losing every attempt to a concurrent bump gets 429.
- Docs and comments: they must say the read-back applies only to `create` and `replaceNamed`, and must not say that a counter write is read back or that `get` is retried.

The Scope rule for existing tests names, as examples, the branch tests that pin the old behavior. In `blob-build-store.test.ts`: the "returns the update after one put for %s when the read-back shows the JSON it sent" table (the 322-332 block), the "Each failed put is followed by a read-back" note, and the `get` call counts in the counter tests. In the acceptance file: the "the save rate counter when its Blob write fails" describe. I checked every quoted name and sentence against branch tip 73693ef.

## Diagrams

Updated the read/act/record flowchart. A failed counter `put` now goes to a 412-or-created-meanwhile decision, then either the next attempt (looping back to the read) or a rethrow, not to `landed`.

## Branch work that still stands

The retry cap, `landed`, `create` and `replaceNamed` with their tests, the live test, `test:blob-live`, and the retry-cap comment all stay. The rework removes the `landed` call from `bumpCounter`, adds a short comment there saying why the counter has no read-back, fixes the counter tests in both test files, and rewrites the ARCHITECTURE storage row. Rework 1's exact ARCHITECTURE sentence is noted as superseded where it names `bumpCounter`.

## Open questions

None.

## SGS-131 check

`tickets/SGS-131-my-builds-no-wipe-and-backup.md` never mentions counter landed checks, `bumpCounter`, `get` retries or the retry cap (I grepped for landed, get, retr, counter). It needs no change, and I did not edit it.

## Overlap and notes

- No overlap with other tickets.
- The tech-lead non-blocking note still applies: commit `fc011d5` on the SGS-130 branch has a ticket id in its title. Reword it, or edit the squash message at merge. It is not in the ticket Scope because rewriting it would restack SGS-131 and later.
- `design/M9.md` was not edited.
