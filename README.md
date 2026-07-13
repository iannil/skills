# iannil/skills

Installable AI agent skills for project initialization, product analysis, and RC (Observational Convergence) philosophical framework.

This package keeps each skill in the standard `skills/<name>/SKILL.md` layout used by the broader skills ecosystem, including the `vercel-labs/skills` installer.

## Available Skills

### Engineering Skills

Based on the "Implementation Planning-Driven AI-Assisted Programming in Practice" methodology, the complete engineering development skill chain:

- `engineer-job` — **AI Project Auto-Build Engine** (P0). Meta-orchestrator that automatically executes the full project lifecycle: scaffolding → architecture design → multi-feature development → integration testing → deployment config generation. Supports `--auto` (auto-confirm) and `--silent` (silent) modes for unattended project building.
- `engineer-architect` — **AI Architect** (P0). Translates vague user requirements into a structured CONTEXT.md blueprint. Automatically researches, analyzes, and proposes technical solutions, generating an executable blueprint that includes system overview, data models, API contracts, and milestone dependency tree.
- `engineer-orchestrator` — **AI Project Orchestration Engine** (P0). Receives the project blueprint, automatically decomposes it into a feature-level task queue, invokes engineer-workflow one by one in dependency order, and manages cross-feature integration acceptance, context reset, and cross-session progress persistence.
- `engineer-workflow` — **AI Coding Fully Automated Workflow Engine**. Takes a single feature requirement as input and automatically executes: milestone breakdown → dispatch instructions → coding → acceptance → branch decision → commit consolidation → update blueprint.
- `engineer-coach` — **AI Coding Process Coach**. A six-step SOP guides users through AI-assisted programming: breakdown → dispatch instructions → coding → acceptance → branch decision → consolidation.
- `engineer-inspector` — **AI Code Architecture Inspector**. Detects three major signals of architecture drift (foundation tampering / over-engineering / size runaway) and outputs a structured acceptance report.
- `engineer-advisor` — **AI Coding Knowledge Advisor**. Diagnoses conversation health, evaluates whether context reset, instruction elevation, or complete rebuild is needed.

### Project & Product Skills

- `init-project` - Complete project initialization workflow with docs, memory, release structure, observability conventions, and language-specific scaffolding.
- `product-analysis-framework` - Structured product and startup analysis framework with market evidence, user pain, moat, business model, risks, and reusable startup patterns.

### RC Philosophy Skills

- `rc-tutor` - Teach the RC (Observational Convergence) philosophical framework to complete beginners — zero philosophy background assumed.
- `rc-application-tool` - Apply RC to diagnose real-world problems (decisions, teams, strategy) and analyze/rewrite marketing copy.
- `rc-philosophy-advisor` - Discuss deep philosophical questions through the RC lens and generate new RC-style aphorisms and fragments.
- `rc-text-assistant` - Write, reference, cite, search, and translate content related to the RC philosophical framework.

## Install

Install all skills with the package-specific CLI:

```bash
npx iannil-skills install all
```

Install one skill:

```bash
npx iannil-skills install init-project
npx iannil-skills install product-analysis-framework
npx iannil-skills install rc-tutor
```

Preview without changing anything:

```bash
npx iannil-skills install --dry-run
```

## Standard Skills Installer

For the widest AI tool compatibility, use the standard `skills` installer directly:

```bash
npx skills add iannil-skills --skill '*'
npx skills add iannil-skills --skill init-project
npx skills add iannil-skills --skill product-analysis-framework
npx skills add iannil-skills --skill rc-tutor
```

The standard installer handles the target agent layout for tools such as Claude Code, Codex CLI, Cursor, Gemini CLI, Continue, Windsurf, OpenCode, Qwen Code, and other compatible AI coding tools.

## Local Development

List skills:

```bash
node bin/iannil-skills.js list
```

Run dry-run install:

```bash
node bin/iannil-skills.js install all --dry-run
```

Run tests:

```bash
npm test
```

## Repository Layout

```text
skills/
├── engineer-job/
│   └── SKILL.md                    # P0 — 元编排引擎 / 全自动项目构建
├── engineer-architect/
│   └── SKILL.md                    # P0 — 需求→蓝图自动生成
├── engineer-orchestrator/
│   └── SKILL.md                    # P0 — 项目级编排引擎
├── engineer-workflow/
│   └── SKILL.md                    # 全自动功能开发引擎
├── engineer-coach/
│   └── SKILL.md                    # 流程教练/六步SOP
├── engineer-inspector/
│   └── SKILL.md                    # 代码架构监理
├── engineer-advisor/
│   └── SKILL.md                    # 编码知识顾问
├── init-project/
│   ├── SKILL.md
│   └── references/
│       └── conventions-guide.md
├── product-analysis-framework/
│   └── SKILL.md
├── rc-application-tool/
│   ├── SKILL.md
│   └── evals/
│       └── evals.json
├── rc-philosophy-advisor/
│   ├── SKILL.md
│   ├── evals/
│   │   └── evals.json
│   └── references/
│       └── philosophy-corpus.md
├── rc-text-assistant/
│   ├── SKILL.md
│   ├── evals/
│   │   └── evals.json
│   └── references/
│       └── philosophy-corpus.md → (symlink to ../rc-philosophy-advisor/references/)
└── rc-tutor/
    ├── SKILL.md
    └── evals/
        └── evals.json
```

## License

MIT
