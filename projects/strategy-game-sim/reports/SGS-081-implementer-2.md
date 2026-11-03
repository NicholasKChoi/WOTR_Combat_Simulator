# SGS-081 implementer 2: needs_review

Branch sgs-081-aoe4-retune-prebuilt-farms, tip 70aa21a, worktree .claude/code-factory/worktrees/sgs-081-aoe4-retune-prebuilt-farms.

Spear/longbow (english-spear-longbow-maa-crossbow.json): +1 step (29 total, one added farm step, far under 60).
- New step 8: build farm from sheep, then sheep (the mill builder has no farm of its own; feeds food).
- Rallies at 200 s, 380 s, 760 s (TC), King's Palace rally, and gold#3 reaction: farm -> wood (wood is infinite, so nothing runs out unreacted; feeds wood).
- man-at-arms trigger 681 -> 757: the "reaches Castle" case failed (Castle/palace now complete ~756.4 s), 757 is the whole second after.
- Result: no farm-idle at 1200/1800/3600 s; all builds.test.ts cases pass.
Knight/longbow: 11 farm steps from the earlier pass kept. 1TC unchanged.

Gates: npm test 1346 passed/10 skipped; tsc ok; lint:dup ok; next build ok; npm run acceptance 710 passed.

Pins edited (old -> new):
- research.acceptance.test.ts: longbowman-2 at 845 12->9; longbowman-3 at 850 13->9; at 1800 66->63.
- simulate-construction.test.ts: population(660) 40->39.
- simulate-house-warnings.test.ts digests: spear 82867e5d74ea9cfd->ff99aa3c294f415f; knight f87b516ea7dc4f08->afa35f19e9a258a6 (held object unchanged).
- acceptance veterancy-conversion: same 12/13/66 -> 9/9/63 (incl. sums).
- acceptance house-lead-time: knight cap 1369.8607727353049->1316.3859872134028; digests population 7b6eb04bae4ffe28->af29a7017b7e11ca, spent 4a2d0d42e3757825->3aa9265132ebbc0f, steps db7191bb9543c39d->af5cbf5986dc59db, warnings 9f7d6def89a4dfc0->fd0832fe4520e3ef; withoutPalaceHouses pop 675/680/765 = 40/41/50 -> 690/695/765 = 40/41/47; series pinned re-derived; title 675-680 -> 690-695. Index filter i<21||i>23 unchanged (houses still 21-23).
- acceptance spear-longbow-build: MAN_AT_ARMS_STEP 23->24, castle 681->757, start 687.5475028949656->767.6367192366768. The 1200 s test "only the first gold deposit has run out" no longer holds (first gold now runs out after 1200 s, ~1515 s), so it became "no gold deposit has run out and the run has no warning"; FIRST_GOLD_DEPLETED_SECONDS removed. This changes what that test asserts; flag for review.

Docs/README: opening paragraph farm rule and farm-idle bar; spear entry (rallies to wood, extra farm, gold#3 to wood, 757 s, removed the "three gold deposits run out by 3600 s" measured claim); knight entry block times (600/840/960/1080 plus 563/634/722/942 groups, all feed food). Statement that the groups are "placed ahead of villagers sent by the TC rally and sheep reaction" is general, not checked per group. docs/aoe4-build-order.md bar paragraph adds the farm-idle sentence. README grep for "N.N s" in the section: 0.

Mutation: spear 760 s rally back to farm -> 3 farm-idle cases fail; deleting the new farm step -> farm-idle cases and Castle case fail; both undone.

Out of scope: none found. Node is v22 (harness expects 24); everything ran.
