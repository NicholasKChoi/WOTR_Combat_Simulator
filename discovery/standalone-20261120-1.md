# Discovery report: standalone, 2026-11-20

Window: base SHA d80751be..origin/main (5 commits). Items: none.

Checked:
- CI on main: `gh run list -b main`: only two runs, both `AoE4 data freshness`, both success; newest is 43936803352 (the watermark). No new runs.
- Issues: `discovery.sh uncovered` exited 0 with no numbers; `gh issue list` shows no open issues.
- Dependencies: Dependabot alerts are disabled (403); skipped. Outdated-direct-dependency check not run (no alert source; none flagged).
- New debt: no added TODO/FIXME/HACK/XXX lines in the window.
- Lint drift: `npx tsc --noEmit && npm run lint:dup` on origin/main in scratch checkout discovery-lint: tsc clean, jscpd 0 clones. Checkout removed.

Watermarks: alerts=0, ci=43936803352, issue=0
