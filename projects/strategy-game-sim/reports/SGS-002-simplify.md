# SGS-002 simplify
Reviewed diff 8532a0b..78048f7 (quality only). One change: un-exported `FIELDS` in acceptance/helpers.ts (only used there). Comments already meet the bar (none present); no dead code or reuse issues; Armies type, config, lockfile untouched.
Checks: tsc --noEmit clean; npm run acceptance 6/6.
