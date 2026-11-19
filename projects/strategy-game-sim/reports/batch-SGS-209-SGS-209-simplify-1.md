# Simplify report: sgs-209-rename-api-patch-named-builds

Ran /simplify over the 3-commit diff. Reviewed inline; I did not launch the four review agents the skill describes.

Trim: `updateNamedBuild` and `renameNamedBuild` in lib/aoe4-build-order/named-builds-routes.ts repeated the same edit-secret and If-Match checks. They now call a shared `checkWriteCredentials`, which keeps the check order (401, then 428, then body checks).

Tests: `tsc --noEmit` and `named-builds-routes.test.ts` (112 tests) pass. No browser or end-to-end tests were run.

Skipped: the rest of the diff has no further reuse, efficiency or altitude findings. `writeNextRevision` already shares the write path.

Commit: 3f948d434df1ebf513bb05dcdaa5694acb1c2c42 on sgs-209-rename-api-patch-named-builds. Nothing pushed.

simplify-proof: sgs-209-rename-api-patch-named-builds commit 3f948d434df1ebf513bb05dcdaa5694acb1c2c42
