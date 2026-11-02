# SGS-051 implementer 4 (rework 3)
- Branch sgs-051-aoe4-build-knight-longbow, tip b5eb52f, rebased onto origin/main (clean, 3 prior commits + 1 new).
- Fix: README knight entry now says the 10:00 farm block starts "about 1.5 s after 10:00 (10:02 as the page shows it)"; blank line before the spear bullet restored. Build JSON untouched.
- Fresh simulation check: rally 347.1 s (5:47); farm blocks start 601.5 / 840 / 960 / 1080 s; gold run-out 931.9 s (15:32). Other claims match; nothing else changed.
- Checks: tsc clean; lint:dup 0 clones; npm test 40 files, 1076 passed, 8 skipped; acceptance 543 passed; next build OK. No servers left running.
