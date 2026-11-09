# SGS-106 spec gate 1

**Verdict: NEEDS_SPEC** (one small, mechanical gap; everything else is ready)

## Gaps

1. **Acceptance criteria, "No file other than ... changes"** - the criterion pins a closed list of files
   (`scripts/smoke-preview.mjs`, `acceptance/smoke-preview.spec.ts`, `package.json`, `ARCHITECTURE.md`,
   `docs/aoe4-build-order.md`). A closed list of files goes stale. For example, an implementer who must
   fix a doc sentence the change makes untrue (Scope 4, last bullet) or touch `package-lock.json` has to guess
   whether that violates it. Proposed fix: replace it with the rule "the diff touches no app code and no
   contract: nothing under `lib/`, `components/`, `pages/`, `data/`, and not `docs/api/openapi.json`; the
   only non-script, non-spec files changed are docs and `package.json`". Keep the `package-lock.json` clause.

## Checks that passed

- Grounded scope: `data/aoe4-build-order/builds/english-1tc.json` exists (with `name`, `source`, `start`,
  `steps`). `scripts/` does not exist and the ticket says it is new. `acceptance:setup`, `acceptance` and
  `@playwright/test` are in `package.json`. The ARCHITECTURE "Where files go" table exists, and the doc
  heading it extends is specified by SGS-105/M6 line 216.
- Contracts match `design/M6.md` C3 and C4: 201/200 `{ id, path }`, 405 for DELETE in production, 204 on
  an absent build, 404 `{ error }`, the id pattern `/^[A-Za-z0-9_-]{11}$/`, and the Smoke table (steps,
  line format, exit codes, usage rule, 405 line). The `durationSeconds` 1200 is within 60..3600.
- Open questions: none. The owner action is in `On merge`, with the hold stated in Context.
- Invariants: S3 and A3 are named and consistent (one save per run, every wait bounded).
- Dependencies stated (SGS-103, SGS-105). Size about 130 LOC. The diagram is present.
- Risk `standard` fits: no criticalPaths symbol is touched.
- Docs: the ARCHITECTURE row and the doc subsections are in Scope, with a grep instruction for stale text.
- Input validation: the only input is one CLI arg and one env var, below the schemaLibrary threshold.
- Lessons: no entry is relevant.

## Notes (non-blocking)

- **Secret scope in the browser.** `extraHTTPHeaders` on the context sends `x-vercel-protection-bypass`
  to every host the page requests (any CDN font or script), not only the deployment origin. Consider
  `context.route('**/*', ...)` that adds the header only for the deployment origin. The spec criterion
  ("every recorded stub request carries it") still holds, since the stub is the origin.
- **Read-back compare.** The server stores the zod output, which strips unknown keys and may apply defaults.
  Step 2's deep-equal against the file as sent would then fail on any fixture field the schema alters. The
  ticket's local verification run will reveal this with `english-1tc.json`. If it appears, the fix belongs to
  this ticket's compare (compare the stored record to the schema-parsed input), not the route.
- The "open fails" case takes about 30 s of the 60 s default test timeout and the ticket already sets at
  least 60 s; fine.
- A Playwright test using the whole stub plus a real Chromium needs `acceptance:setup`; already assumed.
