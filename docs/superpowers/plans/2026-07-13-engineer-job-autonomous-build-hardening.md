# engineer-job 自主构建加固 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 engineer-* 链路支持"普通开发给简单需求→无人值守从 0 构建可运行初始版本"，通过把可靠性从 SKILL.md 散文搬进 `run.wf.js`。

**Architecture:** 方案 A（加固现有链路）。`run.wf.js` 成为确定性状态机大脑：Phase 0 启发式自动检测复杂度；Phase 4 里程碑循环搬进 JS（解析→拓扑排序→逐里程碑 workflow+inspector）；新增 Phase 4.5 "能跑"硬门禁（agent 真跑 build/test，失败强制修复，修不动标 DOES_NOT_RUN）。纯函数（detectComplexity/topoSort）抽出为可测模块并 inline 回 run.wf.js。入口路由收敛 4 个 SKILL.md。3 个 eval 样例作为回归基线。

**Tech Stack:** JavaScript (Workflow 脚本 run.wf.js + Node ESM 测试，Node ≥18 内置 `node:test`)、Markdown (SKILL.md)、JSON (schema/build-commands/cases)。

## Global Constraints

1. `run.wf.js` 是 Workflow 沙箱脚本：**禁止** `require` / `import` / `fs` / `Date.now()` / `Math.random()` / 无参 `new Date()`。所有文件 I/O 与 Bash 执行必须通过 `agent()` 调用完成。
2. SKILL.md 以 `---` 包裹的 YAML frontmatter 开头，含 `name`、`description`、`compatibility` 字段。
3. SKILL.md 内容为中文为主 + 英文关键术语（括号中）双语。
4. `run.wf.js` 必须向后兼容已有 `job.state.json`（init/requirements/architect/frontend/development/finalize/deploy/report 旧键名继续可用；新增 `run_gate` 键对旧文件按 SKIPPED 处理）。
5. 纯逻辑（detectComplexity / topoSort）在 `references/detection-logic.js` 为可测单一真源；在 `run.wf.js` 内联同名函数（`// mirrored from references/detection-logic.js — keep in sync`），由同步守卫测试约束。
6. Node ≥18（仅用于 `node:test` 单测与 `node --check` 语法校验，非运行时依赖）。
7. 提交信息遵循仓库惯例（`feat:` / `docs:` 前缀），结尾 `Co-Authored-By: Claude <noreply@anthropic.com>`。

---

## 文件结构总览

### 新建文件 (8)

| # | 文件 | 职责 |
|:-:|------|------|
| 1 | `skills/engineer-job/references/detection-logic.js` | 纯函数 `detectComplexity` / `topoSort`（可测单一真源，Node ESM） |
| 2 | `tests/test-detection.mjs` | 纯函数 + inline 同步守卫单测（`node:test`） |
| 3 | `skills/engineer-job/evals/complexity-cases.json` | 复杂度检测的输入/预期样例 |
| 4 | `skills/engineer-job/references/build-commands.json` | 语言/框架 → build/test 命令映射（数据真源） |
| 5 | `skills/engineer-job/evals/README.md` | eval 执行 runbook 与回归基线说明 |
| 6 | `skills/engineer-job/evals/simple-cli/{requirements,expected}.md` | Python CLI 样例 |
| 7 | `skills/engineer-job/evals/simple-api/{requirements,expected}.md` | FastAPI 样例 |
| 8 | `skills/engineer-job/evals/web-crud/{requirements,expected}.md` | Next.js 样例 |

### 修改文件 (7)

| # | 文件 | 改动 |
|:-:|------|:-----|
| 9 | `skills/engineer-job/run.wf.js` | inline 纯函数 + 自动检测 + Phase 4 JS 循环 + Phase 4.5 运行门禁 + meta/report 更新 |
| 10 | `skills/engineer-job/references/project-metadata.schema.json` | 增 `detected_complexity`/`has_frontend`/`skip_requirements`/`skip_frontend`/`complexity_reasoning`/`run_gate` |
| 11 | `skills/engineer-job/SKILL.md` | description 加路由强信号 + 文档化新阶段（4.5）+ 自动检测 + 推荐触发短语 |
| 12 | `skills/engineer-job/references/engine.md` | 阶段文档加 Phase 4.5 + 自动检测说明 |
| 13 | `skills/engineer-orchestrator/SKILL.md` | description 加 ROUTING RULE（defer to engineer-job） |
| 14 | `skills/engineer-architect/SKILL.md` | description 加 ROUTING RULE |
| 15 | `skills/init-project/SKILL.md` | description 加 ROUTING RULE |

> **任务顺序说明**：spec 给的组件优先级是 2→4→3→1→5；本计划按**代码依赖**重排为：纯逻辑(Task 1-2) → 数据契约(Task 3) → run.wf.js 集成(Task 4-6) → 入口文档(Task 7) → evals(Task 8) → 基线验证(Task 9)。

---

### Task 1: detectComplexity 纯函数 + 单测（组件 2 核心）

**Files:**
- Create: `skills/engineer-job/references/detection-logic.js`
- Create: `skills/engineer-job/evals/complexity-cases.json`
- Create: `tests/test-detection.mjs`

**Interfaces:**
- Produces: `detectComplexity(requirements: string) -> { detected_complexity: 'simple'|'moderate'|'complex', has_frontend: boolean, skip_requirements: boolean, skip_frontend: boolean, complexity_reasoning: string }`

- [ ] **Step 1: 创建 complexity-cases.json**

```json
[
  {"label":"simple cli no frontend","requirements":"做一个 Python 命令行工具，检查 Markdown 文件里的死链接","expected":{"has_frontend":false,"skip_requirements":true,"skip_frontend":true}},
  {"label":"simple crud api","requirements":"写一个简单的书签 CRUD API，FastAPI + SQLite 存数据","expected":{"has_frontend":false,"skip_requirements":true,"skip_frontend":true}},
  {"label":"web app with frontend","requirements":"做一个 Next.js 的 todo 待办 web app，有页面","expected":{"has_frontend":true,"skip_requirements":true,"skip_frontend":false}},
  {"label":"complex multi-portal","requirements":"做一个多端的考试管理 SaaS，含机构端 web、学员端小程序、多租户、审批工作流","expected":{"has_frontend":true,"skip_requirements":false,"skip_frontend":false}},
  {"label":"ambiguous default blog","requirements":"做一个博客系统","expected":{"has_frontend":true,"skip_requirements":false,"skip_frontend":false}},
  {"label":"library explicit","requirements":"写一个 Rust library，解析 JSON 配置","expected":{"has_frontend":false,"skip_requirements":true,"skip_frontend":true}}
]
```

- [ ] **Step 2: 创建 test-detection.mjs（仅 detect 部分，先失败）**

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectComplexity } from '../skills/engineer-job/references/detection-logic.js'
import { readFileSync } from 'node:fs'

const cases = JSON.parse(readFileSync(new URL('../skills/engineer-job/evals/complexity-cases.json', import.meta.url), 'utf8'))

for (const c of cases) {
  test(`detect: ${c.label}`, () => {
    const r = detectComplexity(c.requirements)
    assert.equal(r.has_frontend, c.expected.has_frontend, `has_frontend for "${c.label}"`)
    assert.equal(r.skip_requirements, c.expected.skip_requirements, `skip_requirements for "${c.label}"`)
    assert.equal(r.skip_frontend, c.expected.skip_frontend, `skip_frontend for "${c.label}"`)
  })
}
```

- [ ] **Step 3: 运行测试，确认失败**

Run: `node --test tests/test-detection.mjs`
Expected: FAIL — `Cannot find module '.../detection-logic.js'`

- [ ] **Step 4: 创建 detection-logic.js（实现 detectComplexity）**

```javascript
// skills/engineer-job/references/detection-logic.js
// 纯函数单一真源。run.wf.js 内联同名函数（见 // mirrored 注释），保持同步。
// 由 tests/test-detection.mjs 守护。

const FRONTEND_SIGNALS = [
  '前端', '界面', '页面', 'ui', 'web app', 'web-app', '小程序', '移动端',
  'dashboard', '仪表盘', '后台管理', '管理后台', 'react', 'vue', 'next.js',
  'nextjs', 'frontend', '网页', '网站',
]
const NO_FRONTEND_SIGNALS = [
  'cli', '命令行', 'library', '库', 'sdk', '脚本', '纯后端', 'api only',
  '纯 api', 'backend only', 'fastapi', 'flask', 'django', 'express', 'spring',
  'gin', 'echo', 'actix', 'rest api', 'api 服务', 'api-server', 'api server',
  '后端接口',
]
const COMPLEX_SIGNALS = [
  '多端', '多模块', '多个角色', '审批', '工作流', 'saas', '多租户',
  '事件驱动', 'bff', '微服务', '跨模块', '多机构', '分销', '权限体系',
]
const SIMPLE_SIGNALS = [
  'crud', '简单', '单个', '工具', '计算器', 'todo', '待办', '脚本',
  '小工具', '单功能', 'single', 'simple',
]

export function detectComplexity(req) {
  const text = String(req || '').toLowerCase()
  const hit = (arr) => arr.some((k) => text.includes(k))

  let has_frontend, fe_reason
  if (hit(NO_FRONTEND_SIGNALS)) {
    has_frontend = false; fe_reason = '命中无前端信号词'
  } else if (hit(FRONTEND_SIGNALS)) {
    has_frontend = true; fe_reason = '命中前端信号词'
  } else {
    has_frontend = true; fe_reason = '无明确信号，保守按含前端处理'
  }

  let skip_requirements, req_reason
  if (hit(COMPLEX_SIGNALS)) {
    skip_requirements = false; req_reason = '命中复杂信号词，保留需求分析'
  } else if (hit(SIMPLE_SIGNALS)) {
    skip_requirements = true; req_reason = '命中简单信号词，跳过需求分析'
  } else {
    skip_requirements = false; req_reason = '无明确信号，保留需求分析（安全默认）'
  }

  const skip_frontend = !has_frontend

  let detected_complexity
  if (hit(COMPLEX_SIGNALS)) detected_complexity = 'complex'
  else if (hit(SIMPLE_SIGNALS)) detected_complexity = 'simple'
  else detected_complexity = 'moderate'

  return {
    detected_complexity,
    has_frontend,
    skip_requirements,
    skip_frontend,
    complexity_reasoning: `${fe_reason}; ${req_reason}`,
  }
}
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `node --test tests/test-detection.mjs`
Expected: PASS — 全部 6 个 detect 用例通过。

- [ ] **Step 6: Commit**

```bash
git add skills/engineer-job/references/detection-logic.js skills/engineer-job/evals/complexity-cases.json tests/test-detection.mjs
git commit -m "feat: add detectComplexity pure function with unit tests

Component 2 core: heuristic complexity detection over requirements string.
Keyword tables for frontend / no-frontend / complex / simple signals.
Tested against 6 cases via node:test.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: topoSort 纯函数 + 单测（组件 3 核心）

**Files:**
- Modify: `skills/engineer-job/references/detection-logic.js`（追加 `topoSort`）
- Modify: `tests/test-detection.mjs`（追加 topo 测试 + import）

**Interfaces:**
- Produces: `topoSort(milestones: Array<{id:string, deps:string[]}>) -> string[]`（拓扑序 id 数组；有环或未知依赖时抛错）

- [ ] **Step 1: 在 test-detection.mjs 顶部 import 加 topoSort**

把 Task 1 Step 2 的 import 行改为：
```javascript
import { detectComplexity, topoSort } from '../skills/engineer-job/references/detection-logic.js'
```

- [ ] **Step 2: 在 test-detection.mjs 末尾追加 topo 测试**

```javascript
test('topoSort: linear chain', () => {
  const ms = [{ id: 'M1', deps: [] }, { id: 'M2', deps: ['M1'] }, { id: 'M3', deps: ['M2'] }]
  assert.deepEqual(topoSort(ms), ['M1', 'M2', 'M3'])
})

test('topoSort: diamond preserves endpoints', () => {
  const ms = [
    { id: 'M1', deps: [] },
    { id: 'M2', deps: ['M1'] },
    { id: 'M3', deps: ['M1'] },
    { id: 'M4', deps: ['M2', 'M3'] },
  ]
  const order = topoSort(ms)
  assert.equal(order[0], 'M1')
  assert.equal(order[order.length - 1], 'M4')
  assert.equal(order.length, 4)
})

test('topoSort: cycle throws', () => {
  const ms = [{ id: 'M1', deps: ['M2'] }, { id: 'M2', deps: ['M1'] }]
  assert.throws(() => topoSort(ms))
})

test('topoSort: unknown dep throws', () => {
  const ms = [{ id: 'M1', deps: ['M9'] }]
  assert.throws(() => topoSort(ms))
})
```

- [ ] **Step 3: 运行测试，确认 topo 部分失败**

Run: `node --test tests/test-detection.mjs`
Expected: detect 用例 PASS；4 个 topo 用例 FAIL — `topoSort is not a function`

- [ ] **Step 4: 在 detection-logic.js 末尾追加 topoSort**

```javascript
export function topoSort(milestones) {
  const ids = milestones.map((m) => m.id)
  const idSet = new Set(ids)
  for (const m of milestones) {
    for (const d of m.deps || []) {
      if (!idSet.has(d)) throw new Error(`milestone ${m.id} depends on unknown ${d}`)
    }
  }
  const indeg = {}
  const adj = {}
  ids.forEach((id) => { indeg[id] = 0; adj[id] = [] })
  for (const m of milestones) {
    for (const d of m.deps || []) {
      adj[d].push(m.id)
      indeg[m.id]++
    }
  }
  const queue = ids.filter((id) => indeg[id] === 0)
  const order = []
  while (queue.length) {
    const id = queue.shift()
    order.push(id)
    for (const next of adj[id]) {
      indeg[next]--
      if (indeg[next] === 0) queue.push(next)
    }
  }
  if (order.length !== ids.length) throw new Error('cycle detected in milestone dependency graph')
  return order
}
```

- [ ] **Step 5: 运行测试，确认全部通过**

Run: `node --test tests/test-detection.mjs`
Expected: PASS — detect 6 + topo 4 全部通过。

- [ ] **Step 6: Commit**

```bash
git add skills/engineer-job/references/detection-logic.js tests/test-detection.mjs
git commit -m "feat: add topoSort pure function with unit tests

Component 3 core: Kahn's algorithm topological sort over milestone DAG.
Throws on cycle or unknown dependency. Tested via node:test.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: 数据契约 — schema 扩展 + build-commands.json（组件 2/4 数据）

**Files:**
- Modify: `skills/engineer-job/references/project-metadata.schema.json`
- Create: `skills/engineer-job/references/build-commands.json`

**Interfaces:**
- Produces: schema 新字段（`detected_complexity`/`has_frontend`/`skip_requirements`/`skip_frontend`/`complexity_reasoning`/`run_gate`）+ 命令映射文件

- [ ] **Step 1: 在 project-metadata.schema.json 的 `project.properties` 末尾（`features` 之后）追加字段**

在 `"features": { ... }` 之后（第 41 行 `}` 之后、第 42 行 `}` 之前）插入：
```json
        "detected_complexity": { "type": "string", "enum": ["simple", "moderate", "complex"], "description": "Phase 0 启发式检测的项目复杂度" },
        "skip_requirements": { "type": "boolean", "description": "是否跳过 Phase 1 需求分析" },
        "skip_frontend": { "type": "boolean", "description": "是否跳过 Phase 3 前端设计" },
        "complexity_reasoning": { "type": "string", "description": "检测理由（一句话）" }
```

- [ ] **Step 2: 在 schema 顶层 `properties` 中（`architect` 之后、`progress_file` 之前）追加 `run_gate`**

```json
    "run_gate": {
      "type": "object",
      "description": "Phase 4.5 运行门禁结果",
      "properties": {
        "status": { "type": "string", "enum": ["PASS", "DOES_NOT_RUN", "SKIPPED"] },
        "attempts": { "type": "number" },
        "build_command": { "type": "string" },
        "test_command": { "type": "string" },
        "last_error": { "type": ["string", "null"] }
      }
    },
```

- [ ] **Step 3: 校验 schema JSON 合法**

Run: `node -e "JSON.parse(require('fs').readFileSync('skills/engineer-job/references/project-metadata.schema.json','utf8')); console.log('schema OK')"`
Expected: 输出 `schema OK`

- [ ] **Step 4: 创建 build-commands.json**

```json
{
  "_comment": "语言/框架 → build/test 命令映射。run-gate agent 的回退参考；项目原生配置（Makefile/package.json/pyproject.toml/Cargo.toml/go.mod）优先。",
  "python": { "build": "pip install -e .", "test": "pytest -q" },
  "python/fastapi": { "build": "pip install -e .", "test": "pytest -q" },
  "python/flask": { "build": "pip install -e .", "test": "pytest -q" },
  "node": { "build": "npm run build --if-present", "test": "npm test --if-present" },
  "typescript": { "build": "npm run build --if-present", "test": "npm test --if-present" },
  "rust": { "build": "cargo build", "test": "cargo test" },
  "go": { "build": "go build ./...", "test": "go test ./..." }
}
```

- [ ] **Step 5: 校验 build-commands.json 合法**

Run: `node -e "JSON.parse(require('fs').readFileSync('skills/engineer-job/references/build-commands.json','utf8')); console.log('ok')"`
Expected: 输出 `ok`

- [ ] **Step 6: Commit**

```bash
git add skills/engineer-job/references/project-metadata.schema.json skills/engineer-job/references/build-commands.json
git commit -m "feat: extend metadata schema with detection fields and run_gate; add build-commands map

Component 2/4 data contract: detected_complexity, has_frontend, skip_*,
complexity_reasoning in project; run_gate top-level. build-commands.json is
the fallback command map for the Phase 4.5 run gate.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: run.wf.js — inline 纯函数 + 自动检测 + Phase 0/1/3 门禁修正（组件 2 集成）

**Files:**
- Modify: `skills/engineer-job/run.wf.js`（顶部 inline 纯函数；替换 isSimpleProject 块；Phase 0 prompt 写入检测字段；Phase 1/3 门禁用 skip_requirements/skip_frontend）
- Modify: `tests/test-detection.mjs`（追加 inline 同步守卫测试）

**Interfaces:**
- Consumes: `detectComplexity` / `topoSort`（来自 Task 1/2，inline 复制）
- Produces: run.wf.js 计算 `detected`/`skip_requirements`/`skip_frontend`/`isSimpleProject`；Phase 0 agent 持久化检测字段

- [ ] **Step 1: 在 test-detection.mjs 末尾追加同步守卫测试**

```javascript
test('run.wf.js inlines pure functions (sync guard)', () => {
  const wf = readFileSync(new URL('../skills/engineer-job/run.wf.js', import.meta.url), 'utf8')
  assert.ok(wf.includes('function detectComplexity'), 'run.wf.js 必须内联 detectComplexity')
  assert.ok(wf.includes('function topoSort'), 'run.wf.js 必须内联 topoSort')
  assert.ok(wf.includes('mirrored from references/detection-logic.js'), 'run.wf.js 必须标注镜像来源')
})
```

- [ ] **Step 2: 运行测试，确认守卫测试失败**

Run: `node --test tests/test-detection.mjs`
Expected: 之前的 10 个 PASS；新同步守卫 FAIL — run.wf.js 尚未内联。

- [ ] **Step 3: 在 run.wf.js 的 `meta` 块之后、`// ── Constants ──` 之前，inline 两个纯函数**

在 `export const meta = { ... }` 之后插入（与 detection-logic.js 内容一致，去掉 `export`）：
```javascript
// ═══════════════════════════════════════════════════════════
//  Pure helpers — mirrored from references/detection-logic.js — keep in sync
//  (Workflow 沙箱禁止 require/import；此处内联。单测守护单一真源。)
// ═══════════════════════════════════════════════════════════

const FRONTEND_SIGNALS = [
  '前端', '界面', '页面', 'ui', 'web app', 'web-app', '小程序', '移动端',
  'dashboard', '仪表盘', '后台管理', '管理后台', 'react', 'vue', 'next.js',
  'nextjs', 'frontend', '网页', '网站',
]
const NO_FRONTEND_SIGNALS = [
  'cli', '命令行', 'library', '库', 'sdk', '脚本', '纯后端', 'api only',
  '纯 api', 'backend only', 'fastapi', 'flask', 'django', 'express', 'spring',
  'gin', 'echo', 'actix', 'rest api', 'api 服务', 'api-server', 'api server',
  '后端接口',
]
const COMPLEX_SIGNALS = [
  '多端', '多模块', '多个角色', '审批', '工作流', 'saas', '多租户',
  '事件驱动', 'bff', '微服务', '跨模块', '多机构', '分销', '权限体系',
]
const SIMPLE_SIGNALS = [
  'crud', '简单', '单个', '工具', '计算器', 'todo', '待办', '脚本',
  '小工具', '单功能', 'single', 'simple',
]

function detectComplexity(req) {
  const text = String(req || '').toLowerCase()
  const hit = (arr) => arr.some((k) => text.includes(k))
  let has_frontend, fe_reason
  if (hit(NO_FRONTEND_SIGNALS)) { has_frontend = false; fe_reason = '命中无前端信号词' }
  else if (hit(FRONTEND_SIGNALS)) { has_frontend = true; fe_reason = '命中前端信号词' }
  else { has_frontend = true; fe_reason = '无明确信号，保守按含前端处理' }
  let skip_requirements, req_reason
  if (hit(COMPLEX_SIGNALS)) { skip_requirements = false; req_reason = '命中复杂信号词，保留需求分析' }
  else if (hit(SIMPLE_SIGNALS)) { skip_requirements = true; req_reason = '命中简单信号词，跳过需求分析' }
  else { skip_requirements = false; req_reason = '无明确信号，保留需求分析（安全默认）' }
  const skip_frontend = !has_frontend
  let detected_complexity
  if (hit(COMPLEX_SIGNALS)) detected_complexity = 'complex'
  else if (hit(SIMPLE_SIGNALS)) detected_complexity = 'simple'
  else detected_complexity = 'moderate'
  return { detected_complexity, has_frontend, skip_requirements, skip_frontend, complexity_reasoning: `${fe_reason}; ${req_reason}` }
}

function topoSort(milestones) {
  const ids = milestones.map((m) => m.id)
  const idSet = new Set(ids)
  for (const m of milestones) {
    for (const d of m.deps || []) {
      if (!idSet.has(d)) throw new Error(`milestone ${m.id} depends on unknown ${d}`)
    }
  }
  const indeg = {}; const adj = {}
  ids.forEach((id) => { indeg[id] = 0; adj[id] = [] })
  for (const m of milestones) {
    for (const d of m.deps || []) { adj[d].push(m.id); indeg[m.id]++ }
  }
  const queue = ids.filter((id) => indeg[id] === 0)
  const order = []
  while (queue.length) {
    const id = queue.shift(); order.push(id)
    for (const next of adj[id]) { indeg[next]--; if (indeg[next] === 0) queue.push(next) }
  }
  if (order.length !== ids.length) throw new Error('cycle detected in milestone dependency graph')
  return order
}
```

- [ ] **Step 4: 替换 isSimpleProject 块为自动检测 + 覆盖**

把现有这段（`// ── Simple Project Detection ─` 整块到 `}` 结束的 `if (isSimpleProject) { log(...) }`）替换为：
```javascript
// ── Complexity Detection (Component 2) ───────────────────
// 启发式检测；显式 args.skip_* 永远优先。

const detected = detectComplexity(REQUIREMENTS)
const skip_requirements = args.skip_requirements != null ? !!args.skip_requirements : detected.skip_requirements
const skip_frontend = args.skip_frontend != null ? !!args.skip_frontend : detected.skip_frontend
const isSimpleProject = skip_requirements || skip_frontend

log(`Complexity: ${detected.detected_complexity} | has_frontend=${detected.has_frontend} | skip_requirements=${skip_requirements} | skip_frontend=${skip_frontend} (${detected.complexity_reasoning})`)
```

- [ ] **Step 5: 在 Phase 0 的 project-metadata.json 模板里追加检测字段**

在 Phase 0 agent prompt 的 metadata JSON 模板中（`"license": "MIT",` 之后、`"features": [...]` 之前）插入：
```
    "detected_complexity": "${detected.detected_complexity}",
    "has_frontend": ${detected.has_frontend},
    "skip_requirements": ${skip_requirements},
    "skip_frontend": ${skip_frontend},
    "complexity_reasoning": "${detected.complexity_reasoning}",
```
> 注意：此 prompt 是字符串模板，`${detected.detected_complexity}` 会被 JS 求值并注入到发给 agent 的文本里，agent 据此写盘。这与现有 `"name": "${PROJECT_NAME}"` 同模式。

- [ ] **Step 6: Phase 1 门禁改用 skip_requirements**

把 `if (!isDone('requirements') && !isSimpleProject) {` 改为：
```javascript
if (!isDone('requirements') && !skip_requirements) {
```
把对应的 `} else if (isSimpleProject) {` 改为：
```javascript
} else if (skip_requirements) {
```

- [ ] **Step 7: Phase 3 门禁改用 skip_frontend**

把 `if (!isDone('frontend') && !isSimpleProject && !args.skip_frontend) {` 改为：
```javascript
if (!isDone('frontend') && !skip_frontend) {
```
把对应的末尾 `} else {` 分支（`log('Phase 3 skipped ...')`）保持不变（任何跳过情况都走这里）。

- [ ] **Step 8: 语法校验 run.wf.js（ESM）**

Run: `cp skills/engineer-job/run.wf.js /tmp/check-wf.mjs && node --check /tmp/check-wf.mjs && echo SYNTAX_OK`
Expected: 输出 `SYNTAX_OK`（.mjs 强制 ESM 解析，`node --check` 仅校验语法不执行）

- [ ] **Step 9: 运行单测，确认同步守卫通过**

Run: `node --test tests/test-detection.mjs`
Expected: PASS — 11 个用例全部通过（含同步守卫）。

- [ ] **Step 10: Commit**

```bash
git add skills/engineer-job/run.wf.js tests/test-detection.mjs
git commit -m "feat: inline pure helpers and auto complexity detection in run.wf.js

Component 2 integration: detectComplexity over args.requirements drives
skip_requirements/skip_frontend (explicit args still override). Phase 0 agent
persists detection fields to project-metadata.json. Phase 1/3 gates now use
the specific skip flag instead of the combined isSimpleProject.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: run.wf.js — Phase 4 确定性里程碑循环（组件 3 集成）

**Files:**
- Modify: `skills/engineer-job/run.wf.js`（顶部加状态变量；替换 Phase 4 单 agent 调用为里程碑循环）

**Interfaces:**
- Consumes: `topoSort`（已 inline 于 Task 4）；`PHASE_RESULT` schema（已存在）
- Produces: `developmentSummary` / `developmentMilestoneState`（供 Task 6 report 使用）；逐里程碑写 `job.state.json`

- [ ] **Step 1: 在 `phasesDone` 声明附近追加状态变量**

在 `const phasesDone = new Set()` 之后追加：
```javascript
let developmentSummary = ''
let developmentMilestoneState = {}
let runGateResult = null
```

- [ ] **Step 2: 定义 MILESTONE_SCHEMA（在 PHASE_RESULT 之后）**

在 `PHASE_RESULT` 常量之后追加：
```javascript
const MILESTONE_SCHEMA = {
  type: 'object',
  properties: {
    milestones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          deps: { type: 'array', items: { type: 'string' } },
          description: { type: 'string' },
          acceptance: { type: 'string' },
          frontend: { type: 'boolean' },
        },
        required: ['id', 'name', 'deps', 'description'],
      },
    },
  },
  required: ['milestones'],
}
```

- [ ] **Step 3: 替换整个 Phase 4 块为里程碑循环**

找到 `phase('Develop')` 到该 phase 结束（`phasesDone.add('development')` 及其 `}`）的整块，替换为：
```javascript
phase('Develop')
if (!isDone('development')) {
  log('Phase 4: extracting milestone DAG from CONTEXT.md')

  const extracted = await agent(
    ctx('milestone-extract', `=== EXTRACT MILESTONE DAG ===
Read "CONTEXT.md" from disk. Extract the milestone/feature list as structured data.
- id: as written in CONTEXT.md (M1, M2, ...)
- name: milestone name
- deps: ids this milestone depends on (empty array if none)
- description: copy the milestone scope from CONTEXT.md
- acceptance: key acceptance points if present (empty string otherwise)
- frontend: true if this milestone is primarily frontend work
If CONTEXT.md has no milestone section, return a single milestone:
  [{id:"M1", name:"implement-all", deps:[], description:"implement the whole project per CONTEXT.md", acceptance:"build and tests pass", frontend:false}]
Return ONLY the structured milestones.`),
    { schema: MILESTONE_SCHEMA, label: 'milestone-extract', phase: 'Develop' }
  )

  let milestones = extracted && extracted.milestones && extracted.milestones.length
    ? extracted.milestones
    : [{ id: 'M1', name: 'implement-all', deps: [], description: 'implement the whole project per CONTEXT.md', acceptance: 'build and tests pass', frontend: false }]
  if (!extracted || !extracted.milestones || !extracted.milestones.length) {
    log('Phase 4: milestone extraction empty — degraded to single implement-all milestone')
  }

  let order
  try {
    order = topoSort(milestones)
  } catch (e) {
    log(`Phase 4: topo sort failed (${e.message}) — fallback to listed order`)
    order = milestones.map((m) => m.id)
  }
  const byId = {}
  milestones.forEach((m) => { byId[m.id] = m })

  const milestoneState = {}
  order.forEach((id) => { milestoneState[id] = { status: 'TODO', rebuild_count: 0, degraded: false, skipped: false } })
  const MAX_RETRY = 1

  function cascadeSkip(blockedId) {
    for (const m of milestones) {
      if ((m.deps || []).includes(blockedId) && milestoneState[m.id].status === 'TODO') {
        milestoneState[m.id].status = 'SKIPPED'
        milestoneState[m.id].skipped = true
        milestoneState[m.id].skip_reason = `upstream ${blockedId} blocked/skipped`
        log(`Phase 4: cascade-skip ${m.id} (depends on ${blockedId})`)
        cascadeSkip(m.id)
      }
    }
  }

  for (const id of order) {
    const ms = milestoneState[id]
    if (ms.status === 'SKIPPED') continue
    const m = byId[id]
    ms.status = 'IN_PROGRESS'
    log(`Phase 4: milestone ${id} (${m.name}) — start`)

    let res = await agent(
      ctx('engineer-workflow', `=== EXECUTE MILESTONE ${id}: ${m.name} ===
Read "CONTEXT.md" from disk for the blueprint.
Implement milestone ${id} "${m.name}":
Description: ${m.description}
Acceptance: ${m.acceptance || '(per CONTEXT.md)'}
${ms.degraded ? 'DEGRADED SCOPE: only the happy path; skip edge/exception branches and optional enhancements; keep core acceptance points.' : ''}
Follow engineer-workflow: generate code + tests, run tests, commit.
Update .agents/job.state.json development.features.${id} and append to .agents/job.progress.md.
Return structured result.`),
      { schema: PHASE_RESULT, label: `workflow-${id}`, phase: 'Develop' }
    )

    if ((!res || res.status === 'BLOCKED') && ms.rebuild_count < MAX_RETRY) {
      ms.rebuild_count++
      ms.degraded = true
      log(`Phase 4: milestone ${id} BLOCKED — retry once with degraded (happy-path only) scope`)
      res = await agent(
        ctx('engineer-workflow', `=== RETRY MILESTONE ${id}: ${m.name} (DEGRADED) ===
Previous attempt blocked. Implement ONLY the happy path of milestone ${id} "${m.name}".
Skip edge cases, exception branches, optional enhancements. Keep core acceptance points.
Description: ${m.description}
Update .agents/job.state.json and job.progress.md. Return structured result.`),
        { schema: PHASE_RESULT, label: `workflow-${id}-retry`, phase: 'Develop' }
      )
    }

    if (!res || res.status === 'BLOCKED') {
      ms.status = 'SKIPPED'
      ms.skipped = true
      ms.skip_reason = 'workflow blocked after retry'
      log(`Phase 4: milestone ${id} SKIPPED (blocked) — cascading`)
      cascadeSkip(id)
    } else {
      const insp = await agent(
        ctx('engineer-inspector', `=== VERIFY MILESTONE ${id}: ${m.name} ===
Read "CONTEXT.md" and inspect code changes for milestone ${id} "${m.name}".
Check the three architecture-drift signals: foundation tampering, over-engineering, size bloat.
Acceptance target: ${m.acceptance || '(per CONTEXT.md)'}
Return DONE if acceptable, DONE_WITH_CONCERNS if minor issues, BLOCKED if serious drift.`),
        { schema: PHASE_RESULT, label: `inspector-${id}`, phase: 'Develop' }
      )
      if (insp && insp.status === 'BLOCKED' && ms.rebuild_count < MAX_RETRY) {
        ms.rebuild_count++
        log(`Phase 4: milestone ${id} inspector BLOCKED — one fix attempt`)
        await agent(
          ctx('engineer-workflow', `=== FIX MILESTONE ${id} per inspector ===
Inspector flagged serious drift. Re-read CONTEXT.md and fix milestone ${id} "${m.name}". Return structured result.`),
          { schema: PHASE_RESULT, label: `workflow-${id}-fix`, phase: 'Develop' }
        )
      }
      ms.status = insp && insp.status === 'BLOCKED' ? 'DEGRADED' : 'DONE'
      log(`Phase 4: milestone ${id} ${ms.status}`)
    }
  }

  developmentSummary = milestones.map((m) => `${m.id}:${milestoneState[m.id].status}`).join(', ')
  developmentMilestoneState = milestoneState
  log(`Phase 4 complete: ${developmentSummary}`)
  phasesDone.add('development')
}
```

- [ ] **Step 4: 语法校验**

Run: `cp skills/engineer-job/run.wf.js /tmp/check-wf.mjs && node --check /tmp/check-wf.mjs && echo SYNTAX_OK`
Expected: `SYNTAX_OK`

- [ ] **Step 5: 运行单测确认未破坏**

Run: `node --test tests/test-detection.mjs`
Expected: PASS（11 个用例）

- [ ] **Step 6: Commit**

```bash
git add skills/engineer-job/run.wf.js
git commit -m "feat: replace Phase 4 with deterministic JS milestone loop

Component 3 integration: extract milestone DAG (one parse agent) -> JS topo
sort -> per-milestone workflow agent + inspector agent. Retry/degrade/cascade
state owned by JS. Collapses job->orchestrator->workflow nesting to two layers.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: run.wf.js — Phase 4.5 运行门禁 + meta/report 更新（组件 4 集成）

**Files:**
- Modify: `skills/engineer-job/run.wf.js`（meta.phases 加 'Run Gate'；Phase 4 之后插入 Phase 4.5；report prompt 反映 run_gate）

**Interfaces:**
- Consumes: Task 5 的 `phase('Develop')` 之后位置；`MODE` 常量
- Produces: `runGateResult`；`job.state.json.phases.run_gate`

- [ ] **Step 1: 在 meta.phases 数组的 'Develop' 之后插入 Run Gate**

把
```javascript
    { title: 'Develop', detail: 'engineer-orchestrator multi-feature development' },
```
改为
```javascript
    { title: 'Develop', detail: 'deterministic milestone loop (workflow + inspector per milestone)' },
    { title: 'Run Gate', detail: 'hard build+test gate; fix loop; DOES_NOT_RUN if unfixable' },
```

- [ ] **Step 2: 定义 RUN_GATE_SCHEMA（在 MILESTONE_SCHEMA 之后）**

```javascript
const RUN_GATE_SCHEMA = {
  type: 'object',
  properties: {
    build_ok: { type: 'boolean' },
    test_ok: { type: 'boolean' },
    build_command: { type: 'string' },
    test_command: { type: 'string' },
    output: { type: 'string' },
  },
  required: ['build_ok', 'test_ok'],
}
```

- [ ] **Step 3: 在 Phase 4 块之后、Phase 5（`phase('Integrate')`）之前插入 Phase 4.5**

```javascript
// ═══════════════════════════════════════════════════════════
//  Phase 4.5 — Run Gate: hard "does it build & test" gate (Component 4)
//  Agent-driven (Workflow 沙箱禁止直接 Bash)。失败强制修复循环；
//  修不动标 DOES_NOT_RUN，report 头条如实反映。

phase('Run Gate')
if (!isDone('run_gate')) {
  log('Phase 4.5: run gate — build + test must pass')

  const MAX_FIX = MODE === 'normal' ? 2 : 1
  let gate = null
  let attempts = 0

  while (attempts <= MAX_FIX) {
    attempts++
    gate = await agent(
      ctx('run-gate', `=== RUN GATE: BUILD + TEST ===
Read "project-metadata.json" for language/framework.
Determine build & test commands:
  1. Prefer project-native config: Makefile, package.json "scripts", pyproject.toml, Cargo.toml, go.mod.
  2. Fallback map (if none found):
     python/fastapi/flask -> build: "pip install -e .",   test: "pytest -q"
     node/typescript      -> build: "npm run build --if-present", test: "npm test --if-present"
     rust                 -> build: "cargo build",         test: "cargo test"
     go                   -> build: "go build ./...",       test: "go test ./..."
Run BOTH commands via Bash. Capture full output.
Return build_ok, test_ok, the commands used, and combined output (last ~2000 chars).
${attempts > 1 ? 'Previous attempt failed. You MAY fix the code to make build+test pass before re-running.' : ''}`),
      { schema: RUN_GATE_SCHEMA, label: 'run-gate', phase: 'Run Gate' }
    )

    if (gate && gate.build_ok && gate.test_ok) break
    if (attempts > MAX_FIX) break
    log(`Phase 4.5: run gate failed (attempt ${attempts}) — fix attempt ${attempts}`)
    await agent(
      ctx('run-gate-fix', `=== FIX BUILD/TEST FAILURES ===
The project build or tests are failing. Fix the code until BOTH pass.
Last failure output:
${(gate && gate.output) || '(no output)'}
Do NOT skip or delete tests. Make them pass. Commit the fix. Append to .agents/job.progress.md.`),
      { schema: PHASE_RESULT, label: 'run-gate-fix', phase: 'Run Gate' }
    )
  }

  const passed = !!(gate && gate.build_ok && gate.test_ok)
  runGateResult = {
    status: passed ? 'PASS' : 'DOES_NOT_RUN',
    attempts,
    build_command: (gate && gate.build_command) || '',
    test_command: (gate && gate.test_command) || '',
    last_error: passed ? null : ((gate && gate.output) || 'unknown'),
  }
  log(`Phase 4.5: run gate ${passed ? 'PASS' : 'DOES_NOT_RUN'} after ${attempts} attempt(s)`)

  await agent(
    ctx('persist', `Update ".agents/job.state.json": set phases.run_gate = ${JSON.stringify({ status: runGateResult.status, attempts: runGateResult.attempts })}. Do not change any other fields.`),
    { schema: PHASE_RESULT, label: 'persist-run-gate', phase: 'Run Gate' }
  )
  phasesDone.add('run_gate')
}
```

- [ ] **Step 4: report agent prompt 反映 run_gate**

在 Phase 7（`phase('Report')`）的 agent prompt 开头（`=== GENERATE FINAL REPORT ===` 之后第一行）插入：
```
RUN GATE STATUS: ${runGateResult ? runGateResult.status : 'unknown'}.
If status is DOES_NOT_RUN, the FIRST line of your report MUST be exactly:
  ⚠️ DOES_NOT_RUN — build/test failing; project is NOT runnable.
Do NOT claim the project is complete in that case.

Development milestone summary: ${developmentSummary || '(not available)'}.
```

- [ ] **Step 5: 语法校验**

Run: `cp skills/engineer-job/run.wf.js /tmp/check-wf.mjs && node --check /tmp/check-wf.mjs && echo SYNTAX_OK`
Expected: `SYNTAX_OK`

- [ ] **Step 6: 单测确认未破坏**

Run: `node --test tests/test-detection.mjs`
Expected: PASS（11 个用例）

- [ ] **Step 7: Commit**

```bash
git add skills/engineer-job/run.wf.js
git commit -m "feat: add Phase 4.5 run gate (hard build+test gate)

Component 4 integration: agent runs build+test via Bash; on failure a fix
loop runs (normal=2/auto=1/silent=1 attempts). Unfixable => DOES_NOT_RUN,
persisted to job.state.json and surfaced as the report headline. Report no
longer claims complete for non-running projects.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: 入口路由收敛 — 4 个 SKILL.md + engine.md（组件 1）

**Files:**
- Modify: `skills/engineer-job/SKILL.md`（description 加强信号 + 文档化新阶段 + 推荐短语）
- Modify: `skills/engineer-job/references/engine.md`（阶段文档加 4.5 + 自动检测）
- Modify: `skills/engineer-orchestrator/SKILL.md`（description ROUTING RULE）
- Modify: `skills/engineer-architect/SKILL.md`（description ROUTING RULE）
- Modify: `skills/init-project/SKILL.md`（description ROUTING RULE）

**Interfaces:**
- Consumes: Task 4-6 已实现的 run.wf.js 行为
- Produces: 收敛后的触发词，普通开发稳定进入 engineer-job

- [ ] **Step 1: engineer-job SKILL.md description 顶部加强信号 + 推荐短语**

把现有 description 的第一段（"AI项目全自动构建引擎 — 从零开始自动完成整个项目构建。"所在行）之前，在 description 块内最前面加一行：
```
  【强触发 / Strong trigger】"从零做一个 X" / "build X from scratch" + 完整项目 + 尚无 CONTEXT.md —— 普通开发用这句话即可稳定进入本技能完成无人值守全链路构建。
  ROUTING RULE: 当用户要"从零一气呵成做完整个项目"且尚无蓝图时，本技能是唯一入口；orchestrator/architect/init-project 应让位。
```

- [ ] **Step 2: engineer-job SKILL.md 阶段总览表加 Phase 4.5 行**

在阶段总览表（`| 4 | orchestrate | ...` 行之后、`| 5 | integrate |` 行之前）插入：
```
| 4.5 | run gate | 内置运行门禁 | 代码 → build+test 通过 | 失败强制修复循环；修不动标 DOES_NOT_RUN |
```

- [ ] **Step 3: engineer-orchestrator SKILL.md description 加 ROUTING RULE**

在 description 块的 `TRIGGERS:` 之前插入一行：
```
  ROUTING RULE: 若用户要"从零做一个完整项目"且尚无 CONTEXT.md 蓝图，请改触发 engineer-job（它负责脚手架+架构+全链路）。本技能仅在蓝图已就绪时接管多功能编排。
```

- [ ] **Step 4: engineer-architect SKILL.md description 加 ROUTING RULE**

在 description 块的 `TRIGGERS:` 之前插入一行：
```
  ROUTING RULE: 若用户要"从零做一个完整项目"（不只是设计），请改触发 engineer-job。本技能聚焦"画蓝图"，不负责脚手架与开发。
```

- [ ] **Step 5: init-project SKILL.md description 加 ROUTING RULE**

在 description 块末尾（`... or any similar phrase about starting a new project — even if the request sounds informal or incomplete.` 之后）追加：
```
  ROUTING RULE: 若用户要"从零做一个完整项目做完"，请改触发 engineer-job；本技能仅做脚手架，不负责架构与开发。
```

- [ ] **Step 6: engine.md 更新阶段文档**

把 engine.md 中"### Phase 2: Develop"小节标题之后、`### Phase 3: Integrate`之前，插入新小节：
```markdown
### Phase 2.5: Run Gate (hard gate)

**新增（Component 4）** — build + test 必须通过。

- agent 读 `project-metadata.json` 的 language/framework，优先用项目原生配置（Makefile / package.json / pyproject.toml / Cargo.toml / go.mod），回退查 `references/build-commands.json`。
- 真跑 build + test（通过 agent 的 Bash 工具）。
- 失败 → 强制修复循环（normal=2 / auto=1 / silent=1 次）。
- 修不动 → 标 `DOES_NOT_RUN`，最终报告头条如实标注，**不宣称完成**。
```
并在 engine.md "设计原理 > 协议数据流"图后追加一段：
```markdown
### 自动复杂度检测（Component 2）

Phase 0 读取 `args.requirements` 后，`run.wf.js` 用 `detectComplexity()` 启发式判定 `has_frontend` / `skip_requirements` / `skip_frontend`（显式 `args.skip_*` 永远优先）。检测结果写入 `project-metadata.json`，并据 `skip_requirements` / `skip_frontend` 分别门禁 Phase 1 与 Phase 3。纯函数单一真源在 `references/detection-logic.js`，由 `tests/test-detection.mjs` 守护，并内联进 `run.wf.js`（沙箱禁止 require）。
```

- [ ] **Step 7: 校验 5 个 SKILL.md frontmatter 仍可解析**

Run:
```bash
for f in skills/engineer-job/SKILL.md skills/engineer-orchestrator/SKILL.md skills/engineer-architect/SKILL.md skills/init-project/SKILL.md; do
  node -e "const t=require('fs').readFileSync('$f','utf8');const m=t.match(/^---\n([\s\S]*?)\n---/);if(!m){console.error('NO FRONTMATTER in $f');process.exit(1)};console.log('$f OK')"
done
```
Expected: 4 行 `<path> OK`

- [ ] **Step 8: Commit**

```bash
git add skills/engineer-job/SKILL.md skills/engineer-job/references/engine.md skills/engineer-orchestrator/SKILL.md skills/engineer-architect/SKILL.md skills/init-project/SKILL.md
git commit -m "feat: converge entry routing and document Phase 4.5 + auto detection

Component 1: add ROUTING RULE to orchestrator/architect/init-project
descriptions to defer to engineer-job for from-scratch whole-project builds;
strengthen engineer-job trigger signal with a recommended phrase. engine.md
documents the new run gate and complexity auto-detection.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Evals — 3 样例 + runbook（组件 5）

**Files:**
- Create: `skills/engineer-job/evals/README.md`
- Create: `skills/engineer-job/evals/simple-cli/requirements.md`
- Create: `skills/engineer-job/evals/simple-cli/expected.md`
- Create: `skills/engineer-job/evals/simple-api/requirements.md`
- Create: `skills/engineer-job/evals/simple-api/expected.md`
- Create: `skills/engineer-job/evals/web-crud/requirements.md`
- Create: `skills/engineer-job/evals/web-crud/expected.md`

**Interfaces:**
- Consumes: Task 4-7 已实现的链路
- Produces: 回归基线样例 + 执行 runbook

- [ ] **Step 1: 创建 evals/README.md（runbook）**

````markdown
# engineer-job Evals / 回归基线

3 个标准样例，验证"普通开发给简单需求 → 无人值守从 0 构建可运行初始版本"。

## 执行方式

在**干净临时目录**里调用 Workflow（避免污染本仓库）：

```bash
mkdir -p /tmp/eval-simple-cli && cd /tmp/eval-simple-cli
```

```javascript
Workflow({
  script: "<repo>/skills/engineer-job/run.wf.js",
  args: {
    requirements: "<把 evals/<sample>/requirements.md 内容粘进来>",
    mode: "auto",
    projectName: "<sample-name>"
  }
})
```

> 不传 `skip_*` —— 验证自动检测是否正确。

## 评分

对照 `evals/<sample>/expected.md` 逐项打勾。**任一"必须"项未达 = 该样例 FAIL**。
运行门禁结果以最终报告头条为准：`DOES_NOT_RUN` = FAIL。

## 样例矩阵

| 样例 | 栈 | 预期自动检测 | 关键验证点 |
|------|----|------------|-----------|
| simple-cli | Python | skip_req=T, skip_fe=T | CLI 能跑 + pytest 过 |
| simple-api | FastAPI+SQLite | skip_req=T, skip_fe=T | CRUD API + pytest 过 |
| web-crud | Next.js | skip_req=T, skip_fe=F | 含前端 + npm build 过 |

跑通后，输出快照作为回归基线。
````

- [ ] **Step 2: 创建 simple-cli/requirements.md**

```markdown
# 样例需求：Markdown 死链检查器（simple-cli）

做一个 Python 命令行工具，扫描指定 Markdown 文件里的所有链接，检查哪些是死链（HTTP 状态码 ≥ 400 或请求失败），把死链列表打印出来。

- 命令：`checklinks <file.md>`
- 正常链接返回 0；发现死链返回非 0。
- 纯标准库 + requests 即可，不需要数据库。
- 带 pytest 单测。
```

- [ ] **Step 3: 创建 simple-cli/expected.md**

```markdown
# simple-cli 验收卡

## 必须达到
- [ ] 自动检测：skip_requirements=true、skip_frontend=true（Phase 1 与 Phase 3 被跳过）
- [ ] 产物含可执行 CLI：`checklinks <file.md>` 能运行
- [ ] 运行门禁 PASS（`pip install -e .` + `pytest -q` 均通过）
- [ ] 最终报告头条 NOT `DOES_NOT_RUN`

## 加分
- [ ] 对 4xx/5xx/网络异常都判定为死链
- [ ] 至少 3 个 pytest 用例（含一个死链、一个正常）
```

- [ ] **Step 4: 创建 simple-api/requirements.md**

```markdown
# 样例需求：书签 CRUD API（simple-api）

写一个简单的书签 CRUD API，FastAPI + SQLite 存数据。每条书签：id、url、title、created_at。

- POST /bookmarks（创建）
- GET /bookmarks（列表）
- GET /bookmarks/{id}
- DELETE /bookmarks/{id}
- 纯后端，无前端界面。
- 带 pytest 单测（用 FastAPI TestClient）。
```

- [ ] **Step 5: 创建 simple-api/expected.md**

```markdown
# simple-api 验收卡

## 必须达到
- [ ] 自动检测：skip_frontend=true（Phase 3 跳过）；has_frontend=false
- [ ] 4 个端点均可访问且行为正确
- [ ] 运行门禁 PASS（build + `pytest -q` 通过）
- [ ] 最终报告头条 NOT `DOES_NOT_RUN`

## 加分
- [ ] SQLite 持久化文件正确创建
- [ ] 单测覆盖创建/列表/删除
```

- [ ] **Step 6: 创建 web-crud/requirements.md**

```markdown
# 样例需求：Todo Web App（web-crud）

做一个 Next.js 的 todo 待办 web app，有页面。功能：

- 前端页面：添加 todo、列出 todo、标记完成、删除。
- 后端 API：Next.js Route Handlers（或同进程 API）做 CRUD。
- 数据用 SQLite（或内存数组即可）。
- 带 npm test 单测。
```

- [ ] **Step 7: 创建 web-crud/expected.md**

```markdown
# web-crud 验收卡

## 必须达到
- [ ] 自动检测：has_frontend=true、skip_frontend=false（Phase 3 前端设计被执行）
- [ ] 产物含前端页面文件（app/ 或 pages/ 下）
- [ ] 运行门禁 PASS（`npm run build` + `npm test` 通过）
- [ ] 最终报告头条 NOT `DOES_NOT_RUN`

## 加分
- [ ] FRONTEND-DESIGN.md 生成且含页面树/组件树
- [ ] CRUD 四个操作在页面上可用
```

- [ ] **Step 8: Commit**

```bash
git add skills/engineer-job/evals/
git commit -m "docs: add 3 eval samples + runbook as regression baseline

Component 5: simple-cli (Python), simple-api (FastAPI+SQLite), web-crud (Next.js).
Each has requirements.md input + expected.md rubric. README documents execution
and scoring. Validates auto-detection, full chain, and the run gate.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: 基线验证 — 跑 simple-cli 并修复发现的问题

**Files:**
- 可能 Modify: `skills/engineer-job/run.wf.js`（依据发现的问题修复）
- Create: `skills/engineer-job/evals/simple-cli/BASELINE-RESULT.md`（记录结果）

**Interfaces:**
- Consumes: Task 1-8 全部产出
- Produces: 第一个样例的端到端验证证据 + 必要修复

> **说明**：本任务是端到端集成验证。Workflow 执行依赖 `Workflow` 工具与子代理，无法在纯静态环境预判全部失败点。执行者按 runbook 跑，对照 expected.md，对发现的链路缺陷就地修复并补提交。simple-api / web-crud 作为后续回归，本计划只要求 simple-cli 跑通作为基线建立。

- [ ] **Step 1: 在干净目录执行 simple-cli**

```bash
mkdir -p /tmp/eval-simple-cli && cd /tmp/eval-simple-cli
```
调用 Workflow：
```javascript
Workflow({
  script: "<repo绝对路径>/skills/engineer-job/run.wf.js",
  args: {
    requirements: "做一个 Python 命令行工具，扫描指定 Markdown 文件里的所有链接，检查哪些是死链（HTTP 状态码 ≥ 400 或请求失败），把死链列表打印出来。命令：checklinks <file.md>。正常链接返回 0；发现死链返回非 0。纯标准库 + requests，不需要数据库。带 pytest 单测。",
    mode: "auto",
    projectName: "checklinks"
  }
})
```

- [ ] **Step 2: 对照 expected.md 逐项核验**

依次确认：
- [ ] 自动检测日志输出 `skip_requirements=true ... skip_frontend=true`
- [ ] Phase 1（requirements）被跳过
- [ ] Phase 3（frontend）被跳过
- [ ] 产物 `checklinks` CLI 可执行
- [ ] 运行门禁 `PASS`，报告头条非 `DOES_NOT_RUN`

- [ ] **Step 3: 对发现的链路缺陷就地修复**

常见可能问题与修法（按实际遇到的处理）：
- 里程碑解析 agent 返回空 → 检查 Phase 4 降级分支是否生效。
- 运行门禁 agent 未真跑命令 → 强化 RUN_GATE prompt 明确"必须用 Bash 工具执行"。
- 检测误判 → 调整 keyword 表并同步 complexity-cases.json + detection-logic.js + run.wf.js inline 三处。
- 语法/引用错误 → `node --check /tmp/check-wf.mjs` 定位。

每处修复后：`node --test tests/test-detection.mjs` 必须仍全绿；`node --check` 必须通过。

- [ ] **Step 4: 记录基线结果**

创建 `skills/engineer-job/evals/simple-cli/BASELINE-RESULT.md`：
```markdown
# simple-cli 基线结果 / Baseline

**执行日期**: <填实际日期>
**模式**: auto
**结果**: <PASS / FAIL>

## 自动检测
- detected_complexity: <>
- skip_requirements: <T/F>  skip_frontend: <T/F>

## 阶段
- Phase 0 init: <OK>
- Phase 1 requirements: <skipped / done>
- Phase 2 architect: <OK>
- Phase 3 frontend: <skipped / done>
- Phase 4 develop: <里程碑状态摘要>
- Phase 4.5 run gate: <PASS / DOES_NOT_RUN>
- Phase 5-7: <OK>

## 修复记录
- <如有修复，记录改了什么、为什么>

## 结论
<一句话：是否达成"无人值守从 0 构建可运行初始版本">
```

- [ ] **Step 5: 提交基线与修复**

```bash
git add skills/engineer-job/evals/simple-cli/BASELINE-RESULT.md skills/engineer-job/run.wf.js tests/
git commit -m "test: establish simple-cli baseline; fix issues found in e2e run

<在 commit body 简述实际修复内容，或写 'no fixes needed' 若一次跑通>

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 执行顺序依赖

```
Task 1 (detect)        ← 独立，先做
Task 2 (topo)          ← 依赖 Task 1（同文件）
Task 3 (schema+data)   ← 独立，可与 1-2 并行
Task 4 (run.wf.js 检测+门禁) ← 依赖 1,2
Task 5 (Phase 4 循环)   ← 依赖 4
Task 6 (Phase 4.5 门禁)  ← 依赖 5
Task 7 (路由文档)        ← 依赖 4-6（描述实际行为）
Task 8 (evals)          ← 依赖 4-7
Task 9 (基线验证)        ← 依赖 1-8
```

Task 1-3 可并行启动；4→5→6 顺序；7-8 在 run.wf.js 稳定后做；9 收尾。
