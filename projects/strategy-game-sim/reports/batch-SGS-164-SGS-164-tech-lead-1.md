# Tech-lead: batch SGS-164-SGS-164

## Decision
PASS - draft PR opened. No blockers, no untested hotspots.

## PRs (bottom to top)
- SGS-164: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/175 - base `main` - **new** - head `a5490af8584fbb2a98c399f6f20c07d94e0060c7` (draft)

  ## Merge risk
  **low** - docs-only, a revert fully undoes it, no public surface or critical-path symbol touched, and every rule sentence is unchanged.

  ## Review focus
  No hotspots: the diff only deletes three notes that describe behavior the code no longer has and shortens the intro to match. No rule text, bound, or diagram changes.

## What I reviewed
- Range: `origin/main..sgs-164-combat-doc-stale-notes` (1 commit, a5490af).
- Files: `docs/combat-simulator.md` only. +1/-13 LoC.
- Invariants: W1 (the doc is the rules authority): only the intro and the three Current code notes changed. Every rule paragraph, the bounds, departures, extension points, and the flowchart are intact. W2: the Independence rule text is kept, and the note that contradicted it is gone. S3 is unaffected.
- Checked the removed claims against code. `DEFAULT_BATTLES = 1000` and `MAX_BATTLES = 100000` are in `lib/combat-simulator/simulate.ts:5-6`, and `validateBattles` is in `pages/api/fight.ts:56-60`. The doc's rule text matches.
- Grepped `docs`, `README.md`, and `ARCHITECTURE.md` for `current code|planned|today|one battle`. The only hits left are the Extension points and Not modeled statements (doc lines 145 and 151), which correctly describe rules that are not modeled. There are no other stale notes.
- Open questions in PROJECT.md: none. No open question was answered.
- Stack check: a single branch on `main` whose diff contains only its own task.

## Notes (non-blocking)
- The PR body was set with `gh api -X PATCH .../pulls/175` because REPO.md says `gh pr edit` fails on this repo.
