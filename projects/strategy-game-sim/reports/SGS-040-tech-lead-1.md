# SGS-040 tech-lead 1

## Decision
No blockers. I opened draft PR #56 against `main`.

## PR
https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/56
- Base: `main`.
- Head: `sgs-040-aoe4-paste-grammar-deposits-reactions` at 683eb36a4ac0bd54b796ecb8196aba4c8d6e983e. I pushed the branch to origin with no new commits.

This is a single PR, so it has no stack footer. I set the body with `gh api -X PATCH` and checked the result: draft is true, the head is the expected SHA, and the body length is 6122.

### Merge risk
**medium** - extends the paste grammar that `POST /api/aoe4-build-order/simulate` accepts and changes the shipped default build's step list (backward-compatible; a revert undoes both).

### Review focus
No hotspots: the engine and validation are untouched, and every new path is pinned. Each new grammar row has a parse test or a parse-then-validate test. Every prebuilt build is round-tripped with `toStrictEqual`. The one change to shipped output, the English 1TC reaction, is pinned at 1200 s and 3600 s by the prebuilt bar and by mutation checks.

## What I reviewed
- Commit range: 9a1a074 (`main`, also the merge base) to 683eb36, three commits. All three are authored by choinickolas@gmail.com, and the commit messages contain no ticket ids or PR numbers.
- Size: 14 files, +354/-52. Reviewable business logic is +81/-19:
  - `lib/aoe4-build-order/parse-text.ts`: +70/-19
  - `data/aoe4-build-order/builds/english-1tc.json`: +11
- Read in full:
  - the `parse-text.ts` diff;
  - the json, docs and README diffs;
  - `builds.test.ts`;
  - all six edited pre-existing tests.
- Checked in `validate.ts`:
  - `nodeRefIssue` is applied to every node field through `checkNode`.
  - `triggerAtLeast` is bounded at 0..100000.
  - Paste node tokens therefore reach the same validation as arbitrary JSON strings. The wider `NODE_TOKEN` creates no new path past validation.

## Checks against the flag list
- **Invariants:** no violation.
  - A1 holds: the start order uses `NODE_REFS`, and the new step is data.
  - A3 holds: parse and format are pure.
  - A2: no engine or payment change.
  - S3 holds: `atLeast` is bounded by validation.
- **criticalPaths:** none touched. `parse-text.ts` is not listed, and `simulate.ts` and `engine-common.ts` are unchanged.
- **Irreversibility:** none. There is no schema or migration change. Previously valid paste text parses the same, because `move N` and every existing prefix are unchanged, and the node token only widens.
- **Contract:** the grammar extension is backward-compatible. OpenAPI shapes are unchanged.
- **Prebuilt output:** the shipped English 1TC result now has 25 steps and lists `gold#2` in its depletions. I found no consumer outside the tests that indexes those. The six tests that encoded the old output are updated, and their timings are unchanged.
- **Concurrency, security:** nothing relevant.
- **Open questions:** CONTEXT.md lists none, and the ticket lists none.

## Non-blocking notes
1. The ticket's Page criterion is still unchecked. The new page spec runs the default build at 3600 s and checks the `whenever` line, a 200 response, the charts and no error. It does not assert that the last step's `startedAt` equals gold `depletedAt`. The API triggers spec and the unit tests pin that equality instead.
2. `whenever gold start ...` reports "whenever takes only ..." instead of "'start' takes no trigger". Both are `syntax` issues (review 2 note 4).
3. The doc's "One example per action" block shows no `when`/`whenever` example line.
4. With `nodeAmounts` set to all-infinite, the English 1TC result still lists `gold#2` with amount 4000. This is the engine's existing deposit handling, not something this diff introduced. I am mentioning it in case it surprises a reader of the API output.

## PR body requirements
- The PR body lists the six edited pre-existing tests, each with its reason.
- It states that both bar mutations were run and reverted. Review 2 re-ran them: dropping the reaction step, and making the `depleted` case of `triggerHolds` false.
- It contains no ticket ids. It ends with the required attribution lines.
