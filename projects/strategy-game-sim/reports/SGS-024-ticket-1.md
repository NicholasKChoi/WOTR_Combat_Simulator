# SGS-024 ticket report 1

File: projects/strategy-game-sim/tickets/SGS-024-package-name-lockfile.md
Risk: low (one component, no public surface, 2 config lines, no invariant adjacent).

Evidence: origin/main package.json lacks name; lockfile root name is WOTR_Combat_Simulator and
packages[""] has no name. In a throwaway detached worktree of origin/main in a folder named
sgs-xx-folder, adding the two fields and running `npm install --package-lock-only` (node 22.17, npm 10.9.2)
changed only the root name (lowercase) and added packages[""].name. A second run left the lockfile
byte-identical. Worktree removed. Build/lint/unit not run (ticket only).

Docs: only ARCHITECTURE.md:13 mentions package.json (engines.node); still true. No doc scope.
On merge: delete the LESSONS.md "Lockfile name after npm install" entry (FACTORY_DIR/LESSONS.md).
Overlap: none. Open questions: none. Diagram: not required.
Note: local `main` ref is stale; I used origin/main.
