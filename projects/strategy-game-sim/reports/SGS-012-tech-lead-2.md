# SGS-012 tech-lead gate 2 (rerun after rework 1)

Decision: **No blockers.** The previous blocker (`engines.node` open range overriding Vercel's Node 24.x) is resolved. PR #24 stays a draft and was not merged.

- Draft PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/24 (base `main`, head `sgs-012-upgrade-dependencies`, pushed as a fast-forward 623a5ff -> da77a09). No new commits were made.

## Vercel check

- Status `Vercel – wotr-combat-simulator` on da77a09: **success**. Deployment 6EY6TCyWWciegvu3CHHYj4zfSZKE, status Ready.
- Build log (`vercel inspect --logs`): "Skipping build cache since Node.js version changed from "26.x" to "24.x"". So this build ran on **Node 24.x**.
- The log has no "Project Settings ... will not apply" override warning (0 matches for "will not apply" or "Project Settings").
- Next.js 16.4.3 (Turbopack), TypeScript passed, and the build compiled successfully.
- Routes: `/`, `/404`, `/api/fight` (dynamic), `/apps/combat-simulator`, `/apps/starcraft-helper`.
- The "npm run vercel-build" line is Vercel's injected default (package.json has no such script). It runs `next build`.
- The ticket criterion "Vercel check green, log shows Node 24.x with no override warning" is now verified. The review-2 report had left it open.

## Delta reviewed

- `623a5ff..da77a09`: `package.json:9` and the root `engines` entry at `package-lock.json:24` each change from `>=22.12.0` to `24.x`. Nothing else changed.
- The overall range `6013fcc..da77a09` is otherwise unchanged from gate 1, and the reviewable LoC is still +34/-32.
- No invariant, irreversibility, security, contract or concurrency issue.

## PR 24 sections as set

Summary Node statement now reads: `engines.node` is `24.x`; Vercel honors `engines` over the project setting, so production keeps building and serving on Node 24.x and does not move on a new Node major; `npm ci` on another major only warns (`EBADENGINE`). The Reviewer guide `package.json` entry was updated to match. The closing attribution lines are kept.

## Merge risk
**medium** - swaps the framework under every page, the `/api/fight` route and the build config (a public surface), but stays backward-compatible with no schema, data or contract change, and a revert fully undoes it.

## Review focus
No hotspots: no simulation, API or StarCraft helper logic changes; the only hand-written edits are the `<Link>` markup the type checker and acceptance suite cover, and the Vercel preview builds on Node 24.x, the runtime production already uses.

## Non-blocking notes

1. `SGS-012-acceptance-2.md` does not exist in `reports/`. Only `SGS-012-acceptance.md` exists, last modified 14:29, which is before rework 1. The manager cited it as PASS, so the record should be fixed. The delta is metadata only, so this does not block.
2. All local gates ran on Node v22.17.0, and production now runs on 24.x. Only the Vercel build has run on 24.x. Production already runs Node 24.x today, and the change only touches framework versions, so I judge the residual risk low. A smoke check of the preview's `/api/fight` would close the gap.
3. On merge, the ticket's follow-ups still apply: REPO.md `acceptanceHarness` "Needs Node 20+" -> "Needs Node 24.x", the design/M2.md Recharts version, and the CONTEXT.md decision line. Developers on Node 22 will see an `EBADENGINE` warning on `npm ci`.
