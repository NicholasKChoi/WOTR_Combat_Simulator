#!/usr/bin/env bash
# link-node-modules.sh [worktree]: give a worktree a node_modules without running npm ci there.
# Installs once per package-lock.json hash into nm-cache/ (next to this bin/ dir), then hardlinks
# the cached tree into the worktree (cp -al, ~1 s). A symlink does not work: Next 16 Turbopack
# refuses node_modules outside the project root. Hardlinks need the cache and the worktree on
# one filesystem, which holds for worktrees under this state dir.
set -euo pipefail
WT=$(cd "${1:-.}" && pwd)
ROOT=$(cd "$(dirname "$0")/.." && pwd)/nm-cache
[ -f "$WT/package-lock.json" ] || { echo "no package-lock.json in $WT" >&2; exit 1; }
C=$ROOT/$(sha256sum "$WT/package-lock.json" | cut -c1-16)
if [ ! -d "$C/node_modules" ]; then
  mkdir -p "$ROOT"
  T=$(mktemp -d "$ROOT/tmp.XXXXXX")
  trap 'rm -rf "$T"' EXIT
  cp "$WT/package.json" "$WT/package-lock.json" "$T/"
  (cd "$T" && npm ci --no-audit --no-fund --prefer-offline)
  # Another run may have filled the same key meanwhile; keep theirs.
  mv -T "$T" "$C" 2>/dev/null || true
fi
rm -rf "$WT/node_modules"
cp -al "$C/node_modules" "$WT/node_modules"
echo "node_modules linked from $C"
