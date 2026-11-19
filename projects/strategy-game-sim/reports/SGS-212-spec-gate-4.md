# SGS-212 spec gate (4)

Verdict: READY

ticket-lint.py: clean. Code read at origin/main via git show; no scratch checkout. SGS-209 is integrated.

## Re-spec 1 gaps from spec-gate-2, all closed

1. Submit text: Scope now fixes `Save name`, never `Rename`. A criterion has an acceptance test locate the submit by role and name, and fail if it is named `Rename`.
2. `canSubmit`: Scope sets it to the Rename button's enabled rule, not Save as copy's `canSave`. A criterion requires a rename to submit for a stale-run, unconvertible or edited build, with a test that fails if submit is disabled.
3. `aoe4-save-status.spec.ts`: now named as a changed-order test. The rule is "Rename right after Save a new version wherever it is shown". Verified in code: `LINK_ROW` at line 21 and `rowIds` at lines 54, 59 and 169. The row without Save a new version (line 54) keeps its ids. `save-build.test.ts` line 87 pins the order, and the existing-tests rule covers it. `aoe4-split-tab-order.spec.ts` uses ordered subsequences and is unaffected.

## Checks

All sixteen items were checked. No gaps.

- Scope names (`validName`, `canSave`, `hideLink`, `saved.by`, `Saver`, `withLoadedEntry`, `withRereadMyBuilds`, `renameNamedBuild`) exist at the base. `name-form.tsx` is marked new.
- Criteria agree with design C10 to C12, the "Rename: page" table and D17. The owner decision on the re-read name is recorded. No open questions remain.
- Risk standard is right: no `criticalPaths` symbol is touched. The item 16 hotspot list does not apply to a standard ticket.
- Docs and ARCHITECTURE.md are in Scope.
- `On merge: none` is valid.
- No other open ticket removes the code this one changes.
- No hand-rolled validator is extended beyond one field.

## Notes (non-blocking)

- Other acceptance specs that depend on the stored name beating the server name (`aoe4-my-builds.spec.ts`) fall under the existing-tests rule. The implementer should re-read them under D17.
- `withRereadMyBuilds` is not exported today. The ticket allows exporting it or covering it through the page.
