# iannil-skills

Installable AI agent skills for project initialization, product analysis, and RC (Observational Convergence) philosophical framework.

This package keeps each skill in the standard `skills/<name>/SKILL.md` layout used by the broader skills ecosystem, including the `vercel-labs/skills` installer.

## Available Skills

- `init-project` - Complete project initialization workflow with docs, memory, release structure, observability conventions, and language-specific scaffolding.
- `product-analysis-framework` - Structured product and startup analysis framework with market evidence, user pain, moat, business model, risks, and reusable startup patterns.
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
