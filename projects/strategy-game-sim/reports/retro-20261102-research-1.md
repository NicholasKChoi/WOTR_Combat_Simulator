# Research: run code-factory in Claude Code cloud agents instead of local WSL (depth: high)

## Question

Can manage `run`, `drive`, `babysit` and `plan` (and possibly `milestone` and `retro`) run on Anthropic cloud agents (claude.ai/code cloud sessions, routines or remote triggers, remote environments) so the factory no longer depends on the local WSL machine?

**What the answer changes:**
- Where the drive loop and the Discord bot run.
- Whether the engine must drop GraphQL-based `gh` calls and draft PRs.
- How the plugin is loaded.
- Whether the repo needs a cloud setup script (Node 24, Playwright).
- Whether the owner's Pro plan limits become the throughput cap.

## Facts that decide it

### Anthropic cloud sessions (claude.ai/code, "Claude Code on the web")

- **Availability and cost:** available on Pro, Max, Ultra and Team. Usage draws from the plan's limits; the VM has no separate charge. [web]
- **Persistence and control:** sessions keep running after the laptop closes, and follow-ups can be sent with `claude -p "msg" --cloud <session-id>`. [web]
- **Background work is lost when the VM is reclaimed.** An idle VM pauses. Once it is reclaimed, background shells, subagents and session-scheduled tasks are gone. [web]
- **Plugins:**
  - `/plugin` is unavailable in cloud sessions. [web]
  - Plugins enabled in the repo's `.claude/settings.json` or in user settings are **not installed** in cloud sessions. [env]
  - The repo's `.claude/agents`, `.claude/commands`, `.claude/skills` and hooks **do** load. [env]
- **VM image:** Ubuntu 24.04 x86_64, 4 vCPU, 16 GB RAM, 30 GB disk. [env]
  - Node 20, 21 and 22 are installed, with 22 as default. **Node 24 is not installed**, but this repo requires it: `REPO.md:20`, `package.json` engines `24.x`.
  - Chrome for Testing is installed. Playwright's own Chromium needs a download, and whether its download host is on the allowlist is **unverified**. [env]
  - `gh` is preinstalled. [env]
- **Setup script:** runs as root and is cached when it finishes within about 5 minutes; the cache expires after about 7 days. [env]
- **GitHub proxy:**
  - It rejects branch deletions and tag pushes. It does not restrict which branches can be pushed, so pushing `code-factory-state` should work. [env]
  - API calls are scoped to the repos attached to the session. [env]
  - **GraphQL requests get 403, so every `gh pr ...` and `gh issue ...` subcommand fails, even with your own `GH_TOKEN`. Only REST through `gh api` works.** [env]
- **Bash timeouts:** 2 minutes by default and up to 10 minutes. After that the command moves to the background for up to 30 more minutes. [env]
- **Self-hosted environments** (cloud sessions running on your own machine) are **Team and Enterprise only**, so the owner's plan cannot use them. [selfhost] The local CLI reports `subscriptionType: pro` (`claude auth status`).

### Routines (scheduled and API-triggered cloud runs)

- **Status:** research preview. [routines]
- **Triggers:**
  - A schedule, with cron runs at least 1 hour apart.
  - An API `/fire` endpoint: bearer token, beta header `experimental-cc-routine-2026-04-01`, and `text` delivered as an untrusted payload.
  - GitHub events.
- **Run behaviour:**
  - Every run starts from a fresh clone and runs in auto mode.
  - Pushes go to `claude/` branches unless the prompt says otherwise.
- **Limits and cost:** 100 scheduled runs per hour per account, 30 per task per hour, and 100 API fires per hour. Runs draw subscription usage.

### Plugin loading options in the cloud

- `CLAUDE_CODE_PLUGIN_DIRS` (CLI v2.1.280 and later) loads directories the same way `--plugin-dir` does. It could be set as a cloud environment variable. [envvars]
- A plugin directory under `.claude/skills/` that contains `.claude-plugin/plugin.json` loads as `@skills-dir`. Project-level copies need workspace trust, and whether a cloud session counts as trusted is **unverified**. [loading]
- A setup script can run `claude plugin install`. [install]
- The plugin repo `NicholasKChoi/code-factory` is **private**. How a setup script would clone it through the session's GitHub proxy is **unverified**. Multi-repo sessions exist, but the clone path is not documented.

### Where the factory engine depends on the local machine

**1. Plugin loading via `--plugin-dir`.**
- The drive loop starts headless `claude -p "/code-factory:manage <slug> run"` passes with `--plugin-dir` (`scripts/drive-loop.sh:12`, `scripts/drive-loop.sh:57`).
- Single-instance locking uses `flock` under `~/.local/state` (`scripts/drive-loop.sh:40`).
- On 2026-11-02 a pass already failed with "manage command isn't installed" (`reports/drive-20261102-1016.md`). Plugin loading is fragile even locally.

**2. GraphQL-only `gh` usage.**
- The plugin uses `gh pr list`, `view`, `edit`, `checks`, `create`, `ready` and `merge`, plus `gh run view` and `gh run rerun`.
- `tech-lead` opens draft PRs (`agents/tech-lead.md:65`).
- Merges run `gh pr ready <n>` then `gh pr merge <n> --<method>`, adding `--admin` (`commands/manage.md:460`).
- `scripts/ci-wait.sh:12` uses `gh pr checks --watch`.
- REST equivalents exist for create, list, view, edit and merge (`PUT /pulls/{n}/merge`, `merge_method=squash`).
- **Draft-to-ready has no REST equivalent.** It is the GraphQL mutation `markPullRequestReadyForReview`, and REST `draft:false` is reported as ignored [gh-aw].
- `gh pr checks --watch` would need to become a REST poll of commit statuses (Vercel reports a commit status).

**3. The Discord bot.**
- It is a long-lived local process that watches the local `QUESTIONS.md` (`bot/run.py:2-4`).
- When `driveOnAnswer: true` (`bot/run.py:41-44`, `PROJECT.md:18-19`), it spawns the local `drive-loop.sh` (`bot/run.py:27`, `bot/run.py:61-63`).
- `manage` starts the bot in `run`, `drive` and `babysit` (`commands/manage.md:128-160`).
- A cloud session cannot host it, because the VM pauses when idle and is reclaimed.

**4. State branch.**
- `.claude/code-factory` is a worktree of the orphan branch `code-factory-state`, with `pushState: true` (`REPO.md:9`).
- It is located through `scripts/locate.sh`, as used at `commands/manage.md:20`.
- A fresh cloud clone would have to add this worktree on every session or run.

**5. Long background waits.**
- `ci-wait.sh` runs with `run_in_background` (`commands/manage.md:481`), and gates launch in parallel (`commands/manage.md:378`).
- Both are fine locally. In the cloud they are exposed to the bash timeout ceilings and to idle reclaim.

**6. Interactive modes.** `manage` already says `plan`, `milestone` and `retro` stay interactive (`commands/manage.md:409-422`).

**7. Merge policy.**
- `main` requires 1 review, with `enforce_admins: false`.
- The repo's admin-merge authorisation relies on `--admin`. Whether a REST merge through the cloud proxy's token can bypass the review is **unverified**.

**8. Babysit.** `babysit: false` (`REPO.md:49`), so babysit adds no extra requirement today.

**9. Cost reference.** Two drive passes cost $1.18 and $0.13 at API-equivalent prices (`reports/drive-20261102-1017.md`). On Pro this counts against plan limits, and those limits are shared with any interactive work.

### Remote Control (local execution, driven from the phone or browser)

- Available on Pro, Max, Ultra, Team and Enterprise; API keys are not supported. [rc]
- Execution and the filesystem stay on the host machine. [rc]
- **Server mode:** `claude remote-control` stays running and waits for remote connections. [rc]
  - `--spawn worktree` gives each on-demand session its own git worktree.
  - `--capacity` caps concurrent sessions (default 32).
- It reconnects after sleep or network loss. [rc]
- Sessions can be resumed for about 4 hours after the server stops. [rc]
- Transcripts are stored on Anthropic servers. [rc]
- So any always-on Linux host running the current setup can be driven from the phone, including interactive `plan`, `milestone` and `retro`.

## Options

**A. Stay local (WSL), unchanged**
- **What it means:** keep today's setup.
- **Tradeoff:**
  - Zero work and no new risk.
  - The factory still stops whenever the machine sleeps or is off, which is the dependency the owner wants to remove.
  - Remote Control could be added on WSL so sessions can be driven from the phone while the PC is on, but that does not remove the dependency.
- **Conflicts:** none.

**B. Full Anthropic cloud (cloud sessions plus routines for every mode, bot included)**
- **What it means:** run every mode, and the bot, on Anthropic's cloud.
- **Hard blocker:** the Discord bot cannot live in a cloud session (idle pause and reclaim). It still needs some always-on host, so "full cloud" is not achievable as stated.
- **Required engine changes (plugin repo):**
  - A REST-only gh layer for create, list, view, edit, merge and checks, plus `gh run` through REST.
  - Drop draft PRs (open stacked PRs non-draft), or leave the ready step to the owner.
  - Replace `gh pr checks --watch` with polling of REST commit statuses.
  - Replace the `flock` and `~/.local/state` assumptions.
  - Have the drive loop target routines instead of nested `claude -p`. Running nested `claude -p` inside a cloud VM is **unverified**.
- **Required repo changes:**
  - A cloud environment setup script: install Node 24, run `npm ci`, and download Playwright Chromium (allowlist **unverified**).
  - Set `CLAUDE_CODE_PLUGIN_DIRS`, or vendor the plugin under `.claude/skills/`.
  - Attach or clone the private plugin repo (**unverified**).
- **Required project-file changes:** state worktree bootstrap on every run.
- **Cost:**
  - All passes come out of the Pro plan's limits.
  - Routines are a research preview.
  - Schedules run at most hourly.
- **Conflicts:**
  - The admin-merge policy depends on `--admin`; REST bypass through the proxy is **unverified**.
  - The `stacking: footer` and draft-PR flow (`REPO.md:50`, `agents/tech-lead.md:65`) changes.

**C. Hybrid: cloud routines run the passes; a small always-on host keeps the bot; plan, milestone and retro stay interactive (local or cloud session)**
- **What it means:**
  - The bot host git-syncs `QUESTIONS.md` on the state branch.
  - On an answer, the bot calls the routine's `/fire` endpoint instead of running `drive-loop.sh`.
- **Tradeoff:**
  - Still needs every engine change from B (REST-only gh, no drafts, plugin loading, setup script).
  - Adds bot changes: git pull and push, and `/fire` with a bearer token, where `text` arrives as an untrusted payload.
  - Adds a host anyway, so the only gain over D is that the heavy compute runs on Anthropic's VM.
- **Conflicts:** same as B.

**D. Move the current local setup to a small always-on Linux host (VPS or home server) and drive it with Remote Control**
- **What it means:**
  - The same Claude Code CLI, plugin via `--plugin-dir`, `gh` with admin auth, Node 24, Playwright, bot and `drive-loop.sh`, unchanged, on an always-on box.
  - Interactive `plan`, `milestone` and `retro` run through `claude remote-control --spawn worktree` from the phone or browser. Pro is supported.
- **Tradeoff:**
  - No engine changes.
  - It removes the dependency on the personal machine.
  - Cost: VPS rent and upkeep, plus a one-time move of the gh auth, the Discord env file (copy it; never print it) and the Claude login.
  - It still uses the Pro plan's limits.
  - The host must be secured, because it holds the repo admin token.
- **Conflicts:** none. The existing decisions, the merge policy and the GraphQL usage all keep working.

## Recommendation

**D**, with **C** as an optional later step.

- **Deciding reason:** Anthropic's cloud still needs an always-on host for the bot. Its GitHub proxy also rejects GraphQL, which breaks the factory's `gh pr` flow, including the GraphQL-only draft-to-ready step.
- D removes the local-machine dependency with zero engine changes. Remote Control covers the interactive modes on the owner's Pro plan.
- **Revisit C if** the engine moves to a REST-only gh layer with non-draft PRs, and cloud plugin loading is confirmed.

## Unknowns (and what would settle them)

1. **Cloud plugin loading.** Does `CLAUDE_CODE_PLUGIN_DIRS`, or a plugin under `.claude/skills/`, load in a cloud session, and does a cloud session count as trusted? Settle it with one throwaway cloud session.
2. **Private plugin repo access.** Can the setup script, or the GitHub proxy, clone `NicholasKChoi/code-factory` (private)? Settle it in the same test.
3. **REST admin merge.** Can a REST merge through the proxy token bypass the 1 required review? Settle it with a test PR in a cloud session.
4. **Nested headless runs.** Does nested `claude -p` work inside a cloud VM? Untested.
5. **Playwright download.** Is Playwright's Chromium download host on the Trusted allowlist? An alternative is pointing Playwright at `/usr/bin/google-chrome`. Settle it with the setup script run.
6. **Remote Control on a headless VPS.** The docs describe a terminal process, so it needs `tmux` or `systemd`. Long-run stability and re-auth frequency were not tested.
7. **Pro-plan headroom.** Can the Pro plan sustain unattended drive passes plus interactive work? Only the owner's usage history can tell.

## Sources

**External:**
- [web] https://code.claude.com/docs/en/claude-code-on-the-web
- [env] https://code.claude.com/docs/en/cloud-environments
- [routines] https://code.claude.com/docs/en/routines
- [selfhost] https://code.claude.com/docs/en/self-hosted-environments
- [rc] https://code.claude.com/docs/en/remote-control
- [install] https://code.claude.com/docs/en/plugins/install
- [loading] https://code.claude.com/docs/en/plugins/loading
- [envvars] https://code.claude.com/docs/en/env-vars
- [gh-aw] https://github.com/github/gh-aw/issues/22469 (REST `draft:false` ignored; the ready step needs GraphQL `markPullRequestReadyForReview`)

**Repo (paths relative to the plugin repo `/home/choin/git/code-factory` or `$FACTORY_DIR`):**
- `REPO.md:9`, `REPO.md:18`, `REPO.md:20`, `REPO.md:26`, `REPO.md:49`, `REPO.md:50`
- `projects/strategy-game-sim/PROJECT.md:18-19`
- `scripts/drive-loop.sh:12`, `scripts/drive-loop.sh:40`, `scripts/drive-loop.sh:57`
- `scripts/ci-wait.sh:12`
- `bot/run.py:2-4`, `bot/run.py:27`, `bot/run.py:41-44`, `bot/run.py:61-63`
- `commands/manage.md:20`, `commands/manage.md:128-160`, `commands/manage.md:378`, `commands/manage.md:409-422`, `commands/manage.md:460`, `commands/manage.md:481`
- `agents/tech-lead.md:65`, `agents/rebase.md:36`
- `projects/strategy-game-sim/reports/drive-20261102-1016.md`, `projects/strategy-game-sim/reports/drive-20261102-1017.md`
- Local `claude auth status`: subscriptionType pro, CLI 2.1.317.
