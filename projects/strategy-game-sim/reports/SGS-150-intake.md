# SGS-150 lane intake

Type: Chore
Priority: low
Milestone: none
Working title: Acceptance flakes: small-screen :42 and step-band :143
Source: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md)

Backlog bullets:

- acceptance/aoe4-small-screen.spec.ts:42 "run bar at 360x760 ... scrolls the results heading into view" failed once in a full npm run acceptance (1/734), passed 5/5 alone and on a second full run; likely load flake. (SGS-095 implementer-2)
- acceptance/aoe4-build-order-step-band.spec.ts:143 flakes in large parallel acceptance batches (failed once in a 380-spec run, passed 13/13 alone). Reported by SGS-133 implementer-2.
