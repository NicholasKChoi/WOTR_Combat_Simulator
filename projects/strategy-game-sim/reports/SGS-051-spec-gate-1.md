# SGS-051 spec gate 1

Verdict: NEEDS_SPEC (two small gaps; neither needs the owner)

## Gaps

1. Docs (check 12) - Scope omits `data/aoe4-build-order/README.md`, "Prebuilt builds" section (line 34 on main). It
   lists each prebuilt build with source, omitted steps and transcription choices, and says every omitted step
   is listed there. SGS-050 adds an entry for its build there. A new build without an entry makes the README
   untrue ("a guide step ... is listed under its build below"). An implementer would skip it, because the
   ticket's docs line and its `git diff --stat` criterion allow only the JSON, builds.ts, builds.test.ts and a
   docs line. Fix: add the README to Scope (an entry under the ENG 1TC / SGS-050 pattern: name, source, Feudal
   landmark choice, the blacksmith ordering choice, N and measured run-out times), and widen the `git diff --stat`
   criterion to include it. Also name that SGS-050 edits the same section (rebase only).
2. Testable criteria (check 2) - the Content criterion says "no `amount`, rate, cost or time number (A1)", but
   Scope tells the implementer to use "time- or villager-triggered" steps, and ENG 1TC uses `trigger.seconds`
   and `villagers.count`. "time number" contradicts that. An implementer would guess whether `trigger.seconds`
   is allowed. Fix: reword to "no `amount`, rate, cost or duration restated; `trigger` seconds and villager
   counts are allowed", or a checkable form such as `jq` finding no `amount` key.

## Checks that pass

- Grounded: `builds.ts` (one-entry `BUILDS`, line 5), `builds.test.ts`, `english-1tc.json` (research steps use
  `tech`, build steps `building`, matching the ticket's jq) and `docs/aoe4-build-order.md:576` exist; `kings-palace`
  is in the snapshot and rules. New JSON is marked new.
- Open questions: none on the main path; N, landmark and upgrades are bounded implementer choices.
- Invariants A1-A3 named and not contradicted. Contracts match design/M3.md (M3.7 builds table, gold reactions,
  bar). Dependencies SGS-039/040/041 stated. Size ~3 business lines. Diagrams: none needed.
- Risk high (criticalPaths `lib/**`) is correct. On merge none is fine (no new command or doc).
- Decisions and design agree; the SGS-050 ordering (this build second) is consistent.
- LESSONS.md (repo and project) are empty.

## Notes

- The Content criterion's `produce knight` waits on Castle is stated in Scope; good. The Report criterion asks for
  the PR body to list the numbers; the README entry (gap 1) is the durable place for measured run-out times.
- The scratch-run shape (12 gold villagers, farms at 14/16/18 min) is a reference only; fine.
