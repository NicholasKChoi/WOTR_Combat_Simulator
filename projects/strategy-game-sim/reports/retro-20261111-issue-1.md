Never skip acceptance-test when a diff adds or edits acceptance specs

## Problem

Since f2c25b4, only the acceptance-test gate runs end-to-end tests. But the acceptance-test skip rules in
`commands/manage.md` (~286-295) still skip it for low-risk tasks and for test-only diffs "at any risk",
citing "the implementer's and suite's runs of them" as evidence. Neither runs them: `implementer.md:57`
says not to author acceptance-harness tests, and `suite.md` runs `commands.unit` only. So a new or
edited acceptance spec can merge without ever having run.

## Evidence (one project, one milestone)

- A low-risk ticket required new acceptance specs. The implementer did not run them, acceptance-test was
  skipped as low risk, the suite ran unit only. The PR merged with an acceptance spec failing on main, and
  a whole follow-up ticket and PR were needed to fix it.
- Two more test-only acceptance diffs skipped acceptance-test the same way.
- The batch suite ran the full acceptance command in only 2 of 4 batches.

## Suggested edit

`commands/manage.md`, acceptance-test skip rules:

```diff
 Skip acceptance-test when:
 - the task is low risk;
 - the diff touches only tests (any risk); the implementer's and suite's runs of them are the evidence;
 - ...
+Never skip it when the diff adds or edits a file under the acceptance harness directory: then run
+acceptance-test on just those spec files (low risk may use the cheaper model). A skipped harness
+change is unverified, since no other gate runs e2e.
```

Alternative or addition: in the batch gate, the suite runs `commands.acceptance` whenever any task in the
batch skipped acceptance-test and its diff touched the harness. Also reconcile `implementer.md:57` with
tickets whose acceptance criteria require new harness specs.
