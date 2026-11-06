# SGS-095 ticket author report

File: tickets/SGS-095-test-hygiene-followups.md. Risk low, Depends on none, no open questions.

Checked against origin/main 9274372:
1. Applies. MAN_AT_ARMS_STEP = 34 still hard-coded. API steps carry only an index, so the ticket derives it from the imported build JSON (first produce/man-at-arms step; several later ones carry `instance`).
2. Applies. `cases` computed at describe time; title uses `%#`.
3. Applies, reworded. The quoted "house lead-time rule" comment is already gone (PR 103 rewrote it to "Re-pinned for villagerTarget: ..."). That is still a history note, so the ticket deletes it, digests untouched.
4. Applies. Suspected cause (unconfirmed, implementer must reproduce): `networkidle` does not guarantee hydration; a pre-hydration click does a native form submit and no fetch. Same wait is in the other two combat-simulator specs, so the ticket adds one shared helper. A different proven cause is allowed.
