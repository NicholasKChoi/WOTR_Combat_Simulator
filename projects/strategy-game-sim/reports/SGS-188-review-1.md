# SGS-188 review 1

Verdict: APPROVE (tip 3e602640271861133fe2b21567309cd9271c105f)

## Blocking findings
None.

## Acceptance criteria
- Listener before openPage, fails on pageerror: pass. `page.on('pageerror', ...)` is registered before `trackPosts`/`openPage`, and `expect(pageErrors).toEqual([])` runs at the end. The implementer's mutation (init-script throw) failed on exactly that assertion with `["boom"]`. The test can fail, and the base test has no such check.
- Hydration console check and other assertions keep their meaning: pass. The diff adds 3 lines only; nothing existing is edited.
- Pre-existing tests keep their assertions: pass. Only the named test is touched.
- No INVARIANTS regressions: pass. Test-only change, no application code.

## Chore check
No application code changed and no existing assertion changed. Scope matches (one spec, one test, no shared helper).

## Conventions
The listener matches `acceptance/aoe4-save-open.spec.ts:175` (`page.on('pageerror', (e) => errors.push(e.message))`). No comments or docs added.

## Linter
`npx tsc --noEmit && npm run lint:dup` run in the task checkout: tsc clean, jscpd 0 clones.

## Bot
Not run: no review bot step was applicable beyond lint in this pass.

## Non-blocking notes
The hydration-failure case itself was not reproduced (ticket's unverified assumption); the plain uncaught error case is verified by the mutation record.

## Coverage
Diff of `acceptance/aoe4-auto-run.spec.ts`, implementer report, sibling spec. No UI inspection (test-only diff). Acceptance tests not run by review, per rules.
