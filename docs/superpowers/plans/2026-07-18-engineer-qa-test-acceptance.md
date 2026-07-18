# engineer-qa Test-Acceptance Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `engineer-qa` test-acceptance skill that auto-triggers after feature development in the engineer* pipeline, gating on unit + integration tests, ≥90% diff branch coverage (global ratchet), and agent-browser E2E over the full entity lifecycle.

**Architecture:** `engineer-qa` becomes the single source of truth for the test/coverage/E2E gate. Its SKILL.md + three reference files define the four-stage QA lifecycle. Pipeline hooks (`engineer-workflow` step 7, `engineer-job/run.wf.js` Run Gate + Integrate, `engineer-inspector` signal 6, `engineer-next` routing) delegate to it. This is a documentation/JS-orchestration repo — "tests" are Node assertions in `tests/*.test.js` that check SKILL.md structure and `run.wf.js` parse-ability, run via `npm test`.

**Tech Stack:** Markdown skills (bilingual 中/EN), Node.js ≥18 test runner (`node --test`), a Workflow-tool ESM script (`run.wf.js`).

## Global Constraints

- Every `skills/*/SKILL.md` MUST have YAML frontmatter with `name`, `description`, `compatibility` (auto-enforced by `tests/engineer-job.test.js`).
- `engineer-*` skills: `compatibility` MUST include `bash` or `agent`. Use `compatibility: "bash, read, write, agent"` for engineer-qa.
- Every mode-bearing engineer skill MUST contain a `## ⚙️ 模式选择` section mentioning `normal`, `auto`, `silent`.
- Coverage gate truth: **本轮变更(diff) 分支覆盖率 ≥ 90% 硬门禁 + 全局覆盖率 ratchet 不回退**. Verbatim number: `90`.
- E2E driver: **agent-browser** skill; non-UI projects (纯 API/CLI/库) degrade to black-box E2E, never silently skipped without a report note.
- State lives in `.agents/`: `qa-latest.md` (report), `qa-baseline.json` (coverage ratchet), `qa-e2e/` (screenshots). Never invent a new progress truth file.
- Three-state verdict aligns with inspector: `✅ PASS / ⚠️ NEEDS_FIX / 🛑 REBUILD`.
- Bilingual style: match existing engineer-* SKILL.md (中文 primary, English mirror, emoji section headers).
- `run.wf.js` is an ESM module. It MUST keep parsing: `node --check --input-type=module < skills/engineer-job/run.wf.js`. Do not break `npm test`.
- Methodology attribution block (来源声明 / Source) matches sibling skills.

---

### Task 1: engineer-qa SKILL.md — skill core

**Files:**
- Create: `skills/engineer-qa/SKILL.md`
- Modify: `tests/engineer-job.test.js` (add engineer-qa to mode list + a dedicated `describe`)
- Test: `tests/engineer-job.test.js`

**Interfaces:**
- Produces: the `engineer-qa` skill directory (later tasks add `references/`), the QA vocabulary consumed by pipeline hooks — verdict tokens `PASS/NEEDS_FIX/REBUILD`, state files `.agents/qa-latest.md`, `.agents/qa-baseline.json`, `.agents/qa-e2e/`, and the four stage names `静态盘点 / 单元层 / 集成层 / E2E 层`.

- [ ] **Step 1: Write the failing test** — append inside the top-level `describe('skills', …)` block in `tests/engineer-job.test.js`, right after the `mode support across skills` block (add `engineer-qa` to the mode list AND a content describe):

```javascript
  describe('engineer-qa', () => {
    const skillFile = path.join(SKILL_DIR, 'engineer-qa', 'SKILL.md');

    it('exists with valid frontmatter', () => {
      assert.ok(fs.existsSync(skillFile), 'engineer-qa/SKILL.md should exist');
      const parsed = readFrontmatter(skillFile);
      assert.ok(parsed.frontmatter.name === 'engineer-qa', 'name must be engineer-qa');
      assert.ok(/bash|agent/.test(parsed.frontmatter.compatibility), 'compat needs bash/agent');
    });

    it('has mode selection section', () => {
      const c = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(c.includes('## ⚙️ 模式选择'), 'should have mode section');
      assert.ok(c.includes('normal') && c.includes('auto') && c.includes('silent'));
    });

    it('defines the four-stage QA lifecycle', () => {
      const c = fs.readFileSync(skillFile, 'utf-8');
      for (const stage of ['静态盘点', '单元层', '集成层', 'E2E']) {
        assert.ok(c.includes(stage), `should describe stage ${stage}`);
      }
    });

    it('enforces 90% diff branch coverage + global ratchet', () => {
      const c = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(c.includes('90'), 'should state the 90% bar');
      assert.ok(c.includes('分支覆盖'), 'should require branch coverage');
      assert.ok(c.includes('qa-baseline.json'), 'should use the ratchet baseline file');
    });

    it('uses agent-browser for E2E with non-UI degradation', () => {
      const c = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(c.includes('agent-browser'), 'should drive E2E via agent-browser');
      assert.ok(c.includes('降级') || c.includes('跳过'), 'should degrade for non-UI');
    });

    it('uses the three-state verdict', () => {
      const c = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(c.includes('PASS') && c.includes('NEEDS_FIX') && c.includes('REBUILD'));
    });
  });
```

Also add `'engineer-qa'` to the `skillsThatNeedMode` array (currently at `tests/engineer-job.test.js:114-117`):

```javascript
    const skillsThatNeedMode = [
      'init-project', 'engineer-architect', 'engineer-orchestrator',
      'engineer-workflow', 'engineer-inspector', 'engineer-qa',
    ];
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A2 engineer-qa`
Expected: FAIL — `engineer-qa/SKILL.md should exist`.

- [ ] **Step 3: Write the skill** — create `skills/engineer-qa/SKILL.md` with this exact frontmatter and section skeleton (fill prose from the spec §3–§4; the tokens below are mandatory and test-checked):

````markdown
---
name: engineer-qa
description: >
  AI 测试验收引擎 — 功能开发完成后自动触发的测试门禁。执行测试金字塔全生命周期验收：
  单元测试 + 本轮变更(diff)分支覆盖率 ≥90% 硬门禁（全局 ratchet 不回退）、集成测试覆盖
  实体 CRUD 与错误路径、用 agent-browser 驱动关键用户链路 E2E。是 engineer* 系列
  测试/覆盖率/E2E 门禁的单一真源；无 UI 项目优雅降级为黑盒验收。
  TRIGGERS: 用户说"测试验收""跑一下测试""覆盖率够不够""E2E""端到端测试""验收测试"
  "test acceptance""run the tests""coverage""e2e""是不是测够了"。
  ALSO TRIGGER: 功能/里程碑开发完成后（管道自动接入），在提交固化前执行测试门禁。
compatibility: "bash, read, write, agent"
---

# engineer-qa — AI 测试验收引擎 / AI Test Acceptance Engine

> **来源声明**: 本 skill 的方法论来源于《基于实现规划的 AI 辅助编程实战》。更多内容请访问 [zhurongshuo.com]。
>
> **Source**: The methodology of this skill originates from "AI-Assisted Programming Practice Based on Implementation Planning".

## 🎯 核心理念 / Core Philosophy

"能跑通" ≠ "验收通过"。验收通过 = **测试金字塔全层绿灯 + 本轮分支覆盖率 ≥90% +
全局覆盖率不回退 + 关键用户链路 E2E 通过**。无验证不固化——测试必须真跑、真过、真达标。

## 🚦 触发条件 / When to Trigger
（中英文触发语句；并说明"功能开发完成后由管道自动接入"。）

## ⚙️ 模式选择 / Mode Selection

| 模式 | 行为 |
|:----:|------|
| normal | 出验收报告，等待用户决定下一步 |
| auto | 自动执行三态决策：PASS→继续，NEEDS_FIX→升维修一次复验，REBUILD→git reset 重建(≤2) |
| silent | 全自动静默，仅 🔴 输出，报告落盘 .agents/qa-latest.md |

## 📋 工作前提 / Prerequisites
（CONTEXT.md 测试策略/验收标准/用户链路；git diff 范围；测试与覆盖率工具链探测。）

## 🔍 四阶段工作流 / Four-Stage QA Lifecycle

### ① 静态盘点 / Inventory
读 CONTEXT.md（测试策略、验收标准、用户链路、词汇表）；探测项目类型(API/CLI/Web/Library)；
探测测试与覆盖率工具链（见 `references/coverage-tools.md`）；确定本轮变更范围（`git diff`）。

### ② 单元层 / Unit
运行单元测试（全部通过）；计算**本轮变更(diff)分支覆盖率 ≥ 90% 硬门禁**；
每核心函数 1 happy + 2 edge（空输入/异常参数/极限值）。覆盖率不足 → NEEDS_FIX，报告未覆盖分支 `file:line`。

### ③ 集成层 / Integration
运行集成测试（全部通过）；业务实体 **CRUD 全链路 + 错误路径**（400/404/500 或等价异常）全覆盖。

### ④ E2E 层 / End-to-End（功能/项目完成后负载一次）
用 **agent-browser** 驱动关键用户链路（登录→核心操作→登出 / 创建→读取→更新→删除），
截图取证存 `.agents/qa-e2e/`。详见 `references/e2e-playbook.md`。
**无 UI 项目**：优雅**降级**——API→端点黑盒 E2E，CLI→子命令 E2E，Library→跳过并在报告标注。

## 📊 覆盖率门禁 / Coverage Gate
- 本轮硬门禁：diff 分支覆盖率 `< 90%` → NEEDS_FIX。
- 全局 ratchet：读写 `.agents/qa-baseline.json`；全局覆盖率低于基线 → NEEDS_FIX；达标则更新基线（只升不降）。
- 首次无基线：建立基线，仅 diff 门禁。
- 工具不支持分支覆盖：降级为行覆盖 + 报告告警。

## 🧭 三态决策 / Branch Decision

| 结论 | 条件 | normal | auto / silent |
|:----:|------|--------|---------------|
| ✅ PASS | 四层全绿 + diff 分支≥90% + 全局不回退 | 出报告建议提交 | 继续 |
| ⚠️ NEEDS_FIX | 测试失败/覆盖不足/全局回退/E2E 单链路失败 | 出报告等决策 | 升维修一次复验 |
| 🛑 REBUILD | 修一次后仍失败/根本性错误 | 建议重建 | git reset --hard 重建(≤2) |

## 📄 报告模板 / Report Template
见 `references/qa-report-template.md`，输出到 `.agents/qa-latest.md`。

## ⚠️ 边界情况 / Edge Cases
（无 CONTEXT.md / 无 git / diff 为空回退 HEAD~1..HEAD / 无测试框架→NEEDS_FIX /
E2E 起服务失败降级 / 首次无 baseline / E2E flake 重试1次 / 用户要求跳过→提醒无验证不固化。）
````

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test 2>&1 | tail -20`
Expected: PASS — all `engineer-qa` assertions green; total suite green.

- [ ] **Step 5: Commit**

```bash
git add skills/engineer-qa/SKILL.md tests/engineer-job.test.js
git commit -m "feat(engineer-qa): add test-acceptance skill core"
```

---

### Task 2: engineer-qa reference files

**Files:**
- Create: `skills/engineer-qa/references/coverage-tools.md`
- Create: `skills/engineer-qa/references/e2e-playbook.md`
- Create: `skills/engineer-qa/references/qa-report-template.md`
- Modify: `tests/engineer-job.test.js` (extend the `engineer-qa` describe)
- Test: `tests/engineer-job.test.js`

**Interfaces:**
- Consumes: the `engineer-qa` SKILL.md from Task 1 (references it links to).
- Produces: `coverage-tools.md` (per-language branch-coverage commands), `e2e-playbook.md` (agent-browser orchestration + degradation), `qa-report-template.md` (the `.agents/qa-latest.md` structure).

- [ ] **Step 1: Write the failing test** — add to the `engineer-qa` describe in `tests/engineer-job.test.js`:

```javascript
    it('ships reference files', () => {
      const ref = path.join(SKILL_DIR, 'engineer-qa', 'references');
      for (const f of ['coverage-tools.md', 'e2e-playbook.md', 'qa-report-template.md']) {
        assert.ok(fs.existsSync(path.join(ref, f)), `missing references/${f}`);
      }
      const cov = fs.readFileSync(path.join(ref, 'coverage-tools.md'), 'utf-8');
      assert.ok(cov.includes('--cov-branch') || cov.includes('branch'),
        'coverage-tools must document branch coverage');
      const e2e = fs.readFileSync(path.join(ref, 'e2e-playbook.md'), 'utf-8');
      assert.ok(e2e.includes('agent-browser'), 'e2e-playbook must reference agent-browser');
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A2 "ships reference"`
Expected: FAIL — `missing references/coverage-tools.md`.

- [ ] **Step 3: Create the three reference files.**

`skills/engineer-qa/references/coverage-tools.md`:

````markdown
# 覆盖率工具链 / Coverage Tools

> engineer-qa ② 单元层读取本文件确定覆盖率命令。优先用项目原生配置里的既有测试命令，
> 本表为回退。目标口径：**本轮变更(diff) 分支覆盖率 ≥ 90%**。

| 语言/框架 | 覆盖率命令（含分支） | 分支支持 |
|-----------|--------------------|:--------:|
| Python (pytest) | `pytest --cov --cov-branch --cov-report=term-missing` | ✅ |
| JS/TS (jest) | `jest --coverage --coverageReporters=text` | ✅ (branches 列) |
| JS/TS (vitest) | `vitest run --coverage` | ✅ |
| JS/TS (c8) | `c8 --branches 90 --check-coverage <cmd>` | ✅ |
| Go | `go test -covermode=count -coverprofile=cover.out ./...` | ⚠️ 行覆盖为主，分支降级告警 |
| Rust | `cargo tarpaulin --out Stdout` | ⚠️ 行覆盖为主，分支降级告警 |
| Java (JaCoCo) | `mvn test`（读 target/site/jacoco，branch counter） | ✅ |

## Diff 分支覆盖计算
1. `git diff --name-only`（回退 `--cached` / `HEAD~1..HEAD`）取变更文件。
2. 跑上表命令产出覆盖率报告。
3. 只统计变更文件/函数的分支命中率；`< 90%` → NEEDS_FIX，列出未覆盖分支 `file:line`。

## 全局 ratchet — `.agents/qa-baseline.json`
```json
{ "line_coverage": 0.0, "branch_coverage": 0.0, "updated_at": "<git-commit-hash>" }
```
- 本轮全局覆盖率 < 基线 → NEEDS_FIX。达标 → 覆盖写回（只升不降）。首次无文件 → 建立基线，仅 diff 门禁。

## 降级
工具不支持分支覆盖 → 用行覆盖按 90% 判 + 报告告警"分支覆盖不可用，已降级为行覆盖"。
````

`skills/engineer-qa/references/e2e-playbook.md`:

````markdown
# E2E 编排手册 / E2E Playbook (agent-browser)

> engineer-qa ④ E2E 层读取本文件。触发时机：功能/项目开发完成后负载一次。

## 标准流程
1. 探测启动命令（CONTEXT.md 运行/部署章节 → package.json scripts / Makefile / README）。
2. 后台起服务，等待就绪（探测端口/健康检查）。
3. `Skill: agent-browser` 脚本化驱动关键链路：导航 → 填表 → 点击 → 断言 DOM/文本/状态。
4. 断言来源：CONTEXT.md 用户链路/验收标准 → 缺失则从实体 CRUD 推断最小链路。
5. 截图取证 → `.agents/qa-e2e/<链路名>-<步骤>.png`。
6. flake：单链路失败自动重试 1 次，再失败判 FAIL。
7. 收尾：关闭服务，汇总通过/失败链路。

## 无 UI 项目降级 / Degradation
| 项目类型 | E2E 降级方式 |
|---------|-------------|
| API 服务 | 起服务 + HTTP 断言 CRUD 全链路（创建→读取→更新→删除）+ 错误路径 |
| CLI 工具 | 子命令 E2E：安装→运行→输出/退出码断言 |
| Library | 跳过 E2E，报告标注"库项目无 E2E，以单元+集成为终验" |

> 报告必须显式标注 E2E 是否降级及原因。E2E 环境不可用（起服务失败）→ 跳过并标注，②③层仍须过。
````

`skills/engineer-qa/references/qa-report-template.md`:

````markdown
# QA 验收报告模板 / Report Template → `.agents/qa-latest.md`

```markdown
# 🔍 QA 验收报告 / QA Acceptance Report

## 摘要 / Summary
**结论**: [ ✅ PASS / ⚠️ NEEDS_FIX / 🛑 REBUILD ]
**项目类型**: [API/CLI/Web/Library]　**E2E**: [执行 / 降级(原因) / 跳过(原因)]
**本轮范围**: [git diff 摘要]

## 一、测试金字塔 / Test Pyramid
| 层 | 命令 | 通过/总数 | 覆盖率 | 说明 |
|----|------|:--------:|:------:|------|
| 单元 | [cmd] | N/N | diff分支 X% | [未覆盖分支 file:line] |
| 集成 | [cmd] | N/N | — | [CRUD/错误路径] |
| E2E | agent-browser/[降级] | N/N | — | [链路名 + 截图路径] |

## 二、覆盖率门禁 / Coverage Gate
| 指标 | 本轮 | 门禁 | 基线 | 判定 |
|------|:----:|:----:|:----:|:----:|
| diff 分支覆盖率 | X% | ≥90% | — | ✅/⚠️ |
| 全局分支覆盖率 | X% | ≥基线 | Y% | ✅/⚠️ |

## 三、问题明细 / Issues
- [严重/建议]：[file:line] — [描述]

## 四、决策建议 / Recommendation
[结论 + 理由 + 后续步骤：提交 / 升维修一次 / 重建]
```
````

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test 2>&1 | grep -A2 "ships reference"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/engineer-qa/references/ tests/engineer-job.test.js
git commit -m "feat(engineer-qa): add coverage/e2e/report reference files"
```

---

### Task 3: Hook engineer-workflow step 7 → engineer-qa

**Files:**
- Modify: `skills/engineer-workflow/SKILL.md` (第七步 验收 block, around lines 281-293)
- Modify: `tests/engineer-job.test.js`
- Test: `tests/engineer-job.test.js`

**Interfaces:**
- Consumes: `engineer-qa` skill (Task 1) as the delegated test gate.
- Produces: engineer-workflow step 7 now delegates test+coverage to engineer-qa (②③ layers, per-milestone).

- [ ] **Step 1: Write the failing test** — add a new describe in `tests/engineer-job.test.js`:

```javascript
  describe('engineer-qa pipeline hooks', () => {
    const read = (s) => fs.readFileSync(path.join(SKILL_DIR, s, 'SKILL.md'), 'utf-8');

    it('engineer-workflow step 7 delegates to engineer-qa', () => {
      assert.ok(read('engineer-workflow').includes('engineer-qa'),
        'workflow acceptance should delegate to engineer-qa');
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A2 "delegates to engineer-qa"`
Expected: FAIL — assertion false.

- [ ] **Step 3: Edit `skills/engineer-workflow/SKILL.md`.** In 第七步 验收 (the `**检查清单**` list near line 286-293), replace the `- [ ] **测试运行**` line with a delegation note:

```markdown
- [ ] **测试与覆盖率门禁（委托 engineer-qa）** — 调用 `engineer-qa`（②单元层 + ③集成层）：
      运行测试 + 本轮变更(diff)分支覆盖率 ≥90% 硬门禁 + 全局不回退。测试或覆盖率不达标 = 里程碑验收失败（NEEDS_FIX），进入既有升维/重建分支。E2E(④层)不在里程碑级跑，留待集成阶段负载一次。
```

Also in 第八步 分支判断 table (near line 300-302), append to the ⚠️ 小问题 row: `（含 engineer-qa 覆盖率不足）`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test 2>&1 | grep -A2 "delegates to engineer-qa"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/engineer-workflow/SKILL.md tests/engineer-job.test.js
git commit -m "feat(engineer-workflow): delegate step-7 test gate to engineer-qa"
```

---

### Task 4: Hook run.wf.js QA-Gate + Integrate E2E + meta

**Files:**
- Modify: `skills/engineer-job/run.wf.js` (Run Gate block 722-776; Integrate block 781-805; `meta.phases` lines 11-12)
- Modify: `skills/engineer-job/references/engine.md` (Phase 2.5 / Phase 3 descriptions, lines 128-145)
- Modify: `tests/engineer-job.test.js`
- Test: `tests/engineer-job.test.js` + `node --check`

**Interfaces:**
- Consumes: `engineer-qa` skill + `references/coverage-tools.md`, `references/e2e-playbook.md`.
- Produces: Run Gate prompt now includes the ≥90% diff branch-coverage check; Integrate runs agent-browser E2E once; meta.phases descriptions updated.

- [ ] **Step 1: Write the failing test** — add to the `engineer-qa pipeline hooks` describe:

```javascript
    it('run.wf.js run-gate enforces coverage + integrate runs e2e', () => {
      const wf = fs.readFileSync(
        path.join(SKILL_DIR, 'engineer-job', 'run.wf.js'), 'utf-8');
      assert.ok(wf.includes('--cov-branch') || wf.includes('branch coverage'),
        'run gate should check branch coverage');
      assert.ok(wf.includes('90'), 'run gate should state the 90% bar');
      assert.ok(wf.includes('agent-browser'), 'integrate should drive e2e via agent-browser');
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A2 "run-gate enforces coverage"`
Expected: FAIL.

- [ ] **Step 3a: Edit the Run Gate agent prompt** in `skills/engineer-job/run.wf.js`. Inside the `ctx('run-gate', …)` template (lines 733-744), append these lines before the closing backtick (after the `Return build_ok…` line):

```javascript
=== COVERAGE GATE (engineer-qa ②③) ===
After build+test pass, measure BRANCH coverage on changed files (git diff).
Prefer project-native coverage config; fallback per engineer-qa references/coverage-tools.md
  (e.g. python: "pytest --cov --cov-branch"; node: "jest --coverage"; c8 "--branches 90").
Diff branch coverage MUST be >= 90% (the 90% bar). If the tool lacks branch coverage,
degrade to line coverage and note it. Read/update ".agents/qa-baseline.json" so global
coverage never regresses. Return coverage_ok plus measured diff/global coverage.
```

Update `RUN_GATE_SCHEMA` (find its definition — search `RUN_GATE_SCHEMA =`) to include `coverage_ok`, `diff_coverage`, `global_coverage` as optional properties (mirror existing property style). Update the pass condition at line 748 & 761 from `gate.build_ok && gate.test_ok` to `gate.build_ok && gate.test_ok && (gate.coverage_ok !== false)`.

- [ ] **Step 3b: Edit the Integrate agent prompt** (lines 786-799). Append before the closing backtick:

```javascript

=== E2E ACCEPTANCE (engineer-qa ④, load once) ===
Drive key user journeys end-to-end. If the project has a UI, use the agent-browser skill
(start server, script navigate/fill/click/assert, screenshot to .agents/qa-e2e/).
If NO UI (pure API/CLI/library), degrade per engineer-qa references/e2e-playbook.md:
API -> HTTP black-box CRUD + error paths; CLI -> subcommand e2e; library -> skip and note.
Record E2E pass/fail and whether it was degraded. DO NOT block — record and continue.
```

- [ ] **Step 3c: Edit `meta.phases`** (lines 11-12):

```javascript
    { title: 'Run Gate', detail: 'QA gate: build + unit + integration + diff branch coverage >=90%; fix loop; DOES_NOT_RUN if unfixable' },
    { title: 'Integrate', detail: 'integration + agent-browser E2E (load once, degrade for non-UI) & production readiness' },
```

- [ ] **Step 3d: Sync `skills/engineer-job/references/engine.md`.** In "Phase 2.5: Run Gate" (lines 128-136) add a bullet: `- 覆盖率门禁：本轮 diff 分支覆盖率 ≥90%，全局 ratchet 不回退（委托 engineer-qa ②③层，见其 references/coverage-tools.md）。` In "Phase 3: Integrate" (lines 137-144) add: `4. agent-browser E2E 关键用户链路负载一次（无 UI 降级为黑盒，委托 engineer-qa ④层）。`

- [ ] **Step 4: Verify parse + tests pass**

Run: `node --check --input-type=module < skills/engineer-job/run.wf.js && npm test 2>&1 | tail -15`
Expected: parses OK; suite green including `run-gate enforces coverage`.

- [ ] **Step 5: Commit**

```bash
git add skills/engineer-job/run.wf.js skills/engineer-job/references/engine.md tests/engineer-job.test.js
git commit -m "feat(engineer-job): QA-gate coverage + agent-browser E2E in pipeline"
```

---

### Task 5: Truth-source convergence + engineer-next routing

**Files:**
- Modify: `skills/engineer-inspector/SKILL.md` (信号6 测试合规性, lines 217-241 + report table 335-346)
- Modify: `skills/engineer-next/SKILL.md` (decision table, around lines 117-131 + edge cases)
- Modify: `skills/init-project/references/test-patterns.md` (top note)
- Modify: `tests/engineer-job.test.js`
- Test: `tests/engineer-job.test.js`

**Interfaces:**
- Consumes: `engineer-qa` as the delegated test authority.
- Produces: inspector signal 6 converged to a pointer; engineer-next routes `dev DONE but qa not passed` → engineer-qa; test-patterns notes the 90% truth source.

- [ ] **Step 1: Write the failing test** — add to `engineer-qa pipeline hooks` describe:

```javascript
    it('inspector signal-6 points to engineer-qa', () => {
      assert.ok(read('engineer-inspector').includes('engineer-qa'),
        'inspector should delegate test compliance to engineer-qa');
    });

    it('engineer-next can route to engineer-qa', () => {
      assert.ok(read('engineer-next').includes('engineer-qa'),
        'resume router should know engineer-qa');
    });

    it('test-patterns names the 90% truth source', () => {
      const tp = fs.readFileSync(
        path.join(SKILL_DIR, 'init-project', 'references', 'test-patterns.md'), 'utf-8');
      assert.ok(tp.includes('engineer-qa') && tp.includes('90'),
        'test-patterns should point to engineer-qa 90% gate');
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A2 "points to engineer-qa"`
Expected: FAIL.

- [ ] **Step 3a: Converge inspector signal 6.** In `skills/engineer-inspector/SKILL.md`, replace the body of `#### 信号 6：测试合规性` (lines 217-241) with a pointer, keeping the heading:

```markdown
> **测试/覆盖率合规现由 `engineer-qa` 裁决**（测试金字塔 + diff 分支覆盖率 ≥90% + 全局 ratchet + agent-browser E2E）。inspector 只做快速前置检查：diff 中是否**包含**测试文件？若完全无测试 → 提示"调用 engineer-qa 做测试验收，无验证不固化"。详细门禁与报告见 engineer-qa。
```

In the report template `### 6️⃣ 测试合规性` table (lines 335-346), replace with a single row: `| 测试验收 | ➡️ 委托 engineer-qa | 见 .agents/qa-latest.md |`.

- [ ] **Step 3b: Add engineer-next route.** In `skills/engineer-next/SKILL.md` decision table (lines 117-131), add a row after 1c:

```markdown
| 1c+ | `job.state.json` 在，`development` DONE 但无 QA 记录 / `.agents/qa-latest.md` 结论非 PASS | 补测试验收 | **路由 engineer-qa** 跑测试门禁（②③④层），通过后再进收尾 |
```

And in Edge Cases table add: `| development DONE 但测试门禁未过 | 路由 engineer-qa 补验收，PASS 后再交 job 收尾 |`.

- [ ] **Step 3c: Note the truth source.** At the top of `skills/init-project/references/test-patterns.md` (after the blockquote on line 3), add:

```markdown
> **门禁真源 / Gate authority**: 进入验收后，测试门禁以 `engineer-qa` 的 **diff 分支覆盖率 ≥90% + 全局 ratchet** 为准；本表的 70%/80% 为最低下限参考。
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test 2>&1 | tail -15`
Expected: PASS (all three new assertions + full suite green).

- [ ] **Step 5: Commit**

```bash
git add skills/engineer-inspector/SKILL.md skills/engineer-next/SKILL.md skills/init-project/references/test-patterns.md tests/engineer-job.test.js
git commit -m "refactor: converge test-gate truth source to engineer-qa + route via engineer-next"
```

---

### Task 6: Register engineer-qa in READMEs

**Files:**
- Modify: `README.md` (skill list ~line 66, decision table ~line 99, file tree ~line 232, mermaid ~line 30)
- Modify: `README.zh-CN.md` (mirror positions)
- Modify: `tests/engineer-job.test.js`
- Test: `tests/engineer-job.test.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: engineer-qa documented in both READMEs so users discover the gate.

- [ ] **Step 1: Write the failing test** — add to `engineer-qa pipeline hooks` describe:

```javascript
    it('both READMEs register engineer-qa', () => {
      const root = path.join(__dirname, '..');
      for (const f of ['README.md', 'README.zh-CN.md']) {
        assert.ok(fs.readFileSync(path.join(root, f), 'utf-8').includes('engineer-qa'),
          `${f} should register engineer-qa`);
      }
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A2 "register engineer-qa"`
Expected: FAIL.

- [ ] **Step 3a: Edit `README.md`.** After the `engineer-inspector` bullet (line 66) add:

```markdown
- `engineer-qa` — **AI Test Acceptance Engine**. Auto-triggers after feature development as the single source of truth for the test gate: runs the test pyramid (unit → integration → E2E), enforces **≥90% branch coverage on changed code** with a global no-regression ratchet, and drives key user journeys end-to-end via `agent-browser` (degrading to black-box API/CLI acceptance for non-UI projects). Emits `.agents/qa-latest.md` with a `PASS / NEEDS_FIX / REBUILD` verdict.
```

In the mermaid graph (line 30), add: `INS --> QA["engineer-qa<br/>test gate"]`. In the decision table (after line 99): `| Verify a finished feature meets the test gate (unit + coverage + E2E) | \`engineer-qa\` | pass/fix/rebuild verdict |`. In the file tree (near line 232, after `engineer-inspector/`): `├── engineer-qa/`.

- [ ] **Step 3b: Edit `README.zh-CN.md`** mirroring: skill-list bullet after `engineer-inspector` (line 66), mermaid node (line 30) `INS --> QA["engineer-qa<br/>测试门禁"]`, decision table row, file tree `├── engineer-qa/` (line 232). Bullet text:

```markdown
- `engineer-qa` — **AI 测试验收引擎**。功能开发完成后自动触发，是测试门禁的单一真源：跑测试金字塔（单元→集成→E2E），强制**变更代码分支覆盖率 ≥90%** 且全局不回退，用 `agent-browser` 驱动关键用户链路 E2E（无 UI 项目降级为 API/CLI 黑盒验收），输出 `.agents/qa-latest.md`（PASS / NEEDS_FIX / REBUILD）。
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test 2>&1 | tail -15`
Expected: PASS — full suite green.

- [ ] **Step 5: Commit**

```bash
git add README.md README.zh-CN.md tests/engineer-job.test.js
git commit -m "docs: register engineer-qa in READMEs"
```

---

## Self-Review

**Spec coverage:**
- §D1 new skill + hooks → Tasks 1,2 (skill) + 3,4,5 (hooks). ✅
- §D2 diff branch ≥90% + ratchet → Task 1 (SKILL), Task 2 (coverage-tools + baseline), Task 4 (run-gate). ✅
- §D3 E2E once + non-UI degrade → Task 1 (④ stage), Task 2 (e2e-playbook), Task 4 (Integrate). ✅
- §D4 CRUD + error paths × pyramid → Task 1 (②③④ stages), Task 2 (report template). ✅
- §5.4 all seven hook points → workflow (T3), run.wf.js run-gate+integrate+meta+engine.md (T4), inspector signal6 (T5), engineer-next (T5), test-patterns (T5). ✅
- §5.5 README registration → Task 6. ✅
- §8 skill-verification (trigger/pipeline/degradation/routing) → encoded as the Node assertions across Tasks 1-6 (structural), with live pipeline validation deferred to real use. ✅

**Placeholder scan:** No TBD/TODO. Section-skeleton prose in Task 1 Step 3 is marked with concrete instructions + all test-checked tokens present verbatim; parenthetical "(fill prose from spec)" points to specific spec sections, not vague filler.

**Type consistency:** Verdict tokens `PASS/NEEDS_FIX/REBUILD`, state files `.agents/qa-latest.md` / `.agents/qa-baseline.json` / `.agents/qa-e2e/`, stage names `静态盘点/单元层/集成层/E2E 层`, and the `90` bar are used identically across all tasks and match the assertions. `RUN_GATE_SCHEMA` extension (Task 4) named consistently. ✅
