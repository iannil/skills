# iannil-skills Design

## Goal

Extract the two skills currently stored under `/Users/rong.zhu/Code/iannil/.claude/workspaces` into the standalone repository at `/Users/rong.zhu/Code/skills`.

The repository must support:

- Installing all skills with one `npx` command.
- Installing one named skill.
- Keeping skills in the common `SKILL.md` format so Claude Code, Codex CLI, Cursor, Gemini CLI, Continue, Windsurf, OpenCode, Qwen Code, and similar agent tools can consume them through existing skill/rule conventions.
- Remaining compatible with the `vercel-labs/skills` ecosystem instead of creating a private-only format.

## Source Skills

The source workspace contains two canonical skill directories:

- `product-analysis-framework`
  - Source: `/Users/rong.zhu/Code/iannil/.claude/workspaces/product-analysis-framework/skill/SKILL.md`
  - Assets: none beyond `SKILL.md`
- `init-project`
  - Source: `/Users/rong.zhu/Code/iannil/.claude/workspaces/init-project/skill/SKILL.md`
  - Assets: `/Users/rong.zhu/Code/iannil/.claude/workspaces/init-project/skill/references/conventions-guide.md`

The `.skill` files in each workspace are packaged artifacts, not the canonical source.

## Repository Layout

Create the standalone npm package in the current repository:

```text
/Users/rong.zhu/Code/skills/
├── package.json
├── README.md
├── bin/
│   └── iannil-skills.js
├── skills/
│   ├── product-analysis-framework/
│   │   └── SKILL.md
│   └── init-project/
│       ├── SKILL.md
│       └── references/
│           └── conventions-guide.md
├── tests/
│   └── smoke.test.js
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-07-13-iannil-skills-design.md
```

The skill directories intentionally use the common `skills/<skill-name>/SKILL.md` shape. This keeps the repository usable by generic skill installers and easy for agents to inspect manually.

## CLI Design

The npm package exposes a binary named `iannil-skills`.

Supported commands:

```bash
npx iannil-skills list
npx iannil-skills install
npx iannil-skills install all
npx iannil-skills install init-project
npx iannil-skills install product-analysis-framework
npx iannil-skills install --dry-run
```

Behavior:

- `list` prints available skill names and descriptions.
- `install` defaults to all skills.
- `install all` installs all skills.
- `install <skill-name>` installs only the named skill.
- `install --dry-run` and `install <skill-name> --dry-run` resolve and print the selected skills without modifying the filesystem or invoking external installers.
- Unknown skill names fail with a non-zero exit code and print valid choices.

## Compatibility Strategy

The canonical skill payload remains `SKILL.md` with YAML frontmatter. This is the format used by the source skills and by public skill repositories such as `vercel-labs/skills`.

The package supports two installation paths:

1. Branded one-command path:

   ```bash
   npx iannil-skills install all
   npx iannil-skills install init-project
   ```

2. Standard ecosystem path:

   ```bash
   npx skills add <repo-or-package> --skill '*'
   npx skills add <repo-or-package> --skill init-project
   ```

The branded CLI delegates installation to the standard `skills` installer by running `npx skills add <package-root> --skill <name>`. For `all`, it delegates with `--skill '*'`. This keeps agent compatibility aligned with the upstream installer instead of duplicating its compatibility matrix.

The README presents the standard installer as the widest compatibility option and the branded CLI as the convenient package-specific entry point.

## Data Flow

1. User runs `npx iannil-skills install [skill]`.
2. CLI resolves the selected skill set:
   - no argument: all
   - `all`: all
   - known skill name: one skill
3. CLI locates the package's local `skills/` directory.
4. CLI delegates to `npx skills add <package-root> --skill <selection>`.
5. CLI reports installed skill names and the delegated command.

## Error Handling

The CLI handles:

- Unknown command: show usage and exit non-zero.
- Unknown skill: show valid skill names and exit non-zero.
- Missing `skills/` directory or `SKILL.md`: report package integrity failure and exit non-zero.
- Installation failure from the delegated installer: show the command that failed and exit non-zero.

The CLI does not silently ignore partial failures.

## Testing

Add smoke tests that verify:

- `list` includes both skill names.
- `install --dry-run` selects all skills by default.
- `install all --dry-run` selects both skills.
- `install init-project --dry-run` selects only `init-project`.
- Unknown skill exits non-zero.
- `init-project` includes `references/conventions-guide.md` in the package.

Tests use dry-run behavior and do not depend on network access.

## Scope Boundaries

This project extracts and packages the existing skills. It does not rewrite the actual skill instructions except for minimal path references needed after relocation.

It does not copy eval outputs, benchmarks, review HTML, generated sample projects, or `.skill` packaged artifacts from the source workspaces.

It also does not maintain a full custom compatibility matrix for every AI tool. The package relies on the common `SKILL.md` format and the standard `skills` installer ecosystem for broad tool support.
