# Tech-lead: batch SGS-171-SGS-171 (tech-lead-1)

## Decision: PR opened (no blockers, no untested hotspots)

## PRs (bottom to top)

- SGS-171: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/178 - base `main` - **new** - head `124dc82cec45123fcd2ad9ab58d98fdea5aad4d9` (pushed by push.sh, draft, body set via gh api PATCH)

  ## Merge risk
  **low** - docs only: a revert fully undoes it, and it touches no API, schema, CLI, config or critical-path code.

  ## Review focus
  No hotspots: a text move with no code change; every moved paragraph is identical to its base text except the intros, the cross-file links and the four bulleted paragraphs.

## What I reviewed

- Range: `origin/main..sgs-171-split-aoe4-build-order-doc`, one commit `124dc82` (author `choinickolas@gmail.com`, so Vercel will accept it).
- Files: `ARCHITECTURE.md` (+3/-3), `docs/aoe4-build-order.md` (+8/-762), new `docs/aoe4-build-order-format.md` (+416), new `docs/aoe4-build-order-ui.md` (+380). +807/-765 total, all docs.
- Blocker categories: no invariant has `Paths:` over `docs/**` or `ARCHITECTURE.md`; no code, data, schema, route or `criticalPaths` change; nothing irreversible; no security surface; PROJECT.md Open questions: none. `git grep` finds no reference to the doc file names outside the three docs (no code, script, or acceptance link into moved anchors), so no consumer breaks.
- Leaned on review-1 for the paragraph-by-paragraph rule-preservation check (whole-file diff of base vs concatenated new docs, scripted link check 14/14 resolved); read the ARCHITECTURE.md diff and the model-doc diff myself.
- Stack check: single branch on `main`, diff contains only this task. No existing PR for the branch before the run.
- PR body: no `GitHub issue #` in Source (BACKLOG item), so no Fixes/Refs line; `Unverified assumptions: none`, so no Preview checks section. Stack footer uses the profile's `stackMarker` `cf-stack` (PR #165 used `code-factory-stack`; I followed PROJECT.md). Dependents SGS-173/174 have no PRs, so the footer lists only #178.

## Non-blocking notes

- From review-1, still open: `docs/aoe4-build-order.md:535` Extension points mentions "the validation kind table", now in the format doc, unlinked; ui doc's three former `####` subsections became `##` rather than `###`; "three tiers" sentence introduces four bullets in the format doc.
- For the manager (state dir): apply the On merge CONTEXT.md Design docs row; REPO.md Conventions ("`docs/<app>.md` for the design doc") and the AoE4 review checklist design-doc line should name the three docs (page reviews judge against the ui doc, input/route/output against the format doc).
- `gh pr create` printed "Warning: 42 uncommitted changes" - that is the main checkout's untracked files (cwd), not the scratch; harmless.
