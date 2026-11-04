# SGS-093 acceptance-test 1: PASS
Tip: see git log on sgs-093-aoe4-docs-prebuilt-cleanups (one test commit atop 6e7ebd3).
- Added: contract spec test "the 200 examples show a warning, a marker and a run-out numbered deposit between them" (criterion: goldRunOut example content).
- Ran contract spec + spear-longbow + prebuilt specs on the live API: 101 passed (existing key-equality, schema validation and per-example "returns documented 200 body" cases cover buildOrder and goldRunOut).
- Mutation: emptied goldRunOut warnings/markers and nulled depletedAt in openapi.json; the new test and the goldRunOut documented-body case failed; reverted via git checkout.
- No impl-defects, spec-gaps or blockers. eslint is not configured in repo (flat-config error), so lint not run.
