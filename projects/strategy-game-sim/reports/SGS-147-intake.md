# SGS-147 lane intake

Type: Bug
Priority: low
Milestone: none
Working title: Browser storage edges: readStoredPin wipes on bad parse; cross-tab clear and 50 cap only on reload; recordCreated puts the entry at the front of the whole list. Only the recordCreated half of the Named-builds bullet is in scope; the unmount-before-201 half is dropped by owner triage
Source: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md)

Backlog bullets:

- `components/apps/aoe4-build-order/pin-storage.ts:24` `readStoredPin` still calls `removeItem` on an unparseable pinned run, the pattern SGS-131 removed from my-builds; lower stakes (no secret). Reported by SGS-131 review.
- AoE4 build page (M9.12 fixed the run bar part): another tab clearing storage is not picked up until reload, and builds created in this tab are not capped at 50 until reload. (SGS-125 review 1)
- Named builds: if the page unmounts after the server created a build but before the 201 arrives, the edit secret is never stored and the build can never be edited (design accepts it). Also `recordCreated` puts the new entry at the front of the whole list, not the My builds group (invisible while the select groups by kind). (batch13 tech-lead, SGS-125)
