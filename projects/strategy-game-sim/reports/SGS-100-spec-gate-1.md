# SGS-100 spec gate 1

**Verdict: NEEDS_SPEC** (three controller gaps; none needs the owner)

Checked: ticket, `design/M6.md` (C6, auto-run table, status table), INVARIANTS, CONTEXT, REPO.md, LESSONS (repo and project; nothing predicts a failure here). Read `pages/apps/aoe4-build-order.tsx` (`postSimulation` at 59, `errorMessages` at 68, call sites at 120 and 166), `schema.ts` (`SIM_INPUT_BOUNDS`, `outOfRange` exported, `durationSeconds` is integer-bounded 60..3600), `api.ts` (`SimulateRequest.inputs` is optional, so the controller's request type-checks), and `ARCHITECTURE.md`. Every named file and function exists, or is marked new.

## Gaps

1. **Scope, rule 4 and in-flight requests** - the design's rule 4 (key equals `rejectedKey`) says "no POST" and says nothing about an in-flight request for a different key. The ticket's rule 4 criterion does not say either. An implementer can leave the other request running, and its late 200 then overwrites the `rejected` status the user is looking at. Fix: state that rule 4, like rule 3, aborts any in-flight request, clears `inflightKey`, and makes its response stale. Add one case to the rule 4 criterion (K1 rejected, edit to K2 in flight, edit back to K1 gives `rejected`, K2's late 200 is dropped).

2. **Scope, `rejectedKey` lifetime against the "clears serverIssues" rule** - the ticket says `serverIssues` and `omittedIssues` are non-empty only while status is `rejected`, and that every other transition clears them. The design says only a 200 clears `rejectedKey`, and a failure never sets it. Sequence: K1 gets a 400, K2 fails (issues cleared, `rejectedKey` still K1), settle K1 again. Rule 4 matches and ends `rejected` with empty `serverIssues`, which contradicts the 400 criterion ("with the stored `serverIssues`"). The same happens after rule 3 or rule 1 follows a 400. Fix: pick one rule. Either clear `rejectedKey` whenever status leaves `rejected` (K1 would then re-POST, which is cheap and correct), or keep the issues privately beside `rejectedKey` and restore them on rule 4. Add a criterion row for the sequence.

3. **Scope, staleness after the body read** - the ticket drops responses by request identity, but the response handler awaits `response.json()` (and `readRejection`) after `post` resolves. A request can be superseded or disposed during that await. The ticket does not say to re-check staleness after the body read, so an implementer may check only once before it. Fix: add to Scope that the identity check happens after the body is read, before any state change or `onChange`. Add a case for it: `post` resolves, the body read is deferred (a `Response` with a manually resolved stream or `json` stub), an edit settles to B or `dispose()` runs, then the body resolves and nothing changes.

## Smaller points to fold into the same edit (gap-level only if left ambiguous)

- **`onChange` at create.** The ticket says `getState()` always equals the last state passed to `onChange`, and that `onChange` is called after each change "a call or timer or response makes". For create with `held` false the constructor posts and moves to `running` before it returns. It is unspecified whether `onChange` fires during construction (the hook cannot have a handle yet). Say: create never calls `onChange`; the caller reads `getState()` after it returns. Add that to the create criteria.
- **Closed export list.** Scope says "Exports exactly the C6 names". A test or grep over a closed list of exports goes stale. The design's module table already owns the list, so Scope can say "exports the C6 names" and drop "exactly". The criterion itself only checks presence, which is fine.

## Checks that pass

- Testable criteria: each has an observable outcome and a "break caught" line. Numbers (60, 3600, 500) are design constants. The criteria read the bounds from `SIM_INPUT_BOUNDS`. No existing test needs a rule, since behavior is preserved and the criterion says none are edited.
- Open questions: none; CONTEXT has none. OD-7 (a) is applied (no jsdom).
- Invariants: S3 and A3 named. A1 and A2 correctly excluded. Nothing contradicts them.
- Contracts: names and shapes match C6, the auto-run table and the module table. No dependency.
- Size: about 220 lines of business logic, under 400.
- Diagram: present (a state machine is a diagram trigger).
- Decisions: CONTEXT Decisions is empty. The body agrees with the design.
- On merge: `none` is right. The ticket adds no command or harness, and the acceptance helper that uses `AUTO_RUN_DEBOUNCE_MS` belongs to a later ticket.
- Risk: `high` is right (rule order and seq handling decide which result shows, A3).
- Docs: the ticket greps `postSimulation` and `errorMessages` and conditionally updates ARCHITECTURE. I confirmed ARCHITECTURE.md has no per-file entries for `components/apps/aoe4-build-order/` (only layout rules, plus a jscpd note), so no doc edit is expected. Fine as written.
- Input validation: `readRejection` is the existing hand check on our own route's 400 body (two fields, an array of issues), moved as is. It is not a new boundary. No `schemaLibrary` change is needed.

## Notes

- Rule 3 resets `shown` but the design does not say whether it clears `rejectedKey`. Gap 2's fix covers it.
- A latest request whose `post` rejects with an `AbortError` that the controller did not cause is unspecified. The ticket treats a non-`AbortError` throw as `failed`. Consider saying that a non-stale `AbortError` is also `failed`, so a status is never stuck on `running`.
