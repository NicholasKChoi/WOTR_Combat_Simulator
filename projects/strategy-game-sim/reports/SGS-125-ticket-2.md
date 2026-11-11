# SGS-125 ticket, re-spec 2

File: tickets/SGS-125-save-panel-rewrite-copy-and-versions.md (edited in place, lint clean).

- Removed `holdNextNamedSave` and the "if a generic hold exists" and lint:dup text. Scope's Specs bullet now uses SGS-118's `holdRequests(page, path, method, matches?)` and `holdNextSimulate`. SGS-125 adds only `NAMED_BUILDS_PATH` to `acceptance/helpers.ts`.
- Late-create, in-flight, late-new-version and late-failure criteria call `holdRequests(page, NAMED_BUILDS_PATH, 'POST'|'PUT')`. The "holds only its method" criterion is now a `holdRequests` PUT-hold row. The `function hold` grep criterion is kept.
- Folded from gate round 2: the NAMED_BUILDS_PATH ownership (note 2) and the link-panel batching hint (note 3: set the saved input's `selected` to the new key and call `onCreated` in the same handler). Notes 1 and 4 are resolved or need no change.
- Changed criteria are tagged `(respec 2)`. A `## Re-spec 2 - 2026-11-10` section is appended. No open questions.
