# SGS-073 spec gate 2

Verdict: NEEDS_SPEC. See handback message.

Gap: parse-text.ts quote() truncates quoted tokens to 40 chars (MAX_QUOTED_LENGTH), so the syntax message for `at 8 vils aaaa...` is `line 2: expected an action, got '<40 a>...'`; it never contains 3000 chars. Fix: use `produce ${"a".repeat(3000)} from town-center` (ID regex accepts any length; validate.ts:360 quotes unknown unit id untruncated as unknown-id), assert data-code unknown-id and text contains the run; confirm the client-side check runs validation before POST.
