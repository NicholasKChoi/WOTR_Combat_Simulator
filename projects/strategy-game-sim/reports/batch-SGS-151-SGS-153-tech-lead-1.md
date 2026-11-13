# Tech-lead gate: SGS-151, SGS-153

Decision: no blockers, no untested hotspots. Two independent draft PRs opened against main.

Both branches were rebased onto origin/main 5371c25 in their worktrees and force-pushed with lease.

- PR #162 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/162 (base main), branch sgs-151-shared-blob-test-fake, tip 86a5be3. Merge risk low (test-support and test files only). Review focus: No hotspots (test-only refactor; fake has its own test file).
- PR #163 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/163 (base main), branch sgs-153-smoke-script-hardening, tip 3a86c57. Merge risk low (developer script, spec, one docs paragraph). Review focus: scripts/smoke-preview.mjs:92-103, bypass-secret route handler, pinned by acceptance/smoke-preview.spec.ts "redirect of a same-origin subresource".

Reviewed: combined diffs vs origin/main (low-risk mode: invariants, irreversibility, security). SGS-151: 5 files, +337/-145. SGS-153: 3 files, +204/-44. No invariant touched, no production code, no schema or migration, no secret value in the diff.

Non-blocking notes:
- SGS-153 launches Chromium with --disable-features=LocalNetworkAccessChecks (accepted deviation). It applies only to the smoke script's own browser.
- SGS-151 criterion 2 met in intent, not literally, in blob-build-store.test.ts (per review).
- `gh pr create` printed "11 uncommitted changes" (untracked dotfiles in the main checkout); unrelated.
- Stack footer is single-entry (independent PRs).
