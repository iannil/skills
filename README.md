# iannil/skills

**AI agent skills for software, fiction, product analysis, and philosophy.**

**English** | [简体中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](package.json)
[![Skills](https://img.shields.io/badge/skills-41-blue.svg)](#available-skills)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-ready-8A2BE2.svg)](#install)
![Offline install](https://img.shields.io/badge/install-offline%20%7C%20zero%20deps-orange.svg)

41 installable skills for Codex, Claude Code, and other agents that support skills: 17 for FDE, 1 for Agent evaluation, 5 for projects and products, 12 for book and web novel writing, 5 for RC (Observational Convergence) philosophy, and 1 for post-draft less-AI-tone cleanup.

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

- **Build software:** “Use fde-job to build a task tracker from scratch.”
- **Continue a novel:** “Use write-webnovel to read the existing chapters and story notes, then write the next chapter.”
- **Polish prose:** “Use novel-prose-readability to revise this passage while preserving character voice and viewpoint.”
- **Explore a product:** “Use fde-product-pusher to identify the assumptions I need to validate in this product idea.”
- **Learn philosophy:** “Use rc-tutor to explain Observational Convergence from first principles.”

See [Install](#install) for more options. If these skills help you, a star helps others find them.

## Choose by Task

| What you want to do | Category | Count | Common entry points |
|---|---|---:|---|
| Build, verify, or resume a software project | [FDE](#fde-skills) | 17 | `fde-job` / `fde-next` |
| Set up a project, analyze a product, or test an idea | [Projects & products](#project--product-skills) | 5 | `fde-init-project` / `fde-product-pusher` |
| Plan, write, or revise Chinese books and web fiction | [Book & web novel writing](#book--web-novel-writing-skills) | 12 | `write-book` / `write-webnovel` |
| Learn RC, diagnose problems, analyze causes, or write | [RC philosophy](#rc-philosophy-skills) | 5 | `rc-tutor` / `rc-application-tool` |
| Evaluate Agent learning, reuse and transfer | [Agent evaluation](#agent-evaluation-skills) | 1 | `agent-learning-eval` |
| Detect and clean AI-writing traces in finished prose | [Less AI tone](#less-ai-tone-skill) | 1 | `less-ai-tone` |

## Available Skills

### FDE Skills

Based on the "Implementation Planning-Driven AI-Assisted Programming in Practice" methodology, the complete FDE development skill chain:

- `fde-job` — **AI Project Auto-Build Engine** (P0). Meta-orchestrator that automatically executes the full project lifecycle: scaffolding → architecture design → multi-feature development → integration testing → deployment config generation. Supports `--auto` (auto-confirm) and `--silent` (silent) modes for unattended project building.
- `fde-next` — **AI Resume Router**. The universal "continue from wherever I am" entry point. Reads the fde-* state fingerprint (`.agents/job.state.json`, `.agents/progress.json`, `CONTEXT.md`, `REQUIREMENTS.md`, `project-metadata.json`, code volume), diagnoses where the project stopped, and hands off to the right skill to resume — `fde-job` (re-invokes its Workflow with reconstructed args, skipping done phases), `fde-orchestrator` (milestone-level recovery when development is mid-flight — never re-invokes job, which would redo milestones), `fde-architect` (blueprint gap, or reverse-engineering a foreign project), or `fde-requirements`. Foreign projects with no fde-* artifacts onboard adaptively: near-empty → fresh `fde-job`, substantial existing code → reverse-engineer a blueprint first. Pure router — it never re-implements phases or writes progress files.
- `fde-cloner` — **AI Reverse Site-Clone Front-End Engine**. Given an authorized target URL and a full-access account, reverse-observes the running site via `agent-browser` (login → loop-until-dry traversal → feature ledger → API/design extraction), then produces `REQUIREMENTS.md` / `CONTEXT.md` / `FRONTEND-DESIGN.md` plus an honest `CLONE-FIDELITY.md` (observable-exact / inferred / unobservable), and hands off to `fde-job` for a full-lifecycle, high-precision clone. Does design-language reconstruction + modern-stack rebuild — never raw-asset copying or backend-source claims.
- `fde-legacy-recon` — **AI Legacy-System Static-Recon Front-End** (offline sibling of `fde-cloner`). When you can't reach the live system but the user **pastes the legacy system's page content + navigation menus** (or screenshots / exported HTML), this skill treats that material as the sole source of truth — **no browsing, no `agent-browser`** — and statically infers the module map, entity fields, actions, state machines, and role/permission split. Grades every finding as `明示 / Stated`, `推断 / Inferred`, or `缺口 / Gap`, produces `REQUIREMENTS.md` / `CONTEXT.md` / `FRONTEND-DESIGN.md` plus a `RECON-FIDELITY.md` (with a gap list to ask the user about), then hands off to `fde-job`. Escalate to `fde-cloner` only if the user explicitly wants live verification with an authorized account.
- `fde-requirements` — **AI Requirements Analyst**. Decomposes vague user requirements into a structured requirements document using Event Storming + DDD strategic design — bounded contexts, business events, functional dependencies, and key state machines. Outputs `REQUIREMENTS.md` for `fde-architect` to consume. Triggers for complex, multi-module, or multi-end systems (2+ frontends or 5+ feature modules).
- `fde-architect` — **AI Architect** (P0). Translates vague user requirements into a structured CONTEXT.md blueprint. Automatically researches, analyzes, and proposes technical solutions, generating an executable blueprint that includes system overview, data models, API contracts, and milestone dependency tree.
- `fde-frontend-architect` — **AI Frontend Architect**. Detailed frontend design performed *after* the system architecture is complete. Outputs `FRONTEND-DESIGN.md` with page tree, component tree, state-management architecture, UI state machines, and design-system tokens — for multi-surface systems (Web / mini-program / mobile). Must run after `fde-architect`; auto-triggers when a project has 2+ frontend surfaces.
- `fde-poc` — **AI High-Fidelity POC Engine**. Turns requirements into a runnable, **pure-frontend, evolutionary** prototype: reads `REQUIREMENTS.md` + `FRONTEND-DESIGN.md` (+ `CONTEXT.md`), identifies the industry and applies a built-in pattern library, then builds every page with all UI states (loading/empty/error/normal/edge) on a swappable mock-adapter seam — full-function coverage guaranteed by a `.agents/poc.ledger.json` + loop-until-dry + coverage critic. Outputs `POC-MANIFEST.md` (mock→real evolution map) and an honest `POC-FIDELITY.md` (`真实交互` / `mock 数据` / `占位未实现`). Slots into `fde-job` as optional Phase 3.5 — the project can **stop at the POC**, **skip it**, or **continue** as Phase 4 evolves the mock layer into a real backend. No backend required.
- `fde-orchestrator` — **AI Project Orchestration Engine** (P0). Receives the project blueprint, automatically decomposes it into a feature-level task queue, invokes fde-workflow one by one in dependency order, and manages cross-feature integration acceptance, context reset, and cross-session progress persistence.
- `fde-workflow` — **AI Coding Fully Automated Workflow Engine**. Takes a single feature requirement as input and automatically executes: milestone breakdown → dispatch instructions → coding → acceptance → branch decision → commit consolidation → update blueprint.
- `fde-coach` — **AI Coding Process Coach**. A six-step SOP guides users through AI-assisted programming: breakdown → dispatch instructions → coding → acceptance → branch decision → consolidation.
- `fde-inspector` — **AI Code Architecture Inspector**. Detects three major signals of architecture drift (foundation tampering / over-engineering / size runaway) and outputs a structured acceptance report.
- `fde-qa` — **Engineering Test Acceptance**. Selects checks and coverage policy from task risk and project requirements, separates mock, real integration and target-environment evidence, and returns PASS / NEEDS_FIX / UNVERIFIED. Failures do not authorize a worktree reset.
- `fde-advisor` — **AI Coding Knowledge Advisor**. Diagnoses conversation health, evaluates whether context reset, instruction elevation, or complete rebuild is needed.

- `fde-reconcile` — Reconcile actual implementation, verification evidence, project status, documentation and memory.
- `fde-build-performance` — Optimize build/dev latency with measured baselines, cache invalidation checks and output equivalence.
- `fde-release` — Coordinate program, plugin, image and downstream releases; distinguish published artifacts from verified live versions.

### Agent Evaluation Skills

- `agent-learning-eval` — Design and run controlled learning, reuse and transfer evaluations, with difficulty calibration, cost accounting and regression analysis.

### Project & Product Skills

- `fde-init-project` - Complete project initialization workflow with docs, memory, release structure, observability conventions, and language-specific scaffolding.
- `commercial-positioning-research` - Research differentiated positioning, assess commercial evidence and the value of the next investment separately, and deliver a sourced report with reproducible economics and stage-appropriate validation plans.
- `seo-geo-methodology` - Evidence-based SEO and generative search optimization: investigate discovery and citation barriers, improve content, and measure search visibility, AI citations and business outcomes separately.
- `fde-product-analysis-framework` - Structured product and startup analysis framework with market evidence, user pain, moat, business model, risks, and reusable startup patterns.
- `fde-product-pusher` - **Product Pusher**. Forge a NEW, still-unbuilt product or startup idea into a buildable definition through a grilled brainstorming dialogue: brainstorm it open, then pressure-test it one hard question at a time (real users, real pain, who holds the kill-switch, the cheapest validation) until a concrete product definition survives — ending in a ranked kill-risk report and a go/no-go/pivot call. Collaborative but adversarial: it pokes holes, not cheerleads. Built on the causal-chain / RC discipline, surfaced in plain language.

### Book & Web Novel Writing Skills

`write-book` handles book planning, chapter drafting, continuation, and whole-book revision, with attention to arguments, terminology, examples, and progression.

The web novel skills support character-driven Chinese long-form fiction and ensemble stories. Use `write-webnovel` as the general entry point, `writing-absurd-xianxia` for absurd cultivation comedy, or one of the six focused skills for a specific craft problem.

- `write-book` - Plan, draft, continue, and revise Chinese books while maintaining consistency across chapters.
- `write-webnovel` - Web novel writing: story planning, serialization, characterization, and multi-chapter revision.
- `writing-absurd-xianxia` - Absurd cultivation comedy: coherent world rules, countered anti-tropes, layered reversals, and satisfying victories; supports concepts, prose, continuation, and revision.
- `novel-character-agency` - Character desires, agency, voice, ensemble differentiation, and consistent growth.
- `novel-comedy-engine` - Character-driven humor, misunderstandings, and comedy across chapters.
- `novel-prose-readability` - Prose readability diagnosis and revision while preserving voice, viewpoint, and emotion.
- `novel-retention-edit` - Opening appeal, serialization pacing, payoffs, chapter boundaries, and anticipation.
- `novel-reveal-design` - Misread legends, identity secrets, foreshadowing payoffs, and plot reversals.
- `novel-tactical-payoff` - Credible tactics, underdog victories, ensemble cooperation, and concrete outcomes.

- `book-polish` — Polish manuscripts for publication, adapting reading difficulty to the audience and book type while preserving precision, authorial voice, and reading rhythm.
- `book-content-audit` — Audit and revise arguments, facts, cases and technical examples while preserving substantive content.
- `book-export-qa` — Verify source-to-export consistency, bilingual editions, navigation and layout across PDF/EPUB/DOCX.

### Less AI Tone Skill

- `less-ai-tone` — Post-draft cleanup: detect with scripts and semantic criteria, deliver a pre-edit report and wait for approval, then make minimal edits and re-test. Thirty long-form writing skills embed this flow under `./less-ai-tone/`; sync the canonical package with `./bin/sync-less-ai-tone.sh`.

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
| Absurd cultivation comedy with layered reversals and satisfying wins | `writing-absurd-xianxia` | Coherent big ideas, countered anti-tropes, comic scenes, and lasting gains |
| Passive characters, disposable supporting roles, or indistinct voices | `novel-character-agency` | Desires, active choices, and consistent growth |
| Humor relies on banter, repeated jokes, or foolish behavior | `novel-comedy-engine` | Comic events driven by character desires |
| Unclear sentences, confusing action, or repetitive explanation | `novel-prose-readability` | Passage-level or multi-chapter prose revision |
| Slow openings, endless setup, delayed payoffs, or weak anticipation | `novel-retention-edit` | Pacing, payoffs, and chapter boundaries |
| Unresolved clues, improvised reveals, or twists with no consequences | `novel-reveal-design` | Causal links between clues, revelations, and action |
| Implausible tactics, weakened opponents, or victories without rewards | `novel-tactical-payoff` | Credible contests, cooperation, and concrete gains |

Provide the project entry point, target chapters, and scope. Specify whether you want a review or edits to the manuscript. Multi-chapter revision uses the original text and surrounding context to check continuity in facts, character knowledge, and foreshadowing. Start with `write-webnovel` or `novel-retention-edit` for structural diagnosis, then select a focused skill as needed.

The seven web novel skills were distilled from work on the Chinese novel 《我们宗门正在逃跑》 and can be applied to other fiction. Its characters, setting, and project-specific procedures apply only when working on that novel. See each `SKILL.md` for the workflow and its `references/` directory for source notes and adaptation details.

## Specialist Boundaries

- Resume with `fde-next`; reconcile conflicting status and implementation with `fde-reconcile`.
- Design or simplify with `fde-architect`, review structure with `fde-inspector`, verify behavior with `fde-qa`, and coordinate releases with `fde-release`.
- Write and plan series with `write-book`, polish for the audience and book type with `book-polish`, audit content with `book-content-audit`, and verify generated editions with `book-export-qa`.
- Before delivering continuous Chinese prose, run `less-ai-tone` (or the host skill’s `./less-ai-tone/`) for detection and confirmation; never silent-edit for tone alone.
- Evaluate learning gains with `agent-learning-eval`; saved assets and passing software tests are not evidence of learning gains.

Demo data, AI editors, technical manuscript checks, open-source delivery, RC consistency and source adaptation live in task-specific references. New specialists can run independently and do not require every optional collaborating skill to be installed.

## FDE Workflow Practices

### Pick the right entry skill

The FDE skills form a chain. Enter at the point that matches your situation — each skill knows how to hand off to the next:

| Your situation | Start here | Produces |
|---|---|---|
| "Build the whole project from scratch, unattended" | `fde-job` | full project |
| "Continue from where I stopped" / don't know which skill / resume | `fde-next` | routes to the right resume point |
| Clone an existing running site you're authorized to rebuild | `fde-cloner` | three docs → `fde-job` |
| Rebuild a legacy system from pasted page content + menus (no live access) | `fde-legacy-recon` | three docs + gap list → `fde-job` |
| Complex / multi-module / multi-end system, requirements still fuzzy | `fde-requirements` | `REQUIREMENTS.md` |
| Clear business goal, no architecture blueprint yet | `fde-architect` | `CONTEXT.md` |
| Architecture done, project has a frontend (esp. 2+ surfaces) | `fde-frontend-architect` | `FRONTEND-DESIGN.md` |
| Want a high-fidelity clickable prototype before real implementation | `fde-poc` | runnable pure-frontend POC + `POC-MANIFEST.md` → `fde-job` |
| Blueprint exists, deliver the whole project feature-by-feature | `fde-orchestrator` | integrated project |
| One feature, end-to-end | `fde-workflow` | implemented and verified feature |
| Verify a finished feature meets the test gate (unit + coverage + E2E) | `fde-qa` | PASS / NEEDS_FIX / UNVERIFIED verdict |
| You want to drive coding yourself, with guidance | `fde-coach` | — |

`fde-init-project` is for **scaffolding conventions only**; for a full build use `fde-job`.

### Follow the three disciplines (red lines)

These are the methodology's non-negotiables — the skills enforce them, and you should too:

- *no work without a blueprint* — Don't start coding before `requirements` / `architect` / `frontend-architect` have produced their design docs.
- *no consolidation without verification* — Never commit or "consolidate" generated code before acceptance. Run `fde-inspector` first.
- *diagnose before restarting* — Preserve current work and evidence, identify the cause, and resume from verified state. Resetting conversational context does not mean discarding code.

### Install the chain, not just one skill

The FDE skills are designed to compose: `requirements → architect → frontend-architect → orchestrator → workflow → inspector`. Installing only a subset can break the handoff contracts between them, so prefer installing all of them (`./install.sh` with no args).

### Keep context lean

These skills emit many artifacts (`CONTEXT.md`, `REQUIREMENTS.md`, `FRONTEND-DESIGN.md`, `.agents/` state). When a conversation grows long, start a fresh session and point it at the persisted blueprint/state instead of continuing in a bloated context. `fde-advisor` can diagnose when a reset is warranted.

### Delegate outcomes and verification

Record the intended outcome, acceptance criteria and their sources, non-negotiable requirements, and authorized tradeoffs in the existing requirements or blueprint. Within that scope, the executing agent owns review, testing, repairs and re-verification; you do not need to prompt each transition. A request to continue inherits the established decisions and authorization.

Missing evidence remains unverified, and failed required work remains incomplete. The agent may continue independent work without reducing the original target. When a decision needs your authority, it should present the facts, attempted remedies, recommended option and its consequences. Finishing the workflow is separate from satisfying the delivery criteria; implementation, verification, publication and live confirmation are reported separately.

## Install

Install all skills with the package-specific CLI:

```bash
npx iannil/skills install all
```

Install one skill:

```bash
npx iannil/skills install fde-init-project
npx iannil/skills install fde-product-analysis-framework
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
./install.sh fde-init-project fde-architect

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
npx skills add iannil/skills --skill fde-init-project
npx skills add iannil/skills --skill fde-product-analysis-framework
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

All 40 skill entry points are listed below. Individual skill directories may also contain `references/` (supporting material), `agents/` (agent configuration), `scripts/` (utilities), and `evals/` (evaluation examples).

```text
skills/
├── agent-learning-eval/SKILL.md
├── book-content-audit/SKILL.md
├── book-export-qa/SKILL.md
├── book-polish/SKILL.md
├── fde-advisor/SKILL.md
├── fde-architect/SKILL.md
├── fde-build-performance/SKILL.md
├── fde-cloner/SKILL.md
├── fde-coach/SKILL.md
├── fde-frontend-architect/SKILL.md
├── fde-inspector/SKILL.md
├── fde-job/SKILL.md
├── fde-legacy-recon/SKILL.md
├── fde-next/SKILL.md
├── fde-orchestrator/SKILL.md
├── fde-poc/SKILL.md
├── fde-qa/SKILL.md
├── fde-reconcile/SKILL.md
├── fde-release/SKILL.md
├── fde-requirements/SKILL.md
├── fde-workflow/SKILL.md
├── fde-init-project/SKILL.md
├── novel-character-agency/SKILL.md
├── novel-comedy-engine/SKILL.md
├── novel-prose-readability/SKILL.md
├── novel-retention-edit/SKILL.md
├── novel-reveal-design/SKILL.md
├── novel-tactical-payoff/SKILL.md
├── commercial-positioning-research/SKILL.md
├── seo-geo-methodology/SKILL.md
├── fde-product-analysis-framework/SKILL.md
├── fde-product-pusher/SKILL.md
├── rc-application-tool/SKILL.md
├── rc-causal-chain/SKILL.md
├── rc-philosophy-advisor/SKILL.md
├── rc-text-assistant/SKILL.md
├── rc-tutor/SKILL.md
├── write-book/SKILL.md
├── write-webnovel/SKILL.md
└── writing-absurd-xianxia/SKILL.md
```

## License

MIT
