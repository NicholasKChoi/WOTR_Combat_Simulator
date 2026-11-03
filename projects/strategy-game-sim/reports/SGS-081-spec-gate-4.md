# SGS-081 spec-gate 4 (transcribed by manager; agent did not write the file)

Verdict: NEEDS_SPEC.

Gaps:
1. Home of PRODUCTION_FLOORS / MAX_FLOATING_AT_1200 contradicts itself (Scope 2 says in builds.test.ts; Scope 4 says shared module or test-helpers.ts; Playwright can't import a vitest *.test.ts). Fix: new lib/aoe4-build-order/production-floors.ts exporting both; builds.test.ts and the acceptance spec import it; name it in allowed files; test-helpers.ts untouched.
2. 1TC frozen steps: file has 25 steps at 2fc9593 (22 = research steeled-arrow time 420; 23 = research iron-undermesh untriggered; 24 = gold-depleted reaction). Correct the sentence; say where added steps go relative to reaction 24 and whether 24 is frozen; make explicit that added steps need time >= 420 or a reaction trigger.
3. Floor reasoning prose doesn't reproduce the table (e.g. villager max 66 * 0.7 = 46 vs 61). State the table is authoritative, or fix the prose maxima. foodPerMinute derivation checks out.

Passing: fails-at-2fc9593 claims consistent; countAt/gatherRates/floating checkable; production buildings covered (JSON only); deps, risk, invariants, docs fine; no open questions.

Notes: name the 1200 s sample via sampleIndex and read gatherRates.food at the same index; instantaneous food rate can dip; spec loops should read the shared table for lint:dup.
