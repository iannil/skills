# iannil/skills

**AI agent skills for software, fiction, product analysis, and philosophy.**

**English** | [简体中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](package.json)
[![Skills](https://img.shields.io/badge/skills-30-blue.svg)](#available-skills)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-ready-8A2BE2.svg)](#install)
![Offline install](https://img.shields.io/badge/install-offline%20%7C%20zero%20deps-orange.svg)

30 installable skills for Codex, Claude Code, and other agents that support skills: 14 for engineering, 3 for projects and products, 8 for book and web novel writing, and 5 for RC (Observational Convergence) philosophy.

Each skill defines its workflow in `skills/<name>/SKILL.md`, with supporting references, scripts, or agent configuration where needed. Choose a skill for a specific task or combine several into a workflow.

## Quick Start

Local installation requires Git and Bash; the script below does not require Node.js. Cloning requires a network connection; installation from the local checkout works offline.

```bash
git clone https://github.com/iannil/skills.git
cd skills
# Install all skills into Codex (~/.codex/skills)
./install.sh --agent codex
```

For Claude Code, run `./install.sh` to install into `~/.claude/skills`. Use `./install.sh --agent all` to install into both.

Then name a skill and describe your task in your agent:

- **Build software:** “Use engineer-job to build a task tracker from scratch.”
- **Continue a novel:** “Use write-webnovel to read the existing chapters and story notes, then write the next chapter.”
- **Polish prose:** “Use novel-prose-readability to revise this passage while preserving character voice and viewpoint.”
- **Explore a product:** “Use product-pusher to identify the assumptions I need to validate in this product idea.”
- **Learn philosophy:** “Use rc-tutor to explain Observational Convergence from first principles.”

See [Install](#install) for more options. If these skills help you, a star helps others find them.

## Choose by Task

| What you want to do | Category | Count | Common entry points |
|---|---|---:|---|
| Build, verify, or resume a software project | [Engineering](#engineering-skills) | 14 | `engineer-job` / `engineer-next` |
| Set up a project, analyze a product, or test an idea | [Projects & products](#project--product-skills) | 3 | `init-project` / `product-pusher` |
| Plan, write, or revise Chinese books and web fiction | [Book & web novel writing](#book--web-novel-writing-skills) | 8 | `write-book` / `write-webnovel` |
| Learn RC, diagnose problems, analyze causes, or write | [RC philosophy](#rc-philosophy-skills) | 5 | `rc-tutor` / `rc-application-tool` |

## Available Skills

### Engineering Skills

Based on the "Implementation Planning-Driven AI-Assisted Programming in Practice" methodology, the complete engineering development skill chain:

- `engineer-job` — **AI Project Auto-Build Engine** (P0). Meta-orchestrator that automatically executes the full project lifecycle: scaffolding → architecture design → multi-feature development → integration testing → deployment config generation. Supports `--auto` (auto-confirm) and `--silent` (silent) modes for unattended project building.
- `engineer-next` — **AI Resume Router**. The universal "continue from wherever I am" entry point. Reads the engineer-* state fingerprint (`.agents/job.state.json`, `.agents/progress.json`, `CONTEXT.md`, `REQUIREMENTS.md`, `project-metadata.json`, code volume), diagnoses where the project stopped, and hands off to the right skill to resume — `engineer-job` (re-invokes its Workflow with reconstructed args, skipping done phases), `engineer-orchestrator` (milestone-level recovery when development is mid-flight — never re-invokes job, which would redo milestones), `engineer-architect` (blueprint gap, or reverse-engineering a foreign project), or `engineer-requirements`. Foreign projects with no engineer-* artifacts onboard adaptively: near-empty → fresh `engineer-job`, substantial existing code → reverse-engineer a blueprint first. Pure router — it never re-implements phases or writes progress files.
- `engineer-cloner` — **AI Reverse Site-Clone Front-End Engine**. Given an authorized target URL and a full-access account, reverse-observes the running site via `agent-browser` (login → loop-until-dry traversal → feature ledger → API/design extraction), then produces `REQUIREMENTS.md` / `CONTEXT.md` / `FRONTEND-DESIGN.md` plus an honest `CLONE-FIDELITY.md` (observable-exact / inferred / unobservable), and hands off to `engineer-job` for a full-lifecycle, high-precision clone. Does design-language reconstruction + modern-stack rebuild — never raw-asset copying or backend-source claims.
- `engineer-legacy-recon` — **AI Legacy-System Static-Recon Front-End** (offline sibling of `engineer-cloner`). When you can't reach the live system but the user **pastes the legacy system's page content + navigation menus** (or screenshots / exported HTML), this skill treats that material as the sole source of truth — **no browsing, no `agent-browser`** — and statically infers the module map, entity fields, actions, state machines, and role/permission split. Grades every finding as `明示 / Stated`, `推断 / Inferred`, or `缺口 / Gap`, produces `REQUIREMENTS.md` / `CONTEXT.md` / `FRONTEND-DESIGN.md` plus a `RECON-FIDELITY.md` (with a gap list to ask the user about), then hands off to `engineer-job`. Escalate to `engineer-cloner` only if the user explicitly wants live verification with an authorized account.
- `engineer-requirements` — **AI Requirements Analyst**. Decomposes vague user requirements into a structured requirements document using Event Storming + DDD strategic design — bounded contexts, business events, functional dependencies, and key state machines. Outputs `REQUIREMENTS.md` for `engineer-architect` to consume. Triggers for complex, multi-module, or multi-end systems (2+ frontends or 5+ feature modules).
- `engineer-architect` — **AI Architect** (P0). Translates vague user requirements into a structured CONTEXT.md blueprint. Automatically researches, analyzes, and proposes technical solutions, generating an executable blueprint that includes system overview, data models, API contracts, and milestone dependency tree.
- `engineer-frontend-architect` — **AI Frontend Architect**. Detailed frontend design performed *after* the system architecture is complete. Outputs `FRONTEND-DESIGN.md` with page tree, component tree, state-management architecture, UI state machines, and design-system tokens — for multi-surface systems (Web / mini-program / mobile). Must run after `engineer-architect`; auto-triggers when a project has 2+ frontend surfaces.
- `engineer-poc` — **AI High-Fidelity POC Engine**. Turns requirements into a runnable, **pure-frontend, evolutionary** prototype: reads `REQUIREMENTS.md` + `FRONTEND-DESIGN.md` (+ `CONTEXT.md`), identifies the industry and applies a built-in pattern library, then builds every page with all UI states (loading/empty/error/normal/edge) on a swappable mock-adapter seam — full-function coverage guaranteed by a `.agents/poc.ledger.json` + loop-until-dry + coverage critic. Outputs `POC-MANIFEST.md` (mock→real evolution map) and an honest `POC-FIDELITY.md` (`真实交互` / `mock 数据` / `占位未实现`). Slots into `engineer-job` as optional Phase 3.5 — the project can **stop at the POC**, **skip it**, or **continue** as Phase 4 evolves the mock layer into a real backend. No backend required.
- `engineer-orchestrator` — **AI Project Orchestration Engine** (P0). Receives the project blueprint, automatically decomposes it into a feature-level task queue, invokes engineer-workflow one by one in dependency order, and manages cross-feature integration acceptance, context reset, and cross-session progress persistence.
- `engineer-workflow` — **AI Coding Fully Automated Workflow Engine**. Takes a single feature requirement as input and automatically executes: milestone breakdown → dispatch instructions → coding → acceptance → branch decision → commit consolidation → update blueprint.
- `engineer-coach` — **AI Coding Process Coach**. A six-step SOP guides users through AI-assisted programming: breakdown → dispatch instructions → coding → acceptance → branch decision → consolidation.
- `engineer-inspector` — **AI Code Architecture Inspector**. Detects three major signals of architecture drift (foundation tampering / over-engineering / size runaway) and outputs a structured acceptance report.
- `engineer-qa` — **AI Test Acceptance Engine**. Auto-triggers after feature development as the single source of truth for the test gate: runs the test pyramid (unit → integration → E2E), enforces **≥90% branch coverage on changed code** with a global no-regression ratchet, and drives key user journeys end-to-end via `agent-browser` (degrading to black-box API/CLI acceptance for non-UI projects). Emits `.agents/qa-latest.md` with a `PASS / NEEDS_FIX / REBUILD` verdict.
- `engineer-advisor` — **AI Coding Knowledge Advisor**. Diagnoses conversation health, evaluates whether context reset, instruction elevation, or complete rebuild is needed.

### Project & Product Skills

- `init-project` - Complete project initialization workflow with docs, memory, release structure, observability conventions, and language-specific scaffolding.
- `product-analysis-framework` - Structured product and startup analysis framework with market evidence, user pain, moat, business model, risks, and reusable startup patterns.
- `product-pusher` - **Product Pusher**. Forge a NEW, still-unbuilt product or startup idea into a buildable definition through a grilled brainstorming dialogue: brainstorm it open, then pressure-test it one hard question at a time (real users, real pain, who holds the kill-switch, the cheapest validation) until a concrete product definition survives — ending in a ranked kill-risk report and a go/no-go/pivot call. Collaborative but adversarial: it pokes holes, not cheerleads. Built on the causal-chain / RC discipline, surfaced in plain language.

### Book & Web Novel Writing Skills

`write-book` handles book planning, chapter drafting, continuation, and whole-book revision, with attention to arguments, terminology, examples, and progression.

The seven web novel skills are built for character-driven Chinese long-form fiction and ensemble stories, covering planning, drafting, review, and revision. Use `write-webnovel` as the general entry point, or choose one of the six focused skills for a specific problem.

- `write-book` - Plan, draft, continue, and revise Chinese books while maintaining consistency across chapters.
- `write-webnovel` - Web novel writing: story planning, serialization, characterization, and multi-chapter revision.
- `novel-character-agency` - Character desires, agency, voice, ensemble differentiation, and consistent growth.
- `novel-comedy-engine` - Character-driven humor, misunderstandings, and comedy across chapters.
- `novel-prose-readability` - Prose readability diagnosis and revision while preserving voice, viewpoint, and emotion.
- `novel-retention-edit` - Opening appeal, serialization pacing, payoffs, chapter boundaries, and anticipation.
- `novel-reveal-design` - Misread legends, identity secrets, foreshadowing payoffs, and plot reversals.
- `novel-tactical-payoff` - Credible tactics, underdog victories, ensemble cooperation, and concrete outcomes.

### RC Philosophy Skills

- `rc-tutor` - Teach the RC (Observational Convergence) philosophical framework to complete beginners — zero philosophy background assumed.
- `rc-application-tool` - Apply RC to diagnose real-world problems (decisions, teams, strategy) and analyze/rewrite marketing copy.
- `rc-causal-chain` - Causal Chain Analysis (modern TRIZ) rebuilt on RC theory: grow a root-cause chain node-by-node, verify each node (observational locking), and locate the key disadvantage (max available margin) to flip into a solvable key problem.
- `rc-philosophy-advisor` - Discuss deep philosophical questions through the RC lens and generate new RC-style aphorisms and fragments.
- `rc-text-assistant` - Write, reference, cite, search, and translate content related to the RC philosophical framework.

## Choosing a Writing Skill

| Current problem | Skill | Focus |
|---|---|---|
| Planning a book, drafting chapters, or revising a full manuscript | `write-book` | Book structure, complete chapters, and consistent arguments and terminology |
| Planning a new story, designing an arc, or writing the next chapter | `write-webnovel` | Story plans, prose, or multi-chapter revision |
| Passive characters, disposable supporting roles, or indistinct voices | `novel-character-agency` | Desires, active choices, and consistent growth |
| Humor relies on banter, repeated jokes, or foolish behavior | `novel-comedy-engine` | Comic events driven by character desires |
| Unclear sentences, confusing action, or repetitive explanation | `novel-prose-readability` | Passage-level or multi-chapter prose revision |
| Slow openings, endless setup, delayed payoffs, or weak anticipation | `novel-retention-edit` | Pacing, payoffs, and chapter boundaries |
| Unresolved clues, improvised reveals, or twists with no consequences | `novel-reveal-design` | Causal links between clues, revelations, and action |
| Implausible tactics, weakened opponents, or victories without rewards | `novel-tactical-payoff` | Credible contests, cooperation, and concrete gains |

Provide the project entry point, target chapters, and scope. Specify whether you want a review or edits to the manuscript. Multi-chapter revision uses the original text and surrounding context to check continuity in facts, character knowledge, and foreshadowing. Start with `write-webnovel` or `novel-retention-edit` for structural diagnosis, then select a focused skill as needed.

The seven web novel skills were distilled from work on the Chinese novel 《我们宗门正在逃跑》 and can be applied to other fiction. Its characters, setting, and project-specific procedures apply only when working on that novel. See each `SKILL.md` for the workflow and its `references/` directory for source notes and adaptation details.

## Engineering Workflow Practices

### Pick the right entry skill

The engineering skills form a chain. Enter at the point that matches your situation — each skill knows how to hand off to the next:

| Your situation | Start here | Produces |
|---|---|---|
| "Build the whole project from scratch, unattended" | `engineer-job` | full project |
| "Continue from where I stopped" / don't know which skill / resume | `engineer-next` | routes to the right resume point |
| Clone an existing running site you're authorized to rebuild | `engineer-cloner` | three docs → `engineer-job` |
| Rebuild a legacy system from pasted page content + menus (no live access) | `engineer-legacy-recon` | three docs + gap list → `engineer-job` |
| Complex / multi-module / multi-end system, requirements still fuzzy | `engineer-requirements` | `REQUIREMENTS.md` |
| Clear business goal, no architecture blueprint yet | `engineer-architect` | `CONTEXT.md` |
| Architecture done, project has a frontend (esp. 2+ surfaces) | `engineer-frontend-architect` | `FRONTEND-DESIGN.md` |
| Want a high-fidelity clickable prototype before real implementation | `engineer-poc` | runnable pure-frontend POC + `POC-MANIFEST.md` → `engineer-job` |
| Blueprint exists, deliver the whole project feature-by-feature | `engineer-orchestrator` | integrated project |
| One feature, end-to-end | `engineer-workflow` | shipped feature |
| Verify a finished feature meets the test gate (unit + coverage + E2E) | `engineer-qa` | pass/fix/rebuild verdict |
| You want to drive coding yourself, with guidance | `engineer-coach` | — |

`init-project` is for **scaffolding conventions only**; for a full build use `engineer-job`.

### Follow the three disciplines (red lines)

These are the methodology's non-negotiables — the skills enforce them, and you should too:

- *no work without a blueprint* — Don't start coding before `requirements` / `architect` / `frontend-architect` have produced their design docs.
- *no consolidation without verification* — Never commit or "consolidate" generated code before acceptance. Run `engineer-inspector` first.
- *rebuild on chaos* — When a session turns into a tangled mess, reset context and rebuild from the persisted blueprint. Don't power through.

### Install the chain, not just one skill

The engineering skills are designed to compose: `requirements → architect → frontend-architect → orchestrator → workflow → inspector`. Installing only a subset can break the handoff contracts between them, so prefer installing all of them (`./install.sh` with no args).

### Keep context lean

These skills emit many artifacts (`CONTEXT.md`, `REQUIREMENTS.md`, `FRONTEND-DESIGN.md`, `.agents/` state). When a conversation grows long, start a fresh session and point it at the persisted blueprint/state instead of continuing in a bloated context. `engineer-advisor` can diagnose when a reset is warranted.

### Accept before you advance

After any generated code, review and accept (`engineer-inspector`) **before** saying "continue" or committing. Saying "continue" without review is how architecture drift compounds.

## Install

Install all skills with the package-specific CLI:

```bash
npx iannil/skills install all
```

Install one skill:

```bash
npx iannil/skills install init-project
npx iannil/skills install product-analysis-framework
npx iannil/skills install rc-tutor
npx iannil/skills install write-book
npx iannil/skills install write-webnovel
```

Preview without changing anything:

```bash
npx iannil/skills install --dry-run
```

## Local Install (offline, with auto-update)

A dependency-free `install.sh` is bundled for offline install. It copies the skills into your agent's skills directory, and **overwrites on re-run — so re-running after `git pull` updates every skill to the latest copy**.

```bash
# Install/update ALL skills into Claude Code (~/.claude/skills)
./install.sh

# Install/update specific skills only
./install.sh init-project engineer-architect

# Install only the writing entry point and prose revision skill into Codex
./install.sh --agent codex write-webnovel novel-prose-readability

# Target a different agent — or both
./install.sh --agent codex
./install.sh --agent all            # Claude Code + Codex

# Custom directory / preview / list
./install.sh --target ~/my/skills
./install.sh --dry-run
./install.sh --list
```

Update to the latest version any time:

```bash
git pull && ./install.sh
```

It works offline (no `npx`, no download), is macOS bash 3.2 compatible, and preserves the `rc-text-assistant → rc-philosophy-advisor` symlink.

## Standard Skills Installer

For the widest AI tool compatibility, use the standard `skills` installer directly:

```bash
npx skills add iannil/skills --skill '*'
npx skills add iannil/skills --skill init-project
npx skills add iannil/skills --skill product-analysis-framework
npx skills add iannil/skills --skill rc-tutor
npx skills add iannil/skills --skill write-webnovel
```

The standard installer handles the target agent layout for tools such as Claude Code, Codex CLI, Cursor, Gemini CLI, Continue, Windsurf, OpenCode, Qwen Code, and other compatible AI coding tools.

## Local Development

List skills:

```bash
node bin/skills.js list
```

Run dry-run install:

```bash
node bin/skills.js install all --dry-run
```

Run tests:

```bash
npm test
```

## Repository Layout

All 30 skill entry points are listed below. Individual skill directories may also contain `references/` (supporting material), `agents/` (agent configuration), `scripts/` (utilities), and `evals/` (evaluation examples).

```text
skills/
├── engineer-advisor/SKILL.md
├── engineer-architect/SKILL.md
├── engineer-cloner/SKILL.md
├── engineer-coach/SKILL.md
├── engineer-frontend-architect/SKILL.md
├── engineer-inspector/SKILL.md
├── engineer-job/SKILL.md
├── engineer-legacy-recon/SKILL.md
├── engineer-next/SKILL.md
├── engineer-orchestrator/SKILL.md
├── engineer-poc/SKILL.md
├── engineer-qa/SKILL.md
├── engineer-requirements/SKILL.md
├── engineer-workflow/SKILL.md
├── init-project/SKILL.md
├── novel-character-agency/SKILL.md
├── novel-comedy-engine/SKILL.md
├── novel-prose-readability/SKILL.md
├── novel-retention-edit/SKILL.md
├── novel-reveal-design/SKILL.md
├── novel-tactical-payoff/SKILL.md
├── product-analysis-framework/SKILL.md
├── product-pusher/SKILL.md
├── rc-application-tool/SKILL.md
├── rc-causal-chain/SKILL.md
├── rc-philosophy-advisor/SKILL.md
├── rc-text-assistant/SKILL.md
├── rc-tutor/SKILL.md
├── write-book/SKILL.md
└── write-webnovel/SKILL.md
```

## License

MIT
