# Discovery: standalone, 2026-11-17

Window: 87f0cd7..origin/main (636193d, 10 commits, #202-#211).

## Checked
- CI: `gh run list -b main`: only the "AoE4 data freshness" workflow, both runs success (latest id 43936803352, unchanged). No failures.
- Issues: `discovery.sh uncovered` with watermark 0 exited 0 and printed no numbers. Nothing uncovered. (Highest open issue lookup: `gh issue list` returned empty/failed on a scope message, so watermark kept at 0.)
- Dependencies: Dependabot alerts disabled (403). `npm outdated`: next 16.4.3 -> 16.4.6 (already in BACKLOG, skipped). Major behind: @types/node 24 -> 26 (project pinned to Node 24, intentional), jscpd 4.3.0 -> 5.4.3 (dev tool, no evidence of need). Both low, not filed.
- New debt: no TODO/FIXME/HACK/XXX lines added in the window.
- Lint drift: `npx tsc --noEmit && npm run lint:dup` on origin/main in scratch checkout: clean, 0 clones. Checkout removed.

## Items
None.

Low, not for filing:
- jscpd 5.x major bump (dev tool): standalone chore, priority low, confidence low.

## Watermarks
ci=43936803352 issue=0 alerts=0 sha=636193dcf07db9771772d1a143a8ea7b9e0395f1
