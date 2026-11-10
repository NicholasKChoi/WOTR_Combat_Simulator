# SGS-105 implementer 3 (rework 2)

Branch sgs-105-save-and-open-by-link, tip e2bc300c2259f2a679ced7ee620ec9dca39132e3 (base 60d2161), worktree $FACTORY_DIR/worktrees/sgs-105-save-and-open-by-link.

Files
- docs/aoe4-build-order.md: sentence replaced verbatim per checklist (save stores the parsed build order and the duration; name rule in its own sentence).
- components/apps/aoe4-build-order/save-build-client.test.ts: four postSavedBuild result blocks folded into one it.each<[label, respond, expected]> table (201, 200, 429 Retry-After, rejecting fetch, 201 non-save, 200 non-save); `posts the request as JSON` kept separate.

Tests: save-build-client 24 passed; full suite, tsc, lint:dup run (see summary). eslint not runnable via npx (read-only npm cache, eslint not found locally).
Mutation: renamed 'Retry-After' header read at save-build-client.ts:65; "429 with Retry-After maps to minutes" failed; reverted via git checkout.
Doc claims: the new doc sentence is true per save-build.tsx:65 (posts durationSeconds) and the existing name logic; unchanged code.
Pre-existing tests edited: none. Out-of-scope: none.
Status: needs_review
