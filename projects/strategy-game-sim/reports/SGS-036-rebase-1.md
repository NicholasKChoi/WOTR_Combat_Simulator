# SGS-036 rebase 1

sgs-036-aoe4-request-hardening rebased onto sgs-053-aoe4-m2-doc-wording (9998b4f). New tip: b83701aa1372266cfa5e0b6a4fe285dc5e481a0a

git log --oneline f078c11..sgs-036-aoe4-request-hardening
b83701a Cover the simulate issue cap through the route, schema, and page
c7ef794 State the 100-issue cap in the simulateBuildOrder description
618818b Harden the AoE4 simulate request against oversized and odd input
9998b4f Correct AoE4 build order doc wording to match the shipped code

## Conflict (docs/aoe4-build-order.md only, in commit 618818b; two hunks)
Hunk 1, 400 bullet, merged: cap text from sgs-036 (issues capped at MAX_REPORTED_ISSUES = 100, omittedIssues present only when above 0, error is first issue's message, non-object body gives one syntax issue) plus sgs-053's line/step rule:
"A validation issue on a pasted step carries `line` and `step`; a `syntax` issue raised while parsing a paste line carries `line` only; a pasted `start` issue carries `line` only; a JSON step's issue carries `step` only; a JSON `start` issue and `inputs` issues carry neither."
Hunk 2, page failure text, merged:
"A 400 shows every returned issue's `message` (each names its line or step) and removes any earlier charts. When the body has `omittedIssues`, the list ends with one more item, "N more issues not shown." Any other HTTP failure shows "The simulation could not be run (HTTP <status>)."; a request or response-body error shows "The simulation could not be run. Please try again.""
Confirmed against pages/apps/aoe4-build-order.tsx (omittedIssues item, "Please try again." message) and parse-text.ts (LineError carries line only). No other file conflicted.

## Checks (Node 24)
- npx tsc --noEmit: clean
- npm test: 27 files, 700 tests passed
- acceptance (edges + contract specs): 82 passed
Authors all Nick Choi <choinickolas@gmail.com>. Nothing pushed.
