# batch-SGS-097 tech-lead 1

## Decision
APPROVED. Opened 1 draft PR. No blockers and no untested hotspots.

## PR
- SGS-097: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/105, base `main`, head `sgs-097-docs-issue-messages` @ 4458555c7e0b12069b11e4fd3e32212380012736 (draft)

### Merge risk
**medium** - changes the text of the public 400 `message` for object keys longer than 40 characters and edits the public OpenAPI document. No field is added, removed or retyped, and a revert fully undoes it.

### Review focus
No hotspots: the only logic change is two `shortText` calls on label text. The unit table in `schema.test.ts` pins both at key lengths 39, 40, 41 and 5000 by whole-message equality, and an API-level acceptance spec checks the same cases. No consumer parses the message prefix.

## What I reviewed
- Range: origin/main 376b832 (fetched; it is newer than the 9274372 the ticket names, and the branch still diffs cleanly against it) ... 4458555, 3 commits.
- Files: `lib/aoe4-build-order/schema.ts` (+2/-2), `docs/api/openapi.json` (+2/-2), `docs/aoe4-build-order.md` (+5/-3), `lib/aoe4-build-order/schema.test.ts` (+17), `acceptance/aoe4-simulate-api-issue-labels.spec.ts` (+64, new).
- Reviewable LoC: +9/-7 (tests excluded).
- Checks:
  - INVARIANTS A1-A3: the engine is untouched.
  - criticalPaths: no symbol touched.
  - `shortText` calls `String(value)`, so numeric path segments are safe.
  - The three request-level messages in the 400 description match `pages/api/aoe4-build-order/simulate.ts:22,25,39` exactly.
  - No component or lib code parses the `inputs.`/`start.villagers.` prefix out of a message.
  - CONTEXT open questions: none.
  - Commit author email is `choinickolas@gmail.com`, which Vercel requires.

## Notes
- The body was set with `gh api -X PATCH .../pulls/105 -F body=@file`, because `gh pr edit` is broken in this repo.
- Non-blocking: commit 8524f53's subject contains a ticket id ("SGS-097 rework 1: ..."). Under the shipped-artifact hygiene rule ticket ids stay out of commit messages. It is only a problem if a squash merge keeps the commit list in the message, so use the PR title for the squash subject and body. I did not rewrite it, because I add no commits.
- The acceptance spec reads `docs/api/openapi.json` from disk and asserts on the description text. That ties the test to doc wording. The ticket asked for this; it is not blocking.
- Stacking: footer mode, but there is a single PR and no stack, so I wrote no footer.
