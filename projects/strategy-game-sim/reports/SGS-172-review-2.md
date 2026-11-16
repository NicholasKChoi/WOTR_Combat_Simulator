# SGS-172 review 2

Verdict: APPROVE
Delta mode (text-only rework). Tip 1c0d25f; checked 6a9d9f4..1c0d25f.

- The diff touches only README.md, two lines.
- Required fix 1 (`smoke:preview` row) landed verbatim. It keeps the URL argument, the bypass secret and the 401/403 request-to-set message. The new Chromium and production-delete claims hold against `scripts/smoke-preview.mjs`: the secret check is at line 73 and the 405 "delete is disabled" failure at line 162.
- Required fix 2 (`docs/` bullet) landed verbatim.
- No blocking findings. Lint, bot and UI inspection do not apply to a README-only change.
