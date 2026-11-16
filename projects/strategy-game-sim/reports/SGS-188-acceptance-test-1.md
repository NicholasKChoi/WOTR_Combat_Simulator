# SGS-188 acceptance-test 1

Verdict: PASS. Tip 3e602640271861133fe2b21567309cd9271c105f. No new commit.

The diff is itself the test change (acceptance/aoe4-auto-run.spec.ts, `first load runs once`), so I wrote no extra tests.

- Harness ran: `acceptanceSetup`, then the whole spec. 14/14 passed.
- Lint: `npx tsc --noEmit && npm run lint:dup` clean, no changes needed.

Criterion coverage:
- Listener registered before `openPage` and asserted empty: confirmed in the diff and by the mutation check below.
- Hydration check and other assertions unchanged: the diff only adds lines. The other 13 tests pass.

Mutation check:
- Break: added `useEffect(() => { setTimeout(() => { throw new Error("boom") }, 0) }, [])` at line 57 of components/apps/aoe4-build-order/build-text-editor.tsx, an uncaught error on load.
- Result: `first load runs once` failed at spec line 80, `expect(pageErrors).toEqual([])`, received `["boom"]`.
- Undone with `git checkout -- components`. `git status` is clean.

Not expressible: none. The base test passing under this break was not run separately. The base has no pageerror assertion, so it cannot fail on this break.

No processes left running (Playwright webServer self-managed).
