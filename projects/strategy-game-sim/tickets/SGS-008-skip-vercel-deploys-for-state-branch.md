# SGS-008: Stop Vercel deploying the code-factory-state branch

- **Type**: Bug
- **Component**: site
- **Milestone / criteria**: M1 / none (site-level ops hygiene; no milestone criterion covers it)
- **Priority**: low
- **Risk**: standard
  <!-- Config surface (Vercel project git config) so not "low"; no strongModelTriggers item applies. -->
- **LOC estimate**: ~7 (one new `vercel.json`, no business logic)
- **Depends on**: none
- **Source**: bug report, manager evidence 2026-10-29 (Vercel CLI 65.5.0, project `nicholas-chois-projects/wotr-combat-simulator`, `prj_kRWs0pvpS3SFnEqFwpGCsGrXmupU`). Base main at 8532a0b.

## Context

Every push to the orphan branch `code-factory-state` (factory state only: `projects/`, `REPO.md`, no app code) creates a
Vercel Preview deploy that fails in 3-4 s with "Couldn't find a `pages` directory" and `npm run vercel-build` exiting 1.
`vercel ls -m githubCommitRef=code-factory-state` shows 6 such Error deploys. Result: dashboard and email noise and a red
status on state-branch commits. Main-branch production deploys are healthy (8532a0b, 3934ff8, d54af2e: success, Ready in
Production, 13-19 s builds). Nothing is wrong with the app build.

## Scope

Evidence from main (`git show origin/main:`): no `vercel.json` exists; `package.json` has only `dev` and `test` scripts;
the project uses default Next.js settings. So nothing today tells Vercel to skip any branch.

Pinned fix: add a `vercel.json` **on the `code-factory-state` branch** (root of that branch):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": {
      "code-factory-state": false
    }
  }
}
```

Reasoning for the placement:

- Vercel's Git Configuration doc (vercel.com/docs/project-configuration/git-configuration, last updated 2026-08-25)
  defines `git.deploymentEnabled` as branches that "should not trigger a deployment upon commits", with branch names or
  minimatch patterns as keys. The doc does **not** say which commit's `vercel.json` is read: the pushed commit or the
  production branch.
- The Git integration decides at push time whether to build the pushed commit. The only tree guaranteed available for
  that decision is the pushed commit. The state branch is an orphan with no shared history with `main`, so a
  `vercel.json` on `main` is not in its tree. Treat "a file on main alone stops state-branch builds" as unproven and
  the likelier outcome as "it does not".
- A file on the state branch is under our control, is a factory-state change (committed directly to
  `code-factory-state`, never merged with main, per REPO.md; not a code PR), and does not change what builds from main
  or PR branches. Adding the file to `main` too is not needed and would add a code PR for a non-app concern.
- This pin is a hypothesis until the acceptance check below passes. If the first push after the file lands still creates
  a deployment, the fallback is the Ignored Build Step (project Settings > Git, or `ignoreCommand`) set by a human; that
  is a project-settings ops action an agent does not do.

Because the branch is a state branch, the implementer commits the one file directly on `code-factory-state` (worktree
under `$FACTORY_DIR/worktrees/`, detached from `origin/code-factory-state`) and pushes it. No PR to main, no review bot,
no Vercel preview check to wait on. The task branch name `sgs-008-skip-vercel-deploys-for-state-branch` is nominal.

**Out of scope:** any change on `main` (no `vercel.json`, no `next.config.js`, no `package.json`); changing Vercel
project settings, Ignored Build Step, or the production branch (human ops, only as the fallback above); deleting the six
existing Error deployments; editing `REPO.md` CI notes beyond what a human chooses to do after this lands; `golang/`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `code-factory-state` contains a root `vercel.json` that is valid JSON, sets `git.deploymentEnabled."code-factory-state"` to `false`, and has no other keys besides `$schema`.
- [ ] Baseline recorded before the push: the deployment count from `vercel ls -m githubCommitRef=code-factory-state` (currently 6 Error deploys).
- [ ] After the push of the `vercel.json` commit, and again after the next normal factory-state push, `vercel ls -m githubCommitRef=code-factory-state` shows no new deployment (count unchanged from baseline), and the GitHub commit status on the new state-branch commit carries no failing `Vercel` status.
- [ ] A subsequent push to `main` (or a PR branch off main) still creates a deployment: the PR shows the `Vercel – wotr-combat-simulator` status and `vercel ls` shows a new Ready deploy for it. If no main push is planned in the window, check the next PR's preview deploy and say so in the handoff.
- [ ] `main` is untouched: no `vercel.json` exists on `main` and this ticket changes nothing there.
- [ ] If any criterion above fails because Vercel still builds the state branch, the implementer stops, reports a blocker, and does not edit `main` or project settings; the manager routes the Ignored Build Step to a human.
- [ ] No INVARIANTS.md regressions (no app code touched).

## Open questions

- Vercel docs do not state whether `git.deploymentEnabled` is read from the pushed commit or the production branch. The pin (file on the state branch) rests on that gap and is verified only by the acceptance check. If it fails, should the owner set an Ignored Build Step in project settings, or accept the failed deploys?
- Does the owner want a `vercel.json` also on `main` as defence in depth (a new code PR, not required here)?
- The graph and worktree flow assume code PRs; this ticket commits directly to the state branch. Manager to confirm it gets no PR and only the nominal branch name in TASK-GRAPH.

## Resolved - 2026-10-29 (manager, spec gate)

- (a) If the state-branch `vercel.json` does not stop the build, stop with a blocker; the owner sets the Vercel Ignored Build Step.
- (b) No `vercel.json` on main.
- (c) No PR; the branch name is nominal. Commit directly onto `code-factory-state` as `choinickolas@gmail.com`, with no ticket id in the message. Record the `vercel ls` baseline before pushing.
