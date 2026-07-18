# engineer-qa — AI 测试验收引擎 / Design Spec

> 日期: 2026-07-18
> 状态: 已批准设计，待写实施计划
> 方法论来源: 《基于实现规划的 AI 辅助编程实战》（与 engineer* 系列一致）

---

## 1. 目标 / Goal

为 engineer* 自动化系列新增一个**专职测试验收 skill `engineer-qa`**，在功能开发完成后**自动触发**，用统一的门禁裁决"验收是否通过"：

- **agent-browser 端到端（E2E）验收**关键用户链路；
- **单元测试 + 覆盖率**，本轮变更（diff）**分支覆盖率 ≥ 90%** 硬门禁，全局覆盖率不回退；
- 覆盖**全生命周期**——业务实体 CRUD + 错误路径（横向）× 测试金字塔 单元→集成→E2E（纵向）。

`engineer-qa` 成为测试/覆盖率/E2E 门禁的**单一真源**；`engineer-inspector` 保留架构监理，其"信号6 测试合规"收敛为指向 `engineer-qa` 的指针，避免双份真源。

### 非目标 / Non-Goals

1. 不做架构偏移检测（仍归 `engineer-inspector`）。
2. 不做里程碑拆解/编码（仍归 `engineer-workflow` / `engineer-orchestrator`）。
3. 不替换 `run.wf.js` 的既有阶段结构，只在既有钩子点接入。
4. 不引入新的进度真源文件——复用 `.agents/` 目录与 `job.state.json` / `progress.json`。

---

## 2. 设计决策记录 / Decisions

| # | 决策点 | 选择 |
|:-:|--------|------|
| D1 | 交付形态 | **新建独立 `engineer-qa` skill + 改造管道钩子**（inspector 只保留架构监理） |
| D2 | 覆盖率口径 | **本轮变更（diff）分支覆盖率 ≥90% 硬门禁 + 全局覆盖率 ratchet 不回退** |
| D3 | E2E 时机与降级 | **功能/项目开发完成后负载一次；无 UI 项目（纯 API/CLI/库）优雅跳过，降级为黑盒集成验收** |
| D4 | "全生命周期"含义 | **实体 CRUD + 错误路径 × 测试金字塔（单元→集成→E2E）双向覆盖** |

---

## 3. 核心理念 / Core Philosophy

"能跑通" ≠ "验收通过"。**验收通过 = 测试金字塔全层绿灯 + 本轮分支覆盖率 ≥90% + 全局覆盖率不回退 + 关键用户链路 E2E 通过。**

无验证不固化——这条铁律对测试本身也成立：测试必须**真跑、真过、真达标**，不接受"测试文件存在"充当"测试合规"。

### 家族一致性 / Family Conventions（必须继承）

- **模式**: `--mode normal|auto|silent`，语义与 engineer-workflow/inspector 一致。
- **文件即状态**: 产物写入 `.agents/`，不依赖对话上下文。
- **蓝图比对**: 读取 `CONTEXT.md` 的"测试策略""领域词汇表""用户链路/验收标准"章节。
- **三态决策**: `✅ PASS / ⚠️ NEEDS_FIX / 🛑 REBUILD`，与 inspector 完全对齐。
- **降级优于阻塞**: 工具链缺失/E2E 环境不可用时降级并如实标注，而非无声通过或死锁。

---

## 4. 架构 / Architecture

### 4.1 QA 生命周期四阶段 / Four-Stage QA Lifecycle

按顺序执行，每层是硬门禁（除非显式降级）：

```
① 静态盘点 / Inventory
   - 读 CONTEXT.md 测试策略、验收标准、用户链路、词汇表
   - 探测项目类型: API / CLI / Web / Library（多类型取并集）
   - 探测测试与覆盖率工具链（见 5.3）
   - 探测本轮变更范围: git diff（无 git 则询问用户改了哪些文件）

② 单元层 / Unit
   - 运行单元测试，全部必须通过
   - 计算【本轮变更(diff)分支覆盖率】≥ 90% 硬门禁
   - 每核心函数至少 1 happy + 2 edge（空输入/异常参数/极限值）

③ 集成层 / Integration
   - 运行集成测试，全部必须通过
   - 业务实体 CRUD 全链路覆盖 + 错误路径（400/404/500 或等价异常）

④ E2E 层 / End-to-End（功能/项目完成后负载一次）
   - agent-browser 驱动关键用户链路（登录→核心操作→登出 / 创建→读取→更新→删除）
   - 截图取证存 .agents/qa-e2e/
   - 无 UI 项目: 优雅跳过浏览器, 降级为 API 端点黑盒 / CLI 子命令 E2E
```

每层产出 `PASS / NEEDS_FIX / REBUILD`；层内失败按模式处理（见 4.4）。

### 4.2 覆盖率门禁机制 / Coverage Gate

**本轮硬门禁（diff 分支覆盖）**
- 对 `git diff`（未提交优先，回退 `--cached` / `HEAD~1..HEAD`）触及的文件与函数计算**分支覆盖率**（不只是行覆盖）。
- `< 90%` → **NEEDS_FIX**，阻断提交/里程碑推进；报告精确列出未覆盖分支 `file:line`。

**全局 ratchet（不回退）**
- 读写 `.agents/qa-baseline.json` 记录项目整体行/分支覆盖率基线。
- 本轮全局覆盖率**低于基线** → NEEDS_FIX（防止"加代码不加测试"稀释总覆盖）。
- 本轮达标且全局未回退 → 更新基线为新值（ratchet 只升不降）。
- 基线文件不存在（首次）→ 以本轮结果建立基线，仅对 diff 门禁；全局不判回退。

**工具链自适应**
- 从 CONTEXT.md / 项目原生配置探测覆盖率命令（见 5.3）。
- 工具**不支持分支覆盖** → 降级为行覆盖 + 报告明确告警"分支覆盖不可用，已降级为行覆盖"，仍按 90% 判行覆盖。

**与 test-patterns.md 协调**
- `engineer-qa` 的 90% 分支覆盖为门禁真源。
- `init-project/references/test-patterns.md` 中 70%/80% 旧阈值标注为"最低下限参考；进入 QA 门禁以 90% 分支覆盖为准"。不删除旧表（保持向后引用兼容）。

### 4.3 agent-browser E2E 流程 / E2E Flow

1. 探测启动命令（CONTEXT.md 部署/运行章节 → 项目原生脚本 `package.json` scripts / Makefile / `README`）。
2. 起服务（后台），等待就绪（探测端口/健康检查）。
3. `Skill: agent-browser` 按脚本化步骤驱动：导航 → 填表 → 点击 → 断言 DOM/文本/状态。
4. 断言来源优先级：CONTEXT.md 用户链路/验收标准 → 实体 CRUD 推断的最小链路。
5. 截图取证 → `.agents/qa-e2e/<链路名>-<步骤>.png`。
6. flake 处理：单条链路失败自动重试 1 次，再失败才判 FAIL。
7. 收尾：关闭服务，收集通过/失败链路。

**降级**: 探测到无前端（无 web 入口、纯 library、纯 CLI）→ 跳过浏览器：
- API 项目 → 端点黑盒 E2E（起服务 + HTTP 断言 CRUD 全链路）。
- CLI 项目 → 子命令 E2E（安装→运行→输出/退出码断言）。
- Library → 跳过 E2E，报告标注"库项目无 E2E，以单元+集成为终验"。

### 4.4 三态决策 / Branch Decision（沿用 inspector）

| 结论 | 触发条件 | normal | auto | silent |
|:----:|---------|--------|------|--------|
| ✅ PASS | 四层全绿 + diff 分支覆盖 ≥90% + 全局不回退 | 出报告，建议提交 | 继续下一步 | 静默继续 |
| ⚠️ NEEDS_FIX | 测试失败 / 覆盖率不足 / 全局回退 / E2E 单链路失败 | 出报告等决策 | 自动下发升维指令修一次后复验 | 修一次后复验 |
| 🛑 REBUILD | 修一次后仍失败 / 根本性错误 | 建议 reset 重建 | 自动 `git reset --hard` 重建（≤2 次） | 静默重建（≤2 次） |

---

## 5. 组件 / Components

### 5.1 新增: `skills/engineer-qa/SKILL.md`

主 skill 文档。结构对齐 engineer-inspector 的风格：
- frontmatter: `name: engineer-qa`，`compatibility: "bash, read, write, agent"`，描述含中英文 TRIGGERS。
- 章节: 核心理念 / 触发条件 / 模式选择 / 工作前提 / 四阶段工作流 / 覆盖率门禁 / E2E 流程 / 报告模板 / 三态决策 / 边界情况。

### 5.2 新增: `skills/engineer-qa/references/`

| 文件 | 内容 |
|------|------|
| `coverage-tools.md` | 各语言覆盖率命令 + 分支覆盖开关 + 报告解析要点（Python/JS-TS/Go/Rust/Java 等） |
| `e2e-playbook.md` | agent-browser E2E 编排指南：起服务、脚本化断言模式、截图取证、降级路径 |
| `qa-report-template.md` | `.agents/qa-latest.md` 报告模板 |

### 5.3 覆盖率工具链映射（coverage-tools.md 摘要）

| 语言/框架 | 覆盖率命令（含分支） |
|-----------|--------------------|
| Python (pytest) | `pytest --cov --cov-branch --cov-report=term-missing` |
| JS/TS (jest) | `jest --coverage --coverageReporters=text` (branches 列) |
| JS/TS (vitest/c8) | `vitest run --coverage` / `c8 --branches 90` |
| Go | `go test -covermode=count -coverprofile=... `（行覆盖；分支覆盖降级告警） |
| Rust | `cargo tarpaulin --out Stdout`（行覆盖为主；分支降级告警） |
| Java | JaCoCo `mvn test`（含 branch counter） |

> 优先读项目原生配置里的既有测试命令；映射表为回退。缺分支能力则降级并告警。

### 5.4 改造: 管道钩子 / Pipeline Hooks

| 接入点 | 改动 |
|--------|------|
| `skills/engineer-workflow/SKILL.md` 第七步 | 验收的"测试运行+覆盖率"委托给 `engineer-qa`（②③层，per-milestone）；测试/覆盖率不达标 = 里程碑验收失败（NEEDS_FIX），进入既有升维/重建分支 |
| `skills/engineer-job/run.wf.js` Phase 2.5 Run Gate | 扩为 **QA-Gate**：build 后调用 `engineer-qa` 跑 ②③ 层硬门禁；失败走既有强制修复循环（normal=2/auto=1/silent=1）；修不动标 `DOES_NOT_RUN` 不宣称完成 |
| `skills/engineer-job/run.wf.js` Phase 3 Integrate | 追加 ④ E2E 层负载一次（agent-browser / 降级黑盒）；非阻塞记录进最终报告 |
| `skills/engineer-job/run.wf.js` `meta.phases` | 更新 Run Gate 描述为 "QA gate: build + unit + integration + coverage"；Integrate 描述增 E2E 子步 |
| `skills/engineer-job/references/engine.md` | 同步 Phase 2.5 / Phase 3 文档描述 |
| `skills/engineer-inspector/SKILL.md` 信号6 | 收敛为指针："测试/覆盖率合规改由 engineer-qa 裁决"，保留一句触发提示，删除重复的量化阈值细节 |
| `skills/engineer-next/SKILL.md` 决策表 | 增补：`job.state` 显示 development DONE 但 qa 未过 / 无 qa 记录 → 路由 `engineer-qa` 补验收 |
| `init-project/references/test-patterns.md` | 顶部加注：QA 门禁真源为 engineer-qa 的 90% 分支覆盖；本表为下限参考 |

### 5.5 README 注册

- `README.md` / `README.zh-CN.md`：技能列表、决策表、文件树中登记 `engineer-qa`（与既有 engineer* 条目风格一致）。

---

## 6. 数据流 / Data Flow

```
功能开发完成 (engineer-workflow 第六步 / engineer-job Phase 2 DONE)
        │
        ▼
engineer-qa 触发（管道自动 or 手动）
        │
   ① 静态盘点 ── 读 CONTEXT.md + git diff + 探测工具链
        │
   ② 单元层 ── 跑单元测试 + diff 分支覆盖率 ≥90% ──► .agents/qa-baseline.json (ratchet)
        │
   ③ 集成层 ── 跑集成测试 + CRUD/错误路径
        │
   ④ E2E 层 ── agent-browser 关键链路 ──► .agents/qa-e2e/*.png
        │
        ▼
   三态结论 ──► .agents/qa-latest.md
        │
  ┌─────┼─────────────────┐
  ▼     ▼                 ▼
 PASS  NEEDS_FIX         REBUILD
 提交   升维指令修一次复验   git reset --hard 重建(≤2)
```

---

## 7. 错误处理 / Error Handling

| 场景 | 处理 |
|------|------|
| 无 CONTEXT.md | 按通用最佳实践 + test-patterns.md 通用标准执行；建议补蓝图 |
| 无 git 仓库 | 询问用户本轮改了哪些文件，以此为 diff 范围 |
| diff 为空（已提交） | 回退 `git diff HEAD~1..HEAD` 作为本轮范围 |
| 覆盖率工具不支持分支覆盖 | 降级为行覆盖 + 报告告警 |
| 无测试框架/无法探测测试命令 | 🔴 NEEDS_FIX：报告"无法运行测试"，要求先建立测试基础设施 |
| E2E 起服务失败/环境不可用 | 降级：跳过 E2E，报告标注环境原因；②③层仍须过 |
| 无 UI 项目 | E2E 优雅跳过/降级为黑盒（见 4.3） |
| 首次无 baseline | 建立基线，仅 diff 门禁，全局不判回退 |
| E2E flake | 单链路重试 1 次再判 |
| 用户要求"跳过测试直接过" | 礼貌提醒"无验证不固化"，坚持则要求在 CONTEXT.md 备注风险 |

---

## 8. 测试策略（本 skill 自身的验证）/ Verifying the Skill

skill 为文档型，验证方式：
1. **触发准确性**: 中英文触发语句 → 命中 engineer-qa（可参考 skill-creator eval 模式，若采用）。
2. **管道端到端**: 在一个含前端的样例项目跑 `engineer-job --auto`，确认 QA-Gate 拦截低覆盖率、E2E 跑通并出报告。
3. **降级路径**: 纯 API 项目确认 E2E 降级为黑盒；无分支覆盖工具确认降级为行覆盖告警。
4. **恢复路由**: 构造 development DONE 但 qa 未过的 `job.state`，确认 engineer-next 路由到 engineer-qa。

---

## 9. 交付清单 / Deliverables

**新增**
- `skills/engineer-qa/SKILL.md`
- `skills/engineer-qa/references/coverage-tools.md`
- `skills/engineer-qa/references/e2e-playbook.md`
- `skills/engineer-qa/references/qa-report-template.md`

**改造**
- `skills/engineer-workflow/SKILL.md`（第七步委托）
- `skills/engineer-job/run.wf.js`（Phase 2.5 QA-Gate + Phase 3 E2E + meta.phases）
- `skills/engineer-job/references/engine.md`（同步描述）
- `skills/engineer-inspector/SKILL.md`（信号6 收敛为指针）
- `skills/engineer-next/SKILL.md`（决策表增补 qa 路由）
- `skills/init-project/references/test-patterns.md`（顶部加注真源）
- `README.md` / `README.zh-CN.md`（注册 engineer-qa）

---

## 10. 里程碑建议（供 writing-plans 细化）

1. **M1 — engineer-qa skill 主体**: SKILL.md + 三个 references（四阶段/覆盖率门禁/E2E/报告/三态/边界完整）。
2. **M2 — 覆盖率门禁与 baseline 机制**: diff 分支覆盖口径 + `.agents/qa-baseline.json` ratchet 规则在 coverage-tools.md 落细。
3. **M3 — 管道钩子接线**: engineer-workflow 第七步 + engineer-job run.wf.js（QA-Gate/E2E/meta）+ engine.md 同步。
4. **M4 — 真源收敛与路由**: inspector 信号6 收敛、engineer-next 决策表、test-patterns.md 加注。
5. **M5 — 注册与文档**: README/README.zh-CN 登记；自检触发与端到端样例验证。
