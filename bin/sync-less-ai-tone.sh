#!/usr/bin/env bash
# Sync the canonical skills/less-ai-tone package into host writing skills.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/skills/less-ai-tone"
MANIFEST="$ROOT/skills/less-ai-tone/HOST_SKILLS.txt"

if [[ ! -d "$SRC" ]]; then
  echo "missing canonical package: $SRC" >&2
  exit 1
fi
if [[ ! -f "$MANIFEST" ]]; then
  echo "missing host list: $MANIFEST" >&2
  exit 1
fi

copy_one() {
  local name="$1"
  local dest="$ROOT/skills/$name/less-ai-tone"
  if [[ ! -d "$ROOT/skills/$name" ]]; then
    echo "skip missing skill: $name" >&2
    return 1
  fi
  mkdir -p "$dest"
  # Replace package contents but keep host skill files outside this subtree.
  rsync -a --delete \
    --exclude 'HOST_SKILLS.txt' \
    --exclude 'evals/' \
    --exclude '.DS_Store' \
    "$SRC/" "$dest/"
  # Host copies should not pretend to be the installable top-level skill name collision
  # beyond the embedded package; SKILL.md inside subtree stays for local execution.
  echo "synced $name"
}

fail=0
while IFS= read -r line || [[ -n "$line" ]]; do
  name="${line%%#*}"
  name="$(echo "$name" | tr -d '[:space:]')"
  [[ -z "$name" ]] && continue
  copy_one "$name" || fail=1
done < "$MANIFEST"

if [[ "$fail" -ne 0 ]]; then
  echo "sync finished with missing hosts" >&2
  exit 1
fi
echo "all hosts synced from $SRC"
