# engineer-next — AI 进度接续路由引擎 / Design Spec

> Date: 2026-07-15
> Status: Approved (brainstorming) → ready for implementation planning
> Family: engineer-* skill chain (methodology: 《基于实现规划的 AI 辅助编程实战》)

---

## 1. 目标 / Goal

新增一个技能 `engineer-next`：**一个"随时随地接着上次继续"的万能入口**。用户落到任意工作目录、说一句"继续 / 接着做 / next"，它就：

1. **快速诊断**当前项目停在哪（读取 engineer* 系列的状态指纹文件）。
2. **判定交接点**——上次可能停在 engineer-job 的某个设计阶段、engineer-orchestrator 的某个里程碑、engineer-architect 之后、或是一个**完全没有 engineer* 产物的"外来项目"**。
3. **接上既有自动化流程**，在什么位置就从什么位置继续，把控制权交给正确的下游技能（job / orchestrator / architect / requirements）。

`engineer-next` 本身是**纯路由 skill**：只做"判断准 + 转发对"，不重写任何阶段逻辑、不写自己的进度文件、不自己跑构建测试。所有执行交给既有技能。

### 要解决的既有缺口

- `engineer-job` 的 `run.wf.js` 已有跨阶段恢复（Phase 0 读 `.agents/job.state.json` 跳过 DONE 阶段），`engineer-orchestrator` 已有里程碑级恢复流程。但接续仍要求用户**知道该重调哪个技能**，且重调 `engineer-job` 还需**重新提供原样的 `requirements` + `mode` 参数**。
- 没有单一入口能覆盖**所有**接续场景，更没有入口处理**零 engineer* 产物的外来项目**。
- `engineer-job` 的 development 阶段重调会把里程碑状态初始化为全 TODO **重跑**——"开发进行中"的接续不能简单重调 job。

---

## 2. 已锁定的核心决策 / Locked Decisions

| 决策点 | 选择 | 含义 |
|:--|:--|:--|
| 形态 | **纯路由 skill（方案 A）** | `SKILL.md` + 纯函数决策真源 `resume-logic.js` + 交接协议；**不新增 `run.wf.js`**。重活（阶段跳过、里程碑循环）仍由 job/orchestrator 承担。 |
| 确定性收敛 | **纯函数 `detectResumePoint(state)` + CLI 包装** | 判决逻辑是单一真源、单测守护（与 `detection-logic.js` 同构）；运行时由 `detect-resume.js` CLI 读文件给确定性判决，CLI 不可用时模型照 SKILL.md 决策表手判（双形态）。 |
| 接续方式 | **按产物选交接点（混合）** | 有 `job.state.json`→按阶段重调 job Workflow 或路由 orchestrator；仅有 `progress.json`/`CONTEXT.md`→orchestrator；仅有 `REQUIREMENTS.md`→architect；…… |
| 外来项目接入 | **按代码量自适应** | 近乎为空→`engineer-job` 全新；已有大量代码→先 `engineer-architect` 逆向建模出蓝图再继续（遵守"无蓝图不开工"）。 |
| 开发中接续 | **走 orchestrator，不重调 job** | `job.state.json.development` 为 IN_PROGRESS 时路由 `engineer-orchestrator` 做里程碑级恢复，避免重跑已完成里程碑。 |
| 代码体量阈值 | **≥10 源文件 或 ≥500 LOC → "大量代码"** | 统计忽略 `node_modules/.git/target/dist/build/.venv` 等；否则判"近乎为空"。数值可调。 |

---

## 3. 核心理念 / Core Philosophy

engineer-next 的职责是当一个**精准的调度员**：用最小代价搞清楚"项目现在在哪一格"，然后把球传给最该接手的那个人，自己从不亲自下场砌墙。

### 三条核心原则

1. **状态即文件，诊断即读文件 / State Is Files, Diagnosis Is Reading Files**
   复用 engineer* 家族既有的状态文件（`job.state.json` / `progress.json` / `project-metadata.json` / `CONTEXT.md` / `REQUIREMENTS.md` / `FRONTEND-DESIGN.md` / `POC-MANIFEST.md`）。engineer-next 只读不写这些文件——它是观察者，不是参与者。检测优先级与家族约定一致：`job.state.json → progress.json → CONTEXT.md → 用户`。

2. **复用既有恢复，绝不重跑 / Reuse Recovery, Never Redo**
   接续的命门是"从断点继续"而非"从头再来"。最典型的陷阱：`engineer-job` 的 development 阶段重调会重跑所有里程碑——所以"开发进行中"必须改走 `engineer-orchestrator` 的里程碑级恢复。每一条路由都遵循"把已完成的工作当成既有地基，只推进未完成的部分"。

3. **降级优于阻塞 / Degrade Over Block**
   状态文件损坏、检测歧义、外来项目体量模糊——都不停下纠缠，按既定优先级降级判定，只在 normal 模式下把不确定性提示给用户。与家族的降级哲学一致。

---

## 4. 触发条件 / When to Trigger

**必须触发**（万能继续入口）：
- "继续 / 接着做 / 继续[项目名/功能] / 接着开发 / 恢复进度 / 接着干"
- "continue / next / resume / pick up where I left off / keep going"
- 用户回到一个项目，不确定停在哪、也不指定具体技能，只想"接着上次的进度往下走"。

**链式触发**：
- 上下文重置/新会话后，用户说"继续项目 [名称]"。
- 一次长对话被建议重置后，新会话用 engineer-next 恢复。

**不触发**（让位给具体技能）：
- "实现登录功能"（明确单功能）→ `engineer-workflow`。
- "从零做一个完整项目"（明确从零）→ `engineer-job`。
- "画蓝图 / 做架构"（明确要设计）→ `engineer-architect`。
- 即：用户**明确指定了起点**时，直接走那个技能；只有"不确定在哪、想接着继续"时才走 engineer-next。

**优先级判断**：
1. 用户表达"接着上次的进度继续 / 不知道停哪 / 恢复" → 触发 engineer-next。
2. engineer-next 诊断后，若发现项目实际是"全新空白"，转 `engineer-job` 全新；否则路由到对应断点技能。

---

## 5. 模式选择 / Mode Selection

与家族一致（默认 normal）：

| 模式 | 行为 |
|:--:|:--|
| normal | 出状态诊断报告，等待用户确认后再交接。检测不确定时（如 git 偏差）询问用户。 |
| auto | 出诊断摘要后直接交接，不确定性按默认降级处理。 |
| silent | 静默诊断 + 交接，仅记日志，末尾输出交接摘要。 |

**mode 透传**：交接时把同一 `--mode` 透传给 target_skill，保证接续后自动化程度一致。

---

## 6. 检测→路由决策表 / Detection→Routing Decision Table（核心）

触发后先读"状态指纹"（见 §7），按下表按优先级从高到低判定 **scenario → resume_point → target_skill**，再按 `references/handoff-protocol.md` 交接。

| 优先级 | Scenario（看什么产物） | resume_point | target_skill / 交接方式 |
|:-:|---|---|---|
| 1a | `job.state.json` 在，下一个未完成阶段是**设计期**（requirements/architect/frontend/poc） | 该设计阶段 | **重调 `engineer-job` run.wf.js**（自动跳过 DONE 阶段）；按 §8 重建 `mode/projectName/requirements/skip_*` 参数 |
| 1b | `job.state.json` 在，`development` 为 **IN_PROGRESS**（部分里程碑 DONE、部分 TODO） | 下一个 TODO 里程碑 | **路由 `engineer-orchestrator`**（按 `progress.json` 里程碑级恢复）。⚠️ 不重调 job，否则重跑已完成里程碑 |
| 1c | `job.state.json` 在，`development` DONE，但 `finalize/deploy/report` 未完成 | 收尾阶段 | **重调 `engineer-job` run.wf.js**（run-gate/integrate/deploy/report，不重跑里程碑） |
| 1d | `job.state.json` 全阶段 DONE | （已完成） | 报告"项目已完成"，建议 `engineer-advisor` 或追加功能走 `engineer-architect` |
| 1e | 某阶段 BLOCKED | 该阶段 | 报告阻塞 + 路由该阶段技能（带阻塞上下文）/ `engineer-advisor` |
| 2 | 无 `job.state.json`，但有 `.agents/progress.json` | 下一个 TODO 里程碑 | **路由 `engineer-orchestrator`** 恢复流程 |
| 3 | 无 job.state/progress，但有 `CONTEXT.md`（蓝图就绪、未开发） | 首个里程碑 | **路由 `engineer-orchestrator`**（有 `CONTEXT-MAP.md` 则走多模块） |
| 4 | 无 job.state/progress/CONTEXT，但有 `REQUIREMENTS.md` | 架构设计 | **路由 `engineer-architect`** 产 CONTEXT.md |
| 5 | 只有 `project-metadata.json`（仅脚手架） | 需求/架构 | **路由 `engineer-requirements`**（简单项目→architect） |
| 6a | **零 engineer* 产物 + 代码近乎为空** | 从零开始 | **路由 `engineer-job` 全新**（既有零散文件当作脚手架） |
| 6b | **零 engineer* 产物 + 已有大量代码**（外来项目） | 逆向建模 | **路由 `engineer-architect` 逆向分析** → 生成 REQUIREMENTS.md+CONTEXT.md（既有代码作地基）→ 再接 orchestrator |
| 7 | 完全空目录 | 从零开始 | **路由 `engineer-job` 全新**（无需求则先问最少问题） |

**两条贯穿原则**：
- **复用既有恢复，绝不重跑**：1b 是关键。
- **外来项目遵守"无蓝图不开工"**：6b 先逆向出 CONTEXT.md 再继续。

---

## 7. 状态指纹 / State Fingerprint

诊断读取的文件（任一可缺失；缺失即 null）：

| 文件 | 用途 | 关键字段 |
|:--|:--|:--|
| `.agents/job.state.json` | 全生命周期状态 | `checkpoint.last_phase`、`phases[*].status`、`development.features` 的 DONE/TODO 计数、`mode`、`project` |
| `.agents/progress.json` | orchestrator 里程碑跟踪 | features 状态、`checkpoint.last_verified_commit_hash` |
| `project-metadata.json` | init→architect→orchestrator 协议 | `project.description`、`project.features`、`skip_*`/`has_frontend` |
| `CONTEXT.md` | 蓝图 | 存在性 + 里程碑章节 |
| `CONTEXT-MAP.md` | 多模块地图 | 存在性（→多模块编排） |
| `REQUIREMENTS.md` | 需求 | 存在性 |
| `FRONTEND-DESIGN.md` | 前端设计 | 存在性 |
| `POC-MANIFEST.md` | POC 产物 | 存在性（演进依据） |
| 代码体量 | 外来项目判定 | 非依赖目录下的源文件数 + LOC（见 §2 阈值） |

诊断额外校验：`git rev-parse HEAD` 与 `job.state.json.checkpoint.last_commit` 比对，偏差时在诊断报告标 ⚠️。

---

## 8. 纯函数决策真源 + 参数重建 / Pure-Function Decision Source & Arg Reconstruction

### `references/resume-logic.js`（单一真源，无 fs/无 I/O，单测守护）

```js
// 主判决：state 是"已读好的指纹对象"，纯判定
detectResumePoint(state) -> {
  scenario,            // "1a".."7"
  resume_point,        // 人类可读：阶段名 / 里程碑 id / "逆向建模" / "已完成" 等
  target_skill,        // "engineer-job" | "engineer-orchestrator" | "engineer-architect"
                       //   | "engineer-requirements" | null(已完成)
  handoff,             // "reinvoke-job-workflow" | "route-orchestrator"
                       //   | "route-architect" | "route-architect-reverse"
                       //   | "route-requirements" | "report-complete" | "report-blocked"
  reconstructed_args,  // 所有重调/新建 job 的场景(1a/1c/6a/7)都有：
                       //   {mode, projectName, requirements,
                       //    skip_requirements, skip_frontend, skip_poc, stop_at_poc:false}
  reasoning            // 判定依据，用于诊断报告
}

// 外来项目代码体量评估
assessCodeVolume({sourceFiles, totalLoc}) -> "substantial" | "near-empty"
```

`state` 形状（任一字段可 null）：`{ jobState, progress, metadata, context, contextMap, requirements, frontendDesign, pocManifest, codeStats }`。

### `references/detect-resume.js`（薄 CLI 包装，可用 fs）

读 cwd 文件 → 组装 `state` → 调 `detectResumePoint` → 打印 JSON 判决。模型触发 engineer-next 后先跑一次拿到确定性判决，再按 `handoff-protocol.md` 转发。CLI 不可用时回退到模型照 §6 决策表手判（双形态，与 `detection-logic.js` 既是真源又被 run.wf.js 内联同理）。

### 参数重建规则（`reconstructed_args`，所有重调/新建 job 的场景 1a/1c/6a/7）

分两类来源：

- **接续型（1a/1c）**：从既有状态文件重建。
- **全新型（6a/7）**：requirements 取自用户本次输入（若空则在交接后由 engineer-job 按其 auto/silent 逻辑问最少问题），其余按兜底。

| 参数 | 接续型来源 | 全新型来源 / 兜底 |
|:--|:--|:--|
| `mode` | `jobState.mode` | 用户指定 / 默认 `normal` |
| `projectName` | `jobState.project` | cwd 目录名 |
| `requirements` | `metadata.project.description` + `.features` 拼接 | 用户本次输入 / 空（交由 job 询问）/ `"continue project <name>"` |
| `skip_requirements` / `skip_frontend` / `skip_poc` | `metadata` 的 `skip_*`/`has_frontend` 字段重读 | 按 `detection-logic.detectComplexity(requirements)` 推断 |
| `stop_at_poc` | 固定 `false`（恢复时不再停在 POC） | 固定 `false` |

---

## 9. 状态诊断报告 / Diagnosis Report

交接前输出（对应 job/orchestrator 的恢复报告模板）：

```markdown
## 🔍 状态诊断 / State Diagnosis

**项目**: [名称]　**检测场景**: [scenario + resume_point]
**判定依据**: [reasoning]

### 已完成
1. ✅ [阶段/里程碑...]

### 待续
2. [ ] [下一个动作]　→ 路由到 **[target_skill]**

### 验证
- git HEAD vs checkpoint.last_commit: [一致 ✅ / 偏差 ⚠️]
- （若适用）测试基线: [N/N 通过]

### 下一步
[normal] 确认后我将交接给 [target_skill]...
[auto] 直接交接。
```

---

## 10. references/ 结构

| 文件 | 内容 |
|:--|:--|
| `resume-logic.js` | 纯函数单一真源：`detectResumePoint(state)` + `assessCodeVolume(stats)`。无 fs/无 I/O。 |
| `detect-resume.js` | CLI 包装：读 cwd 文件 → 组装 state → 调 `detectResumePoint` → 打印 JSON 判决。可用 fs。 |
| `handoff-protocol.md` | 每个 scenario 的交接指令细则：重调 job Workflow 的参数重建、路由各技能的启动指令、外来项目逆向建模的引导、git 偏差处理。 |

---

## 11. 非目标 / Non-Goals

1. **不重实现任何阶段** —— init/requirements/architect/frontend/poc/development/finalize/deploy 全交给既有技能。
2. **不写自己的进度文件** —— 只读既有 `job.state.json` 等，不新增 engineer-next 私有状态。
3. **不自己跑构建/测试** —— build/test/run-gate 由 target_skill 负责。
4. **不自带 `run.wf.js`** —— 单步"检测+转发"用 Workflow 是杀鸡用牛刀，且 Workflow 内不能直接调用别的 skill。
5. **不做语义级"下一步任务推荐"** —— 只做技能/阶段/里程碑级路由；更细的"下一个具体 TODO"由下游技能（orchestrator/workflow）决定。

---

## 12. 交付范围 / Deliverables

1. `skills/engineer-next/SKILL.md`：触发条件、§6 决策表、模式、§9 诊断报告、边界情况。
2. `skills/engineer-next/references/resume-logic.js`：纯函数 `detectResumePoint` + `assessCodeVolume`。
3. `skills/engineer-next/references/detect-resume.js`：CLI 包装。
4. `skills/engineer-next/references/handoff-protocol.md`：每 scenario 交接细则 + 参数重建。
5. `skills/engineer-next/evals/resume-cases.json`：检测用例（文件指纹 → 期望判决）。
6. `tests/test-resume.test.js`：`detectResumePoint` 单测 + `assessCodeVolume` 边界 + SKILL.md 结构守卫。
7. `README.md` + `README.zh-CN.md`：技能列表 + 决策表 + 文件树三处注册 engineer-next。

---

## 13. 边界情况 / Edge Cases

| 场景 | 处理 |
|:--|:--|
| `job.state.json` 损坏/无法解析 | 降级到 `progress.json` → `CONTEXT.md` → 外来项目判定 |
| git HEAD 与 `checkpoint.last_commit` 偏差 | 诊断报告标 ⚠️；normal 模式询问用户是否仍按状态文件继续 |
| 恢复时用户给了**新需求** | 是新功能→路由 orchestrator 追加；改范围→路由 architect |
| `CONTEXT-MAP.md` 在（多模块） | 交给 orchestrator 的多模块编排流程 |
| 检测歧义（如同时有 `progress.json` 和 `REQUIREMENTS.md` 但无 `CONTEXT.md`） | 严格按 §6 优先级表（2 > 4） |
| `job.state.json` 与 `project-metadata.json` 不一致 | 以 job.state.json 阶段为准重建参数；记录差异 |
| 外来项目体量恰在阈值附近 | 按"保守走逆向"(6b) 处理——宁可有蓝图，不贸然当空白重做 |
| 完全空目录 + 无需求 | 先问最少问题（项目类型/技术栈），再路由 engineer-job 全新 |

---

## 14. 测试策略 / Test Strategy

沿用 `tests/test-detection.test.js` 范式（`node:test` + `node:assert/strict`）：

- **`detectResumePoint` 用例测试**：对 `evals/resume-cases.json` 每条（文件指纹 + 解析后的关键字段）断言 `scenario / target_skill / handoff`，覆盖 1a–7 全场景。
- **`assessCodeVolume` 边界**：9 文件→near-empty、10 文件→substantial、499 LOC→near-empty、500 LOC→substantial。
- **结构守卫**：
  - `SKILL.md` 有 `## ⚙️ 模式选择`、决策表覆盖 1a–7、出现 `job.state.json`/`progress.json`/`CONTEXT.md` 关键词、触发短语（继续 / next / continue / resume）。
  - `resume-logic.js` 导出 `detectResumePoint` 与 `assessCodeVolume` 两个函数。
  - `detect-resume.js` 使用 fs 且无 `new Date()`（与 run.wf.js 守卫一致）。
- **前置依赖测试**：`tests/engineer-job.test.js` 的"all skills"通用结构断言会自动覆盖 engineer-next（按目录自动发现），需保证其 frontmatter 合规（`name`/`description`/`compatibility` 含 bash 或 agent）。
