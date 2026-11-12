# SGS-131 spec gate 2

Verdict: READY

Read at origin/main (fetched). SGS-128 is not integrated, so its contract (`fakeStorage(entries?: Record<string,string>)`, `throwingStorage`) was read from its ticket file and design C12.

## Earlier gaps

1. Contradiction with the existing removal test: closed. Scope now states the rule (tests asserting removal become unchanged-stored-string assertions; every other test keeps its assertions; implementer lists edits). The base test `returns [] and removes the key for %s` exists and matches the rule. Criterion 1 requires no remaining removal assertion.
2. Throwing `getItem` in `upsertMyBuild`: closed. Scope commits to no backup attempt, list written, `persisted` following the list write. A new criterion covers it (getItem throws, setItem works). It can fail on the current code only through the backup parts, which is fine for a guard.

## Checks

- Grounding: `readMyBuilds` calls `removeItem` on a parse or shape failure at base; `upsertMyBuild` rebuilds from valid elements only. Both as the ticket says.
- Contracts: `MY_BUILDS_BACKUP_KEY` value, intact definition and behavior table match design C11 and "My builds (M9.10)".
- Docs: the My builds paragraph naming `my-builds-unavailable` exists at `docs/aoe4-build-order.md` line 1084 at base, with no statement about an unreadable list.
- Criteria are behavioral and testable; no stale counts or quoted messages. Invariants none, On merge none, risk standard, size about 50 LOC, no overlap with other open tickets.

## Notes (non-blocking)

- Unspecified edge: `getItem(MY_BUILDS_BACKUP_KEY)` throwing while the main read worked. Treating it like a failed backup (`persisted: false`, no list write) is the safe reading; the implementer may add a row.
- Duplicate ids among valid elements count as intact, so no backup is made when dedupe drops one. That follows the design definition; fine.
- Criterion 48 relies on SGS-128 landing first; the Depends-on line covers it.
