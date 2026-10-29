# SGS-004 tech-lead gate

## Decision

APPROVE. No blockers. Draft PR opened.

- PR #19: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/19, base `main`, head `sgs-004-wotr-combat-caps` at 0a84a2e (pushed; origin tip verified equal).
- Single-task batch, so no stack to link. `gh stack link` was not run (needs 2+ PRs); no footer.
- Body set with `gh api -X PATCH .../pulls/19 -F body=@file` per REPO.md. All six files-view links resolve to `pull/19/files#diff-<sha256>`.
- `git push -u` pushed the branch but could not write the upstream-tracking entry to the local git config (sandbox). Harmless; the remote branch is correct.

## Reviewed

- Range: origin/main 006c553 .. 0a84a2e (5 commits, all authored choinickolas@gmail.com): move, round/loop split, caps + casualty fix, acceptance spec, comment trim.
- Files: lib/combat-simulator/{battle,army}.ts (new), pages/api/fight.ts, pages/api/models/army.ts, docs/combat-simulator.md, ARCHITECTURE.md; tests lib/combat-simulator/{battle,army}.test.ts and acceptance/fight-api-caps.spec.ts skimmed.
- LoC: +613/-207 total; reviewable (excluding unit tests and acceptance spec) +247/-207, about 55 new or changed lines, the rest moved.

## Checks against the flag list

- Invariants: W1 holds. `resolveRound` uses min(strength, 5) dice and min(misses, leaders, 5) re-rolls; `takeHit` downgrades an elite when there are more than 5 units and 0 regulars. All three match docs/combat-simulator.md "Round order" steps 1/3 and "Casualties". Hit threshold, roll order, and simultaneous casualties are unchanged. W2 holds: the handler builds fresh `BaseArmy` objects per request and passes them to `Battle`; there is no module-level mutable state. S3 is unaffected: still ends only on elimination, and the downgrade keeps strength unchanged only while elites remain, so each army still converges to 0/0. S1 holds: lib imports only `./army`.
- Correctness: moved bodies match main byte for byte apart from the specified edits. `getSurvivor` gives the same strings for every finished battle.
- Irreversibility: none. `pages/api/models/army.ts` stays at its path as a re-export, and `/api/models/army` keeps status 500 (asserted by acceptance spec).
- Contract: `/api/fight` request, status codes, and response shape unchanged; no other importers of the moved modules (grep).
- Concurrency, security: nothing new. No secrets, no new routes, no new logging of user data.
- Open questions: the one open item (removing stale "Current code" notes) was resolved by the owner on 2026-10-29.
- Blast radius: matches the commit messages. criticalPaths is empty.

## Non-blocking notes

- PR #18 (SGS-009) edits a different section of docs/combat-simulator.md; whichever merges second gets a small textual conflict. Noted in the reviewer guide.
- The reviewer guide asks for a manual Fight! check with 10/0/5 vs 0/10/5 on the Vercel preview.
- `getSurvivor()` / `getStats()` now throw if called mid-battle; no caller does, and the ticket specifies it.
- `shouldStop` takes an unused `options` parameter by design (extension seam).
- Per-round `console.log` still runs and will be noisy at large N; removal is scheduled for the Monte Carlo ticket.
- acceptance/fight-api-caps.spec.ts is statistical over HTTP (100-400 fights per test). The only assertion that could flake is `oneRound.length > 0` for 10/0/5 vs 1/0/0 over 400 fights, and its failure probability is negligible. It runs about 1,000 requests, which adds suite time.
- The branch has 5 commits rather than the ticket's 3. The extra two (acceptance spec, comment trim) sit on top, so the move/split/behavior order is still reviewable.
