# SGS-093 simplify pass 1

Changes: no change.

Reviewed `git diff origin/main...HEAD`: acceptance spec edits (loops over example maps, small new tests), one pinned-digest and one new pinned-depletion unit test, a removed rally step in prebuilt JSON, docs reflow and a regenerated openapi.json. No duplication, reuse or efficiency cleanup was worth making; pinned values and assertions left alone.

Checks: none run, since nothing was edited.

Final branch tip: 26eebf9e2942894622c1232ba60d744fa5d428cb (no commit added).
