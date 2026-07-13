# iannil-skills

Installable AI agent skills for project initialization, product analysis, and RC (Observational Convergence) philosophical framework.

This package keeps each skill in the standard `skills/<name>/SKILL.md` layout used by the broader skills ecosystem, including the `vercel-labs/skills` installer.

## Available Skills

### Engineering Workflow Skills（工程开发系列）

基于《基于实现规划的 AI 辅助编程实战》方法论的完整工程开发技能链：

- `engineer-architect` — **AI 架构师**（P0）。将用户模糊需求转化为结构化 CONTEXT.md 蓝图。自动调研、分析、提议技术方案，生成含系统全景、数据模型、API契约、里程碑依赖树的可执行蓝图。
- `engineer-orchestrator` — **AI 项目编排引擎**（P0）。接收项目蓝图，自动分解为功能级任务队列，按依赖顺序逐一调用 engineer-workflow 执行，管理跨功能集成验收、上下文重置和跨会话进度持久化。
- `engineer-workflow` — **AI 编码全自动工作流引擎**。输入单个功能需求，自动执行：里程碑拆解→下发指令→编码→验收→分支判断→提交固化→更新蓝图。
- `engineer-coach` — **AI 编码流程教练**。六步 SOP 引导用户完成 AI 辅助编程：拆解→下发指令→编码→验收→分支判断→固化。
- `engineer-inspector` — **AI 代码架构监理**。检测架构偏移三大信号（篡改地基/过度设计/体积失控），输出结构化验收报告。
- `engineer-advisor` — **AI 编码知识顾问**。诊断对话健康度，评估是否需要重置上下文、升维指令或彻底重建。

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
