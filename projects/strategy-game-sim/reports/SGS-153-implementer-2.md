# SGS-153 implementer 2 (rework)
Branch sgs-153-smoke-script-hardening, worktree .claude/code-factory/worktrees/sgs-153-smoke-script-hardening. Status: needs_review.
Change: docs/aoe4-build-order.md (redirect paragraph of the smoke section) now says: API requests fail on a 3xx; in `open` with the secret set, same-origin requests with the header fail on a redirect; with the secret unset `open` installs no route handler and redirects are followed.
Backing code: scripts smoke file lines 52-54 (manual redirect for API), 97-99 and 125 (routeBypassToOrigin only `if (secret)`).
Optional Chromium-flag suggestion: not done. No code changed; no tests, lint or build rerun (doc only).
