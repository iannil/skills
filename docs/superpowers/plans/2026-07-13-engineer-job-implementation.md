# engineer-job — 全自动项目编排引擎 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `engineer-job` meta-orchestrator skill and add `--mode` support to all 5 existing engineer-* skills, enabling fully automated project building from simple requirements.

**Architecture:** engineer-job acts as a skill-level lifecycle manager that dispatches each phase (init→architect→orchestrate→integrate→deploy→report) as a fresh subagent through the Agent tool, using `.agents/job.state.json` for cross-session persistence. Each existing skill gets a `## ⚙️ 模式选择` section documenting its auto/silent behaviour at each decision point.

**Tech Stack:** SKILL.md markdown files (behavior definitions for AI agents), no runtime code changes.

## Global Constraints

- All skills follow the existing `skills/<name>/SKILL.md` layout
- Mode semantics are consistent across all skills: `normal` = confirm at key points, `auto` = default decisions auto-proceed, `silent` = fully quiet with only final output
- The `## ⚙️ 模式选择 / Mode Selection` section must use the canonical template from the design spec (section 7.2)
- All documentation text is bilingual (Chinese + English)
- No runtime code changes — all modifications are to SKILL.md markdown

---

## File Map

### New files:
- `skills/engineer-job/SKILL.md` — Meta-orchestrator: 6-phase lifecycle, subagent dispatch, phase-level self-healing, recovery flow

### Modified files:
- `skills/init-project/SKILL.md` — Add `## ⚙️ 模式选择` section; document auto defaults for 6 tech-stack decision points; replace "ask then confirm" with "infer then optionally ask" for auto mode
- `skills/engineer-architect/SKILL.md` — Add `## ⚙️ 模式选择` section; document auto defaults for 8 blueprint decision points; document silent mode filtering
- `skills/engineer-inspector/SKILL.md` — Add `## ⚙️ 模式选择` section; document auto defaults for PASS/NEEDS_FIX/REBUILD
- `skills/engineer-workflow/SKILL.md` — Add `## ⚙️ 模式选择` section; add self-healing section; document rebuild thresholds per mode
- `skills/engineer-orchestrator/SKILL.md` — Add `## ⚙️ 模式选择` section; add job.state.json persistence section; add cross-session recovery section
- `README.md` — Add engineer-job to available skills list

### Test files:
- `tests/engineer-job.test.js` — Smoke test verifying engineer-job SKILL.md parses and has required sections

---

## Tasks

### Task 1: Create `skills/engineer-job/SKILL.md`

**Files:**
- Create: `skills/engineer-job/SKILL.md`

**Interfaces:**
- Consumes: User's simple project requirement + optional `--auto`/`--silent` flag
- Produces: A complete project with CONTEXT.md, code, git history, deployment config

- [ ] **Step 1: Write the skill metadata (frontmatter + trigger conditions)**

```yaml
---
name: engineer-job
description: >
  AI项目全自动构建引擎 — 从零开始自动完成整个项目构建。
  输入简单的需求描述和项目背景，自动执行：
  项目脚手架 → 架构设计 → 多功能编排开发 → 集成验收 → 部署配置生成。
  支持 --auto（自动确认）和 --silent（静默）模式实现无人值守。
  TRIGGERS: 用户说"帮我从零做一个""全自动构建""帮我搭建一个完整的"
  "automate project building""full project from scratch""build project auto"
  "做一个完整的""全链路开发""自动从头到尾做一个"
  也触发于：用户在 architect 或 init-project 完成后说"继续""自动做下去"。
  比 engineer-orchestrator 更高一级——orchestrator 管项目内功能编排，
  job 管技能间编排（含脚手架和架构设计阶段）。
compatibility: "agent, bash, write, edit, read"
---
```

- [ ] **Step 2: Write Core Philosophy section**

Three principles:
1. **阶段即子代理 / Phases Are Sub-Agents** — each phase runs in a fresh subagent with clean context. The main session only manages state transitions.
2. **状态即文件 / State Is Files** — all progress is written to `.agents/job.state.json`. No state lives in conversation context.
3. **降级优于阻塞 / Degrade Over Block** — when a phase meets unresolvable failure, degrade to the next working option rather than stopping for human input (in `--auto` mode).

- [ ] **Step 3: Write the 6-phase orchestration workflow with mermaid diagram**

Use the exact flow from design doc section 6.2 (the mermaid diagram with Phase 0-5).

Each phase has explicit failure handling:
- Phase 0 (init): retry 1 → terminate
- Phase 1 (architect): retry 1 → degrade to skeleton CONTEXT.md
- Phase 2 (orchestrate): feature-level self-healing via workflow
- Phase 3 (integrate): log failures, never block
- Phase 4 (deploy): log warnings, never block
- Phase 5 (report): always succeeds

- [ ] **Step 4: Write subagent dispatch pattern section**

```markdown
## 🤖 子代理调度模式 / Sub-Agent Dispatch Pattern

每个阶段作为独立的 Agent 子代理执行：

```
engineer-job（主会话）
  ├── 读取 .agents/job.state.json → 确定当前阶段
  ├── [Agent] Phase 0: init-project
  ├── [Agent] Phase 1: engineer-architect
  ├── [Agent] Phase 2: engineer-orchestrator
  │     └── [Agent] engineer-workflow × N
  ├── [Agent] Phase 3: integration
  ├── [Agent] Phase 4: deploy config
  └── [Agent] Phase 5: final report
```

**约束条件：**
1. 每个子代理的工作范围有明确边界（一个阶段或一个里程碑）
2. 子代理的上下文只包含当前任务所需的最少信息
3. 子代理之间的状态通过文件传递（CONTEXT.md, job.state.json）
4. 子代理返回简短状态码：DONE / DONE_WITH_CONCERNS / BLOCKED
```

- [ ] **Step 5: Write the phase progression table**

Use the exact table from design doc section 2.2 (6 rows: phase number, name, skill invoked, input→output, failure handling).

- [ ] **Step 6: Write the mode selection and auto-confirm section**

Document the three-level mode system (normal/auto/silent) using the canonical template from section 7.2, adapted for engineer-job's phase-level scope.

| 模式 | 阶段间行为 | 异常时行为 |
|:----:|-----------|-----------|
| normal | 每个阶段完成后暂停报告，等用户确认后进入下一阶段 | 报告错误，等待用户决策 |
| auto | 阶段间自动推进，只在终止级失败时暂停 | 自动降级/跳过，记录到最终报告 |
| silent | 阶段间自动推进，无输出 | 静默处理，只记日志 |

- [ ] **Step 7: Write the self-healing section (phase level)**

Include the self-healing loop diagram from design doc section 6.3, plus the phase-level failure handling table from section 4.5.

- [ ] **Step 8: Write the cross-session recovery section**

Recovery flow:
1. Check `.agents/job.state.json`
2. Read current phase and next action
3. Verify git state against `checkpoint.last_commit`
4. Run tests to verify code state
5. Continue from the next TODO phase/milestone

Include the recovery triage diagram from design doc section 5.3.

- [ ] **Step 9: Write job.state.json schema documentation**

Include the full example JSON from design doc section 5.1, plus the status value definitions (TODO/IN_PROGRESS/DONE/BLOCKED/SKIPPED).

- [ ] **Step 10: Write the final report template**

Section detailing what the final output looks like: completion checklist, file count, milestone status, degradation log, deployment config status.

- [ ] **Step 11: Write edge cases section**

| 场景 | 处理方式 |
|------|---------|
| job.state.json 不存在 | 回退到 progress.json → 回退到 CONTEXT.md → 从用户问起 |
| job.state.json 与 git 状态不一致 | 运行 git log 验证，报告差异，询问用户 |
| 子代理超时 | 默认 10 分钟超时，超时后标记 BLOCKED |
| 同一项目重复启动 | 检测 job.state.json 存在，提示恢复 |
| 用户中途说"暂停" | 记录当前进度到 job.state.json，commit 当前工作，输出恢复指令 |

- [ ] **Step 12: Verify the file**

Read the completed `skills/engineer-job/SKILL.md` and check:
- [ ] Frontmatter is valid (name, description, triggers)
- [ ] All 6 phases are documented
- [ ] Subagent dispatch pattern is documented
- [ ] Mode selection (`## ⚙️ 模式选择`) section exists
- [ ] Self-healing section exists
- [ ] Recovery section exists
- [ ] job.state.json schema is documented
- [ ] Edge cases are covered

- [ ] **Step 13: Commit**

```bash
git add skills/engineer-job/SKILL.md
git commit -m "feat: add engineer-job meta-orchestrator skill with 6-phase lifecycle and cross-session persistence"
```

---

### Task 2: Modify `init-project/SKILL.md` for `--mode`

**Files:**
- Modify: `skills/init-project/SKILL.md`

**Interfaces:**
- Consumes: User project description + optional `--mode` flag
- Produces: Project scaffolding with tech stack appropriate for the mode

- [ ] **Step 1: Add mode selection section after trigger conditions**

Insert after the `## 🚦 触发条件 / When to Trigger` section (currently ends at "除非用户明确说不需要某些结构"):

```markdown
## ⚙️ 模式选择 / Mode Selection

通过 `--mode` 参数控制自动确认程度（默认 normal）：

| 模式 | 行为 |
|:----:|------|
| normal | 问 5-8 个问题 → 展示文件树 → 等待确认后生成 |
| auto | 从需求推断默认值，只问推断置信度低于 60% 的问题（最多 2 个） |
| silent | 全部使用默认值，不提问，直接生成 |

### auto 模式默认决策

| 决策点 | 默认行为 |
|--------|---------|
| 技术栈选择 | 从需求推断默认技术栈（预定义模板匹配） |
| 项目元信息 | 从目录名/已有配置推断 |
| 许可证 | 默认 MIT（或项目已有许可证） |
| CI/CD | 默认 GitHub Actions（如适用） |
| Docker | 根据项目类型默认决定（服务端=需要，库=不需要） |
| 文件树确认 | 直接生成 |

### silent 模式附加行为

- 无进度条输出，仅记录日志
- 连低置信度推断也不提问——使用最保守的默认值
- 直接在 `pwd` 或指定目录生成项目结构
```

- [ ] **Step 2: Add auto-mode override logic to Step 1 of the core workflow**

In the "Step 1: 推断 + 提问" section, change the instruction from "一次性问 5-8 个问题" to something like:

```markdown
**提问逻辑受 --mode 控制**：
- `normal`：一次性问 5-8 个问题覆盖所有未知信息
- `auto`：先推断默认值，只问推断置信度 < 60% 的问题（最多问 2 个）
- `silent`：全部使用默认值，跳过提问阶段
```

- [ ] **Step 3: Verify the file**

Read the modified file and check:
- [ ] `## ⚙️ 模式选择` section exists after trigger conditions
- [ ] All 6 auto decision points documented
- [ ] Silent mode behavior documented
- [ ] Step 1 mentions mode-dependent question count

- [ ] **Step 4: Commit**

```bash
git add skills/init-project/SKILL.md
git commit -m "feat(init-project): add --mode (normal/auto/silent) with tech stack inference"
```

---

### Task 3: Modify `engineer-architect/SKILL.md` for `--mode`

**Files:**
- Modify: `skills/engineer-architect/SKILL.md`

**Interfaces:**
- Consumes: Project requirements + optional `--mode` flag
- Produces: CONTEXT.md blueprint with auto-generated decisions in auto mode

- [ ] **Step 1: Add mode selection section after trigger conditions**

Insert after the `# 🚦 触发条件 / When to Trigger` section (currently ends at `如果用户描述的是单个功能/模块需求 → 触发 engineer-workflow`):

```markdown
## ⚙️ 模式选择 / Mode Selection

通过 `--mode` 参数控制自动确认程度（默认 normal）：

| 模式 | 行为 |
|:----:|------|
| normal | 每个设计步骤展示后等待用户确认 |
| auto | 使用 AI 推荐的默认决策自动推进，仅在重大异常时暂停 |
| silent | 全部自动，静默执行，仅在终止级失败时暂停 |

### auto 模式默认决策

| 阶段 | 决策点 | auto 模式行为 |
|:----:|--------|-------------|
| 需求收敛 | 需求理解摘要确认 | 跳过，直接进入技术选型 |
| 蓝图设计 | 技术选型确认 | 使用 AI 推荐的默认技术栈 |
| 蓝图设计 | 领域词汇表确认 | 直接使用 AI 生成的定义 |
| 蓝图设计 | 数据模型确认 | 直接使用 AI 生成的设计 |
| 蓝图设计 | API 契约确认 | 直接使用 AI 生成的设计 |
| 蓝图设计 | 里程碑确认 | 直接使用 AI 生成的规划 |
| 固化 | 完整蓝图审核 | 自动批准，记录决策日志 |
| 固化 | ADR 创建 | 条件满足时自动创建 |
| 固化 | 蓝图提交 | 自动 git add + commit |

### silent 模式附加行为

- 无阶段摘要输出
- 不展示任何"请确认"提示
- 使用最保守的默认值（第一个推荐的选项）
- 仅输出最终提交的 commit hash
```

- [ ] **Step 2: Add mode awareness to Phase 1 (需求收敛) instructions**

In the "第一步：理解场景" section, add a note:

```markdown
**模式感知**：在 `--auto` 模式下，生成需求理解摘要后不等待确认，直接进入技术选型。
在 `--silent` 模式下，不输出需求理解摘要，直接进入技术选型。
```

- [ ] **Step 3: Add mode awareness to Phase 3 (固化) instructions**

In the "第十步：用户审核蓝图" section, add:

```markdown
**模式感知**：
- `normal`：展示完整蓝图等待用户逐项确认
- `auto`：展示蓝图摘要后自动批准，仅记录关键决策的日志
- `silent`：不展示蓝图，直接提交并记录 commit hash
```

- [ ] **Step 4: Verify the file**

Read the modified file and check:
- [ ] `## ⚙️ 模式选择` section exists after trigger conditions
- [ ] All 9 auto decision points documented
- [ ] Silent mode additional behaviors documented
- [ ] Phase 1 and Phase 3 mention mode awareness

- [ ] **Step 5: Commit**

```bash
git add skills/engineer-architect/SKILL.md
git commit -m "feat(engineer-architect): add --mode (normal/auto/silent) with auto blueprint approval"
```

---

### Task 4: Modify `engineer-inspector/SKILL.md` for `--mode`

**Files:**
- Modify: `skills/engineer-inspector/SKILL.md`

**Interfaces:**
- Consumes: Code changes + blueprint + optional `--mode` flag
- Produces: Inspection report with auto-executed decisions in auto mode

- [ ] **Step 1: Add mode selection section after trigger conditions**

Insert after the `## 🚦 触发条件 / When to Trigger` section (currently ends at `User says "next" after AI code generation without verification`):

```markdown
## ⚙️ 模式选择 / Mode Selection

通过 `--mode` 参数控制自动确认程度（默认 normal）：

| 模式 | 行为 |
|:----:|------|
| normal | 展示验收报告，等待用户决定下一步 |
| auto | 自动执行验收决策：PASS→继续，NEEDS_FIX→自动修复，REBUILD→自动重建 |
| silent | 全部自动，静默执行，仅记录报告到文件 |

### auto 模式验收决策

| 结论 | auto 模式行为 |
|:----:|--------------|
| ✅ PASS | 自动进入下一步（提交或继续下一个里程碑） |
| ⚠️ NEEDS_FIX | 自动下发升维指令给 AI 修复一次，修复后重新验收 |
| 🛑 REBUILD | 自动执行 git reset --hard + 重建（不超过 2 次） |
```

- [ ] **Step 2: Add auto-decision logic to the Decision Framework section**

In the `## 🧭 决策框架` section, add a note at the end:

```markdown
### auto 模式执行规则

当 `--mode` 为 auto 或 silent 时，以上决策自动执行而不等待用户确认：

1. **PASS** → 不展示报告（silent）或展示摘要（auto），然后继续
2. **NEEDS_FIX** → 自动调用 AI 修复，修复后重新运行验收
3. **REBUILD** → 自动执行 `git reset --hard HEAD`，通知调用方重建

**silent 模式**额外：
- 不输出验收报告到 stdout
- 报告写入 `.agents/inspection-latest.md`
- 仅当检测到 🔴 级别问题时才会输出
```

- [ ] **Step 3: Verify the file**

Read the modified file and check:
- [ ] `## ⚙️ 模式选择` section exists after trigger conditions
- [ ] All 3 auto decision behaviours documented
- [ ] Decision framework has auto-mode execution rules

- [ ] **Step 4: Commit**

```bash
git add skills/engineer-inspector/SKILL.md
git commit -m "feat(engineer-inspector): add --mode (normal/auto/silent) with auto-executed PASS/FIX/REBUILD"
```

---

### Task 5: Modify `engineer-workflow/SKILL.md` for `--mode` + self-healing

**Files:**
- Modify: `skills/engineer-workflow/SKILL.md`

**Interfaces:**
- Consumes: Feature description + CONTEXT.md + optional `--mode` flag
- Produces: Working code with tests, committed. In auto mode: self-healed on failure.

- [ ] **Step 1: Add mode selection section after trigger conditions**

Insert after the `## 🚦 触发条件 / When to Trigger` section (currently ends at `"implement the complete [feature]"`):

```markdown
## ⚙️ 模式选择 / Mode Selection

通过 `--mode` 参数控制自动确认程度（默认 normal）：

| 模式 | 行为 |
|:----:|------|
| normal | 每个里程碑计划展示后等待确认；验收发现问题时等待用户决策 |
| auto | 里程碑计划确认→直接执行；验收自动执行分支判断 |
| silent | 全部自动，静默执行，仅记录日志 |

### auto 模式默认决策

| 决策点 | auto 模式行为 |
|--------|-------------|
| 里程碑计划展示 | 直接开始执行，不等待确认 |
| 验收 PASS | 自动提交 + 进入下一个里程碑 |
| 验收 NEEDS_FIX | 自动下发升维指令修复一次 |
| 验收 REBUILD | 自动 git reset --hard + 重建 |
| 提交确认 | 自动 git add + commit |

### silent 模式附加行为

- 不输出里程碑进度（仅记录到日志）
- 不展示实施计划
- 不展示测试运行输出（只记录 pass/fail 计数）
- 里程碑完成后不输出摘要
```

- [ ] **Step 2: Add self-healing section after the workflow architecture**

Insert a new section after the `## 🏗️ 工作流架构` section (or after step 8's branch decision):

```markdown
## 🔧 自愈机制 / Self-Healing

### 代码级自愈

在 `--auto` 和 `--silent` 模式下，编译/测试失败自动触发自愈流程：

```
编译错误/测试失败
  ├── 捕获错误输出
  ├── [尝试 1] 发送修复指令给 AI
  │   ├── ✅ 修复成功 → 继续验收流程
  │   └── ❌ 修复失败 → git reset --hard → 重建
  ├── [尝试 2] 重建后再次失败
  │   → 自动降级里程碑范围
  └── [尝试 N] 降级后仍然失败 → 标记 SKIPPED
```

### 降级策略

1. **简化范围**：移除非核心功能（如 API 只保留 Create+Read，跳过 Update+Delete）
2. **退化为 coach 模式**：全自动 workflow 失败后，退化为半自动 coach 流程
3. **跳过+记录**：标记为 SKIPPED + 失败原因，继续下一个里程碑

### 重建阈值

| 模式 | 重建 1 次 | 重建 2 次 | 重建 3 次 |
|:----:|:---------:|:---------:|:---------:|
| normal | 自动重建 | ⏸ 暂停报告用户 | 等待用户决策 |
| auto | 自动重建 | 自动降级 | 跳过，记录原因 |
| silent | 自动重建 | 自动降级 | 跳过，静默记录 |

**重建计数规则**：
- 重建后 git commit hash 变化 → 计数重置
- 跨会话重置不重置计数
- 降级后如果成功 → 通过，报告标注为"降级通过"
```

- [ ] **Step 3: Add auto-mode awareness to step 2 (user confirmation)**

In the "第二步：用户确认" section, change the instruction:

```markdown
**模式感知**：
- `normal`：展示计划，等待用户确认后再执行
- `auto`：展示计划后不等待确认，直接开始执行第一个里程碑
- `silent`：不展示计划，直接开始执行
```

- [ ] **Step 4: Add auto-mode awareness to step 8 (branch decision)**

In the "第八步：分支判断" section, note that in auto mode, the branch decision is executed automatically without asking. Add:

```markdown
**模式感知**：在 `--auto` 和 `--silent` 模式下，分支判断自动执行而不等待用户确认。
具体行为请参见上方"auto 模式默认决策"表格。
```

- [ ] **Step 5: Verify the file**

Read the modified file and check:
- [ ] `## ⚙️ 模式选择` section exists after trigger conditions
- [ ] `## 🔧 自愈机制` section exists
- [ ] Degradation strategies documented
- [ ] Rebuild thresholds table present
- [ ] Step 2 and Step 8 mention mode awareness

- [ ] **Step 6: Commit**

```bash
git add skills/engineer-workflow/SKILL.md
git commit -m "feat(engineer-workflow): add --mode (normal/auto/silent) and self-healing with auto-degrade"
```

---

### Task 6: Modify `engineer-orchestrator/SKILL.md` for `--mode` + progress persistence

**Files:**
- Modify: `skills/engineer-orchestrator/SKILL.md`

**Interfaces:**
- Consumes: CONTEXT.md blueprint + optional `--mode` flag + `.agents/job.state.json` (if resuming)
- Produces: All features implemented + `.agents/job.state.json` + `.agents/job.progress.md`

- [ ] **Step 1: Add mode selection section after trigger conditions**

Insert after the `## 🚦 触发条件 / When to Trigger` section (currently ends at `检查是否有多个未完成的功能`):

```markdown
## ⚙️ 模式选择 / Mode Selection

通过 `--mode` 参数控制自动确认程度（默认 normal）：

| 模式 | 行为 |
|:----:|------|
| normal | 展示执行计划等待确认；每个功能阻塞时等待用户决策 |
| auto | 直接开始执行；功能阻塞时自动重试/跳过；上下文自动重置 |
| silent | 全部自动，静默执行，仅记录日志 |

### auto 模式默认决策

| 决策点 | auto 模式行为 |
|--------|-------------|
| 展示执行计划 | 直接开始第一个里程碑 |
| 功能阻塞 | 自动重试 1 次 → 跳过后记录 |
| 集成问题 | 记录到问题列表，继续下个功能 |
| 上下文重置 | 自动提交 + 重置 |

### silent 模式附加行为

- 不输出执行计划
- 里程碑完成时不输出摘要
- 仅输出最终完成报告
```

- [ ] **Step 2: Add cross-skill persistence section**

Insert a new section after the workflow diagram:

```markdown
## 📁 跨技能进度持久化 / Cross-Skill Progress Persistence

### 双文件方案

orchestrator 新增对 `.agents/job.state.json` 的支持，用于跨技能、跨会话的进度追踪。

#### 文件 1：`.agents/job.state.json` — 机器可读完整状态

```json
{
  "project": "<project_name>",
  "job_version": "2.0",
  "mode": "auto",
  "phases": {
    "init": { "status": "DONE" },
    "architect": { "status": "DONE" },
    "development": {
      "status": "IN_PROGRESS",
      "skill": "engineer-orchestrator",
      "features": {
        "M1": { "name": "...", "status": "DONE", "commits": "abc..def", "rebuild_count": 0, "degraded": false },
        "M2": { "name": "...", "status": "IN_PROGRESS" }
      }
    },
    "finalize": { "status": "TODO" },
    "deploy": { "status": "TODO" }
  },
  "checkpoint": {
    "last_commit": "def456",
    "last_phase": "development",
    "next_action": "continue milestone M2",
    "session_summary": "Completed M1. Starting M2."
  }
}
```

**状态值**：`TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED` / `SKIPPED`

#### 文件 2：`.agents/job.progress.md` — 人类可读追加账本

追加格式，每行一个事件：
```
[10:25] ✅ M1: data-model — commits abc..def, 3 files, 2 tests
```

#### 与现有 progress.json 的兼容

- `job.state.json` **新增**，覆盖完整生命周期
- `progress.json` **保留**，内容被 `job.state.json.development.features` 吸收
- **检测优先级**：`job.state.json` → `progress.json` → 从用户问起
```

- [ ] **Step 3: Add cross-session recovery section**

Insert after the existing "进度持久化" section:

```markdown
### 跨会话恢复流程

当 orchestrator 检测到 job.state.json 存在时，执行恢复流程：

1. **读取 job.state.json** → 确定当前阶段和下一个动作
2. **验证 git 状态** → 运行 `git log --oneline -3`，与 `checkpoint.last_commit` 比对
3. **运行测试** → 确认现有代码的状态正常
4. **读取 CONTEXT.md** → 获取最新的蓝图状态
5. **生成恢复报告** → 展示当前进度和下一个动作

**恢复报告模板**：

```markdown
## 🔄 项目进度恢复 / Project Recovery

检测到 job.state.json，从持久化文件恢复进度：

**项目**: [名称]
**阶段**: development（M1 完成，M2 待开始）
**上次验证的 commit**: [hash]

### 已完成
1. ✅ M1: data-model — 3 files, 2 tests

### 待完成
2. [ ] M2: article-crud

### 恢复操作
1. git 状态验证: [hash] matches ✅
2. 测试运行: [N/N 通过] ✅
3. 从 M2 继续...
```
```

- [ ] **Step 4: Add auto-mode awareness to key decision points**

In the "第四步：用户确认计划" section, add:

```markdown
**模式感知**：
- `normal`：展示执行计划，等待用户确认
- `auto`：展示执行计划摘要后直接开始执行
- `silent`：不展示执行计划，直接开始执行
```

In the "第八步：记录阻塞原因" section, add mode-aware failure handling:

```markdown
**模式感知**：
- `normal`：展示选项等待用户选择
- `auto`：执行自动重试 1 次 → 标记为 BLOCKED → 继续下个功能
- `silent`：记录阻塞原因到 checkpoint，静默跳过
```

In the "第十步：提交 & 重置上下文" section, add:

```markdown
**模式感知**：
- `normal`：展示重置建议，等待用户确认
- `auto`：自动执行提交 → 重置上下文
- `silent`：静默提交 + 重置，不输出重置报告
```

- [ ] **Step 5: Verify the file**

Read the modified file and check:
- [ ] `## ⚙️ 模式选择` section exists after trigger conditions
- [ ] `## 📁 跨技能进度持久化` section exists with job.state.json schema
- [ ] Recovery flow section exists
- [ ] Step 4, 8, 10 mention mode awareness

- [ ] **Step 6: Commit**

```bash
git add skills/engineer-orchestrator/SKILL.md
git commit -m "feat(engineer-orchestrator): add --mode support and cross-skill persistence (job.state.json)"
```

---

### Task 7: Update README.md

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: All previously written/modified skill files
- Produces: Updated README with engineer-job listed

- [ ] **Step 1: Add engineer-job to the skill list**

Insert after the `engineer-advisor` entry in the "Engineering Workflow Skills" section:

```markdown
- `engineer-job` — **AI 项目全自动构建引擎**（P0）。元编排引擎，自动执行从脚手架搭建、架构设计、多功能开发、集成验收到部署配置生成的全流程。支持 `--auto`（自动确认）和 `--silent`（静默）模式实现无人值守项目构建。
```

- [ ] **Step 2: Update the repository layout**

Add engineer-job to the file tree:

```text
skills/
├── engineer-job/
│   └── SKILL.md                     # P0 — 元编排引擎 / 全自动项目构建
├── engineer-architect/
│   └── SKILL.md                     # P0 — 需求→蓝图自动生成
├── engineer-orchestrator/
│   └── SKILL.md                     # P0 — 项目级编排引擎
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add engineer-job to skill list and repository layout"
```

---

### Task 8: Add smoke tests for engineer-job

**Files:**
- Create: `tests/engineer-job.test.js`

**Interfaces:**
- Consumes: `skills/engineer-job/SKILL.md`
- Produces: Test pass/fail for skill file integrity

- [ ] **Step 1: Write the test file**

```javascript
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SKILL_DIR = path.join(__dirname, '..', 'skills');

function findSkillFiles() {
  const skills = [];
  const entries = fs.readdirSync(SKILL_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillFile = path.join(SKILL_DIR, entry.name, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        skills.push({ name: entry.name, path: skillFile });
      }
    }
  }
  return skills;
}

function readFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) frontmatter[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '');
  }
  return { frontmatter, content };
}

describe('skills', () => {
  const skills = findSkillFiles();
  
  describe('all skills', () => {
    for (const skill of skills) {
      it(`${skill.name} has valid SKILL.md with frontmatter`, () => {
        const parsed = readFrontmatter(skill.path);
        assert.ok(parsed, `${skill.name}/SKILL.md has no valid frontmatter`);
        assert.ok(parsed.frontmatter.name, `${skill.name} has no name`);
        assert.ok(parsed.frontmatter.description, `${skill.name} has no description`);
        assert.ok(parsed.frontmatter.compatibility, `${skill.name} has no compatibility`);
      });
      
      it(`${skill.name} has compatibility listed`, () => {
        const parsed = readFrontmatter(skill.path);
        const compat = parsed.frontmatter.compatibility;
        assert.ok(compat, `${skill.name} must define compatibility`);
        assert.ok(compat.includes('bash') || compat.includes('agent'), 
          `${skill.name} compatibility should include 'bash' or 'agent'`);
      });
    }
  });
  
  describe('engineer-job', () => {
    const skillFile = path.join(SKILL_DIR, 'engineer-job', 'SKILL.md');
    
    it('exists', () => {
      assert.ok(fs.existsSync(skillFile), 'engineer-job/SKILL.md should exist');
    });
    
    it('has mode selection section', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('## ⚙️ 模式选择'), 'should have mode selection section');
      assert.ok(content.includes('normal'), 'should mention normal mode');
      assert.ok(content.includes('auto'), 'should mention auto mode');
      assert.ok(content.includes('silent'), 'should mention silent mode');
    });
    
    it('has 6-phase orchestration flow', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('Phase 0') || content.includes('init'), 'should mention phase 0 (init)');
      assert.ok(content.includes('Phase 1') || content.includes('architect'), 'should mention phase 1');
      assert.ok(content.includes('Phase 2') || content.includes('orchestrat'), 'should mention phase 2');
    });
    
    it('has subagent dispatch pattern', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('子代理') || content.includes('subagent') || content.includes('Agent'),
        'should mention subagent dispatch');
    });
    
    it('has cross-session recovery flow', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('恢复') || content.includes('recovery'),
        'should mention recovery flow');
    });
    
    it('has self-healing section', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('自愈') || content.includes('self-heal'),
        'should mention self-healing');
    });
    
    it('has job.state.json schema', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('job.state.json'), 'should document job.state.json schema');
    });

    it('has trigger conditions for project building', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('TRIGGERS'), 'should have TRIGGERS in frontmatter');
      assert.ok(content.includes('帮我从零') || content.includes('from scratch'),
        'should list project-building trigger phrases');
    });
  });
  
  describe('mode support across skills', () => {
    const skillsThatNeedMode = [
      'init-project', 'engineer-architect', 'engineer-orchestrator', 
      'engineer-workflow', 'engineer-inspector'
    ];
    
    for (const skillName of skillsThatNeedMode) {
      it(`${skillName} has mode selection section`, () => {
        const skillFile = path.join(SKILL_DIR, skillName, 'SKILL.md');
        if (!fs.existsSync(skillFile)) return; // skip if skill not installed
        
        const content = fs.readFileSync(skillFile, 'utf-8');
        assert.ok(content.includes('## ⚙️ 模式选择'), 
          `${skillName} should have '## ⚙️ 模式选择' section`);
        assert.ok(content.includes('auto'), `${skillName} mode section should mention auto`);
        assert.ok(content.includes('silent'), `${skillName} mode section should mention silent`);
      });
    }
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npm test`

Expected: All tests pass (including existing init-project test if any, plus the new engineer-job tests)

- [ ] **Step 3: Commit**

```bash
git add tests/engineer-job.test.js
git commit -m "test: add smoke tests for engineer-job and --mode support across all skills"
```

---

## Self-Review Checklist

After completing all tasks, run through this checklist:

**Spec coverage:**
- [ ] Spec section 2 (architecture) → Task 1 (engineer-job SKILL.md phases + subagent pattern)
- [ ] Spec section 3 (auto modes) → Tasks 2-6 (each skill's `## ⚙️ 模式选择` section)
- [ ] Spec section 4 (self-healing) → Task 5 (workflow self-healing) + Task 1 (phase-level self-healing)
- [ ] Spec section 5 (persistence) → Task 6 (job.state.json + recovery) + Task 1 (schema docs)
- [ ] Spec section 6 (SKILL.md structure) → Task 1 (full file)
- [ ] Spec section 7 (modifications) → Tasks 2-6 (5 existing skills)
- [ ] README update → Task 7
- [ ] Tests → Task 8

**Placeholder scan:**
- [ ] No "TBD", "TODO", "implement later", "fill in details" in any SKILL.md
- [ ] No "Add appropriate handling" without concrete examples
- [ ] No "Similar to Task X" without code

**Cross-reference consistency:**
- [ ] All skills use consistent `--mode` flag with same 3 values
- [ ] `normal`/`auto`/`silent` semantics are the same across all skills
- [ ] job.state.json schema matches in both engineer-job and orchestrator definitions
- [ ] Trigger conditions don't overlap or conflict between engineer-job and engineer-orchestrator
