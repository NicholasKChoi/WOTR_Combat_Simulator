# SGS-173 spec gate 2

**Verdict: NEEDS_SPEC** (one small gap; everything else from gate 1 is closed)

Judged against the SGS-171 tip, `124dc82` on `sgs-171-split-aoe4-build-order-doc`.

## Gaps

1. **Scope / criteria (Local saved builds row)** - Scope leaves the "Local saved builds" row alone ("already short; leave it"). At the SGS-171 tip that row (ARCHITECTURE.md line 27) states the file store's environment selection: it writes to `.builds-local/` when `BUILDS_STORE_ID` is unset or empty, and a non-empty `BUILDS_LOCAL_DIR` points it elsewhere.
   - Scope also requires the new Storage section to state this same rule (`buildStoreFromEnv`, `.builds-local/` or `BUILDS_LOCAL_DIR`).
   - The criterion "No doc under `ARCHITECTURE.md`, `README.md` or `docs/` still describes the storage behavior in two places that can drift" then fails by construction: the rule lives in both places.
   - The implementer must either break "leave it" or ignore the criterion.
   - Proposed fix, pick one:
     - (a) Scope trims the Local saved builds row to the placement fact (git-ignored; the file store writes here) and links the Storage section for when and how to override it.
     - (b) Scope drops `.builds-local/`/`BUILDS_LOCAL_DIR` from the Storage bullet and links to the ARCHITECTURE.md row.
     - Option (a) is preferred because the format doc is the stated home. Either way, state the choice and adjust the "Out of scope" line.

## Checks that passed

- Gate 1's dependency gap is closed:
  - Depends on is SGS-171.
  - Storage lands in `docs/aoe4-build-order-format.md` after "Named builds routes" (a `####` under "Builds routes" under `## Route`) and before `## Outputs`. Both headings exist at the tip (`## Route` line 216, `#### Named builds routes` line 265, `## Outputs` line 290).
  - The format doc's intro exists and can take the storage mention.
  - The placement reason is given.
- Grounded scope: `build-store.ts`, `blob-build-store.ts` and `save-rate-limit.ts` exist. Spot-checked against the code:
  - `BLOB_SDK_RETRIES = 1`
  - the `VERCEL_BLOB_RETRIES` default
  - the `accept-encoding: identity` fresh read
  - `COUNTER_ATTEMPTS` and `contended`
  - `buildStoreFromEnv` using `BUILDS_STORE_ID` and `BUILDS_LOCAL_DIR`
- ARCHITECTURE.md storage row (line 25) and route-logic row (line 26) are as the ticket describes. Rows 25 and 26 are not among the rows SGS-171 edits (its edits are to row 30 and Rules), so the re-read instruction is sufficient.
- The Route sections state only the 503/`VERCEL_ENV` rule, the `buildStoreFromEnv` pointer and the named-build `ETag`/`If-Match` behavior. The store behavior is not yet in the format doc, so the move is not a duplicate.
- No doc or code comment cites the "saved-build storage" row by name. The only doc hits for the row's content are the two rows themselves and the Route pointers.
- Docs only, so Risk is low, Invariants `none`, Unverified assumptions `none`, On merge `none`, and no diagram trigger.
- The criteria are observable. The row-size bound (two sentences) is present, and the code-claim check is a reading check with a report line.
- No criterion pins a stale count or line number.
- No throwaway overlap found with other open tickets (gate 1 checked SGS-172 and SGS-174).

## Notes

- The ticket's "at most two sentences" for the route-logic row is "files and short roles (at most two sentences) plus the placement rules". Reviewers may read the bound as covering only the roles. Consider "at most four sentences in total".
- `CounterResult` also has a `refused` outcome beside `contended`. The Storage section's `nextCounter` bullet should keep the "a refused save writes nothing" rule, which the Scope list covers only as "per-client save limit".
