# SGS-078 implementer report
Branch sgs-078-aoe4-timeline-started-first-type-colors, tip b6daa1322a3a284005297afaaa85812ce5c974b8, worktree $FACTORY_DIR/worktrees/sgs-078-aoe4-timeline-started-first-type-colors. Status: needs_review.
Unit: npm test 1318 passed/10 skipped. tsc, lint:dup clean. next build ok. Full acceptance 690 passed (incl. 390px spec).
Acceptance edits: aoe4-build-order.spec.ts header (l.643), Finished nth(2)->nth(1) (l.652, l.664), label td first()->nth(2) (l.670); timeline-compare.spec.ts nth(1)/nth(2)->nth(0)/nth(1) (l.47-48); new kind/legend assertions in knight-longbow-page.spec.ts.
Mutations: age-up rule dropped, villager/military merged, build case removed, landmark class filter dropped: each failed its test. Dropping the building-type filter or .sort() in the catalog is not caught (data has no such cases).
