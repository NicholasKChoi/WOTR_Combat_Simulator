# SGS-149 lane intake

Type: Chore
Priority: low
Milestone: none
Working title: Test hardening: spec waits after running; memory-store env test cannot fail; tab-order spec masked assertions
Source: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md)

Backlog bullets:

- Acceptance specs (SGS-118): wait briefly after `running` before reading the answered list so the new "no response before release" assertions are the first failure, not shadowed by earlier asserts.
- Memory-store "shares no named build between envs" test (build-store.test.ts, SGS-120) cannot fail on an env bug since each memory store has its own map; the existing builds env-isolation test has the same gap. (SGS-120 review 1)
- acceptance/aoe4-split-tab-order.spec.ts: column-order and handle-before-caret assertions are masked by setup assertions under mutation (column swap trips 'every chart section is rendered'; caret-before-handle trips 'every chart section has a handle stop'); harden by taking the last chart's handle from the DOM. Reported by SGS-141 acceptance-test-1.
