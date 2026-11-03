# SGS-077 spec-gate 3

(The agent wrote no file. It said its brief was read-only. The manager transcribed its returned text.)

Verdict: READY.

- The implementer's finding is closed. Scope item 6 names acceptance/aoe4-simulate-api-issue-shape.spec.ts, and its assertion and title move to 2.1.0. On main ebc063d it is the only test that pins 2.0.0. fight-api-spec-surface only checks that the version is truthy.
- Both unlisted edits are now named: the edges key list gains 'gathered', and the simulate-house-warnings digest excludes `gathered` and keeps its three pins. The rule says so, and unchanged pins become the check that no existing field moved.
- No new gap. The rule is stated and then applied to named tests. The doc passages are still present on ebc063d (docs/aoe4-build-order.md:763, :866). The line 672 "in API 2.0.0" text is historical and stays. The branch diff covers the 15 Scope files. Risk high is correct (criticalPaths simulateBuildOrder, plus a new required response field). A2, A3 and S3 hold. No open questions.

Non-blocking:
- simulate-house-warnings.test.ts digests the whole result, so every future result field breaks its pins.
- The Depends-on line still says main ee7ecb9, which is stale but harmless.
