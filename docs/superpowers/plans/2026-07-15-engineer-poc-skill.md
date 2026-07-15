# engineer-poc — High-Fidelity POC Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `engineer-poc` skill that turns user requirements into a high-fidelity, full-function, pure-frontend evolutionary POC, wired as an optional Phase 3.5 in `engineer-job` that can be skipped, stopped-at, or continued from.

**Architecture:** `engineer-poc` is a standalone skill in the `engineer-*` family (philosophy + numbered principles + normal/auto/silent modes + phased pipeline + file-based state + honest fidelity labeling + handoff to `engineer-job`). It consumes `REQUIREMENTS.md` + `FRONTEND-DESIGN.md` (+ `CONTEXT.md`) and produces a runnable front-end skeleton with a swappable mock-adapter seam plus `POC-MANIFEST.md` / `POC-FIDELITY.md`. `engineer-job/run.wf.js` gains a `poc` phase between `frontend` and `develop`, gated by `skip_poc` (default `false`, auto-skips when no frontend) and `stop_at_poc`.

**Tech Stack:** Markdown skill files, JSON Schema, Workflow script JS (sandboxed — no `require`/`fs`/argless `new Date()`), Node's built-in test runner (`node --test tests/*.test.js`).

## Global Constraints

- Skill frontmatter MUST include `name`, `description`, and `compatibility` (guarded by `tests/engineer-job.test.js`). For `engineer-poc` use `compatibility: "agent, bash, write, edit, read"`.
- Every engineer-* skill MUST have a `## ⚙️ 模式选择` section mentioning `normal`, `auto`, `silent`.
- `run.wf.js` MUST NOT use `require('fs')` / `require("fs")` or argless `new Date()` (guarded by tests). File I/O is delegated to sub-agents.
- The three fidelity labels are EXACTLY: `真实交互` (Real), `mock 数据` (Mocked), `占位未实现` (Placeholder).
- Persistent artifact filenames are EXACTLY: `.agents/poc.ledger.json`, `POC-MANIFEST.md`, `POC-FIDELITY.md`.
- `skip_poc` default `false`; POC auto-skips when `skip_frontend` is true (no-frontend project). `stop_at_poc` default `false`.
- Run the full test suite with `npm test` (i.e. `node --test tests/*.test.js`).
- End every commit message with the repo's trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**New files:**
- `skills/engineer-poc/SKILL.md` — the skill definition (philosophy, principles, triggers, modes, pipeline, artifacts, integration, non-goals).
- `skills/engineer-poc/references/pipeline.md` — detailed six-phase actions + loop-until-dry + recovery.
- `skills/engineer-poc/references/poc-ledger.schema.json` — coverage ledger JSON Schema.
- `skills/engineer-poc/references/mock-layer-guide.md` — swappable mock-adapter seam conventions.
- `skills/engineer-poc/references/poc-manifest-template.md` — `POC-MANIFEST.md` + `POC-FIDELITY.md` templates.
- `skills/engineer-poc/references/industry-patterns.md` — industry/form pattern library.
- `tests/engineer-poc.test.js` — structural tests for the new skill.

**Modified files:**
- `skills/engineer-job/run.wf.js` — insert `poc` phase, `skip_poc`/`stop_at_poc`, meta phase entry, `job.state.json` `poc` segment, POC-aware Develop prompts, `stop_at_poc` gating.
- `skills/engineer-job/SKILL.md` — phase overview / flow / three-document system updated to include Phase 3.5 POC.
- `tests/engineer-job.test.js` — assertions for the POC phase in `run.wf.js`.
- `README.md` — skill list + decision table + file tree (3 spots).
- `README.zh-CN.md` — skill list + decision table + file tree (3 spots).

---

## Task 1: engineer-poc SKILL.md + test scaffold

**Files:**
- Create: `skills/engineer-poc/SKILL.md`
- Test: `tests/engineer-poc.test.js`

**Interfaces:**
- Produces: a skill named `engineer-poc` with frontmatter (`name`, `description`, `compatibility`), a `## ⚙️ 模式选择` section, a `## 🎯 核心理念` section with four numbered principles, a six-phase pipeline table, the three fidelity labels, artifact filenames, and a `## 🚫 非目标` section. Later tasks (5, 7) reference the skill name `engineer-poc` and artifacts `POC-MANIFEST.md` / `POC-FIDELITY.md`.

- [ ] **Step 1: Write the failing test**

Create `tests/engineer-poc.test.js`:

```javascript
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SKILL_FILE = path.join(__dirname, '..', 'skills', 'engineer-poc', 'SKILL.md');
const REF_DIR = path.join(__dirname, '..', 'skills', 'engineer-poc', 'references');

function read(p) { return fs.readFileSync(p, 'utf-8'); }

describe('engineer-poc skill', () => {
  it('SKILL.md exists', () => {
    assert.ok(fs.existsSync(SKILL_FILE), 'engineer-poc/SKILL.md should exist');
  });

  it('has valid frontmatter with name/description/compatibility', () => {
    const content = read(SKILL_FILE);
    const m = content.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(m, 'should have frontmatter');
    assert.ok(/name:\s*engineer-poc/.test(m[1]), 'name should be engineer-poc');
    assert.ok(/description:/.test(m[1]), 'should have description');
    assert.ok(/compatibility:/.test(m[1]), 'should have compatibility');
    assert.ok(/agent/.test(m[1]) || /bash/.test(m[1]), 'compatibility should include agent or bash');
  });

  it('has mode selection section with all three modes', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('## ⚙️ 模式选择'), 'should have mode section');
    assert.ok(content.includes('normal'), 'mentions normal');
    assert.ok(content.includes('auto'), 'mentions auto');
    assert.ok(content.includes('silent'), 'mentions silent');
  });

  it('has core philosophy with four principles', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('## 🎯 核心理念'), 'should have philosophy section');
    assert.ok(content.includes('原则一'), 'principle 1');
    assert.ok(content.includes('原则二'), 'principle 2');
    assert.ok(content.includes('原则三'), 'principle 3');
    assert.ok(content.includes('原则四'), 'principle 4');
  });

  it('documents the three fidelity labels', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('真实交互'), 'has 真实交互 label');
    assert.ok(content.includes('mock 数据'), 'has mock 数据 label');
    assert.ok(content.includes('占位未实现'), 'has 占位未实现 label');
  });

  it('names the persistent artifacts', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('poc.ledger.json'), 'mentions ledger');
    assert.ok(content.includes('POC-MANIFEST.md'), 'mentions manifest');
    assert.ok(content.includes('POC-FIDELITY.md'), 'mentions fidelity report');
  });

  it('has loop-until-dry coverage mechanism and non-goals', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('loop-until-dry'), 'mentions loop-until-dry');
    assert.ok(content.includes('## 🚫 非目标'), 'has non-goals section');
  });

  it('has TRIGGERS and handoff to engineer-job', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('TRIGGERS'), 'has TRIGGERS in frontmatter/body');
    assert.ok(content.includes('engineer-job'), 'mentions engineer-job handoff');
  });
});

describe('engineer-poc references', () => {
  const files = ['pipeline.md', 'poc-ledger.schema.json', 'mock-layer-guide.md', 'poc-manifest-template.md', 'industry-patterns.md'];
  for (const f of files) {
    it(`reference ${f} exists`, () => {
      assert.ok(fs.existsSync(path.join(REF_DIR, f)), `references/${f} should exist`);
    });
  }

  it('poc-ledger.schema.json is valid JSON with node schema fields', () => {
    const schema = JSON.parse(read(path.join(REF_DIR, 'poc-ledger.schema.json')));
    assert.ok(schema.properties, 'schema has properties');
    assert.ok(schema.properties.nodes, 'schema has nodes property');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/engineer-poc.test.js`
Expected: FAIL — `engineer-poc/SKILL.md should exist` (file not created yet).

- [ ] **Step 3: Write the SKILL.md**

Create `skills/engineer-poc/SKILL.md` with EXACTLY this content:

````markdown
---
name: engineer-poc
description: >
  【强触发 / Strong trigger】"做个高保真原型 / POC / 可点击 demo" + 已有需求或前端设计 + 纯前端演示 —— 把需求变成全功能、全状态、贴合行业风格的可运行纯前端演进式原型。
  ROUTING RULE: 位于 engineer-job 流程的需求分析(Phase 1)+前端设计(Phase 3)之后、正式实现(Phase 4)之前。工程可停在 POC、可跳过 POC、也可接着 POC 演进为完整功能。
  AI 高保真 POC 生成引擎 — 读取 REQUIREMENTS.md + FRONTEND-DESIGN.md（+ CONTEXT.md），
  产出真实前端工程骨架 + 可替换 mock 数据层 + POC-MANIFEST.md / POC-FIDELITY.md，
  再交棒 engineer-job Phase 4 把 mock 演进为真实实现。
  TRIGGERS: "做个原型""高保真原型""POC""样机""可点击 demo""交互原型""先出个能演示的前端"
  "prototype""high-fidelity prototype""clickable demo""interactive mockup"
  也触发于：engineer-job Phase 3 完成后（除非 skip_poc），或用户在需求/前端设计后说"先做 POC"。
compatibility: "agent, bash, write, edit, read"
---

# engineer-poc — AI 高保真 POC 生成引擎 / AI High-Fidelity POC Engine

> **来源声明**: 本 skill 的方法论来源于《基于实现规划的 AI 辅助编程实战》。更多内容请访问 [zhurongshuo.com]。
>
> **Source**: The methodology of this skill originates from "AI-Assisted Programming Practice Based on Implementation Planning". Visit [zhurongshuo.com] for more context.
>
> **参考架构**: 覆盖账本范式复用 `engineer-cloner` / `engineer-legacy-recon`；状态覆盖范式复用 `engineer-frontend-architect`；构建链交棒 `engineer-job`。

---

## 🎯 核心理念 / Core Philosophy

POC 的职责是：在写下第一个真实后端接口之前，让**整个产品先"像真的、像做完了"**——每个页面、每个状态、每条流程都能在 mock 数据上点得动、走得通、贴合行业风格——同时诚实标注数据层是 mock 且**为演进而设计**。

不是一次性抛弃式样机，而是一副**真实前端骨架，其 mock 层被刻意设计成可被真实 API 替换的单一接缝**。

**A POC makes the whole product feel real and complete before a single real endpoint exists — every screen, every state, every flow clickable on mock data, styled to industry conventions — while staying honest that the data layer is mocked and built to evolve.**

### 四条核心原则

#### 原则一：全功能靠账本，不靠记忆 / Coverage via Ledger, Not Memory

"全功能覆盖"不能靠对话记忆——长会话必然遗漏页面、状态、边角交互。覆盖靠一份持久化账本：

- `.agents/poc.ledger.json` —— 由 `REQUIREMENTS.md` + `FRONTEND-DESIGN.md` 驱动，记录每个页面/组件/状态/流程及其覆盖状态与保真度层级（schema 见 `references/poc-ledger.schema.json`）。
- **loop-until-dry** —— 反复实现，直到账本不再新增未覆盖节点。
- **coverage critic** —— 每轮复查账本，追问"还有哪些页面/状态/流程/角色视图没覆盖"。

**Coverage is a file, not a memory.**

#### 原则二：全生命周期即全状态 / Full Lifecycle Means Every State

**Happy path 不是唯一路径。** 每个页面必须覆盖：

- **loading**: 首次加载、刷新、部分加载
- **empty**: 无数据、清零、搜索无结果
- **error**: 网络错误、权限不足、服务端异常
- **normal**: 数据正常展示
- **edge**: 分页结尾、最大长度、频控

外加完整 mock CRUD 生命周期、跨页流程、mock 登录/角色切换。只画 happy path 不算 POC。

#### 原则三：行业保真优于通用模板 / Industry Fidelity Over Generic Templates

POC 要像"这个行业里的真实产品"，不是通用模板。

- 先从 `REQUIREMENTS.md` **识别行业/形态**，套用 `references/industry-patterns.md` 的典型信息架构、组件、交互范式与最佳实践。
- 设计 Token（色彩/排版/间距）取自 `FRONTEND-DESIGN.md`，不手写魔法值。
- 必要时用 WebSearch 对特定行业惯例做增强（可选、联网）。

#### 原则四：Mock 层可演进，诚实标注 / Evolvable Mock Layer, Honest Labeling

全部数据走一个可替换的 mock adapter（**单一接缝**，见 `references/mock-layer-guide.md`），使 engineer-job Phase 4 只需替换这一层即可接真实 API。每条资产落入三个保真度层级之一：

| 层级 / Tier | 标签 | 含义 |
|:--|:--|:--|
| 真实交互 / Real | `真实交互` | 前端逻辑完整、状态齐全、可点可走，仅数据来自 mock。 |
| mock 数据 / Mocked | `mock 数据` | 数据来自 mock adapter，契约按 CONTEXT.md 或推断，可演进为真实 API。 |
| 占位未实现 / Placeholder | `占位未实现` | 支付网关 / 第三方 SaaS / 纯服务端算法 → 占位，留待正式实现阶段接入。 |

**Honesty about the tier is part of the deliverable.**

---

## 🚦 触发条件 / When to Trigger

**必须触发**：

- "做个原型""高保真原型""POC""样机""可点击 demo""交互原型""先出个能演示的前端"
- "prototype""high-fidelity prototype""clickable demo""interactive mockup"
- 用户已有需求或前端设计，想先出一个能演示、能点通的纯前端产品

**链式触发**：

- engineer-job Phase 3（frontend）完成后自动进入 Phase 3.5（除非 `skip_poc`）
- 用户在需求/前端设计完成后说"先出个原型""先做 POC"

**不触发**：

- 纯后端 / CLI / 库项目（无前端）→ 自动跳过
- 用户明确要求直接进入正式实现（`skip_poc`）

**优先级**：

1. 用户表达"要一个可演示的高保真前端原型" → 优先触发 engineer-poc。
2. engineer-poc 完成后可停在交棒点（`stop_at_poc`），或交棒 engineer-job Phase 4 演进。

---

## ⚙️ 模式选择 / Mode Selection

通过 `--mode` 参数控制自动确认程度（默认 normal）：

| 模式 | 行为 |
|:----:|------|
| normal | 每阶段展示产出后等待确认；行业范式与设计 Token 需用户验证。 |
| auto | 用默认策略自动推进遍历与实现，仅在重大异常时暂停。 |
| silent | 全自动，仅记录日志，末尾输出交棒摘要。 |

---

## 🏗️ 六阶段流水线 / Pipeline

| 阶段 | 名称 | 输入 → 输出 | 关键动作 | 失败处理 |
|:--:|:--|:--|:--|:--|
| 0 | 输入校验与行业识别 | 三文档 → POC 范围 + 行业匹配 | 读 REQUIREMENTS / FRONTEND-DESIGN（/CONTEXT）；缺则降级（从用户需求生成最小集）；识别行业匹配 `industry-patterns`；划定 do-not-fake 边界（支付/第三方→占位）。 | 三文档全缺 → 降级：从用户 prompt 生成最小需求+页面清单 |
| 1 | POC 脚手架 | 范围 → 演进式前端工程 | 按 FRONTEND-DESIGN 技术栈（默认 Vite + React/Vue）搭骨架，接入设计 Token、路由、**mock adapter 接缝**。 | 技术栈缺失 → 用默认栈，记录 |
| 2 | 覆盖账本构建 | FRONTEND-DESIGN → `poc.ledger.json` | 把每个页面/组件/状态/流程枚举进账本（coverage_status=planned）。 | — |
| 3 | 逐页高保真实现（loop-until-dry） | 账本 → 高保真页面 | 逐页实现全 UI 状态 + mock 数据 + 交互，套用行业范式；账本跑干；coverage critic 复查遗漏。 | 单页失败 → 降级为占位页，标 `占位未实现` |
| 4 | 全生命周期贯通 | 页面 → 可点通的产品 | 打通跨页流程、mock 登录/角色、内存持久化、灌真实感 seed 数据；run gate（build + 启动）。 | build 失败 → 强制修复循环；修不动标 DOES_NOT_RUN |
| 5 | 产物合成与交棒 | 全部 → POC 文档 + 归宿 | 写 `POC-MANIFEST.md` + `POC-FIDELITY.md` + 报告；然后 stop（stop_at_poc）或交棒 engineer-job Phase 4。 | — |

详细阶段动作、loop-until-dry 伪码与恢复流程见 `references/pipeline.md`。

---

## 📁 产物与文件结构 / Artifacts

| 产物 | 用途 |
|:--|:--|
| 可运行的纯前端 POC 工程（仓库内） | 演进式骨架，engineer-job Phase 4 在其上继续 |
| `.agents/poc.ledger.json` | 覆盖账本——所有页面/组件/状态/流程 + 保真度层级 + 覆盖状态；loop-until-dry 与恢复的唯一真相源（schema 见 `references/poc-ledger.schema.json`） |
| `src/mocks/`（或框架约定位置） | mock adapter + seed 数据——**可替换接缝**（演进为真实 API 时只改这一层，规范见 `references/mock-layer-guide.md`） |
| `POC-MANIFEST.md` | 已建清单：页面/组件/路由/mock 端点 + **mock→真实演进映射**（engineer-job Phase 4 消费，做演进而非重建） |
| `POC-FIDELITY.md` | 逐资产诚实标注 `真实交互 / mock 数据 / 占位未实现`，供正式实现阶段对照 |

模板见 `references/poc-manifest-template.md`。

---

## 🤝 交棒 / Handoff

Phase 5 产出 POC 工程 + 两份文档后：

- **停留**（`stop_at_poc`）：输出交棒摘要，停在 POC。
- **继续**：交棒 `engineer-job`。orchestrate（Phase 4）读取 `POC-MANIFEST.md`，把 mock 层**演进**为真实实现，而非重建页面。

```javascript
Workflow({
  script: "skills/engineer-job/run.wf.js",
  args: { requirements: "见 REQUIREMENTS.md", mode: "auto", projectName: "<name>", skip_poc: false, stop_at_poc: false }
})
```

---

## ⚠️ 边界情况 / Edge Cases

| 场景 | 处理方式 |
|------|---------|
| **REQUIREMENTS.md / FRONTEND-DESIGN.md 缺失** | 降级：从用户 prompt 生成最小需求 + 页面清单，再继续；在 POC-FIDELITY.md 标注降级 |
| **无前端项目** | 自动跳过 POC（`skip_frontend` → 不生成） |
| **支付 / 第三方 SaaS 页面** | 标 `占位未实现`，用占位/mock 实现，绝不接真实支付/第三方 |
| **纯服务端算法（排序/风控/推荐）** | 前端用合理 mock 结果驱动，标 `mock 数据` 或 `占位未实现`，诚实说明 |
| **会话中断** | 从 `.agents/poc.ledger.json` 恢复：跳过 coverage_status=="implemented" 的节点，从 "planned" 继续 |
| **build/启动失败** | Phase 4 强制修复循环；修不动标 DOES_NOT_RUN，报告头条如实反映 |

---

## 🚫 非目标 / Non-Goals

1. **不做后端** —— 无真实数据库、无真实 API，全走 mock 层。
2. **不做真实鉴权/支付** —— mock 登录/角色仅用于演示；支付/第三方标 `占位未实现`。
3. **非抛弃式** —— 演进式骨架，可被 engineer-job Phase 4 继续，不是一次性 mockup。
4. **不重造构建链** —— 脚手架之外的正式实现（架构编排/里程碑/验收/部署）交回 engineer-job。
5. **不臆造不可观测的服务端逻辑** —— 纯服务端算法用占位/合理 mock，诚实标注。
````

- [ ] **Step 4: Run test to verify SKILL.md assertions pass**

Run: `node --test tests/engineer-poc.test.js`
Expected: The `engineer-poc skill` describe block PASSES; the `engineer-poc references` block still FAILS (reference files not created yet). This is expected — references land in Tasks 2-4.

- [ ] **Step 5: Commit**

```bash
git add skills/engineer-poc/SKILL.md tests/engineer-poc.test.js
git commit -m "feat: add engineer-poc SKILL.md and structural tests

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: poc-ledger.schema.json + pipeline.md

**Files:**
- Create: `skills/engineer-poc/references/poc-ledger.schema.json`
- Create: `skills/engineer-poc/references/pipeline.md`
- Test: `tests/engineer-poc.test.js` (already asserts these exist + schema validity from Task 1)

**Interfaces:**
- Produces: a JSON Schema with a top-level `properties.nodes` array; `pipeline.md` documenting the loop-until-dry pseudocode and recovery. Consumed conceptually by the SKILL.md (Task 1) references.

- [ ] **Step 1: Write the coverage ledger schema**

Create `skills/engineer-poc/references/poc-ledger.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "POC Coverage Ledger",
  "description": "Single source of truth for POC full-function coverage — every page/component/state/flow node with its fidelity tier and coverage status. Drives loop-until-dry and cross-session recovery.",
  "type": "object",
  "required": ["meta", "nodes"],
  "properties": {
    "meta": {
      "type": "object",
      "required": ["project", "industry", "mode"],
      "properties": {
        "project": { "type": "string" },
        "industry": { "type": "string", "description": "Matched industry archetype from industry-patterns.md" },
        "mode": { "type": "string", "enum": ["normal", "auto", "silent"] },
        "tech_stack": { "type": "string" },
        "do_not_fake": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Boundaries that must be 占位未实现 (payment/third-party/pure-server)"
        }
      }
    },
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "kind", "coverage_status", "fidelity"],
        "properties": {
          "id": { "type": "string", "description": "Route path or click-sequence key or component name" },
          "kind": { "type": "string", "enum": ["page", "component", "state", "flow", "role_view"] },
          "title": { "type": "string" },
          "parent": { "type": "string", "description": "Parent node id, if any" },
          "coverage_status": { "type": "string", "enum": ["planned", "implemented", "placeholder", "skipped"] },
          "fidelity": { "type": "string", "enum": ["真实交互", "mock 数据", "占位未实现"] },
          "ui_states": {
            "type": "array",
            "items": { "type": "string", "enum": ["loading", "empty", "error", "normal", "edge"] },
            "description": "UI states covered for this page/component"
          },
          "mock_endpoints": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Mock adapter endpoints this node consumes (for the evolution map)"
          },
          "notes": { "type": "string" }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Write pipeline.md**

Create `skills/engineer-poc/references/pipeline.md`:

````markdown
# engineer-poc — 六阶段详细流水线 / Detailed Pipeline

本文件是 `SKILL.md` 流水线表的展开，供执行阶段逐步照做。

## 阶段间数据流 / Data Flow

```
Phase 0  scope        REQUIREMENTS.md + FRONTEND-DESIGN.md(+CONTEXT.md) → POC 范围 + 行业匹配 + do-not-fake
   │
   ▼
Phase 1  scaffold     演进式前端工程（设计 Token + 路由 + mock adapter 接缝）
   │
   ▼
Phase 2  ledger       .agents/poc.ledger.json（每个 page/component/state/flow → coverage_status=planned）
   │
   ▼
Phase 3  implement    逐页高保真实现（全 UI 状态 + mock 数据 + 交互）— loop-until-dry
   │
   ▼
Phase 4  wire         跨页流程 + mock 登录/角色 + 内存持久化 + seed 数据 + run gate
   │
   ▼
Phase 5  synth        POC-MANIFEST.md + POC-FIDELITY.md + 报告 → stop 或交棒 engineer-job
```

## 阶段 0：输入校验与行业识别

1. 读 `REQUIREMENTS.md`、`FRONTEND-DESIGN.md`；有则读 `CONTEXT.md`（取数据模型/契约）。
2. 三文档全缺 → 降级：从用户 prompt 生成最小需求 + 页面清单，并在 `POC-FIDELITY.md` 标注"输入降级"。
3. 从需求识别行业/形态，匹配 `industry-patterns.md` 的一个或多个原型。
4. 划定 do-not-fake 边界（支付网关、第三方 SaaS、纯服务端算法），写入 ledger `meta.do_not_fake`。

## 阶段 1：POC 脚手架

1. 技术栈：优先取 `FRONTEND-DESIGN.md`；缺失则默认 Vite + React（或 Vue，按需求）。
2. 接入设计 Token（来自 `FRONTEND-DESIGN.md` 或 `frontend-spec.json`）为 CSS 变量/主题。
3. 建立路由骨架（按页面树）。
4. 建立 mock adapter 接缝（`src/mocks/`），规范见 `mock-layer-guide.md`。

## 阶段 2：覆盖账本构建

1. 从 `FRONTEND-DESIGN.md` 页面树/组件树/UI 状态机枚举节点，写入 `.agents/poc.ledger.json`（schema 见 `poc-ledger.schema.json`），coverage_status=planned。
2. 每个 page 节点记录应覆盖的 `ui_states`（loading/empty/error/normal/edge）。

## 阶段 3：逐页高保真实现（loop-until-dry 核心）

```
frontier ← 账本中 coverage_status == "planned" 的 page/component 节点
repeat:
    new_nodes ← 0
    for each node in frontier:
        实现该节点全部 ui_states + mock 数据 + 交互（套用行业范式）
        发现的子视图 / 弹窗 / 状态分支 / 流程 若未在账本:
            加入账本(coverage_status="planned"); new_nodes++
        node.coverage_status ← "implemented"; 标 fidelity 层级
    # coverage critic 复查
    critic 追问：还有哪些页面 / 状态 / 流程 / 角色视图没覆盖？
    critic 发现的遗漏写入账本(planned); new_nodes += critic 新增
    frontier ← 账本中仍为 "planned" 的节点
until new_nodes == 0 且 frontier 为空
assert 每个 node 都 implemented/placeholder/skipped 且带 fidelity
```

单页实现失败 → 降级为占位页，coverage_status="placeholder"，fidelity="占位未实现"。

## 阶段 4：全生命周期贯通

1. 打通跨页流程（列表→详情→编辑→保存→回列表）。
2. mock 登录/角色切换（内存 session；不同角色看到不同视图/权限）。
3. 内存持久化（增删改在会话内可见）+ 真实感 seed 数据。
4. run gate：构建 + 启动开发服务器必须通过；失败进入修复循环，修不动标 DOES_NOT_RUN。

## 阶段 5：产物合成与交棒

1. 写 `POC-MANIFEST.md`（页面/组件/路由/mock 端点 + mock→真实演进映射）。
2. 写 `POC-FIDELITY.md`（逐资产 `真实交互 / mock 数据 / 占位未实现`）。
3. `stop_at_poc` → 输出交棒摘要并停止；否则交棒 engineer-job Phase 4 演进。

## 恢复 / Recovery

会话中断后从 `.agents/poc.ledger.json` 恢复：
- 跳过 coverage_status == "implemented" / "placeholder" 的节点。
- 从 "planned" 节点继续 loop-until-dry。
- ledger 不存在 → 从阶段 0 重新开始。
````

- [ ] **Step 3: Run tests to verify the reference + schema assertions pass**

Run: `node --test tests/engineer-poc.test.js`
Expected: `reference pipeline.md exists`, `reference poc-ledger.schema.json exists`, and `poc-ledger.schema.json is valid JSON with node schema fields` now PASS. Other reference files (mock-layer-guide, poc-manifest-template, industry-patterns) still FAIL until Tasks 3-4.

- [ ] **Step 4: Commit**

```bash
git add skills/engineer-poc/references/poc-ledger.schema.json skills/engineer-poc/references/pipeline.md
git commit -m "feat: add engineer-poc coverage ledger schema and detailed pipeline

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: mock-layer-guide.md + poc-manifest-template.md

**Files:**
- Create: `skills/engineer-poc/references/mock-layer-guide.md`
- Create: `skills/engineer-poc/references/poc-manifest-template.md`
- Test: `tests/engineer-poc.test.js` (existence asserted from Task 1)

**Interfaces:**
- Produces: the swappable mock-adapter seam convention and the two output-doc templates carrying the three fidelity labels and the mock→real evolution map.

- [ ] **Step 1: Write mock-layer-guide.md**

Create `skills/engineer-poc/references/mock-layer-guide.md`:

````markdown
# engineer-poc — Mock 层接缝规范 / Mock Layer Seam Guide

目标：让 POC 的数据层成为**单一可替换接缝**，使 engineer-job Phase 4 只替换这一层即可接真实 API，页面与组件零改动。

## 单一接缝原则 / Single Seam

- 所有数据访问必须经过一个 adapter 模块（如 `src/mocks/adapter.*`），页面/组件**只**调用 adapter 暴露的方法，绝不直接内联假数据。
- adapter 方法签名对齐 `CONTEXT.md` 的 API 契约（路径、入参、返回形状、错误体）。契约缺失时按推断实现并在 `POC-FIDELITY.md` 标 `mock 数据`。

## 目录约定 / Layout

```
src/mocks/
├── adapter.(ts|js)     # 唯一对外接口：list/get/create/update/remove + auth
├── seed.(ts|js)        # 真实感 seed 数据
├── db.(ts|js)          # 内存存储（会话内持久化）
└── latency.(ts|js)     # 模拟网络延迟 / 随机错误（驱动 loading/error 状态）
```

## 契约对齐 / Contract Alignment

adapter 每个方法对应一个未来真实端点。示例：

```
// mock
adapter.listStudents({ page, keyword }) -> { items, total }   // 对应 GET /api/students
// 演进后（Phase 4）
fetch('/api/students?...') -> { items, total }                // 形状不变，接缝替换
```

## 驱动全状态 / Driving All UI States

- `latency` 制造可控延迟 → 页面能展示 **loading**。
- adapter 支持"强制空/错误"开关（如 query flag 或 seed 变体）→ 页面能展示 **empty / error**。
- 分页到末尾 → 页面能展示 **edge**。

## 演进映射 / Evolution Map

`POC-MANIFEST.md` 必须为每个 adapter 方法登记 `mock → 真实端点` 映射，供 Phase 4 逐个替换。

## do-not-fake

支付网关、第三方 SaaS、纯服务端算法 → adapter 返回占位结果，页面标 `占位未实现`，绝不接真实外部服务。
````

- [ ] **Step 2: Write poc-manifest-template.md**

Create `skills/engineer-poc/references/poc-manifest-template.md`:

````markdown
# engineer-poc — 产物模板 / Output Templates

两份产物：`POC-MANIFEST.md`（给 engineer-job Phase 4 消费）与 `POC-FIDELITY.md`（诚实保真度报告）。

---

## POC-MANIFEST.md 模板

```markdown
# POC Manifest — <项目名>

> 演进式 POC 清单。engineer-job Phase 4 据此把 mock 层演进为真实实现，而非重建页面。

## 技术栈 / Tech Stack
- 框架: <framework> ｜ 构建: <bundler> ｜ 状态: <state lib>

## 页面 / Pages
| 路由 | 页面 | 覆盖状态 | UI 状态 | 保真度 |
|:--|:--|:--|:--|:--|
| /students | 学员列表 | implemented | loading/empty/error/normal/edge | 真实交互 |

## 组件 / Components
| 组件 | 所属页面 | 保真度 |
|:--|:--|:--|

## Mock → 真实端点演进映射 / Evolution Map
| adapter 方法 | mock 行为 | 未来真实端点 | 契约来源 |
|:--|:--|:--|:--|
| listStudents | 内存分页 | GET /api/students | CONTEXT.md §API |

## 占位清单 / Placeholders（正式实现阶段接入）
| 资产 | 原因 | 处理 |
|:--|:--|:--|
| 支付页 | 第三方网关 | 占位未实现 |
```

---

## POC-FIDELITY.md 模板

```markdown
# POC Fidelity Report — <项目名>

逐资产诚实标注。三层级：`真实交互` / `mock 数据` / `占位未实现`。

## 汇总 / Summary
- 真实交互: N ｜ mock 数据: M ｜ 占位未实现: K
- 输入降级: <是/否，若是说明缺哪些文档>

## 逐资产 / Per-Asset
| 资产 | 类型 | 保真度 | 说明 |
|:--|:--|:--|:--|
| 学员列表 | page | 真实交互 | 全状态可点，数据来自 mock adapter |
| 排序算法 | logic | mock 数据 | 前端按 mock 结果展示，真实排序在服务端 |
| 支付流程 | flow | 占位未实现 | 第三方网关，留待正式实现 |
```
````

- [ ] **Step 3: Run tests**

Run: `node --test tests/engineer-poc.test.js`
Expected: `reference mock-layer-guide.md exists` and `reference poc-manifest-template.md exists` now PASS. Only `industry-patterns.md` existence still FAILS.

- [ ] **Step 4: Commit**

```bash
git add skills/engineer-poc/references/mock-layer-guide.md skills/engineer-poc/references/poc-manifest-template.md
git commit -m "feat: add engineer-poc mock-layer seam guide and output templates

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: industry-patterns.md

**Files:**
- Create: `skills/engineer-poc/references/industry-patterns.md`
- Test: `tests/engineer-poc.test.js` (existence asserted from Task 1)

**Interfaces:**
- Produces: the built-in industry/form pattern library that Principle 3 (行业保真) draws on.

- [ ] **Step 1: Write industry-patterns.md**

Create `skills/engineer-poc/references/industry-patterns.md`:

````markdown
# engineer-poc — 行业/形态模式库 / Industry & Archetype Pattern Library

阶段 0 识别行业后套用；一个项目可命中多个原型。每个原型给出典型信息架构、关键页面/组件、交互范式、最佳实践/避坑。必要时用 WebSearch 对具体行业增强。

## 如何使用 / How to Use
1. 从 `REQUIREMENTS.md` 的角色、功能、领域词判断最接近的原型。
2. 采用该原型的信息架构与组件清单作为账本起点，再叠加项目特有页面。
3. 交互范式与最佳实践作为 loop-until-dry 实现时的行业校验清单。

---

## 1. 后台管理 / Admin & Back-Office
- **信息架构**: 左侧导航 + 顶栏 + 内容区；模块化 CRUD。
- **关键页面/组件**: 数据表格（筛选/排序/分页/批量）、详情抽屉、表单弹窗、RBAC 角色切换、审计日志。
- **交互范式**: 列表→详情→编辑就地保存；批量操作确认；空/错/加载态标准化。
- **最佳实践**: 表格必带 loading/empty/error；危险操作二次确认；保留筛选状态到 URL。

## 2. SaaS 应用 / SaaS Product
- **信息架构**: 工作区切换 + 引导(onboarding) + 设置中心 + 计费。
- **关键页面/组件**: onboarding 向导、workspace 仪表盘、成员/权限、订阅与账单、通知中心。
- **交互范式**: 首次进入引导流；空状态引导创建；按套餐门控功能（feature gating）。
- **最佳实践**: 空态即引导；计费页标 `占位未实现`（第三方支付）；多租户数据隔离在 mock 层体现。

## 3. 电商 / E-Commerce
- **信息架构**: 商品目录 + 商品详情(PDP) + 购物车 + 结算 + 订单。
- **关键页面/组件**: 商品卡/列表、筛选侧栏、PDP（图廊/规格/加购）、购物车、结算表单、订单状态机。
- **交互范式**: 加购乐观更新；库存/价格边界；结算多步表单。
- **最佳实践**: 支付网关标 `占位未实现`；库存为空/售罄 edge 态；订单状态机完整（待付/已付/发货/完成/退款）。

## 4. 金融 / Fintech
- **信息架构**: 账户总览 + 交易流水 + 转账/支付 + 合规(KYC)。
- **关键页面/组件**: 资产卡、交易表格、图表（趋势/占比）、KYC 多步表单、风控提示。
- **交互范式**: 金额精度与本地化；敏感操作二次验证（mock）；图表联动筛选。
- **最佳实践**: 风控/清算算法标 `mock 数据` 或 `占位未实现`；金额千分位与币种；错误态明确（余额不足/超限）。

## 5. 医疗 / Healthcare
- **信息架构**: 患者列表 + 病历详情 + 预约排班 + 表单采集。
- **关键页面/组件**: 患者档案、时间线病历、预约日历、结构化表单、隐私提示。
- **交互范式**: 隐私脱敏展示；长表单分段保存；日历排班拖拽。
- **最佳实践**: 隐私数据用假名 seed；权限视图区分（医生/护士/管理员）；预约冲突 edge 态。

## 6. 数据大屏 / Data Visualization & Monitoring
- **信息架构**: 全屏栅格 + 多图表卡 + 实时刷新 + 筛选。
- **关键页面/组件**: KPI 卡、折线/柱/饼、地图、实时列表、时间范围选择。
- **交互范式**: 定时/推送刷新（mock 定时器）；筛选联动全屏；下钻。
- **最佳实践**: 用 mock 定时器驱动"实时"；无数据/断连 error 态；深色主题为主。

## 7. 内容 / 社区 / Content & Community
- **信息架构**: 信息流 + 详情 + 创作编辑器 + 个人主页。
- **关键页面/组件**: Feed 卡、富文本/Markdown 编辑器、评论、关注/点赞、通知。
- **交互范式**: 无限滚动（分页 edge）；乐观点赞；草稿本地保存。
- **最佳实践**: 空 Feed 引导；发布流全状态；审核/推荐算法标 `mock 数据`。

## 8. 生产力工具 / Productivity Tools
- **信息架构**: 文档/项目列表 + 编辑画布 + 快捷操作。
- **关键页面/组件**: 文件树、编辑器/画布、命令面板、协作光标（mock）。
- **交互范式**: 键盘快捷键；自动保存（mock）；拖拽排序。
- **最佳实践**: 自动保存用内存持久化体现；协作/同步标 `占位未实现`；空文档引导。
````

- [ ] **Step 2: Run the full engineer-poc test file**

Run: `node --test tests/engineer-poc.test.js`
Expected: ALL tests in both describe blocks PASS.

- [ ] **Step 3: Commit**

```bash
git add skills/engineer-poc/references/industry-patterns.md
git commit -m "feat: add engineer-poc industry pattern library

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: engineer-job run.wf.js — insert POC phase + switches

**Files:**
- Modify: `skills/engineer-job/run.wf.js`
- Modify: `tests/engineer-job.test.js`

**Interfaces:**
- Consumes: existing `run.wf.js` APIs (`agent`, `phase`, `log`, `ctx`, `PHASE_RESULT`, `phasesDone`, `isDone`, `skip_frontend`, `MODE`, `REQUIREMENTS`, `PROJECT_NAME`).
- Produces: `args.skip_poc` (default `false`), `args.stop_at_poc` (default `false`), a `'POC'` meta phase, a `poc` segment in the Phase 0 `job.state.json` template, and `stop_at_poc` gating on Develop/Run Gate/Integrate/Deploy.

- [ ] **Step 1: Write the failing test assertions**

In `tests/engineer-job.test.js`, inside the `describe('engineer-job run.wf.js workflow script', ...)` block, add this new test after the existing `it('contains the meta export block with 6 phases', ...)` test:

```javascript
    it('has a POC phase with skip/stop switches wired to engineer-poc', () => {
      const content = fs.readFileSync(wfFile, 'utf-8');
      assert.ok(content.includes("'POC'"), 'meta should include the POC phase');
      assert.ok(content.includes('skip_poc'), 'should support args.skip_poc');
      assert.ok(content.includes('stop_at_poc'), 'should support args.stop_at_poc');
      assert.ok(content.includes('engineer-poc'), 'should dispatch the engineer-poc agent');
      assert.ok(content.includes('POC-MANIFEST.md'), 'orchestrate should be POC-aware via POC-MANIFEST.md');
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/engineer-job.test.js`
Expected: FAIL on `has a POC phase with skip/stop switches wired to engineer-poc` — `meta should include the POC phase`.

- [ ] **Step 3: Add the POC meta phase entry**

In `skills/engineer-job/run.wf.js`, in the `meta.phases` array, insert a new entry between the `Frontend` and `Develop` entries:

```javascript
    { title: 'Frontend', detail: 'engineer-frontend-architect frontend design' },
    { title: 'POC', detail: 'engineer-poc high-fidelity clickable prototype (skippable via skip_poc / stoppable via stop_at_poc)' },
    { title: 'Develop', detail: 'deterministic milestone loop (workflow + inspector per milestone)' },
```

- [ ] **Step 4: Add skip_poc / stop_at_poc constants**

In `run.wf.js`, right after the line `const isSimpleProject = skip_requirements || skip_frontend`, add:

```javascript
// ── POC gating (Phase 3.5) ───────────────────────────────
// POC runs by default when the project has a frontend; skip_poc opts out,
// stop_at_poc halts the pipeline after POC (no orchestrate/run-gate/integrate/deploy).
const skip_poc = args.skip_poc != null ? !!args.skip_poc : false
const stop_at_poc = !!args.stop_at_poc
```

- [ ] **Step 5: Add the `poc` segment to the Phase 0 job.state.json template**

In `run.wf.js`, inside the Phase 0 agent prompt's `Step 3 — Write .agents/job.state.json` JSON, change the `phases` object to include a `poc` key between `frontend` and `development`:

Find:
```
  "phases": { "init": { "status": "DONE" }, "requirements": { "status": "TODO" }, "architect": { "status": "TODO" }, "frontend": { "status": "TODO" }, "development": { "status": "TODO" }, "finalize": { "status": "TODO" }, "deploy": { "status": "TODO" }, "report": { "status": "TODO" } },
```
Replace with:
```
  "phases": { "init": { "status": "DONE" }, "requirements": { "status": "TODO" }, "architect": { "status": "TODO" }, "frontend": { "status": "TODO" }, "poc": { "status": "TODO" }, "development": { "status": "TODO" }, "finalize": { "status": "TODO" }, "deploy": { "status": "TODO" }, "report": { "status": "TODO" } },
```

- [ ] **Step 6: Insert the Phase 3.5 POC block**

In `run.wf.js`, immediately AFTER the Phase 3 (Frontend) block's closing (the `} else { log('Phase 3 skipped ...') }` and its closing brace, i.e. right before the `// ═══...  Phase 4 — engineer-orchestrator` comment banner), insert:

```javascript
// ═══════════════════════════════════════════════════════════
//  Phase 3.5 — engineer-poc: 高保真 POC（可跳过 / 可停留 / 可继续）
//  Input:  REQUIREMENTS.md + FRONTEND-DESIGN.md (+ CONTEXT.md) on disk
//  Output: 可运行前端 POC + .agents/poc.ledger.json + POC-MANIFEST.md + POC-FIDELITY.md
//  Gate:   runs only when project has a frontend and skip_poc is false.
// ═══════════════════════════════════════════════════════════

phase('POC')
const runPoc = !skip_frontend && !skip_poc
if (runPoc && !isDone('poc')) {
  log('Phase 3.5: engineer-poc — high-fidelity clickable prototype')

  let result = await agent(
    ctx('engineer-poc', `=== HIGH-FIDELITY POC GENERATION ===

Read "REQUIREMENTS.md" and "FRONTEND-DESIGN.md" from disk (and "CONTEXT.md" if present for data models/contracts).

Build a runnable, PURE-FRONTEND, EVOLUTIONARY POC:
1. Identify the industry from REQUIREMENTS.md; apply skills/engineer-poc/references/industry-patterns.md conventions.
2. Scaffold the frontend using FRONTEND-DESIGN.md tech stack (default Vite + React if unspecified); wire design tokens, routing, and a swappable mock-adapter seam (src/mocks/, per mock-layer-guide.md).
3. Build a coverage ledger ".agents/poc.ledger.json" enumerating every page/component/state/flow (coverage_status=planned).
4. Implement every page with ALL UI states (loading/empty/error/normal/edge) + mock data + interactions; loop-until-dry with a coverage critic until the ledger is dry.
5. Wire cross-page flows, mock auth/roles, in-memory persistence, realistic seed data. Build + dev-server start MUST pass.
6. Write "POC-MANIFEST.md" (pages/components/routes/mock-endpoints + mock→real evolution map) and "POC-FIDELITY.md" (per-asset 真实交互 / mock 数据 / 占位未实现).
Label payment / third-party / pure-server logic as 占位未实现 — never fake real external services.

Update ".agents/job.state.json" poc phase to DONE. Append to ".agents/job.progress.md".
Return structured result.`),
    { schema: PHASE_RESULT, label: 'engineer-poc', phase: 'POC' }
  )

  if (result?.status === 'BLOCKED') {
    log('Phase 3.5 failed, retrying once...')
    result = await agent(
      `Retry: engineer-poc. Generate at minimum a runnable frontend POC covering the main pages with mock data, plus POC-MANIFEST.md and POC-FIDELITY.md.`,
      { schema: PHASE_RESULT, label: 'poc-retry', phase: 'POC' }
    )
  }

  if (!result || result.status === 'BLOCKED') {
    await agent(
      `Generate a minimal clickable POC of the core pages with mock data + POC-MANIFEST.md + POC-FIDELITY.md. Mark as degraded.`,
      { schema: PHASE_RESULT, label: 'poc-degrade', phase: 'POC' }
    )
    log('Phase 3.5 degraded: minimal POC generated')
  } else {
    log('Phase 3.5 complete: POC generated')
  }

  phasesDone.add('poc')

  if (stop_at_poc) {
    log('stop_at_poc=true — halting after POC; skipping develop/run-gate/integrate/deploy, proceeding to report.')
  }
} else {
  log(`Phase 3.5 skipped (skip_poc=${skip_poc}, has_frontend=${!skip_frontend})`)
}
```

- [ ] **Step 7: Gate the build phases on `stop_at_poc`**

In `run.wf.js`, add `&& !stop_at_poc` to the entry condition of each of the four build phases so `stop_at_poc` halts them (Report still runs):

Phase 4 Develop — change:
```javascript
if (!isDone('development')) {
```
to:
```javascript
if (!isDone('development') && !stop_at_poc) {
```

Phase 4.5 Run Gate — change:
```javascript
if (!isDone('run_gate')) {
```
to:
```javascript
if (!isDone('run_gate') && !stop_at_poc) {
```

Phase 5 Integrate — change:
```javascript
if (!isDone('finalize')) {
```
to:
```javascript
if (!isDone('finalize') && !stop_at_poc) {
```

Phase 6 Deploy — change:
```javascript
if (!isDone('deploy')) {
```
to:
```javascript
if (!isDone('deploy') && !stop_at_poc) {
```

- [ ] **Step 8: Make Phase 4 orchestrate POC-aware (evolve, not rebuild)**

In `run.wf.js`, in the Phase 4 `milestone-extract` agent prompt, append a POC-awareness line. Find the milestone-extract prompt line ending `Return ONLY the structured milestones.` and insert BEFORE it:

```
If "POC-MANIFEST.md" exists on disk, the frontend POC is the starting point — frontend milestones should EVOLVE the POC's mock layer into real implementation (swap the mock adapter per the evolution map) rather than rebuild pages from scratch.
```

Also, in the Phase 4 per-milestone `engineer-workflow` prompt (the one starting `=== EXECUTE MILESTONE ${id}`), insert after the `Read "CONTEXT.md" from disk for the blueprint.` line:

```
If this is a frontend milestone and "POC-MANIFEST.md" exists, build on the existing POC: replace mock-adapter calls with real implementations per the manifest's evolution map instead of rewriting the UI.
```

- [ ] **Step 9: Generalize the completion log line**

In `run.wf.js`, find the final completion log:
```javascript
log(`All ${isSimpleProject ? '6' : '8'} phases completed. Project build finished.`)
```
Replace with:
```javascript
log(`All phases completed${stop_at_poc ? ' (stopped at POC)' : ''}. Mode: ${MODE}.`)
```

- [ ] **Step 10: Run the job tests to verify they pass**

Run: `node --test tests/engineer-job.test.js`
Expected: PASS, including the new `has a POC phase with skip/stop switches wired to engineer-poc` test and the existing `contains the meta export block with 6 phases` (still passes — POC is additive).

- [ ] **Step 11: Commit**

```bash
git add skills/engineer-job/run.wf.js tests/engineer-job.test.js
git commit -m "feat: wire optional POC phase (3.5) into engineer-job run.wf.js

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: engineer-job SKILL.md — document Phase 3.5 POC

**Files:**
- Modify: `skills/engineer-job/SKILL.md`

**Interfaces:**
- Consumes: nothing new. Produces documentation consistent with the run.wf.js changes (POC phase, skip_poc/stop_at_poc, POC-MANIFEST.md in three-doc system).

- [ ] **Step 1: Add POC to the Phase Overview table**

In `skills/engineer-job/SKILL.md`, in the `### 阶段总览 / Phase Overview` table, insert a new row between the `frontend` row (Phase 3) and the `orchestrate` row (Phase 4):

```markdown
| 3.5 | poc | `engineer-poc` | REQUIREMENTS.md + FRONTEND-DESIGN.md → 可运行 POC + POC-MANIFEST.md + POC-FIDELITY.md | 重试 1 次，失败则降级最小 POC；无前端或 skip_poc 时跳过 |
```

- [ ] **Step 2: Add POC to the three-document system note**

In `SKILL.md`, in the `### 三文档体系 / Three-Document System` section, after the `FRONTEND-DESIGN.md ← Phase 3 (前端设计)` line and its arrow, add a note paragraph after the diagram block:

```markdown
**可选 POC 阶段（Phase 3.5）**：在 frontend 之后、orchestrate 之前，`engineer-poc` 可生成高保真纯前端 POC，产出 `POC-MANIFEST.md`（供 Phase 4 演进消费）与 `POC-FIDELITY.md`。默认对有前端的项目生成（`skip_poc=false`）；`stop_at_poc=true` 时工程停在 POC；`skip_poc=true` 或无前端时跳过。Phase 4 orchestrate 读取 `POC-MANIFEST.md` 时做**演进**（替换 mock 层）而非重建。
```

- [ ] **Step 3: Document the new args in the Quick Start**

In `SKILL.md`, in the `## 🏃 快速执行 / Quick Start` Workflow example (the first `Workflow({...})` block with `args`), add two args after `skip_frontend`:

Find:
```javascript
    skip_frontend: false,      // 无前端界面时设为 true
  }
})
```
Replace with:
```javascript
    skip_frontend: false,      // 无前端界面时设为 true
    skip_poc: false,           // 跳过 POC 阶段（默认 false；无前端自动跳过）
    stop_at_poc: false,        // 工程停在 POC，不进入正式实现
  }
})
```

- [ ] **Step 4: Run the job tests to confirm nothing broke**

Run: `node --test tests/engineer-job.test.js`
Expected: PASS (SKILL.md structural assertions — mode section, phases, recovery, self-healing, job.state.json — all still hold).

- [ ] **Step 5: Commit**

```bash
git add skills/engineer-job/SKILL.md
git commit -m "docs: document optional POC Phase 3.5 in engineer-job SKILL.md

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Register engineer-poc in README.md + README.zh-CN.md

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Test: `tests/engineer-poc.test.js` — add a README registration assertion

**Interfaces:**
- Consumes: skill name `engineer-poc`. Produces: registration in both READMEs (skill list bullet, decision-table row, file-tree entry).

- [ ] **Step 1: Add a README registration test**

In `tests/engineer-poc.test.js`, append a new describe block at the end of the file:

```javascript
describe('engineer-poc README registration', () => {
  const ROOT = path.join(__dirname, '..');
  for (const f of ['README.md', 'README.zh-CN.md']) {
    it(`${f} registers engineer-poc`, () => {
      const content = fs.readFileSync(path.join(ROOT, f), 'utf-8');
      assert.ok(content.includes('engineer-poc'), `${f} should mention engineer-poc`);
    });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/engineer-poc.test.js`
Expected: FAIL on `README.md registers engineer-poc` (not registered yet).

- [ ] **Step 3: Add the skill-list bullet in README.md**

In `README.md`, in the `### Engineering Skills` list, insert AFTER the `engineer-frontend-architect` bullet:

```markdown
- `engineer-poc` — **AI High-Fidelity POC Engine**. Turns requirements into a runnable, **pure-frontend, evolutionary** prototype: reads `REQUIREMENTS.md` + `FRONTEND-DESIGN.md` (+ `CONTEXT.md`), identifies the industry and applies a built-in pattern library, then builds every page with all UI states (loading/empty/error/normal/edge) on a swappable mock-adapter seam — full-function coverage guaranteed by a `.agents/poc.ledger.json` + loop-until-dry + coverage critic. Outputs `POC-MANIFEST.md` (mock→real evolution map) and an honest `POC-FIDELITY.md` (`真实交互` / `mock 数据` / `占位未实现`). Slots into `engineer-job` as optional Phase 3.5 — the project can **stop at the POC**, **skip it**, or **continue** as Phase 4 evolves the mock layer into a real backend. No backend required.
```

- [ ] **Step 4: Add the decision-table row in README.md**

In `README.md`, in the `| Your situation | Start here | Produces |` table, insert AFTER the `engineer-frontend-architect` row:

```markdown
| Want a high-fidelity clickable prototype before real implementation | `engineer-poc` | runnable pure-frontend POC + `POC-MANIFEST.md` → `engineer-job` |
```

- [ ] **Step 5: Add the file-tree entry in README.md**

In `README.md`, in the ```text file-tree block, insert AFTER the `engineer-frontend-architect/` entry (with its `SKILL.md` line):

```text
├── engineer-poc/
│   ├── SKILL.md                    # high-fidelity pure-frontend POC engine / optional Phase 3.5
│   └── references/                 # industry-patterns, poc-ledger schema, mock-layer guide, templates, pipeline
```

- [ ] **Step 6: Add the skill-list bullet in README.zh-CN.md**

In `README.zh-CN.md`, in the engineering skills list, insert AFTER the `engineer-frontend-architect` bullet:

```markdown
- `engineer-poc` — **AI 高保真 POC 生成引擎**。把需求变成可运行的**纯前端演进式**原型：读取 `REQUIREMENTS.md` + `FRONTEND-DESIGN.md`（+ `CONTEXT.md`），识别行业并套用内置模式库，在可替换的 mock 数据接缝上把每个页面的全 UI 状态（loading/empty/error/normal/edge）做出来——全功能覆盖由 `.agents/poc.ledger.json` + loop-until-dry + coverage critic 保证。产出 `POC-MANIFEST.md`（mock→真实演进映射）与诚实的 `POC-FIDELITY.md`（`真实交互` / `mock 数据` / `占位未实现`）。作为 `engineer-job` 的可选 Phase 3.5 接入——工程可**停在 POC**、可**跳过**、也可**接着** Phase 4 把 mock 层演进为真实后端。无需后端。
```

- [ ] **Step 7: Add the decision-table row in README.zh-CN.md**

In `README.zh-CN.md`, in the decision table, insert AFTER the `engineer-frontend-architect` row:

```markdown
| 正式实现前想先要一个高保真可点击原型 | `engineer-poc` | 可运行纯前端 POC + `POC-MANIFEST.md` → `engineer-job` |
```

- [ ] **Step 8: Add the file-tree entry in README.zh-CN.md**

In `README.zh-CN.md`, in the file-tree block, insert AFTER the `engineer-frontend-architect/` entry:

```text
├── engineer-poc/
│   ├── SKILL.md                    # 高保真纯前端 POC 引擎 / 可选 Phase 3.5
│   └── references/                 # 行业模式库、账本 schema、mock 层规范、模板、流水线
```

- [ ] **Step 9: Run the engineer-poc tests to verify registration passes**

Run: `node --test tests/engineer-poc.test.js`
Expected: ALL pass, including both README registration assertions.

- [ ] **Step 10: Commit**

```bash
git add README.md README.zh-CN.md tests/engineer-poc.test.js
git commit -m "docs: register engineer-poc in READMEs (list, decision table, file tree)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the entire test suite**

Run: `npm test`
Expected: All test files pass — `node --test tests/*.test.js` reports 0 failures. In particular:
- `tests/engineer-poc.test.js` — all skill/reference/README assertions pass.
- `tests/engineer-job.test.js` — POC phase assertion passes; all prior assertions still pass.
- `tests/test-detection.test.js`, `tests/engineer-cloner.test.js`, `tests/engineer-legacy-recon.test.js`, `tests/smoke.test.js` — unaffected, still pass.

- [ ] **Step 2: Verify the skill file tree is complete**

Run: `ls skills/engineer-poc skills/engineer-poc/references`
Expected: `SKILL.md` plus references `industry-patterns.md`, `mock-layer-guide.md`, `pipeline.md`, `poc-ledger.schema.json`, `poc-manifest-template.md`.

- [ ] **Step 3: Confirm clean git status**

Run: `git status`
Expected: working tree clean (all work committed across Tasks 1-7).

---

## Self-Review

**1. Spec coverage** (checked against `docs/superpowers/specs/2026-07-15-engineer-poc-skill-design.md`):
- §2 locked decisions (evolutionary / standalone + Phase 3.5 / built-in patterns + optional web / default-generate-POC) → Task 1 (SKILL.md), Task 5 (run.wf.js defaults). ✅
- §3 four principles → Task 1 SKILL.md principle sections + Task 1 tests assert 原则一..四. ✅
- §3 three fidelity labels → Task 1 SKILL.md table + tests; Task 3 templates; Task 4 patterns. ✅
- §6 six-phase pipeline → Task 1 SKILL.md table + Task 2 pipeline.md. ✅
- §7 artifacts (ledger/mocks/manifest/fidelity) → Task 2 schema, Task 3 templates+guide, Task 1 SKILL.md. ✅
- §8 engineer-job integration (skip_poc/stop_at_poc/poc phase/state segment/evolve-not-rebuild) → Task 5 (all steps). ✅
- §9 references (5 files) → Tasks 2-4. ✅
- §10 non-goals → Task 1 SKILL.md 非目标 section + test. ✅
- §11 deliverables (SKILL, references, run.wf.js, engineer-job SKILL, both READMEs, tests) → Tasks 1-7. ✅

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases" left as instructions — all file contents given verbatim; run.wf.js edits use exact find/replace anchors.

**3. Type consistency:** Skill name `engineer-poc` consistent across Tasks 1/5/7. Artifact names `.agents/poc.ledger.json`, `POC-MANIFEST.md`, `POC-FIDELITY.md` identical in SKILL.md, schema, templates, run.wf.js, READMEs. Fidelity labels `真实交互`/`mock 数据`/`占位未实现` identical everywhere. Args `skip_poc`/`stop_at_poc` identical in run.wf.js, SKILL.md, tests. Schema property `nodes` matches the Task 1 test assertion `schema.properties.nodes`.
