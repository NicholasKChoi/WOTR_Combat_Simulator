# SGS-168 review 1

Verdict: **APPROVE**

Branch `sgs-168-combat-doc-not-modeled-claims`, tip `edbb1b37d28899fced4e61b9c3d0f0a32b7adbc8`, base `origin/main`.
Type Docs, risk standard. Diff: `docs/combat-simulator.md` only (1 insertion, 4 deletions), one commit.

## Blocking findings

None.

## Spec gaps

None.

## Docs check (every changed sentence against the code at the tip)

- Removed: "A request for N = 100,000 completes within 10 seconds." Nothing in the code or tests states a
  duration. The sentence before it stays: "N defaults to 1000 ... and N is at most 100,000". That matches
  `lib/combat-simulator/simulate.ts:5` `DEFAULT_BATTLES = 1000` and `:6` `MAX_BATTLES = 100000`, which
  `:156-157` enforce.
- Changed: "Companions, Minions, and Nazgul that add leadership are not modeled; leadership comes only
  from the leaders count." This is true. Leadership enters combat only through
  `Math.min(misses, <side>.leaders, MAX_LEADER_REROLLS)` at `lib/combat-simulator/battle.ts:134` and `:137`.
  The only leadership field is `BaseArmy.leaders` (`lib/combat-simulator/army.ts:4,10,15`), and nothing
  models characters. The only fact removed is the roadmap sentence, which is the defect.
- The sentences the diff did not touch but the ticket asked to re-read are still true. The Extension
  points symbols exist: `OUTCOME_KINDS` (`battle.ts:3`), `BattleOptions` (`:149`), `shouldStop` (`:151`)
  and its use in `Battle` (`:155-158`). A grep of the doc for plan/later/will/future/second/within/
  perform/release/soon finds only the Extension points opener "Later termination rules ...". The ticket
  scope tells the implementer to keep that section, and the section itself says none of those rules is
  modeled today.
- Neither removed claim appears anywhere else. A grep of `docs/`, `README.md`, and `ARCHITECTURE.md` for
  "10 seconds" and "later release" finds nothing.

## Acceptance criteria

1. The doc states no duration or performance requirement for any N: **pass**. The only timing sentence
   is removed, and the grep finds no other.
2. No future-support or later-release claim; "Not modeled" still names Companions, Minions, and Nazgul
   leadership and the leaders count: **pass**. The bullet now ends at "leadership comes only from the
   leaders count." The Extension points wording is in scope to keep (see notes).
3. "Number of battles N" gives the default and the maximum N, and both match `simulate.ts`: **pass**
   (1000 = `DEFAULT_BATTLES`, 100,000 = `MAX_BATTLES`).
4. Only docs change: **pass**. `git diff --stat origin/main...HEAD` lists only `docs/combat-simulator.md`.
5. No INVARIANTS.md regressions: **pass** (see below).

## Invariants touched

- W1 (combat follows the rules in `docs/combat-simulator.md`) **holds**. The diff removes no dice,
  leader-reroll, casualty, or round-order rule, and the code does not change.
- W2 (independent battles) **holds**. That section is unchanged.

## Contract, scope, checklist

- spec-checklist: no section with `Paths:` matches the diff. Scope and Naming (no Paths) hold: nothing
  out of scope is implemented, `golang/` is untouched, no constant is invented, and no names change.
- Out of scope (ticket, CONTEXT.md, PROJECT.md): nothing added. No performance target, no leadership
  work, and no PROJECT.md edit.
- Pre-existing tests: the diff edits none.
- Commit message: authored as `choinickolas@gmail.com`, with no ticket ids, factory pointers, or PR
  numbers.

## Lint

I ran `commands.lint` (`npx tsc --noEmit && npm run lint:dup`) in the scratch after linking
node_modules. tsc passed. jscpd found 0 clones in 162 files.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there is nothing to reconcile.

## UI inspection

Not run. The diff changes no UI (docs only).

## Non-blocking notes

- The Extension points paragraph opens with "Later termination rules, such as a round limit or the
  attacker retreating, plug in at three places". It describes code seams, not a release plan, and it
  ends "None of these rules is modeled today". The ticket scope keeps it on purpose. I record it here
  only because criterion 2's "any other rule" could be read as covering it (the spec gate raised the
  same point).

## Coverage

- Reviewed: `docs/combat-simulator.md` (the full Number of battles N, Independence, Outcome reporting,
  Departures, Extension points, and Not modeled sections). For the doc claims I checked
  `lib/combat-simulator/simulate.ts`, `battle.ts`, and `army.ts`.
- REPO.md Review checklist "Every diff": I did not run `next build` or load the page. The diff changes
  no code, so a build or page load cannot differ from main. "Combat simulator" section: its paths
  (`lib/combat-simulator/**` and the others) are not in the diff. I did not exercise `/api/fight`
  because no request handling changed.
- Style sources (ARCHITECTURE.md, tsconfig.json) and LESSONS.md (`acceptance/**` only) do not apply to
  a docs edit. No exemplar applies.
