# SGS-212 review 10 (delta, text-only rework 2)

Tip 582806d68a62ecfbf4f95d0f575e2c53129aec83, delta from e5f987df51ee5a1f400a14a701fec7829cc0502d (the tip review-8 bounced).

Verdict: APPROVE

Blocking findings: none.

Check: `git diff e5f987d..582806d` touches one file, `acceptance/aoe4-rename-build.spec.ts`, one line (356). The title changed from "choosing the build again shows the server name when the stored name is out of date" to exactly `'opening ?n= shows the server name when the stored name is out of date'`, matching the Required fix verbatim. Test body, other tests, and all other files are unchanged. The title now matches the test, which reloads with `?n=`.

Acceptance criteria and invariants: unchanged from review-8 (clean apart from this title).

Bot reconciliation: not rerun (text-only delta).

Coverage: the delta only. No tests or lint run.
