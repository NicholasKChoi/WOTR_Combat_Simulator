# SGS-051 spec gate 2

Verdict: READY

Both gate-1 gaps are closed:
1. Scope now has `data/aoe4-build-order/README.md` "Prebuilt builds" (verified present at line ~34 on main, with the ENG 1TC entry pattern). It names SGS-050 as co-editor (rebase only). The `git diff --stat` criterion and a README criterion cover it.
2. The Content criterion is now checkable: no `amount` key (jq), trigger seconds and villager counts allowed.

Re-checked: `builds.ts` has the single-entry BUILDS. `kings-palace-2` is in the snapshot. `MAX_DEPOSITS` is defined in design/M3.md (introduced by an earlier M3 ticket, not yet in lib). The M3.7 names and the blacksmith ordering match the design table. Bar parts and the SGS-039/040 split match the design. Risk high is correct (lib/** criticalPaths). Open questions: none on the main path. Repo and project LESSONS are empty. Docs: no `ENG 1TC` hit in docs/ or README.md, and the ticket says to grep again.

Notes (non-blocking):
- The mutation criterion needs a throwaway worktree; fine.
- Part 4 non-vacuity at 3600 s depends on the build actually depleting a gold deposit; the ticket expects it.
