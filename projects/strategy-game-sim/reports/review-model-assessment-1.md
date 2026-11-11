# Review model assessment 1: can sonnet review `standard`-risk tickets?

Date: 2026-11-10. Scope: strategy-game-sim, SGS-091 to SGS-126. Read-only analysis; nothing else was edited.

## Verdict

**No, apart from a narrow exception that already mostly exists.** Keep `review` on `opus` for `standard` risk.

- Most of the blocking findings in standard reviews are class (b): they needed deep reasoning. The reviewer either ran its own mutation to prove a test could not fail, or it reasoned about a doc or contract claim across layouts, routes or data.
- In this project's history, the sonnet reviews skipped exactly those checks. None of the four sonnet low-risk reviews ran a mutation, and one of them (SGS-113) let through a data-dependent precondition that could not fail. That miss became a whole new ticket, SGS-126.
- At current list prices, opus costs 2x sonnet per review. A single missed class-(b) finding costs at least one rework loop and at most a new ticket. Either one is far more than the opus premium. Break-even needs sonnet to miss fewer than about 1 in 8 reviews; the observed class-(b) blocking rate in standard reviews is above 50%.
- The safe exception: a sonnet review is acceptable when the diff changes no test, doc or contract text (a pure mechanical refactor or rename). The existing rule that runs delta reviews after text-only reworks on sonnet should stay; all three such deltas (SGS-114 r2, 115 r3, 120 r2) were correct.

## Classification key

- **(a) mechanical/surface.** House style, indentation, a copied helper or constant, a stale test title, a table fold. Found by reading the diff against conventions.
- **(b) deep reasoning.** A test that cannot fail, proved by mutation or by semantic argument (NaN coercion, a data-dependent precondition, programmatic scroll). Or a doc/contract claim that is false on some path, layout or route (client navigation vs hydration, the tabs layout below 1200 px, exhaustive-list claims).

## Evidence: standard-risk reviews (opus unless marked)

| Ticket / round | Model | Verdict | Blocking findings (class) | Notable non-blocking | What later gates caught |
|---|---|---|---|---|---|
| SGS-091 r1 | opus | RC | Copied `ID_QUOTE_CHARS` / `shortId` (a) | - | - |
| SGS-093, 094, 107, 110 | opus | APPROVE | - | - | - |
| SGS-097 r1 | opus | RC | OpenAPI and doc location lists claimed to be exhaustive; disproved by probing `checkBuildOrder` output (b, partly a) | - | - |
| SGS-099 r1 | opus | RC | `omittedIssues > 0` cannot catch an off-by-one; confirmed by mutation (b) | - | - |
| SGS-103 r1 | opus | RC | ARCHITECTURE "route files only adapt" is false for simulate.ts and fight.ts (b); OpenAPI omits the roundTripIssues rejection (b) | - | - |
| SGS-104 r1 | opus | RC | First-paint claim is false on next/link client navigation, because `getServerSnapshot` is used only at hydration; checked in Playwright (b); doc sentence order (b-ish); copied `openPage` (a) | - | - |
| SGS-105 r1-r5 | opus | RC x3 | r1: doc false without SGS-104 (b), savedBuildName vs pinName (b), `?b=` load (b), pin label (b), copied `sameInput` (a). r2: text the reviewer itself dictated dropped "the duration" (b), table fold (a). r3: subsection inserted mid-paragraph (a/b) | - | - |
| SGS-106 r1 | opus | RC | Doc overclaims that the smoke test checks `path` (b) | - | - |
| SGS-108 r1 | opus | RC | aria-describedby doc claim contradicted by the debounce status (b); missing 59.9 s row (b). The reviewer also dictated a `styles.stale` assertion that cannot fail, because Vitest CSS modules are proxies (an opus error) | Badge mid-word wrap filed as a note | M7-validate found the badge wrap (retro P2) |
| SGS-109 r1 | opus | RC | Start-row handlers untested, confirmed with a scratch spec (b); dropped doc rules (b); stale test title (a) | - | - |
| SGS-114 r1 | opus | RC | JSX indentation (a) | Tab test starts from a programmatic focus; some stored-value rows prove only "no error" (b). UI inspection at 5 widths; focus restore and hydration logic checked | - |
| SGS-114 r2 | sonnet (delta) | APPROVE | - | - | Clean |
| SGS-115 r1 | opus | RC | Test sets scrollTop programmatically, so the "window unchanged" assertion cannot fail; confirmed by mutating `overscroll-behavior: contain` (b). Doc line 851 is false for the tabs layout below 1200 px (b) | Chrome scroll anchoring after the bar shrinks (b) | - |
| SGS-115 r2 | opus | RC | Precondition checks only that the page overflows, not that it can still scroll down; about 51 px of margin (b, data dependence) | - | Second rework; tripped reworkCount 2 and forced an opus re-spec |
| SGS-115 r3 | sonnet (delta) | APPROVE | - | - | acceptance-test confirmed the fix by mutation |
| SGS-118 r1 | opus | APPROVE | - | `expect(answered).toEqual([])` rarely fails first (b); two nits (a) | - |
| SGS-119 r1 | opus | RC | Row `sameSecretHash('abcdef','abcde')` cannot catch a missing length guard because of NaN coercion. Guard deleted, 51/51 still passed (b) | - | - |
| SGS-119 r2 | opus | APPROVE | - (mutation re-run) | - | - |
| SGS-120 r1 / r2 | opus / sonnet delta | RC / APPROVE | (text-only rework) | - | Clean |
| SGS-122 r1 | opus | APPROVE | - (ran 3 of its own mutations: passthrough, dropped 401, status 0) | Duplicate stubFetch (a); ARCHITECTURE test-helper sentence (b); abort after headers, pre-existing (b) | - |
| SGS-123 r1 | opus | APPROVE | - (analysed the sort and dedupe rows: a string compare gives [3,1,2]; 50 cap) | Array-by-reference (b); nits (a) | - |
| SGS-112, 124 | opus | APPROVE | - | - | Batch suite and tech-lead clean |

**Tally (standard, first full review rounds):** 12 of about 20 tickets got REQUEST CHANGES. **10 of those 12 had at least one class-(b) blocker.** Only SGS-091 and SGS-114 bounced on class (a) alone. On the APPROVE rounds (118, 122, 123), the value was reasoning verified by mutation, not surface findings.

## Baseline: sonnet low-risk reviews

| Ticket | Verdict | What the review did and did not do | Outcome |
|---|---|---|---|
| SGS-113 | APPROVE | Criteria "pass by reading"; no mutation; the acceptance spec was never run | **Escape.** The pinned-only legend test's precondition fails at 300 s (data dependence, the same class opus caught in SGS-115 r2). The batch suite failed 916/917, and pin-compare.spec:141 also fails on base. Fixing it took a new ticket, SGS-126 (re-spec plus a full cycle) |
| SGS-116 | APPROVE | Skipped the UI inspection and the REPO.md screenshot step | No escape found |
| SGS-117 | APPROVE | "Did not check whether reviewBot configured"; did not re-run mutations | No escape found |
| SGS-126 | APPROVE | Did not run tsc or lint itself; did not check the bot | No escape found |

Across all four, sonnet ran no mutations of its own and skipped steps from the review checklist. Low risk also skips acceptance-test and simplify, so review is the last check before the suite. The one escape it allowed is the retro-20261110 P1 class (tests that cannot fail), which is exactly the class standard-risk review exists to catch.

## Cost comparison

Prices (Anthropic list, per MTok input / output): Opus 5.5 $4 / $20; Sonnet 5.5 $2 / $10. **Opus costs 2x per token**, so the premium per review is about one sonnet review's cost, written R below. Token counts per review are not recorded in the run logs, so the figures below are in units of R, not dollars.

| Event | Agent runs it adds | Approx. cost |
|---|---|---|
| Opus instead of sonnet, one review | 0 | +1 R |
| Missed (b) blocker caught by acceptance-test | implementer rework + delta review + acceptance re-run | ~3-4 R plus wall-clock |
| Missed (b) blocker caught by suite (SGS-113 to SGS-126) | ticket re-spec + spec-gate + implementer + review + acceptance + suite + tech-lead + babysit + PR | ~8-10 R plus a blocked batch |
| Missed (b) blocker that ships (SGS-108 badge pattern) | validation finding + new ticket + human attention | >10 R |

Break-even: sonnet would have to miss a (b) blocker on fewer than about 1 in 8 standard reviews (at the suite-escape cost) or 1 in 3 (at the cheapest catch). With class-(b) blockers in about 50% of standard reviews, sonnet would only have to miss a quarter of them to lose money. The baseline (no mutations; 1 escape in 4 reviews of easier diffs) suggests it would miss more than that.

Caveat: opus is not infallible. In SGS-108 it dictated a test that cannot fail and filed a real defect as a note. A model downgrade does not fix those misses; prompt rules (the retro P1 proposals) do.

## Proposed manage.md wording

Keep the table as it is. Replace the delta sentence under it with the following, so the existing sonnet exception is stated as a rule:

```
| agent | low | standard | high |
| review | sonnet | opus | opus |

A `review` runs on `sonnet` below `high` risk only when the round cannot hide a
test-that-cannot-fail or a false doc/contract claim: a delta review after a
text-only rework, or a `standard` diff that adds or changes no test, no doc or
contract sentence, and no public schema (a pure mechanical refactor or rename).
Every other `standard` review runs on `opus`. Do not lower `standard` review via
`REPO.md` `models` without a retro showing sonnet reviews ran their own mutation
checks on that repo.
```

Optional, a separate decision: run `opus` for `low`-risk reviews whose diff adds or changes an acceptance or e2e spec. Low risk skips acceptance-test, so review is the only gate before the suite (the SGS-113 lesson). Per the standing rule, an engine change like this goes as a gh issue on NicholasKChoi/code-factory, not as a direct edit.
