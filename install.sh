#!/usr/bin/env bash
#
# install.sh — Local install / update for iannil/skills
#
# Copies the skills bundled in this repository into your AI coding agent's
# skills directory. Re-running the script overwrites the installed copy, so
# it doubles as an "update to latest" — just `git pull` then re-run:
#
#   git pull && ./install.sh
#
# Works offline (no npx, no download). macOS bash 3.2 compatible.
#
# Usage:
#   ./install.sh                          # install/update ALL skills → Claude Code
#   ./install.sh init-project rc-tutor    # install/update specific skill(s)
#   ./install.sh --agent codex            # target Codex CLI instead
#   ./install.sh --agent all              # target Claude Code AND Codex
#   ./install.sh --target ~/my/skills     # target a custom directory
#   ./install.sh --list                   # list bundled skills
#   ./install.sh --dry-run                # preview without writing
#   ./install.sh --help
#
set -uo pipefail

# ── Resolve locations ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/skills"

# ── Options ──────────────────────────────────────────────────────────────────
AGENT="claude"          # claude | codex | all
TARGET=""               # explicit dir; overrides --agent
SOURCE_DIR_OVERRIDE=""
DRY_RUN=0
LIST_ONLY=0
SELECTED=()
ERRORS=0

# ── Pretty output (only when stdout is a TTY) ────────────────────────────────
if [[ -t 1 ]]; then
  C_OK=$'\033[32m'; C_WARN=$'\033[33m'; C_ERR=$'\033[31m'; C_DIM=$'\033[2m'; C_RST=$'\033[0m'
else
  C_OK=""; C_WARN=""; C_ERR=""; C_DIM=""; C_RST=""
fi
ok()   { printf '  %s✓%s %s\n' "$C_OK" "$C_RST" "$1"; }
warn() { printf '  %s!%s %s\n' "$C_WARN" "$C_RST" "$1"; }
err()  { printf '  %s✗%s %s\n' "$C_ERR" "$C_RST" "$1" >&2; }

usage() {
  sed -n '3,22p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

# ── Argument parsing ─────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)    usage; exit 0 ;;
    --agent)      [[ $# -ge 2 ]] || { echo "--agent needs a value" >&2; exit 2; }; AGENT="$2"; shift 2 ;;
    --target)     [[ $# -ge 2 ]] || { echo "--target needs a value" >&2; exit 2; }; TARGET="$2"; shift 2 ;;
    --source)     [[ $# -ge 2 ]] || { echo "--source needs a value" >&2; exit 2; }; SOURCE_DIR_OVERRIDE="$2"; shift 2 ;;
    --dry-run)    DRY_RUN=1; shift ;;
    --list)       LIST_ONLY=1; shift ;;
    --)           shift; while [[ $# -gt 0 ]]; do SELECTED+=("$1"); shift; done ;;
    --*)          echo "Unknown option: $1" >&2; echo >&2; usage >&2; exit 2 ;;
    *)            SELECTED+=("$1"); shift ;;
  esac
done

[[ -n "$SOURCE_DIR_OVERRIDE" ]] && SOURCE_DIR="$SOURCE_DIR_OVERRIDE"

# ── Discover bundled skills ──────────────────────────────────────────────────
if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source skills directory not found: $SOURCE_DIR" >&2
  echo "Run this script from the repository root, or pass --source <dir>." >&2
  exit 1
fi

ALL_SKILLS=()
shopt -s nullglob
for d in "$SOURCE_DIR"/*/; do
  name="$(basename "$d")"
  [[ "$name" == .* ]] && continue
  if [[ -f "${d}SKILL.md" ]]; then
    ALL_SKILLS+=("$name")
  fi
done
shopt -u nullglob

if [[ ${#ALL_SKILLS[@]} -eq 0 ]]; then
  echo "No skills found under $SOURCE_DIR" >&2
  exit 1
fi

# ── --list ───────────────────────────────────────────────────────────────────
if [[ $LIST_ONLY -eq 1 ]]; then
  printf '%s\n' "${ALL_SKILLS[@]}"
  exit 0
fi

# ── Resolve which skills to install ──────────────────────────────────────────
TO_INSTALL=()
if [[ ${#SELECTED[@]} -eq 0 ]]; then
  TO_INSTALL=("${ALL_SKILLS[@]}")
else
  for want in "${SELECTED[@]}"; do
    found=""
    for s in "${ALL_SKILLS[@]}"; do [[ "$s" == "$want" ]] && { found=1; break; }; done
    if [[ -z "$found" ]]; then
      echo "Unknown skill '$want'. Available:" >&2
      printf '  %s\n' "${ALL_SKILLS[@]}" >&2
      exit 1
    fi
    TO_INSTALL+=("$want")
  done
fi

# ── Resolve target directories ───────────────────────────────────────────────
resolve_targets() {
  if [[ -n "$TARGET" ]]; then
    echo "$TARGET"
    return
  fi
  case "$AGENT" in
    claude) echo "$HOME/.claude/skills" ;;
    codex)  echo "$HOME/.codex/skills" ;;
    all)    echo "$HOME/.claude/skills"; echo "$HOME/.codex/skills" ;;
    *) echo "Unknown agent '$AGENT' (use claude|codex|all, or --target <dir>)." >&2; exit 2 ;;
  esac
}

TARGETS=()
while IFS= read -r line; do
  [[ -n "$line" ]] && TARGETS+=("$line")
done < <(resolve_targets)

# ── Banner ───────────────────────────────────────────────────────────────────
mode="install / update"
[[ $DRY_RUN -eq 1 ]] && mode="DRY-RUN $mode"
printf '%sInstalling %d skill(s): %s%s\n' "$C_DIM" "${#TO_INSTALL[@]}" "${TO_INSTALL[*]}" "$C_RST"
printf '%sMode: %s%s\n' "$C_DIM" "$mode" "$C_RST"

# ── Install into each target ─────────────────────────────────────────────────
install_into() {
  local target="$1" skill src dst action
  printf '\n%s→ %s%s\n' "$C_DIM" "$target" "$C_RST"

  if [[ ! -d "$target" ]]; then
    if [[ $DRY_RUN -eq 1 ]]; then
      warn "would create $target"
    else
      if ! mkdir -p "$target" 2>/dev/null; then
        err "cannot create $target (skipping)"
        ERRORS=$((ERRORS + 1))
        return
      fi
      ok "created $target"
    fi
  fi

  for skill in "${TO_INSTALL[@]}"; do
    src="$SOURCE_DIR/$skill"
    dst="$target/$skill"

    if [[ -f "$dst/SKILL.md" ]]; then action="update"; else action="install"; fi

    if [[ $DRY_RUN -eq 1 ]]; then
      printf '  %s•%s [%s] %s\n' "$C_DIM" "$C_RST" "$action" "$skill"
      continue
    fi

    # Remove any prior copy, then copy fresh. -P preserves the rc-text-assistant
    # → rc-philosophy-advisor symlink (relative, still resolves at the target).
    rm -rf "$dst"
    if cp -RP "$src" "$dst" 2>/dev/null && [[ -f "$dst/SKILL.md" ]]; then
      ok "[$action] $skill"
    else
      err "$skill (copy failed)"
      ERRORS=$((ERRORS + 1))
    fi
  done
}

for t in "${TARGETS[@]}"; do
  install_into "$t"
done

# ── Summary ──────────────────────────────────────────────────────────────────
printf '\n'
if [[ $DRY_RUN -eq 1 ]]; then
  printf '%sDry run complete — nothing was written.%s\n' "$C_WARN" "$C_RST"
else
  if [[ $ERRORS -eq 0 ]]; then
    printf '%sDone. %d skill(s) installed/updated into %d target(s).%s\n' \
      "$C_OK" "${#TO_INSTALL[@]}" "${#TARGETS[@]}" "$C_RST"
    printf '%sTip: re-run anytime to update — `git pull && ./install.sh`.%s\n' "$C_DIM" "$C_RST"
  else
    printf '%sCompleted with %d error(s).%s\n' "$C_ERR" "$ERRORS" "$C_RST"
  fi
fi

exit $ERRORS
