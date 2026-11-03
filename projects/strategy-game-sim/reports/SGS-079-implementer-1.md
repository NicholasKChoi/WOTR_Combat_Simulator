# SGS-079 implementer 1
Branch sgs-079-aoe4-prebuilt-docs-no-measured-results, tip 7e6a0857eeaaf933e46b973d792a898a85866ac1, worktree $FACTORY_DIR/worktrees/sgs-079-aoe4-prebuilt-docs-no-measured-results. Status: needs_review.
Files: data/aoe4-build-order/README.md (Prebuilt builds section only).
Checks: criterion 1 grep = 0 (was 6); criterion 2 = 0 (was 13); 0:21, never reached, 687/695 gone; 681 s, 10:00/14:00/16:00/18:00, 0:40 kept. tsc, lint:dup pass; npm test 1307 passed, 10 skipped. Build/next build not run (docs only). No tests edited, none written (docs only, so no mutation checks).
Doc claims: opening-paragraph sentence (measured results not listed) - states policy; "man-at-arms must not start before Castle" - same reason as main's "Feudal unit would otherwise start before Castle"; "three gold deposits run out by 3600 s ... three reactions" - spear build JSON has gold, gold#2, gold#3 reactions; "5:30 rally to gold waits behind the 5:15 farm block, so it fires after 5:30" - knight build rally/farm step order; "held at the supply limit until the third house starts" - auto-houses stay off until the third explicit house (same text on main).
Out of scope: none.
