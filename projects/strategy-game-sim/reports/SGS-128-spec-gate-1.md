# SGS-128 spec gate 1

**Verdict: NEEDS_SPEC**

Checked at `origin/main` (cdc51b1). I ran the proposed tests config in a detached worktree (removed afterwards). With `pattern` `**/{*.test.ts,*.spec.ts,*test-helpers.ts,route-test-support.ts,helpers.ts}` plus `acceptance` in `path`, jscpd reports 19 clones at 5 lines and 70 tokens. That matches the ticket's measurement, so the Unverified assumption about `pattern` holds. Sixteen of the 19 clones are in `acceptance/*.spec.ts`; the other three are in `builds.test.ts` and `builds-routes.test.ts`.

## Gaps

1. **Acceptance criteria, Probe** - "copying the old `fakeStorage` body back into a test file makes `lint:dup` fail" cannot fail as written. After the fold, the three old bodies exist nowhere, and the shared helper's body differs (entries record, `keys()`). A single pasted copy has no partner, so jscpd reports nothing. The reviewer would see a pass and either guess a different probe or log a false failure. Fix: the probe copies the body of `fakeStorage` from `storage-test-helpers.ts` into a test file (the helper file is in the tests-config pattern, so it is the partner). Alternatively, paste the same body into two test files. State that `lint:dup` then exits non-zero and names both files.

2. **Scope / LOC estimate and split clause** - the estimate is "~150", but there are 19 test-config clones (plus 8 from the default config on `acceptance/`, overlapping). Each clone is 6 to 20 lines, and the fold touches about 15 files. Add roughly 20 call-site edits for the new `fakeStorage(entries)` signature, and the real size is likely above 300 and may pass 400. The "stop and propose splitting" clause leaves the implementer to decide mid-run. Fix: put the split up front, or raise the estimate and say the ticket is one unit. Say which fold goes where: the `lib/` clones in `builds.test.ts` and `builds-routes.test.ts` go with the helper-and-tests work. The `acceptance/` clones go with the `.jscpd.json` `acceptance` path. Both stay roots.

3. **Scope, acceptance-clone folds / Invariants** - the `acceptance/` scan pulls in the non-AoE4 specs. One clone is `combat-simulator.spec.ts` against `fight-api-caps.spec.ts`. The ticket sets `Invariants: none`, but "Apps are independent" is adjacent: the fold crosses an app boundary if it moves code into an AoE4 file, or an AoE4 file's helper into the shared file. Fix: add that invariant to the field. Scope says that clones among non-AoE4 specs are folded into a local function or into `acceptance/helpers.ts`, and that no app's spec imports another app's helper module.

4. **Scope, fetch helper moves vs acceptance criterion 3** - Scope names the local `reply` in `auto-run.test.ts` as an example to move. It has a different shape from the shared one (`reply(status, body): Response`, against the shared `reply(body, status)` returning `() => Promise<Response>`). Scope also says to leave shapes that genuinely differ. The criterion "no test file redefines the fetch stub or JSON reply that `fetch-test-helpers.ts` exports" does not say which reading applies. Fix: state the rule, for example "a local helper is removed only when its signature and return value match a `fetch-test-helpers.ts` export; the others stay and are listed in the implementer's report". Drop `auto-run.test.ts` from the examples, since it needs no move.

5. **Scope, `throwingStorage` / criterion 4** - "every method throws" is undefined for `clear`, `key` and the `length` getter. All three current copies cover only `getItem`, `setItem` and `removeItem`. Fix: name the members, for example "`getItem`, `setItem`, `removeItem`, `clear` and `key` throw; `length` access throws". Also say whether `fakeStorage` implements `clear`, `key` and `length` or is cast like today.

6. **Scope, `fakeStorage` call sites** - the three copies take a single `initial` string keyed by a module constant. The shared helper takes `Record<string, string>`. The ticket says "only setup moves" but not that each call becomes `fakeStorage({ [KEY]: raw })`. `chart-layout`'s copy also has no `removeItem`. Fix: state that call sites seed through the record and that a missing `removeItem` is not an assertion.

## Notes

- The Docs item is correct and sufficient. ARCHITECTURE.md lines 46-48 are the only mention of `lint:dup`, `.jscpd.json` and `test-helpers.ts`. There is no other stale text in `package.json` or elsewhere.
- Risk `standard` is right: no production code, no criticalPaths symbols.
- On merge `none`: acceptable, since `REPO.md` `commands.lint` already calls `npm run lint:dup`. Consider mentioning in `REPO.md` that it now runs two configs.
- The `.jscpd.tests.json` `pattern` glob is the implementer's choice, as the design allows. My trial glob above works with `path` and `gitignore`. Note that a bare `helpers.ts` also matches non-acceptance helpers. A path-qualified `acceptance/helpers.ts` entry is stricter.
- The counts "8" and "19" in Context are measurements, not criteria. That is fine. Nothing in the criteria pins them.
