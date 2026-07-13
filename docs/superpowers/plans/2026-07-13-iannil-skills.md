# iannil-skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/Users/rong.zhu/Code/skills` into an npm-installable skills package containing `init-project` and `product-analysis-framework`.

**Architecture:** The repository stores canonical skill payloads under `skills/<skill-name>/SKILL.md`. A small Node.js CLI discovers those directories, validates package integrity, supports dry-run/list commands, and delegates real installation to `npx skills add <package-root> --skill <selection>` for compatibility with `vercel-labs/skills`.

**Tech Stack:** Node.js CommonJS CLI, npm package metadata, `node:test` smoke tests, standard `SKILL.md` skill layout.

---

## File Structure

- Create `package.json`: npm metadata, `bin` mapping, package files, and test script.
- Create `bin/iannil-skills.js`: focused CLI for listing skills, resolving install selections, validating package files, dry-run output, and delegating to `npx skills add`.
- Create `skills/init-project/SKILL.md`: copied from the source canonical skill.
- Create `skills/init-project/references/conventions-guide.md`: copied source reference used by `init-project`.
- Create `skills/product-analysis-framework/SKILL.md`: copied from the source canonical skill.
- Create `tests/smoke.test.js`: node:test smoke coverage for list, dry-run selection, invalid skill handling, and reference packaging.
- Create `README.md`: install commands, standard `skills` compatibility commands, available skills, and development commands.
- Create `.gitignore`: Node, OS, editor, and local artifact ignores.

## Tasks

### Task 1: Package Skeleton and Skill Payloads

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `skills/init-project/SKILL.md`
- Create: `skills/init-project/references/conventions-guide.md`
- Create: `skills/product-analysis-framework/SKILL.md`

- [ ] **Step 1: Create package metadata**

Create `package.json`:

```json
{
  "name": "iannil-skills",
  "version": "0.1.0",
  "description": "Installable AI agent skills for project initialization and product analysis.",
  "license": "MIT",
  "type": "commonjs",
  "bin": {
    "iannil-skills": "bin/iannil-skills.js"
  },
  "files": [
    "bin/",
    "skills/",
    "README.md"
  ],
  "scripts": {
    "test": "node --test tests/*.test.js"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": [
    "ai",
    "agents",
    "skills",
    "claude-code",
    "codex",
    "cursor"
  ]
}
```

- [ ] **Step 2: Create ignore rules**

Create `.gitignore`:

```gitignore
.DS_Store
node_modules/
npm-debug.log*
coverage/
.nyc_output/
.env
.env.*
!.env.example
.idea/
.vscode/
```

- [ ] **Step 3: Copy canonical skill files**

Run:

```bash
mkdir -p skills/init-project/references skills/product-analysis-framework
cp /Users/rong.zhu/Code/iannil/.claude/workspaces/init-project/skill/SKILL.md skills/init-project/SKILL.md
cp /Users/rong.zhu/Code/iannil/.claude/workspaces/init-project/skill/references/conventions-guide.md skills/init-project/references/conventions-guide.md
cp /Users/rong.zhu/Code/iannil/.claude/workspaces/product-analysis-framework/skill/SKILL.md skills/product-analysis-framework/SKILL.md
```

- [ ] **Step 4: Verify copied payloads**

Run:

```bash
find skills -maxdepth 3 -type f | sort
```

Expected output includes:

```text
skills/init-project/SKILL.md
skills/init-project/references/conventions-guide.md
skills/product-analysis-framework/SKILL.md
```

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore skills
git commit -m "Add skill package payloads"
```

### Task 2: CLI Implementation

**Files:**
- Create: `bin/iannil-skills.js`
- Test later: `tests/smoke.test.js`

- [ ] **Step 1: Create CLI**

Create `bin/iannil-skills.js`:

```javascript
#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageRoot = path.resolve(__dirname, '..');
const skillsRoot = path.join(packageRoot, 'skills');

function usage() {
  return [
    'Usage:',
    '  iannil-skills list',
    '  iannil-skills install [all|skill-name] [--dry-run]',
    '',
    'Examples:',
    '  iannil-skills install',
    '  iannil-skills install all',
    '  iannil-skills install init-project',
    '  iannil-skills install product-analysis-framework --dry-run'
  ].join('\n');
}

function readSkillDescription(skillDir) {
  const skillPath = path.join(skillsRoot, skillDir, 'SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');
  const match = content.match(/^description:\s*(?:>\s*|\|-\s*)?\n?([\s\S]*?)\n(?:compatibility:|---)/m);
  if (!match) {
    return '';
  }
  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 180);
}

function discoverSkills() {
  if (!fs.existsSync(skillsRoot)) {
    throw new Error(`Package integrity error: missing skills directory at ${skillsRoot}`);
  }

  const names = fs.readdirSync(skillsRoot)
    .filter((entry) => {
      const fullPath = path.join(skillsRoot, entry);
      return fs.statSync(fullPath).isDirectory();
    })
    .sort();

  for (const name of names) {
    const skillPath = path.join(skillsRoot, name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Package integrity error: missing ${skillPath}`);
    }
  }

  return names;
}

function resolveInstallSelection(args, skillNames) {
  const dryRun = args.includes('--dry-run');
  const positional = args.filter((arg) => arg !== '--dry-run');
  const requested = positional[0] || 'all';

  if (requested === 'all') {
    return {
      dryRun,
      requested,
      installerSkill: '*',
      selectedSkills: skillNames
    };
  }

  if (!skillNames.includes(requested)) {
    throw new Error(`Unknown skill "${requested}". Valid skills: ${skillNames.join(', ')}`);
  }

  return {
    dryRun,
    requested,
    installerSkill: requested,
    selectedSkills: [requested]
  };
}

function printList(skillNames) {
  for (const name of skillNames) {
    const description = readSkillDescription(name);
    console.log(`${name}${description ? ` - ${description}` : ''}`);
  }
}

function install(selection) {
  const command = ['npx', 'skills', 'add', packageRoot, '--skill', selection.installerSkill];
  if (selection.dryRun) {
    console.log(`Selected skills: ${selection.selectedSkills.join(', ')}`);
    console.log(`Would run: ${command.join(' ')}`);
    return 0;
  }

  console.log(`Installing skills: ${selection.selectedSkills.join(', ')}`);
  console.log(`Running: ${command.join(' ')}`);

  const result = spawnSync(command[0], command.slice(1), {
    stdio: 'inherit',
    cwd: packageRoot
  });

  if (result.error) {
    console.error(`Failed to run installer: ${result.error.message}`);
    return 1;
  }

  return result.status === null ? 1 : result.status;
}

function main(argv) {
  const [command, ...args] = argv;
  const skillNames = discoverSkills();

  if (!command || command === '--help' || command === '-h') {
    console.log(usage());
    return 0;
  }

  if (command === 'list') {
    printList(skillNames);
    return 0;
  }

  if (command === 'install') {
    const selection = resolveInstallSelection(args, skillNames);
    return install(selection);
  }

  console.error(`Unknown command "${command}".`);
  console.error(usage());
  return 1;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  discoverSkills,
  resolveInstallSelection,
  usage
};
```

- [ ] **Step 2: Make CLI executable**

Run:

```bash
chmod +x bin/iannil-skills.js
```

- [ ] **Step 3: Manually verify CLI list**

Run:

```bash
node bin/iannil-skills.js list
```

Expected output includes both:

```text
init-project
product-analysis-framework
```

- [ ] **Step 4: Manually verify dry-run**

Run:

```bash
node bin/iannil-skills.js install init-project --dry-run
```

Expected output:

```text
Selected skills: init-project
Would run: npx skills add /Users/rong.zhu/Code/skills --skill init-project
```

- [ ] **Step 5: Commit**

```bash
git add bin/iannil-skills.js
git commit -m "Add iannil skills CLI"
```

### Task 3: Smoke Tests

**Files:**
- Create: `tests/smoke.test.js`

- [ ] **Step 1: Create smoke tests**

Create `tests/smoke.test.js`:

```javascript
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'bin', 'iannil-skills.js');

function runCli(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: 'utf8'
  });
}

test('list includes both skills', () => {
  const result = runCli(['list']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /init-project/);
  assert.match(result.stdout, /product-analysis-framework/);
});

test('install dry-run selects all skills by default', () => {
  const result = runCli(['install', '--dry-run']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Selected skills: init-project, product-analysis-framework/);
  assert.match(result.stdout, /--skill \*/);
});

test('install all dry-run selects both skills', () => {
  const result = runCli(['install', 'all', '--dry-run']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Selected skills: init-project, product-analysis-framework/);
  assert.match(result.stdout, /--skill \*/);
});

test('install one skill dry-run selects only that skill', () => {
  const result = runCli(['install', 'init-project', '--dry-run']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Selected skills: init-project/);
  assert.doesNotMatch(result.stdout, /Selected skills: init-project, product-analysis-framework/);
  assert.match(result.stdout, /--skill init-project/);
});

test('unknown skill exits non-zero with valid choices', () => {
  const result = runCli(['install', 'missing-skill', '--dry-run']);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown skill "missing-skill"/);
  assert.match(result.stderr, /init-project/);
  assert.match(result.stderr, /product-analysis-framework/);
});

test('init-project reference file is packaged', () => {
  const reference = path.join(root, 'skills', 'init-project', 'references', 'conventions-guide.md');

  assert.equal(fs.existsSync(reference), true);
  assert.match(fs.readFileSync(reference, 'utf8'), /项目指南/);
});
```

- [ ] **Step 2: Run tests**

Run:

```bash
npm test
```

Expected: all six tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/smoke.test.js package.json
git commit -m "Add smoke tests"
```

### Task 4: README and Final Verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README**

Create `README.md`:

```markdown
# iannil-skills

Installable AI agent skills for project initialization and product analysis.

This package keeps each skill in the standard `skills/<name>/SKILL.md` layout used by the broader skills ecosystem, including the `vercel-labs/skills` installer.

## Available Skills

- `init-project` - Complete project initialization workflow with docs, memory, release structure, observability conventions, and language-specific scaffolding.
- `product-analysis-framework` - Structured product and startup analysis framework with market evidence, user pain, moat, business model, risks, and reusable startup patterns.

## Install

Install all skills with the package-specific CLI:

```bash
npx iannil-skills install all
```

Install one skill:

```bash
npx iannil-skills install init-project
npx iannil-skills install product-analysis-framework
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
└── product-analysis-framework/
    └── SKILL.md
```

## License

MIT
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
node bin/iannil-skills.js list
node bin/iannil-skills.js install all --dry-run
npm pack --dry-run
```

Expected:

- Tests pass.
- List prints both skill names.
- Dry-run prints both skills and `--skill *`.
- Pack dry-run includes `bin/`, `skills/`, `README.md`, and `package.json`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Document iannil skills package"
```

## Self-Review

- Spec coverage: Tasks cover package structure, skill payload extraction, CLI commands, dry-run behavior, standard installer delegation, README compatibility docs, smoke tests, and package verification.
- Placeholder scan: No TBD/TODO placeholders remain in the implementation steps.
- Type consistency: CLI function names and test expectations consistently use `discoverSkills`, `resolveInstallSelection`, `install`, `list`, `install`, `all`, and `--dry-run`.
