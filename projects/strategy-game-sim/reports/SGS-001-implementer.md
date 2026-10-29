# SGS-001 implementer report

Status: needs_review

- Ticket: SGS-001 (WOTR combat design doc)
- Branch: sgs-001-wotr-combat-design-doc, cut from origin/main d54af2e
- Tip SHA: 47c8931adef9b90bcbcbfcec454d9179d06502e1 (author Nick Choi <choinickolas@gmail.com>)
- Worktree: /home/choin/git/WOTR_Combat_Simulator-factory/worktrees/sgs-001-wotr-combat-design-doc
- Not pushed, no PR.

## Files touched

- `docs/combat-simulator.md` (new, 168 lines): the design doc with its round-order Mermaid flowchart.

`git diff --stat origin/main..HEAD` shows only that file.

## Acceptance criteria check

- Sections: Purpose and model, Armies, Round order, Casualties, Input bounds, Number of battles N,
  Independence of battles, Outcome reporting, Departures from the published game, Not modeled. Present.
- Round order rules: dice = min(regulars + elites, 5); hit on 6 only; re-rolls = min(misses, leaders, 5),
  hit on 6; at most 5 hits per side per round; simultaneous casualties; repeat while both sides have
  combat strength above 0; three outcomes. Present.
- Mermaid flowchart: shows the same steps, both caps, simultaneous casualties, the loop condition, and
  the three outcomes. Shows the rule only, not current-code behavior. Parsed with mermaid 11.x
  `mermaid.parse` under jsdom in a scratch dir: `{"diagramType":"flowchart-v2"}`. A deliberately broken
  copy returned `false`, so the check can fail. I did not render it on GitHub; the reviewer should look at
  the GitHub preview.
- Casualties: the owner's rule (more than 5 units: remove a regular, or with 0 regulars downgrade an elite;
  5 or fewer: downgrade an elite, else remove a regular; excess hits discarded; leaders never casualties),
  plus a Current code note on negative regulars.
- Input bounds: regulars + elites <= 10; leaders 0-5, not counted; 0 regulars + elites invalid; UI 0-10 /
  0-10 / 0-5. Present.
- N: default 1000, max 100,000, N = 100,000 within 10 seconds. Present.
- Outcome reporting: frequencies as counts and shares; rounds mean/median/p10/p90 with nearest-rank
  defined (rank ceil(p/100 x N), median = p50); surviving (regulars, elites) counts per winning side, kept
  separate, ties contribute none; hits-per-round shares over 0-5. No field names. Nothing tagged "proposal"
  or "owner to confirm".
- Current code notes cover: dice cap, re-roll cap, 5-hit ceiling (one note in Round order), casualty
  0-regulars case, input bounds and 0-unit behavior, UI ranges, N, independence, outcome statistics. Each
  is labeled **Current code**, and the intro says no note is a rule.
- Departures: fight to elimination, no combat cards, no sieges/sorties, Shadow/Free hard-coded. Each is
  tagged "(owner to confirm)". Character/Nazgul leadership is under Not modeled, with no tag.
- Forbidden-term grep `grep -E 'SGS-|M1\.|W1|W2|S3|CONTEXT\.md|INVARIANTS\.md'`: no matches (exit 1).

## Spec-gate-2 notes applied

- `survivor` / `n/a` appear only in the Outcome reporting Current code note. The rule text defines a tie
  in words.
- Rejection rules are explicit: a request is rejected and no battle runs if a side has more than 10
  regulars + elites, more than 5 leaders, 0 regulars + elites, or a value that is negative or not a whole
  number. The "whole numbers" wording follows the gate's suggestion. SGS-003 should check it fits.
- The doc says the form does not stop 10 regulars + 10 elites, which the server rejects.
- Not applied: the CONTEXT.md tidy (factory file, out of scope), and naming an environment for the
  10-second budget (left to SGS-005).

## Wording choices for review

- N section: I left out what happens when a request asks for more than 100,000 (reject or clamp). Neither
  the ticket nor CONTEXT.md settles it, so the doc only says "at most 100,000". SGS-005/SGS-003 should
  decide.
- The doc says field names are "documented in the API spec, `docs/api/openapi.json`". That file does not
  exist on main yet; the ticket allows the link.
- Not modeled says character/Nazgul support is "planned for a later release" (no milestone id).

## Stages run

- codegen: not set in REPO.md; skipped.
- build: `npm ci && npx next build` in the worktree. Passed (exit 0, all routes built). npm needed
  `--cache` pointed at the scratchpad because the sandbox makes `~/.npm/_cacache` read-only.
- lint: `npx tsc --noEmit`. Passed (exit 0, no output).
- unit: not set in REPO.md. This ticket is docs only, so it has no unit tests.
- Mermaid parse: see above.

## Invariant check

- W1: upheld. This doc is the rule source W1 points at. No code changed, and every place the code differs
  from the doc is marked with a Current code note.
- W2: upheld. The Independence section restates it, and the in-place mutation is noted as current code.
- S3: upheld. Input caps and N max are stated as caps checked before work runs. No code changed.

## Out-of-scope findings

- `components/apps/combat-simulator/results.js` uses `<th>` straight inside `<thead>` with no `<tr>`. That
  is invalid table markup, and React may warn about it in dev.
- `pages/api/fight.ts` `Battle` logs every round with `console.log`. At N = 100,000 this would flood the
  logs and slow the run. SGS-005 should drop it.
- `getStats()` divides by `rounds`, which gives NaN when rounds = 0. This is already covered by the
  0-unit Current code note.
