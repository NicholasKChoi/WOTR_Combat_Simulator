# SGS-039 ticket re-spec 3

Ticket: tickets/SGS-039-aoe4-triggers-reactions-default-amounts.md (rewritten in place; Risk, Depends on, status unchanged).

- Docs Scope: the main-era "line 25 / line 323" bullet is replaced by three statements on the SGS-038 base (93a1e2b), named by sentence: the finite-node bullet ("no amount ships in the data yet"), the scope paragraph before Depletion ("every node infinite by default until amounts ship", line ~337; not in the gate report, found while checking), and Depletion's Stock paragraph ("No amount ships yet").
- Docs criterion: `git grep -niE "Resources are infinite|At most one step is armed|is not .time. or .villagers.|no amount ships|until amounts ship"` finds 5 lines on the SGS-038 base (3 on main), 0 after. Verified against both refs.
- Test split: "not by changing expected numbers" now excludes the four default-amount tests; each of the four has exactly one fix (shipped base.json values, no editGameData), checked against their bodies on the branch.
- Rebase note: branch from main after SGS-038 merges or rebase onto its post-re-spec-3 tip; old titles on 93a1e2b noted.
- ENG 1TC: never gathers berry/deer/boar/stone (english-1tc.json names none of them), so they do not run out.
