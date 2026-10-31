# Research: model tiering for implementer and review (retro cost proposal 4)

Depth: medium. Read-only.

## Question
How should the factory choose Opus vs Sonnet/Haiku for implementer and review so cost drops without losing quality? Changes: PROJECT.md `strongModelTriggers`, and/or the model table in `commands/manage.md:254-258`.

## Repo facts
- Current table (code-factory `commands/manage.md:254-262`): implementer low/standard = sonnet, high = opus; review low = sonnet, standard/high = opus. Any `strongModelTriggers` item makes a ticket `high` regardless of the ticket's own risk (`manage.md:249-252`). A correctness/invariant bounce on a sonnet implementation relaunches on opus (`manage.md:260-262`).
- `PROJECT.md` strongModelTriggers: 5 items; "touches an invariant" is the broad one. INVARIANTS.md scopes cover whole directories (`lib/combat-simulator/**`, `pages/api/fight.ts`, `utils/**`, `styles/**`), so almost any ticket in those paths trips it.
- TASK-GRAPH.md: 9 of 17 high (001,003,004,005,006,011,012,013,014). Several are not logic work: 001 and 013 are design docs, 012 is a dependency upgrade, 011 is deleting a stray route.
- Reworks by tier (graph reworkCount): high 4 of 9 (005, 012, 013, 014); standard 2 of 4 (007, 015, both sonnet implementer); low 0 of 4. Samples are tiny; the data does not show that Opus implementation reworks less than Sonnet.
- Bounce causes (retro-20261031.md): "tests that cannot fail" hit SGS-007 (sonnet), SGS-005 (opus), SGS-014 (opus) (retro:37-50), so the failure is model-independent and review caught all three. Lockfile `name` leak (sonnet, 3x) is a tooling gap, being removed by SGS-024 (retro:68-87). SGS-013 rework was a design gap, not model quality (retro:112-122). SGS-012 bounce came from tech-lead, not review (retro:175).
- Retro notes a sonnet low-risk review made one false claim (SGS-010, "REPO.md has no Review checklist", retro:185). One data point against Sonnet review.
- The 5-hour usage limit stopped an SGS-014 re-review (retro:187). On a subscription the binding cost is the usage window, not dollars.

## External findings
- Claude Code docs: `sonnet` = daily coding, `opus` = complex reasoning; built-in `opusplan` uses Opus in plan mode and Sonnet to execute; subagents inherit the session model unless `model` is set in their definition. https://code.claude.com/docs/en/model-config . The same page does not state how Opus vs Sonnet draw down Max limits.
- Third-party comparisons put Opus ahead of Sonnet on coding by under about 7 points (e.g. SWE-bench Verified 80.8 vs 79.6 for the 4.6 pair, secondhand), at roughly 1.7-5x the API price depending on version. Unverified, blog-level: https://www.morphllm.com/comparisons/claude-opus-vs-sonnet-for-coding , https://claudelog.com/faqs/sonnet-5-vs-opus-4-8/ . Mainstream advice: Sonnet default, Opus for architecture/hard debugging, strong model plans or coordinates and cheaper workers execute.
- Aider architect/editor: one model plans, a second turns it into edits. Same model in both roles beat its solo score (Sonnet 77.4 -> 80.5); strongest pairs used a strong planner and a cheaper editor. Aider's own page gives no cost figures and calls the top configs slow. https://aider.chat/2024/09/26/architect.html . Note: this is strong-plans/cheap-writes; the factory's spec-gate/ticket step already is the "architect", so Sonnet as "editor" matches the pattern.
- RouteLLM (LMSYS): learned router sends each query to strong or weak model once; >40% cost cut vs commercial routers at similar quality; 85% on MT-Bench is a best case, MMLU/GSM8K savings smaller (secondhand). https://lmsys.org/blog/2024-07-01-routellm/ , https://sky.cs.berkeley.edu/project/routellm/ . An unreviewed report claims the BERT router did not beat a cost-matched random baseline while cascades did: https://glama.ai/mcp/servers/n0ks43nsja (treat as unverified).
- Cascade (FrugalGPT): cheap model first, escalate when a reliability check fails; cost grows with models tried. https://shekhargulati.com/2024/07/09/routellm-paper/ . A 2026 paper found removing the cascade cost 1.9 quality points: https://arxiv.org/pdf/2604.23577 . Routers need a reliable pass/fail signal; the factory has a strong one (review, suite, acceptance, rework bounce), which makes cascade the best fit.
- Max plan: sources conflict on whether Opus has its own weekly bucket and say hour estimates are stale; no current official breakdown found. https://claudelog.com/faqs/claude-code-usage-limits/ , https://claudeissues.com/issue/55663-max-plan-separated-sonnet-opus-weekly-limits-push-heavy-sonnet-users-toward-opus-unnecessarily . Unverified: how much faster Opus drains the window. Settle by reading `/usage` before and after one Opus and one Sonnet run.
- Not found: Cursor/Copilot auto-selection and Martian/NotDiamond details at this depth (not searched; low value for a one-person setup).

## Options
A. High-risk implementer on Sonnet, review stays Opus.
   - Saves the Opus implementer share (15 runs, 0.9M fresh, 16.4M cache read, 259k out), about half of Opus use. Review (19 runs) remains the safety net and caught 4 of 6 reworks.
   - Risk: review sees the diff, not the reasoning, so subtle invariant violations (W2 shared state, A3 determinism, S3 caps) depend entirely on the reviewer. Sonnet-built reworks are already 2/4 on standard tickets. Costs an extra rework cycle (a full implementer+review pass) when it misses.
   - Conflicts: none with invariants; contradicts the current table's "high = opus implementer" and the manage.md bounce rule only if the bounce rule is kept (it should be).
B. Tighten strongModelTriggers.
   - Rewrite the triggers around what actually needs deep reasoning (logic, shared state, ordering, contract change), not path membership. Docs, data, dependency, and deletion tickets drop to standard; Sonnet implements, Opus reviews.
   - Cheap, no quality risk on the tickets that stay high. Weakness: "touches an invariant" is a safety net; narrowing it loses the automatic escalation, so the replacement must still name invariant-affecting behavior changes.
   - Note: risk also drives other gates (auto-merge, `manage.md` merge risk), so keep a separate field or check; narrowing triggers must not silently loosen merge policy. Verify in manage.md before applying (not checked).
C. Cascade (recommended addition): Sonnet implements everything except a narrow Opus-always list; Opus review always except low risk; escalate the implementer to Opus on the first correctness/invariant/contract rework (already the manage.md rule) or when spec-gate flags risk high for logic reasons. Keep Opus review for any ticket with Sonnet implementation that touches an invariant.
D. Opus plans, Sonnet executes everywhere (opusplan-style): effectively what C does since ticket/spec-gate already plan. Not a separate change.
E. Do nothing, fix quality causes instead (mutation self-check, lockfile name). Does not cut cost, but removes 3 of the rework causes regardless of model; ship it anyway.

## Recommendation
B plus C, which gives A for ordinary invariant-touching work: narrow the Opus implementer to tickets that change simulation logic, state, ordering, or a published contract; everything else implements on Sonnet; review stays Opus whenever the diff touches an invariant path or the ticket is high, so the strong model still checks the risky part. Deciding reason: the evidence shows review, not the implementer model, catches defects (3 "tests cannot fail" bounces occurred under both models), the rework data has no model signal, and cascade-on-bounce already exists. Hold Opus review constant for one retro window so any quality change is attributable to the implementer change alone.

Subscription effect: dollars drop out; the constraint is the 5-hour/weekly window (a re-review already hit it). The gain is throughput and fewer pauses, so optimizing the cache-heavy Opus runs (long implementer contexts: 16M cache read) matters more than token price. Do not move review to Sonnet to save more: review is the highest-leverage Opus spend and the one Sonnet review slip is on record. Haiku: not for implementer or review; keep it for research low and mechanical work only.

## Proposed text
PROJECT.md:
```
strongModelTriggers:
  - changes combat or simulation rules, dice, casualties, RNG, or battle/series loop behavior (a change in what a run computes)
  - changes shared or mutable state, or the order of operations a result depends on (concurrency, ordering, W2, A3)
  - changes a public schema, API request/response, or cross-component contract (/api/fight, shared types)
  - changes a bound or cap that enforces S3, H1, or A2
  - estimated over 150 lines of business logic
```
Not triggers on their own: design or doc text, data snapshots, dependency or config upgrades, deleting dead code, UI styling, test-only changes. A ticket may still be set `high` by spec-gate or the ticket agent with a one-line reason, which only affects review and merge risk, not the implementer model.

manage.md table, split by trigger:
```
| agent | low | standard | high (strongModelTriggers) |
| implementer | sonnet | sonnet | opus |
| review | sonnet | opus | opus |
```
plus: "A ticket that only trips 'touches an invariant' by path (docs, data, dependency, deletion) is `standard`: sonnet implements, opus reviews. A correctness, invariant, or contract bounce on a sonnet implementation relaunches the implementer on opus (unchanged)."
If the owner wants the aggressive Option A, add instead: "high implementer = sonnet when the ticket lists a named mutation per behavior test; opus otherwise."

## Evidence to watch next retro
1. Reworks per tier, split by implementer model (baseline: high/opus 4/9, standard/sonnet 2/4). Alarm: sonnet-implemented tickets above ~1 in 3 reworks for correctness or invariant reasons.
2. Review bounces for correctness vs hygiene (lockfile, comment, test-cannot-fail). A rise in correctness findings means review is absorbing implementer errors.
3. Defects that escaped to a merged ticket or owner-out-of-band finding (baseline 4 follow-ups, 1 owner finding). Any escape from a sonnet-implemented invariant ticket is a revert signal.
4. Escalations: count of opus relaunches after a sonnet bounce; if most downgraded tickets escalate, the trigger was too narrow and cost rose.
5. Usage: `/usage` window consumption per ticket and count of limit hits (baseline: 1, SGS-014 re-review).
6. Spec-gate item-11 risk corrections (retro:183): if the ticket agent understates risk more often under the narrower triggers, add the missed pattern back.

## Unknowns
- How Opus vs Sonnet consume Max limits (no official figure found); measure with `/usage`.
- Whether tightening risk triggers changes auto-merge behavior (not checked in manage.md).
- Third-party benchmark numbers are secondhand and version-mixed.
- Cursor/Copilot auto-select, Martian, NotDiamond not researched.

## Sources
Repo: `/home/choin/git/code-factory/commands/manage.md:249-262`; `.../projects/strategy-game-sim/PROJECT.md`; `INVARIANTS.md`; `TASK-GRAPH.md`; `retros/retro-20261031.md:37-50,68-87,112-122,175,183,185,187`; ticket Rework sections SGS-005/007/012/013/014/015.
Web: https://code.claude.com/docs/en/model-config ; https://aider.chat/2024/09/26/architect.html ; https://lmsys.org/blog/2024-07-01-routellm/ ; https://sky.cs.berkeley.edu/project/routellm/ ; https://shekhargulati.com/2024/07/09/routellm-paper/ ; https://arxiv.org/pdf/2604.23577 ; https://glama.ai/mcp/servers/n0ks43nsja ; https://www.morphllm.com/comparisons/claude-opus-vs-sonnet-for-coding ; https://claudelog.com/faqs/sonnet-5-vs-opus-4-8/ ; https://claudelog.com/faqs/claude-code-usage-limits/ ; https://claudeissues.com/issue/55663-max-plan-separated-sonnet-opus-weekly-limits-push-heavy-sonnet-users-toward-opus-unnecessarily
