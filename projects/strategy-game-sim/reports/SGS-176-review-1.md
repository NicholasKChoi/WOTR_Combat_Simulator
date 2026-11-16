# SGS-176 review 1

Verdict: APPROVE. Tip reviewed: 8484866049756b092a3e56f1083e23d229af52cd (base origin/main).

## Blocking findings
None.

## Acceptance criteria
1. Every export has a `/** */` above it: pass. I scripted a scan of every top-level `export` in `lib/**/*.ts`, excluding `*.test.ts` and the three test-support modules. The only exports without a preceding `*/` are the two multi-line re-exports (`api.ts:4`, `model.ts:75`; exemption a) and the 7 that keep a `//` comment (exemption b). I read each of the 7 and each states the job: `refusedSaveSlot`, `disallowedMethod`, `shortText`, `BuildOrderLines`, `researchEntry`, `convertUnits`, `triggerWakeAt`.
2. Comments state the job and cite real headings: pass. Every quoted heading exists verbatim in `docs/*.md`, each as a `##` to `####` heading (21 distinct headings checked; "Extension points" is in both docs). I read the combat-simulator, depletion, named-builds, parse-text, civ-rules and simulate.ts comments, and the sections they cite match the symbols. None only restates its identifier. The same-named `docs/` heading in both files is ambiguous only for "Extension points", and it matches in either.
3. Only comment lines changed, all within `lib/`: pass. Across 36 files, every added or removed line in `git diff -U0` matches `//`, `/**`, `*` or `*/`. Nothing outside `lib/` and no test file changed.
4. Checks: pass. I ran `npx tsc --noEmit`, `npm run lint:dup` (0 clones) and `npx vitest run lib` (53 files passed, 1 skipped; 1848 tests passed, 15 skipped). The implementer's full `npm test` record is consistent. No test file is edited.
5. No ticket ids, invariant numbers or factory file names in added lines: pass. I grepped for `SGS-`, `INVARIANT`, `CONTEXT.md`, `PROJECT.md`, `LESSONS` and `[AW]<digit>`; there were no hits.

## Invariants
W1, W2 and the AoE4 simulation invariants are adjacent by path only. No code line changed, so all hold.

## Linter and bot
The linter (`commands.lint`: tsc plus jscpd) is clean. There is no `reviewBot` CLI or rules file.

## Doc claims
I checked the implementer's list against the code, and did not re-read the bodies of `sameSecretHash`, `buildStoreFromEnv` or `savedBuildId` (unverified). `isDepleted` matches its comment (read in the diff context). `NAMED_BUILD_VERSION` says only what its name means.

## Non-blocking notes
- Several comments run well past one line (for example the `MAX_COMBAT_DICE` and `drawDown` ones). They are single lines of source and carry a rationale, so I did not flag them.
- `simulate.test.ts` scans `/** */` text as code, so `simulate.ts` and `civ-rules.ts` comments must avoid apostrophes and backticks. The implementer already worked around this and reported it. The test file was left unchanged, as the ticket requires.
- `NAMED_BUILD_VERSION` is exported but unused (implementer's out-of-scope finding; not acted on).

## Coverage
I reviewed the full diff mechanically (non-comment-line check, export scan, heading check, id grep). I read the diffs of `lib/combat-simulator/*`, `depletion.ts`, `named-builds.ts`, `parse-text.ts`, `simulate.ts` and `civ-rules.ts` in full. I did not read comment-by-comment in the remaining aoe4 files (routes, stores, schemas, data, etc.), which I only sampled (the `Route` comments). UI inspection does not apply; the change has no UI.
