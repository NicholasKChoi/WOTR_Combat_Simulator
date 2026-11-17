# SGS-192 simplify 1

Verdict: nothing to trim. No commit made; nothing pushed.

Branch sgs-192-wait-details, tip d30e22c409d1cdfccec78bad4a51dce075843065 (3 commits over origin/main; there is no local `main` ref).

Loaded: common.md, REPO.md, LESSONS.md (the one lesson applies to `acceptance/**` only, not touched by simplify), styleSources.

Reviewed the non-test diff: simulate.ts, model.ts, research.ts, wait-detail.ts.
- Moving `constructing` from Engine to EngineState removes a cast, and wait-detail.ts needs it. Kept.
- Comments meet the comment bar (each states a constraint or tie-break rule).
- `waitReasonOf` and `waitDetailText` have no production caller, only tests. They are documented as Outputs (public wait-detail contract), so I left them rather than delete a spec'd surface.
- No duplicated helpers, no single-call-site helper with an oversized doc comment.

`npm test`: 90 files passed, 1 skipped; 2817 tests passed, 15 skipped. No browser or e2e tests run.
