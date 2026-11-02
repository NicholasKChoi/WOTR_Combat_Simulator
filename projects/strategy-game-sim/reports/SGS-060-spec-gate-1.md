# SGS-060 spec gate 1

Verdict: READY

Checked against origin/main d5c2549.

- Grounded scope: `git grep` of the ticket's pattern gives 75 lines: api 28, edges 26, contract 6, depletion 4, waits 4, depletion-engine 2, five warm-up specs 1 each. Line-by-line, the 16 kept lines match Scope 5 exactly (api 107/108/109/158/169/275, edges 148/150/210, contract 277/278/342-in-cap-rewrite excluded -> 277,278,400,438,446, waits 28/248). Every named spec title, helper (`order`, `paste`, `simulate`, `buildOrderBody`) and model step shape exists. parse-text.test.ts:112 and parse-text.acceptance.test.ts:103/107 cover CRLF; `@1:61` is covered at parse-text.acceptance.test.ts:78.
- Cap rewrite is sound: an unknown unit yields exactly one `unknown-id` (rules skip when the unit is unresolved, validate.ts checkField/checkRules); 200 steps is the accepted maximum.
- `buildOrderFrom(text: string): BuildOrder` matches SGS-075 Scope 4. `text-to-build.test.ts` comes from SGS-057 (dependency).
- Criteria are observable; the grep, tsc, lint:dup and playwright criteria hold in the end state. Existing-test rule is stated (Scope 5 leaves the old `text` specs for the remove-`text` ticket).
- Invariants S3 and A3 named; no contradiction. Risk standard is justified (test-only). No diagram trigger. No open questions. Project and repo LESSONS are empty. Docs: route and OpenAPI unchanged, so nothing goes stale. Matches design M4.md "API test rewrite" rows and "ticket order" row 4. On merge none is fine.

Notes (non-blocking)
- Scope 2 says to turn `line N` regexes into `steps\[i\]` / `start`, but the exact post-SGS-075 message wording comes from `checkBuildOrder`, which is not merged. The implementer must read the merged messages; ticket already says to follow merged names.
- After conversion the "equivalent JSON gives the same as the paste" tests compare `buildOrderFrom(paste)` with the JSON literal, which is the A3 intent; the titles still say "paste", which is acceptable.
