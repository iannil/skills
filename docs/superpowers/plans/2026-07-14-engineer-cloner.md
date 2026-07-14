# engineer-cloner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `engineer-cloner` skill that reverse-observes a live, authorized target site and produces the methodology's three-document system plus a fidelity report, then hands off to `engineer-job` for the build.

**Architecture:** `engineer-cloner` is a front-end observation skill in the engineer-* chain. It reuses `agent-browser` for observation and `engineer-job`/`engineer-architect` for output-doc formats and the build. It ships as `skills/engineer-cloner/SKILL.md` plus four reference files, is registered in both READMEs, and is guarded by a dedicated structural test written test-first.

**Tech Stack:** Markdown skill files (bilingual zh/en), one JSON-Schema (draft-07) reference, Node's built-in `node:test` for structural validation (matches `tests/smoke.test.js` style). No new runtime dependencies.

## Global Constraints

- **Skill name is exactly `engineer-cloner`** — used in frontmatter `name:`, directory name, README entries, and test assertions. Must match everywhere.
- **Bilingual family style** — every SKILL.md/reference heading and key section is Chinese + English (e.g. `## 🎯 核心理念 / Core Philosophy`), matching `engineer-architect`/`engineer-job`.
- **Source-attribution block** — SKILL.md includes the family's source note referencing the "实现规划" methodology and `zhurongshuo.com`, same as sibling skills.
- **frontmatter `compatibility: "agent, bash, write, edit, read"`** — copied verbatim (observation runs through agent-browser, so `agent` is required).
- **Three-tier fidelity vocabulary is fixed**: `可观测精确 / Observable-exact`, `推断 / Inferred`, `不可观测 / Unobservable`. Use these exact labels in SKILL.md and the fidelity template.
- **Seven pipeline phases, fixed names**: 0 授权与范围 / Authorize & Scope, 1 侦察 / Recon, 2 登录全站遍历 / Authenticated Traversal, 3 契约与数据模型提取 / Contract & Model Extraction, 4 设计语言提取 / Design-Language Extraction, 5 三文档合成 / Synthesize Docs, 6 交棒 / Handoff.
- **Runtime artifact paths are fixed**: `.agents/clone.ledger.json`, `.agents/clone.observations/`, and outputs `REQUIREMENTS.md`, `CONTEXT.md`, `FRONTEND-DESIGN.md`, `CLONE-FIDELITY.md`.
- **Non-goals must be stated**: no raw-asset mirroring, no built-in browser, no rebuilding the engineer-job chain, no cloning payment/third-party/secrets/server-only logic, never claims to copy backend source.
- **No test in `EXPECTED_SKILLS`** — do NOT add `engineer-cloner` to `tests/smoke.test.js`'s `EXPECTED_SKILLS` (that list is CLI-install scoped to non-engineer skills; the engineer family is intentionally absent). The new skill gets its own test file.

---

## File Structure

**Create:**
- `skills/engineer-cloner/SKILL.md` — main skill: philosophy, triggers, modes, seven-phase pipeline, artifacts, edge cases, handoff.
- `skills/engineer-cloner/references/coverage-ledger.schema.json` — JSON-Schema for `.agents/clone.ledger.json` (feature inventory + coverage state).
- `skills/engineer-cloner/references/observation-playbook.md` — agent-browser traversal methodology + loop-until-dry + coverage critic.
- `skills/engineer-cloner/references/contract-extraction.md` — reconstruct API contracts & data models from captured traffic.
- `skills/engineer-cloner/references/fidelity-report-template.md` — `CLONE-FIDELITY.md` template with three-tier labels.
- `tests/engineer-cloner.test.js` — structural validation (files exist, frontmatter, required sections, schema parses, READMEs updated).

**Modify:**
- `README.md` — add one bullet under "Engineering Skills" and one row in "Pick the right entry skill".
- `README.zh-CN.md` — same two additions in Chinese.

---

## Task 1: Structural test (written first, red)

**Files:**
- Test: `tests/engineer-cloner.test.js`

**Interfaces:**
- Consumes: repo layout constants (`root`, `skills/engineer-cloner/...`) in the style of `tests/smoke.test.js`.
- Produces: the objective "done" gate every later task turns green. Assertions later tasks must satisfy:
  - `skills/engineer-cloner/SKILL.md` exists; frontmatter `name: engineer-cloner`; `compatibility:` line present; contains all seven phase names; contains all three fidelity labels; contains handoff to `engineer-job`; contains the four runtime artifact filenames.
  - The four reference files exist; `coverage-ledger.schema.json` is valid JSON with `$schema` draft-07 and top-level `type`.
  - `README.md` and `README.zh-CN.md` both contain `engineer-cloner`.

- [ ] **Step 1: Write the failing test**

Create `tests/engineer-cloner.test.js`:

```javascript
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const skillDir = path.join(root, 'skills', 'engineer-cloner');
const refDir = path.join(skillDir, 'references');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

test('SKILL.md exists with correct frontmatter', () => {
  const p = path.join(skillDir, 'SKILL.md');
  assert.equal(fs.existsSync(p), true, 'Missing engineer-cloner/SKILL.md');
  const body = read(p);
  assert.match(body, /^name:\s*engineer-cloner\s*$/m, 'frontmatter name must be engineer-cloner');
  assert.match(body, /^compatibility:\s*"agent, bash, write, edit, read"\s*$/m, 'compatibility line mismatch');
});

test('SKILL.md covers all seven phases', () => {
  const body = read(path.join(skillDir, 'SKILL.md'));
  const phases = [
    '授权与范围',
    '侦察',
    '登录全站遍历',
    '契约与数据模型提取',
    '设计语言提取',
    '三文档合成',
    '交棒',
  ];
  for (const phase of phases) {
    assert.ok(body.includes(phase), `SKILL.md missing phase: ${phase}`);
  }
});

test('SKILL.md states the three fidelity tiers', () => {
  const body = read(path.join(skillDir, 'SKILL.md'));
  for (const label of ['可观测精确', '推断', '不可观测']) {
    assert.ok(body.includes(label), `SKILL.md missing fidelity tier: ${label}`);
  }
});

test('SKILL.md names runtime artifacts and handoff', () => {
  const body = read(path.join(skillDir, 'SKILL.md'));
  for (const artifact of [
    '.agents/clone.ledger.json',
    'REQUIREMENTS.md',
    'CONTEXT.md',
    'FRONTEND-DESIGN.md',
    'CLONE-FIDELITY.md',
  ]) {
    assert.ok(body.includes(artifact), `SKILL.md missing artifact: ${artifact}`);
  }
  assert.ok(body.includes('engineer-job'), 'SKILL.md must reference engineer-job handoff');
  assert.ok(body.includes('agent-browser'), 'SKILL.md must reference agent-browser');
});

test('reference files exist', () => {
  for (const f of [
    'coverage-ledger.schema.json',
    'observation-playbook.md',
    'contract-extraction.md',
    'fidelity-report-template.md',
  ]) {
    assert.equal(fs.existsSync(path.join(refDir, f)), true, `Missing reference: ${f}`);
  }
});

test('coverage-ledger schema is valid JSON draft-07', () => {
  const schema = JSON.parse(read(path.join(refDir, 'coverage-ledger.schema.json')));
  assert.match(schema.$schema, /draft-07/, 'schema must declare draft-07');
  assert.ok(typeof schema.type === 'string', 'schema needs a top-level type');
});

test('fidelity template uses the three tiers', () => {
  const body = read(path.join(refDir, 'fidelity-report-template.md'));
  for (const label of ['可观测精确', '推断', '不可观测']) {
    assert.ok(body.includes(label), `fidelity template missing tier: ${label}`);
  }
});

test('both READMEs register engineer-cloner', () => {
  assert.ok(read(path.join(root, 'README.md')).includes('engineer-cloner'), 'README.md missing engineer-cloner');
  assert.ok(read(path.join(root, 'README.zh-CN.md')).includes('engineer-cloner'), 'README.zh-CN.md missing engineer-cloner');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `tests/engineer-cloner.test.js` reports missing `engineer-cloner/SKILL.md` and related assertions (the pre-existing `tests/smoke.test.js` and others stay green).

- [ ] **Step 3: Commit the red test**

```bash
git add tests/engineer-cloner.test.js
git commit -m "test: add structural gate for engineer-cloner skill"
```

---

## Task 2: coverage-ledger.schema.json

**Files:**
- Create: `skills/engineer-cloner/references/coverage-ledger.schema.json`

**Interfaces:**
- Consumes: nothing.
- Produces: the schema SKILL.md and observation-playbook.md reference by path. Feature-entry shape used by Task 3/Task 4 prose: each feature has `id`, `entry_path` (URL or click-sequence), `name`, `roles_visible`, `ui_states`, `actions`, `forms`, `api_calls`, `screenshots`, `coverage_status`.

- [ ] **Step 1: Write the schema**

Create `skills/engineer-cloner/references/coverage-ledger.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "iannil/skills/clone-ledger",
  "title": "Clone Coverage Ledger",
  "description": "Feature inventory + coverage state for engineer-cloner reverse observation. Written during Phase 2 (authenticated traversal), resumable across sessions, the single source of truth for full-feature coverage.",
  "type": "object",
  "required": ["target", "loop_state", "features"],
  "properties": {
    "target": {
      "type": "object",
      "required": ["url"],
      "properties": {
        "url": { "type": "string", "description": "目标站点地址 / target site URL" },
        "authorized": { "type": "boolean", "description": "授权确认标记 / authorization confirmed" },
        "inferred_stack": { "type": ["string", "null"], "description": "从指纹推断的原栈 / stack inferred from fingerprint" },
        "roles": {
          "type": "array",
          "items": { "type": "string" },
          "description": "已遍历的角色 / roles traversed"
        },
        "do_not_clone": {
          "type": "array",
          "items": { "type": "string" },
          "description": "不克隆边界：支付/第三方/密钥 / out-of-scope surfaces"
        }
      }
    },
    "loop_state": {
      "type": "object",
      "required": ["dry_rounds", "pass_count"],
      "properties": {
        "dry_rounds": { "type": "integer", "minimum": 0, "description": "连续无新发现的轮数 / consecutive rounds with no new features" },
        "pass_count": { "type": "integer", "minimum": 0, "description": "已完成的遍历轮数 / traversal passes completed" },
        "complete": { "type": "boolean", "description": "loop-until-dry 是否收敛 / whether discovery converged" }
      }
    },
    "features": {
      "type": "array",
      "description": "功能账本条目 / feature ledger entries",
      "items": {
        "type": "object",
        "required": ["id", "entry_path", "name", "coverage_status"],
        "properties": {
          "id": { "type": "string", "description": "稳定主键 / stable key" },
          "entry_path": { "type": "string", "description": "URL 或点击序列（SPA）/ URL or click-sequence for SPAs" },
          "name": { "type": "string", "description": "功能名 / feature name" },
          "roles_visible": {
            "type": "array",
            "items": { "type": "string" },
            "description": "可见此功能的角色 / roles that can see this feature"
          },
          "ui_states": {
            "type": "array",
            "items": { "type": "string" },
            "description": "观测到的 UI 状态：默认/空态/错误态/加载 / observed UI states"
          },
          "actions": {
            "type": "array",
            "items": { "type": "string" },
            "description": "可执行操作 / actionable operations"
          },
          "forms": {
            "type": "array",
            "items": { "type": "string" },
            "description": "表单字段与校验 / form fields and validations"
          },
          "api_calls": {
            "type": "array",
            "items": { "type": "string" },
            "description": "观测到的 API 调用引用 / references to observed API calls"
          },
          "screenshots": {
            "type": "array",
            "items": { "type": "string" },
            "description": ".agents/clone.observations/ 下的截图路径 / screenshot paths"
          },
          "coverage_status": {
            "type": "string",
            "enum": ["discovered", "explored", "extracted"],
            "description": "discovered=已发现未展开, explored=已遍历状态, extracted=契约与设计已提取"
          }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Verify JSON parses**

Run: `node -e "JSON.parse(require('node:fs').readFileSync('skills/engineer-cloner/references/coverage-ledger.schema.json','utf8')); console.log('ok')"`
Expected: prints `ok`

- [ ] **Step 3: Run the schema test**

Run: `node --test tests/engineer-cloner.test.js`
Expected: `coverage-ledger schema is valid JSON draft-07` now PASSES; SKILL/README tests still FAIL.

- [ ] **Step 4: Commit**

```bash
git add skills/engineer-cloner/references/coverage-ledger.schema.json
git commit -m "feat: add clone coverage-ledger schema"
```

---

## Task 3: SKILL.md

**Files:**
- Create: `skills/engineer-cloner/SKILL.md`

**Interfaces:**
- Consumes: `coverage-ledger.schema.json` (Task 2); references `agent-browser`, `engineer-job`, `engineer-architect`, `engineer-frontend-architect`.
- Produces: the skill entry point. Turns green: the four SKILL.md tests in Task 1.

Author `skills/engineer-cloner/SKILL.md` with these sections in order. Content must be bilingual and match the family voice in `engineer-architect/SKILL.md`. Every bracketed item below is a required, concrete element — not a placeholder to leave blank.

- [ ] **Step 1: Write frontmatter + source block**

Frontmatter (exact):

```yaml
---
name: engineer-cloner
description: >
  【强触发 / Strong trigger】"克隆这个网站" / "clone this site" + 目标 URL + 具有完整操作权限的账号 —— 逆向观测线上站点并产出三文档，交棒 engineer-job 构建。
  ROUTING RULE: 当用户提供目标 URL + 账号并要"克隆/复刻现有站点"时，本技能优先于 engineer-architect / engineer-job 触发；cloner 完成三文档后再调用 engineer-job 构建。
  AI 逆向站点克隆前置引擎 — 授权范围内逆向观测正在运行的站点，
  产出 REQUIREMENTS.md / CONTEXT.md / FRONTEND-DESIGN.md / CLONE-FIDELITY.md，
  再交棒 engineer-job 完成全功能、全生命周期、高精度克隆。
  观测复用 agent-browser，构建复用 engineer-job 链。
  TRIGGERS: "克隆这个网站""复刻这个站点""逆向这个网站""照着这个站点做一个"
  "clone this site""reverse-engineer this site""rebuild this website""replicate this site"
  也触发于：用户给出线上站点地址与登录账号并表达重建意图。
compatibility: "agent, bash, write, edit, read"
---
```

Then the source-attribution block (copy the two-line 来源声明/Source pattern from `engineer-architect/SKILL.md` lines 20-22, referencing the "实现规划" methodology and `zhurongshuo.com`, plus a 参考架构 line naming `agent-browser` and `engineer-job`).

- [ ] **Step 2: Write `## 🎯 核心理念 / Core Philosophy` (four principles)**

Write the four principles from the spec, each with a Chinese paragraph + one bold English line:
1. **观测即黑盒，推断即架构 / Observe the Black Box, Infer the Architecture** — only client-observable parts (UI, interactions, client-visible API contracts) can be exactly replicated; backend is inferred to behavioral equivalence, never copied. Introduce the three tiers here: `可观测精确 / Observable-exact`, `推断 / Inferred`, `不可观测 / Unobservable`.
2. **覆盖靠账本，不靠记忆 / Coverage via Ledger, Not Memory** — persistent `.agents/clone.ledger.json` + loop-until-dry + coverage critic guarantee 全功能 coverage.
3. **状态即文件 / 交棒复用 / State Is Files, Reuse the Chain** — produce the three docs, hand off to `engineer-job`; do not re-implement scaffolding/orchestration/acceptance.
4. **授权先行 / Authorization First** — confirm lawful authorization before any credentialed access; establish the do-not-clone boundary (payment gateways, third-party SaaS, secrets, copyrighted media). This skill does functional reconstruction (design-language reconstruction + modern-stack rebuild), never raw-asset copying.

- [ ] **Step 3: Write `## 🚦 触发条件 / When to Trigger`**

Include: must-trigger phrases (from frontmatter TRIGGERS), do-not-trigger cases (new project with no target → `engineer-job`; local-code architecture analysis → `engineer-architect` reverse mode), and priority rule (target URL + clone intent → cloner first; cloner calls job internally).

- [ ] **Step 4: Write `## ⚙️ 模式选择 / Mode Selection`**

A table of `normal / auto / silent` (copy the shape from `engineer-architect/SKILL.md` lines 112-119) plus an explicit note: **the Phase 0 authorization + do-not-clone confirmation always runs, and is never skipped by auto/silent.**

- [ ] **Step 5: Write `## 🏗️ 逆向流水线 / Reverse Pipeline` (the seven phases)**

A phase-overview table with columns 阶段 | 名称 | 输入 → 输出 | 关键动作, one row per phase, using the exact fixed phase names from Global Constraints. Then a `### 阶段间数据流` code block reproducing the spec's data-flow diagram (scope → fingerprint → ledger → contracts → design → three docs → build+screenshot acceptance). Then a `### loop-until-dry 遍历（阶段 2 核心）` pseudo-code block (from spec §4). Each phase also gets a short subsection `### 阶段 N: <名称>` describing action + output + which reference file to consult (Phase 2 → `references/observation-playbook.md`; Phase 3 → `references/contract-extraction.md`; Phase 5 fidelity → `references/fidelity-report-template.md`; ledger → `references/coverage-ledger.schema.json`).

- [ ] **Step 6: Write `## 📁 产物与文件结构 / Artifacts` and `## 🤝 交棒 / Handoff`**

Artifacts table listing `.agents/clone.ledger.json`, `.agents/clone.observations/`, `REQUIREMENTS.md`, `CONTEXT.md`, `FRONTEND-DESIGN.md`, `CLONE-FIDELITY.md` with one-line purposes. Handoff section: after Phase 5, invoke `engineer-job` (or `engineer-orchestrator` if only a blueprint is wanted) with the produced docs; Phase 6 acceptance compares rebuilt views against Phase 2 screenshots. Show the concrete handoff call:

````markdown
```javascript
Workflow({
  script: "skills/engineer-job/run.wf.js",
  args: { requirements: "见 REQUIREMENTS.md（由 cloner 生成）", mode: "auto", projectName: "<clone-name>", skip_requirements: false, skip_frontend: false }
})
```
````

- [ ] **Step 7: Write `## ⚠️ 边界情况 / Edge Cases` and `## 🚫 非目标 / Non-Goals`**

Edge-case table: copy the eight rows from spec §8 (unauthorized → stop at Phase 0; anti-bot/captcha → semi-auto + record; payment/third-party → mark unobservable + mock; session interrupt → resume from ledger; contracts only-2xx → mark error states inferred; SPA routing → click-sequence keys; copyrighted media → placeholder; screenshot diff → iteration list). Non-Goals: the six items from spec §9 (no asset mirror, no built-in browser, no rebuilding the chain, no cloning payment/third-party/secrets/server-only logic, never claims to copy backend source).

- [ ] **Step 8: Run the SKILL.md tests**

Run: `node --test tests/engineer-cloner.test.js`
Expected: the four SKILL.md tests (`frontmatter`, `all seven phases`, `three fidelity tiers`, `runtime artifacts and handoff`) now PASS. README tests + reference-file tests for the not-yet-written files still FAIL.

- [ ] **Step 9: Commit**

```bash
git add skills/engineer-cloner/SKILL.md
git commit -m "feat: add engineer-cloner SKILL.md (reverse site-clone front-end)"
```

---

## Task 4: observation-playbook.md

**Files:**
- Create: `skills/engineer-cloner/references/observation-playbook.md`

**Interfaces:**
- Consumes: `agent-browser` skill; `coverage-ledger.schema.json` feature shape.
- Produces: the Phase 2 methodology SKILL.md points to.

- [ ] **Step 1: Write the playbook**

Author `skills/engineer-cloner/references/observation-playbook.md`, bilingual headings, covering:
- `## 目标 / Purpose` — how Phase 2 uses `agent-browser` to log in with the highest-privilege account and systematically walk every view into the ledger.
- `## 登录与会话 / Login & Session` — invoke agent-browser to authenticate; if captcha/anti-bot, degrade to semi-automatic (ask user to complete login) and record it for the fidelity report.
- `## 遍历策略 / Traversal Strategy` — breadth-first over navigation, then per-view exhaust every entry: nav items, buttons, links, modal triggers, tabs, pagination, filters, detail pages, empty states, error states, multi-step forms. For SPAs, key features by click-sequence, not URL.
- `## loop-until-dry` — reproduce the pseudo-code from SKILL.md; `dry < 2` default; each round updates `loop_state` in the ledger.
- `## 覆盖 critic / Coverage Critic` — the end-of-round checklist of question prompts ("哪个导航项/弹窗/空态/错误态/分页/筛选/详情/多步表单没有打开？").
- `## 记录规范 / Recording Convention` — every discovered feature written to `.agents/clone.ledger.json` per the schema; screenshots + network captures into `.agents/clone.observations/`; `coverage_status` transitions discovered → explored → extracted.
- `## 恢复 / Resume` — on session restart, read the ledger, skip covered features, continue the loop.

- [ ] **Step 2: Run the reference-exists test**

Run: `node --test tests/engineer-cloner.test.js`
Expected: `reference files exist` moves closer (still fails until Tasks 5-6 land the remaining two files).

- [ ] **Step 3: Commit**

```bash
git add skills/engineer-cloner/references/observation-playbook.md
git commit -m "docs: add engineer-cloner observation playbook"
```

---

## Task 5: contract-extraction.md

**Files:**
- Create: `skills/engineer-cloner/references/contract-extraction.md`

**Interfaces:**
- Consumes: network captures from `.agents/clone.observations/`; ledger `api_calls`.
- Produces: the Phase 3 methodology; feeds CONTEXT.md's data dictionary + API contracts.

- [ ] **Step 1: Write the extraction guide**

Author `skills/engineer-cloner/references/contract-extraction.md`, bilingual, covering:
- `## 目标 / Purpose` — reconstruct API contracts and infer data models from captured client traffic; contracts are `可观测精确` only for states actually seen.
- `## API 契约重建 / API Contract Reconstruction` — for each observed request: method, path (parameterize IDs into `:id`), request body shape, response body shape, status codes seen, auth scheme (cookie/bearer/etc). Mark unseen error states as `推断 / Inferred`.
- `## 数据模型反推 / Data-Model Inference` — cluster response payloads into entities; infer fields, types, relationships, keys; align names into a domain glossary (reuse `engineer-architect` glossary format). Note that server-side constraints/validation are `推断`.
- `## 与 architect 的衔接 / Handoff to architect` — how these become CONTEXT.md's Core Data Dictionary + API Contracts sections (point to `engineer-architect/SKILL.md` templates).
- `## 诚实标注 / Honesty Tagging` — every reconstructed contract/model item carries a tier tag (`可观测精确 / 推断 / 不可观测`) that flows into `CLONE-FIDELITY.md`.

- [ ] **Step 2: Commit**

```bash
git add skills/engineer-cloner/references/contract-extraction.md
git commit -m "docs: add engineer-cloner contract-extraction guide"
```

---

## Task 6: fidelity-report-template.md

**Files:**
- Create: `skills/engineer-cloner/references/fidelity-report-template.md`

**Interfaces:**
- Consumes: outputs of Phases 2-4.
- Produces: the `CLONE-FIDELITY.md` template. Turns green: `fidelity template uses the three tiers` and completes `reference files exist`.

- [ ] **Step 1: Write the template**

Author `skills/engineer-cloner/references/fidelity-report-template.md` as a fill-in `CLONE-FIDELITY.md` template, bilingual, containing:
- Header block: target URL, observation date placeholder, account role, modes.
- `## 保真分级 / Fidelity Tiers` — define the three tiers verbatim: `可观测精确 / Observable-exact`, `推断 / Inferred`, `不可观测 / Unobservable`.
- `## 能力清单 / Capability Inventory` — a table `功能 / Feature | 分级 / Tier | 依据 / Evidence | 克隆处理 / Clone Handling`, with example rows for each tier (e.g. a UI flow = 可观测精确; a validation rule = 推断; a nightly job/third-party integration = 不可观测 → mock/placeholder).
- `## 不克隆边界 / Do-Not-Clone Boundary` — payment gateways, third-party SaaS, secrets, copyrighted media.
- `## 已知差距 / Known Gaps` — screenshot-diff items and unresolved inferences carried forward as iteration work.

- [ ] **Step 2: Run the fidelity + reference-files tests**

Run: `node --test tests/engineer-cloner.test.js`
Expected: `fidelity template uses the three tiers` and `reference files exist` now PASS. Only the README test remains failing.

- [ ] **Step 3: Commit**

```bash
git add skills/engineer-cloner/references/fidelity-report-template.md
git commit -m "docs: add engineer-cloner fidelity report template"
```

---

## Task 7: Register in both READMEs

**Files:**
- Modify: `README.md` (Engineering Skills list + "Pick the right entry skill" table)
- Modify: `README.zh-CN.md` (same two spots, Chinese)

**Interfaces:**
- Consumes: nothing.
- Produces: discoverability; turns green the final `both READMEs register engineer-cloner` test.

- [ ] **Step 1: Add the English bullet in `README.md`**

Under "### Engineering Skills", immediately after the `engineer-job` bullet, add:

```markdown
- `engineer-cloner` — **AI Reverse Site-Clone Front-End Engine**. Given an authorized target URL and a full-access account, reverse-observes the running site via `agent-browser` (login → loop-until-dry traversal → feature ledger → API/design extraction), then produces `REQUIREMENTS.md` / `CONTEXT.md` / `FRONTEND-DESIGN.md` plus an honest `CLONE-FIDELITY.md` (observable-exact / inferred / unobservable), and hands off to `engineer-job` for a full-lifecycle, high-precision clone. Does design-language reconstruction + modern-stack rebuild — never raw-asset copying or backend-source claims.
```

- [ ] **Step 2: Add the English table row in `README.md`**

In the "Pick the right entry skill" table, add a row after the `engineer-job` row:

```markdown
| Clone an existing running site you're authorized to rebuild | `engineer-cloner` | three docs → `engineer-job` |
```

- [ ] **Step 3: Add the Chinese bullet + row in `README.zh-CN.md`**

Mirror Steps 1-2 in Chinese, in the corresponding Engineering Skills list and entry-skill table. Bullet:

```markdown
- `engineer-cloner` — **AI 逆向站点克隆前置引擎**。给定授权的目标站点地址与完整权限账号，经 `agent-browser` 逆向观测线上站点（登录 → loop-until-dry 遍历 → 功能账本 → API/设计提取），产出 `REQUIREMENTS.md` / `CONTEXT.md` / `FRONTEND-DESIGN.md` 与诚实的 `CLONE-FIDELITY.md`（可观测精确 / 推断 / 不可观测），再交棒 `engineer-job` 完成全功能、全生命周期、高精度克隆。做设计语言重建 + 现代栈重建，不拷贝原始资产、不声称复制后端源码。
```

Row (match the Chinese table's column headers):

```markdown
| 克隆一个你有权重建的线上站点 | `engineer-cloner` | 三文档 → `engineer-job` |
```

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: ALL tests PASS, including every assertion in `tests/engineer-cloner.test.js` and the pre-existing suites.

- [ ] **Step 5: Commit**

```bash
git add README.md README.zh-CN.md
git commit -m "docs: register engineer-cloner in READMEs"
```

---

## Self-Review

**Spec coverage** (spec §→task):
- §1 positioning / routing → Task 3 Steps 1,3 (frontmatter ROUTING RULE, triggers).
- §2 four principles → Task 3 Step 2.
- §3 fidelity & stack decisions → Task 3 Step 2 (tiers), Task 5 (contract extraction stack-agnostic), Task 6 (tiers in report).
- §4 seven-phase pipeline → Task 3 Step 5; Phase 2 detail → Task 4; Phase 3 detail → Task 5.
- §5 artifacts & file layout → Task 2 (ledger schema), Task 3 Step 6, whole file structure.
- §6 modes → Task 3 Step 4 (incl. authorization-never-skipped).
- §7 triggering → Task 3 Steps 1,3.
- §8 edge cases → Task 3 Step 7.
- §9 non-goals → Task 3 Step 7.
- §10 deliverables → Tasks 2-7 (all five skill files + both READMEs) + Task 1 (test).

**Placeholder scan:** Small artifacts (schema, README lines, test) are fully inline. SKILL.md and the three prose references are specified section-by-section with concrete required elements and enforced by structural assertions; no vague "add content" steps remain.

**Type consistency:** ledger feature shape (`id`, `entry_path`, `name`, `roles_visible`, `ui_states`, `actions`, `forms`, `api_calls`, `screenshots`, `coverage_status`) is defined in Task 2's schema and referenced identically in Tasks 4-5 prose. Fidelity tier labels (`可观测精确 / 推断 / 不可观测`) are identical across Global Constraints, Task 3, Task 5, Task 6, and the Task 1 assertions. Phase names identical between Global Constraints, Task 3 Step 5, and Task 1's phase assertions. Artifact filenames identical across schema, SKILL.md, and Task 1 assertions.
