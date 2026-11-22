# Simplify report: SGS-213 (sgs-213-step-popover-beside-text)

Tip reviewed: 6f9b91f02772ee301b6db84dc8c3299b90b2ce28 (base origin/main). Working tree clean.

Loaded: common.md, REPO.md, LESSONS.md, CONTEXT.md, INVARIANTS.md, ARCHITECTURE.md (style source; tsconfig.json has no prose rules).

Invoked the `/simplify` skill (Skill tool). Reviewed the diff across its four angles (reuse, simplification, efficiency, altitude), done inline by one agent rather than four spawned reviewers, since the diff is small (7 files).

Findings: none worth applying.
- Reuse: `placePopover` is a pure extraction of the old `place` with injected rects; `clamp` and the margin constants are reused; `hasPopover` is the one gating predicate, and no existing helper duplicates it.
- Simplification: `placePopover` is a single early-return plus the unchanged fallback; tests are tabled (`it.each`); no dead code or redundant state.
- Efficiency: one extra `getBoundingClientRect` on the textarea per update, only while a popover is open; nothing to cut.
- Altitude: placement logic sits in the popover module, and the gating predicate in `step-annotations.ts` beside `waitedText`; no special case layered on shared infrastructure.
- Comments: the existing portal comment is a hidden constraint and stays; no new narrating comments.

No edits made, so no unit tests were run and no commit was created. Nothing pushed.

simplify-proof: sgs-213-step-popover-beside-text no-change /simplify was invoked on the branch and changed nothing.
