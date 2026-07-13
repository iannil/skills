# engineer-job 执行引擎 & 语言模板扩展设计

**日期**: 2026-07-13
**状态**: 已批准
**对应版本**: iannil/skills v2.x

---

## 背景

iannil/skills 包的工程化技能链（engineer-job → init-project → engineer-architect → engineer-orchestrator → engineer-workflow → engineer-inspector）能力定义完整，但存在两个关键缺口：

1. **engineer-job 执行引擎** — engineer-job 的 6 阶段编排目前是"说明书"形态（SKILL.md），AI 需要手动读取并逐阶段执行，缺少可自动运行的编排程序。这使得`--auto`和`--silent`模式的无人值守能力受限。

2. **语言模板覆盖不足** — init-project 有 Python/Rust/Node.js/Web/CLI 五类模板，但缺少 Go 和 Java 这两个主流语言的项目模板。当前对这两类项目的生成依赖"遵循社区标准"的模糊兜底。

本设计针对以上两个缺口，分别采用**方案 C（混合架构）**和**方案 B（references 模板文件）**。

---

## 设计变更一：engineer-job 执行引擎

### 架构

```
skills/engineer-job/
├── SKILL.md                    ← 保留为完整文档（不改变现有行为）
├── run.wf.js                   ← 🆕 Workflow 脚本（实际的编排执行引擎）
└── references/
    └── engine.md               ← 🆕 引擎参考文档

bin/
├── skills.js                    ← 已有
└── engineer-job.js              ← 🆕 CLI 入口（状态查看/恢复）

.agents/
├── job.state.json               ← 已有（状态持久化）
└── job.progress.md              ← 已有（进度账本）
```

**职责分离**：

| 组件 | 职责 | 输入 → 输出 |
|------|------|:-----------:|
| `run.wf.js` | 执行 6 阶段编排 | 用户需求描述 → 完成的项目代码 + 报告 |
| `engineer-job.js` | 状态查看/恢复 | `status`/`history`/`report` 命令 → 终端输出 |
| `SKILL.md` | 完整的方法论文档 | AI 从零理解流程 → 行为指南 |

### run.wf.js 详细设计

#### 数据流

```
每个 Phase 的 agent() 调用通过文件系统传递上下文：

job.state.json 是共享状态文件，所有 phase 读写。
Agent 子进程的输入：CONTEXT.md（蓝图）+ job.state.json（当前状态）
Agent 子进程的输出：文件修改 + 更新 job.state.json + 返回状态码

run.wf.js 主循环：
  ┌─────────────────────────────────────────────────┐
  │  while (存在未完成的 phase) {                    │
  │    phase = next_phase(state)                    │
  │    result = await agent(phase_instruction)       │
  │    state = update_state(state, phase, result)    │
  │    if (result.status === 'BLOCKED') handle_error │
  │  }                                              │
  └─────────────────────────────────────────────────┘
```

#### Schema 定义

每个 Phase 的 agent 返回值统一使用以下 schema：

```javascript
const PHASE_RESULT = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['DONE', 'DONE_WITH_CONCERNS', 'BLOCKED']
    },
    summary: { type: 'string' },                    // 一句话摘要
    changes: {
      type: 'object',
      properties: {
        files_created: { type: 'number' },
        files_modified: { type: 'number' },
        tests_passed: { type: 'number' },
        commit_hash: { type: 'string' },
      }
    }
  },
  required: ['status', 'summary']
}
```

#### 恢复流程

```javascript
// 脚本启动时前置逻辑
function loadOrInitState(args) {
  const state = readFile('.agents/job.state.json')
  if (state) {
    log(`检测到 job.state.json，恢复进度`)
    log(`当前阶段: ${state.checkpoint.last_phase}`)
    log(`上次 checkpoint: ${state.checkpoint.next_action}`)
    // 验证 git 状态
    const gitLog = exec('git log --oneline -3')
    // 对比 state.checkpoint.last_commit
    // 不一致时记录警告但不阻塞（auto/silent 模式）
    return state
  }
  // 不存在则初始化新状态
  return initNewState(args)
}
```

#### 阶段总览

| Phase | 名称 | agent() 指令 | 失败处理 |
|:-----:|------|-------------|---------|
| 0 | Scaffold | 调用 init-project 进行项目初始化 | 重试 1 次 → 终止 |
| 1 | Architect | 调用 engineer-architect 生成 CONTEXT.md | 重试 1 次 → 降级骨架蓝图 |
| 2 | Develop | 调用 engineer-orchestrator 编排开发 | 从 job.state.json 恢复 → 输出已完成的 |
| 3 | Integrate | 运行测试 + 可选生产就绪检查 | 记录警告，不阻塞 |
| 4 | Deploy | 生成 Dockerfile / CI 配置 | 记录警告，不阻塞 |
| 5 | Report | 生成最终报告 | — |

### engineer-job.js CLI 详细设计

```javascript
// CLI 入口，三个子命令：

// engineer-job status  — 读取 job.state.json 展示当前状态
// 输出示例：
//   Project:  blog-system
//   Phase:    Development (M1 done, M2/5)
//   Mode:     auto
//   Next:     Continue M2 (article-crud)
//   Last:     abc1234 "feat: data model"

// engineer-job history  — 读取 job.progress.md 展示最近 20 条
// 输出示例：
//   [10:02] ✅ Phase 0: init
//   [10:15] ✅ Phase 1: architect
//   [10:25] ✅ M1: data-model

// engineer-job report  — 重新生成最终报告
//   从 job.state.json + job.progress.md 聚合输出
```

**实现**：纯 Node.js 文件操作（读 JSON/MD，无外部依赖）。

---

## 设计变更二：Go / Java 项目模板

### 文件

```
skills/init-project/references/templates/
├── go-project.md         ← 🆕
└── java-project.md       ← 🆕
```

两个文件遵循一致的格式，每个包含：

1. **目录结构** — 社区最佳实践的完整文件树
2. **框架推荐表** — 按场景列出推荐 + 替代方案
3. **入口文件示例** — 可运行的 Hello World 级代码片段
4. **测试规范** — 与 test-patterns.md 对齐的分层测试标准
5. **构建与运行** — Makefile 目标或 CLI 命令

### 对 init-project SKILL.md 的改动

在 Step 3"生成类型特定文件树"中，将原有"其他项目类型"段替换为：

```markdown
#### Go 项目

参考 `references/templates/go-project.md` 生成。

#### Java/Kotlin 项目

参考 `references/templates/java-project.md` 生成。

#### 其他项目类型

对于未在上述列表中列出的项目类型（C++、Elixir、Swift 等），
遵循以下原则自行推断生成：
- 该语言/框架社区的标准目录结构
```

### 模板对比

| 维度 | Go 模板 | Java 模板 |
|------|:-------:|:---------:|
| 推荐框架 | gin | Spring Boot 3.x |
| 数据库库 | sqlx | Spring Data JPA |
| 迁移工具 | golang-migrate | Flyway |
| 构建工具 | Makefile + go build | Gradle / Maven |
| 入口 | cmd/{name}/main.go | @SpringBootApplication |
| 测试框架 | testing + testify | JUnit 5 + Mockito |

---

## 文件变更总览

### 新建文件

| # | 文件 | 预估行数 | 用途 |
|:-:|------|:--------:|------|
| 1 | `skills/engineer-job/run.wf.js` | ~200 | 6 阶段编排执行引擎 |
| 2 | `skills/engineer-job/references/engine.md` | ~50 | 引擎参考文档 |
| 3 | `bin/engineer-job.js` | ~120 | CLI 状态查看/恢复 |
| 4 | `skills/init-project/references/templates/go-project.md` | ~120 | Go 项目模板 |
| 5 | `skills/init-project/references/templates/java-project.md` | ~130 | Java 项目模板 |

### 编辑文件

| # | 文件 | 改动量 | 改动内容 |
|:-:|------|:------:|---------|
| 1 | `skills/engineer-job/SKILL.md` | +3 行 | 子代理调度模式节增加 Workflow 脚本入口说明 |
| 2 | `skills/init-project/SKILL.md` | +10 行 | Step 3 替换"其他项目类型"为 Go + Java 引用 |

### 无变更

| 文件 | 理由 |
|------|------|
| `.agents/job.state.json` | 复用已有设计，格式不变 |
| `.agents/job.progress.md` | 复用已有设计 |
| `engineer-orchestrator/SKILL.md` | 不变 — orchestrator 内部的编排逻辑不变 |
| `engineer-workflow/SKILL.md` | 不变 — workflow 单功能开发流程不变 |
| `engineer-inspector/SKILL.md` | 不变 |

---

## 向后兼容性

1. **现有 job.state.json 格式完全兼容** — run.wf.js 读写与现有 orchestrator/engineer-job 的格式一致
2. **SKILL.md 不受影响** — 旧的"手动执行"方式仍然可用，新增的 run.wf.js 是可选项
3. **README.md 不受影响** — 安装方式不变
4. **测试不受影响** — 现有 npm test 不需要修改

---

## 未纳入范围

1. 不修改 engineer-orchestrator 的内部编排逻辑（它的职责不变）
2. 不修改 engineer-workflow 的单功能开发流程
3. 不覆盖 C++、C#、Swift、Kotlin（独立）的模板（仅 Go 和 Java）
4. 不会将 run.wf.js 做成 NPM 可发布模块（保持为项目内 Workflow 脚本 + CLI）
