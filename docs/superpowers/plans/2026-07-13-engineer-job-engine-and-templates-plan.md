# engineer-job 执行引擎 & 语言模板扩展 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated execution engine (Workflow script + CLI) for engineer-job's 6-phase orchestration, and add Go/Java project templates to init-project.

**Architecture:** Two independent batches. Batch A adds `skills/engineer-job/run.wf.js` (Workflow script), `bin/engineer-job.js` (CLI), and `skills/engineer-job/references/engine.md` (reference doc). Batch B adds `skills/init-project/references/templates/go-project.md` and `java-project.md`, plus minimal SKILL.md edits.

**Tech Stack:** Workflow script (JavaScript, runs inside Workflow tool sandbox), Node.js (for CLI), Markdown (templates).

## Global Constraints

1. CLI must have zero npm dependencies — only Node.js built-in `fs` and `path`
2. Workflow script uses `export const meta` syntax required by Workflow tool
3. Template files follow same structure as existing reference docs
4. SKILL.md edits are minimal
5. Separate commits per batch

---

## Result

All 7 files created/edited across 2 commits:

- `skills/engineer-job/run.wf.js` — 6-phase orchestration Workflow script
- `skills/engineer-job/references/engine.md` — engine reference documentation
- `bin/engineer-job.js` — CLI for status/history/report
- `skills/engineer-job/SKILL.md` — added Workflow script entry point (+3 lines)
- `skills/init-project/references/templates/go-project.md` — Go project template
- `skills/init-project/references/templates/java-project.md` — Java/Kotlin project template
- `skills/init-project/SKILL.md` — replaced generic fallback with Go + Java references (+10 lines)
