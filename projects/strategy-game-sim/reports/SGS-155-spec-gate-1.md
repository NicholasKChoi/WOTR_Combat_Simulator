# SGS-155 spec gate 1

Verdict: NEEDS_SPEC (2 gaps, both fixable by the ticket agent; no owner gaps). Risk `low` confirmed.

Read at origin/main (fetched): refresh-snapshot.mjs, data/aoe4-build-order/README.md, english.json source block, vitest.config.mts, tsconfig.json, .jscpd*.json, package.json, REPO.md, INVARIANTS A1, docs/aoe4-build-order.md "Patch policy".

## Gaps

1. Scope / Acceptance - where the tests live is unstated, and the obvious place does not run. `vitest.config.mts` includes only `utils/**/*.test.ts`, `lib/**/*.test.ts`, `components/**/*.test.ts`. A test file beside the script in `data/aoe4-build-order/` is never run by `npm test`, so every test criterion (1, 2, 3, 4) could pass vacuously while the tests never execute. The script is `.mjs` and tsc includes only `.ts/.tsx/.mts` (allowJs, no checkJs), so the test must be a `.ts` file importing the `.mjs`. Fix: state the test file lives under `lib/aoe4-build-order/` (existing tests already import from `data/`) and imports the exported comparison function and the check's main/fetch seam from the `.mjs`, or else add the data path to the vitest `include` in Scope. Add an end-state criterion: the new tests appear in `npm test` output.

2. Scope - "share the kinds list and civ filter by import or extraction" is not implementable as written by import. `refresh-snapshot.mjs` runs top-level code on load (argv check, `process.exit(1)`, network fetch, `writeFileSync` to english.json), so importing it from the check script or from a test would exit or overwrite the snapshot. This also collides with criterion 4 (check never writes under `data/aoe4-build-order/`). Fix: Scope names the extraction: a new side-effect-free module in `data/aoe4-build-order/` (for example the repo name, kinds, civ and a `filterEnglish` function, plus the upstream fetch helper) that both scripts import, with `refresh-snapshot.mjs` otherwise unchanged. Criterion 5 then reads "neither script defines the kinds list, civ id or filter itself", and the usage-line check stays.

## Notes (non-blocking)

- Define "content differs" as deep equality on the entries per kind, ignoring the `source` block (`fetchedAt` always differs). Say whether order counts; refresh keeps upstream order, so an order-only change is reasonably "stale". The implementer will otherwise guess.
- Say how the latest upstream commit is resolved (API `commits/HEAD` on the default branch is enough); then fetch `all.json` at that sha, not at a branch name, so the two reads agree.
- `.jscpd.json` does not cover `data/`, so `lint:dup` cannot catch a copied constants block; the no-copy rule rests on review and the criterion above.
- REPO.md front matter comment `babysit: false  # no .github/workflows` also goes stale on merge; add it to the On merge text (the Repo notes sentence is already covered).
- Criterion 7 (first dispatch run after merge) is a post-merge check by the manager; fine as written and listed under Unverified assumptions.
- Checked and fine: the four kinds, `en` filter, `source.repo`/`source.commit` fields, README "Refreshing the snapshot" step 1 wording and file table exist as described; no `.github/workflows` at origin/main; Node 24 matches engines; docs/aoe4-build-order.md "Patch policy" stays true; Invariants A1 adjacency correct; Depends-on none; no other open ticket overlaps; On merge is well formed; LOC ~90 fine; no input-validation trigger (no parsed untrusted structure beyond comparing JSON).
