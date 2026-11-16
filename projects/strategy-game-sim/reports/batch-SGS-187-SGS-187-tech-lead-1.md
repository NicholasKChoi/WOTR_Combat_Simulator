# Tech-lead gate: SGS-187

Decision: PASS. Draft PR opened.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/196 , base main, new, head f7ff09f4c088105819c70c532d447ed985e3295c

## Merge risk
**low** - a revert fully undoes it, it touches no public surface or critical path, and the type checker would flag any leftover importer.

## Review focus
No hotspots: pure deletion of an exported test helper with no importer, covered by `tsc --noEmit`.

## Reviewed
origin/main...sgs-187-remove-unused-settled-scroll-y, one commit, acceptance/helpers.ts, +0/-5. `git grep settledScrollY` at the tip finds nothing. No invariant, irreversibility, or security concern.

Non-blocking notes: none.
