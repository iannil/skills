# 工程化技能链增强设计 — 需求分析与前端架构设计

**日期**: 2026-07-13
**状态**: 已批准
**对应版本**: iannil/skills v3.x

---

## 背景

iannil/skills 包的工程化技能链（engineer-job → engineer-architect → engineer-orchestrator → engineer-workflow → engineer-inspector）经过 AOPA 无人机合格证系统的验证测试，暴露出三个关键缺口：

1. **需求分拆不够细致** — 当面对 AOPA 这样 4 端、数十个模块的复杂系统时，engineer-architect 现有的"需求收敛→技术选型→数据模型→里程碑"的线性流程过于粗糙，缺少对需求的结构化拆解过程。
2. **架构设计过于老旧** — 技术选型停留在"推荐语言/框架/数据库"层面，缺少对多端多模块企业系统的架构模式指导（BFF、事件驱动、CQRS、多租户等）。
3. **没有体现前端设计过程** — 架构师把主力放在后端（数据模型、API），前端仅有一个"设计方向"小节，缺少正式的页面树、组件树、状态管理、UI 状态机设计过程。

本设计针对以上三个缺口，采用**新增两个技能 + 改进现有技能**的方案。

---

## 设计概览

### 技能链变化

```
新增技能:
  skills/engineer-requirements/SKILL.md          ← 需求分析技能
  skills/engineer-frontend-architect/SKILL.md    ← 前端架构设计技能

修改技能:
  skills/engineer-architect/SKILL.md             ← 增加架构模式决策 + 部署架构 + 里程碑并行
  skills/engineer-job/run.wf.js                  ← 6→8 阶段，新增 Phase 1/3
  skills/engineer-job/SKILL.md                   ← 更新编排说明

新增参考文件:
  skills/engineer-requirements/references/requirements-template.md
  skills/engineer-frontend-architect/references/frontend-design-template.md
  skills/engineer-architect/references/enterprise-architecture-patterns.md
```

### 8 阶段编排

```
Phase 0: init-project        → project-metadata.json + 文件树
Phase 1: engineer-requirements  → REQUIREMENTS.md (需求深度拆解)
Phase 2: engineer-architect     → CONTEXT.md + ADRs (含架构模式/部署架构，改进版)
Phase 3: engineer-frontend-architect → FRONTEND-DESIGN.md (前端详细设计)
Phase 4: engineer-orchestrator  → 完整代码 (前后端里程碑并重)
Phase 5: integrate            → 集成测试报告
Phase 6: deploy               → 部署配置
Phase 7: report               → 最终报告
```

### 三文档体系

```
REQUIREMENTS.md  ← 需求分析师产出 (Phase 1)
  ↓ 输入
CONTEXT.md        ← 架构师产出 (Phase 2，改进版)
  ↓ 输入
FRONTEND-DESIGN.md ← 前端架构师产出 (Phase 3)
  ↓ 输入
orchestrator/workflow 消费以上三文档 (Phase 4+)
```

---

## 设计变更一：新增 engineer-requirements 技能

### 定位

在 architect 绘制架构蓝图之前，专门负责需求的深度拆解。解决"需求分拆不够细致"问题。

### 方法论

基于 **Event Storming + 领域驱动设计 (DDD) 战略设计**：

| 步骤 | 名称 | 方法 | 产出 |
|:----:|:----|:-----|:-----|
| 1 | 角色旅程 | 按用户角色走通端到端核心流程 | 用户旅程图 |
| 2 | 事件风暴 | 识别关键业务事件，追溯命令和聚合 | 事件流 + 命令列表 |
| 3 | 模块拆解 | 识别有界上下文（Bounded Context） | 模块划分 + CONTEXT-MAP |
| 4 | 功能清单 | CRUD 矩阵 + 功能归属 | 详尽功能列表 |
| 5 | 功能依赖图 | 有向无环图依赖关系 | 依赖关系图 |
| 6 | 关键状态机 | 核心业务对象的状态流转 | 状态机定义 |
| 7 | 验收条件 | 每条功能的验收条件 | 验收标准清单 |

### 触发条件

- 用户描述了一个多模块/多端系统（如 2 个以上前端端，或 5 个以上功能模块）
- 用户说"帮我分析需求"、"需求拆解"、"梳理需求"
- engineer-architect 检测到需求复杂度超过阈值后推荐触发
- 当前 context-map-template 的部分内容（CONTEXT-MAP）将作为此技能的副产品生成

### 输出：`REQUIREMENTS.md`

| 章节 | 内容 | 示例（AOPA） |
|:----|------|:------------|
| 角色定义 | 用户角色及其职责 | 机构管理员、AOPA 管理员、学员、考试员 |
| 角色旅程 | 每个角色的端到端核心流程 | 机构：资质申请→学员录入→考试申请→成绩查看 |
| 事件风暴 | 关键业务事件列表 | 资质提交、考试申请、证书打印、凭证审核 |
| 模块拆解 | 按有界上下文划分模块 | 资质/学员/考试/证书/财务/CMS |
| 模块间映射 | 上下文映射关系图 | 考试→学员（依赖学员数据）|
| 功能清单 | 完整功能列表 + 归属 + CRUD | 约 50+ 条功能，标注归属端 |
| 功能依赖图 | 有向无环图 | 考试申请→学员录入→资质通过 |
| 关键状态机 | 核心对象状态流转 | 考试申请：待审核→已审核→已安排→已完成 |
| 验收条件 | 功能级验收描述 | 机构发起提现→管理端审核→打款→流水更新 |

### 关键设计决策

1. **验收标准是结构化描述，非 BDD Gherkin**。一句话描述不产生歧义即可，不要求 Given/When/Then 格式。保持轻量但足够 architect 做后续设计。
2. **状态优先**。对有大量审批流和状态流转的系统（如 AOPA），状态机定义在 Phase 1 完成，直接指导后续数据模型中的状态字段设计。
3. **CONTEXT-MAP.md 作为副产品**。如果模块超过 3 个，自动生成 `CONTEXT-MAP.md`。

### REQUIREMENTS.md 模板

详见 `references/requirements-template.md`。

---

## 设计变更二：改进 engineer-architect 技能

### 什么不变

- Phase 1（需求收敛）、Phase 3（固化）、逆向分析模式全部保留
- CONTEXT.md 模板格式不变
- 术语先行、双向推演等核心原则不变
- Step 7 "前端设计方向"保留，作为前端架构师工作的前置参考

### 什么变

在现有流程中插入两个新阶段，并增加架构模式参考：

```
当前流程:                             改进后:
┌─────────────┐                      ┌─────────────┐
│ 需求收敛     │ ← 不变，输入改为      │ 需求收敛      │ ← 读取 REQUIREMENTS.md
├─────────────┤   REQUIREMENTS.md    ├─────────────┤
│ 技术选型     │                      │ 技术选型      │ ← 不变
├─────────────┤                      ├─────────────┤
│ 词汇表       │                      │ 词汇表       │ ← 不变
├─────────────┤                      ├─────────────┤
│ 数据模型     │                      │ 🆕 架构模式决策│ ← 新增: 多端架构选择
├─────────────┤                      ├─────────────┤
│ API 契约     │                      │ 🆕 部署架构   │ ← 新增: 部署拓扑
├─────────────┤                      ├─────────────┤
│ 前端设计方向  │                      │ 数据模型     │ ← 不变
├─────────────┤                      ├─────────────┤
│ 里程碑拆解   │                      │ API 契约     │ ← 不变
└─────────────┘                      ├─────────────┤
                                      │ 前端设计方向  │ ← 保留
                                      ├─────────────┤
                                      │ 里程碑拆解    │ ← 增强: 前后端里程碑分离
                                      └─────────────┘
```

### 新增：架构模式决策

在技术选型确认后、数据模型设计前，对多端/多模块系统进行架构模式选择。

对 AOPA 这样的多端系统，应用的架构模式：

| 模式 | 适用场景 | 说明 |
|:----|---------|:-----|
| BFF | 不同端有不同的数据展示需求 | 每个前端端一个专属 BFF，聚合后端数据 |
| 事件驱动 | 异步跨模块流程 | 证书打印、快递对接、"考试→审核→成绩同步" |
| CQRS | 读多写少、报表查询 | 财务报表、数据看板、证书统计 |
| 多租户 | 一个管理端管理多个机构 | 数据按机构隔离，应用层共享 |
| API Gateway | 多端共享认证/限流 | 统一认证入口、路由、频控 |
| Saga / 事件编排 | 跨模块最终一致性 | 考试付款→安排→成绩→证书的跨模块流程 |

**输出**：更新 `CONTEXT.md` 的「系统全景」章节，增加架构模式和架构图。

### 新增：部署架构

给出多端系统的推荐部署拓扑，以 Mermaid 图嵌入 `CONTEXT.md`。

```
[前端层]  →  [BFF/Gateway层]  →  [领域服务层]  →  [基础设施层]
```

### 里程碑拆解增强

里程碑支持**前后端分离**，orchestrator 可并行调度：

```
后端里程碑:    前端里程碑:
M1 数据模型     M1' 设计系统+布局框架   ← 可并行
M2 业务 API     M2' 核心页面            ← 依赖 M1+M1' 完成
M3 高级 API     M3' 高级页面            ← 依赖 M2+M2'
```

### 企业架构模式参考

新增 `references/enterprise-architecture-patterns.md`，包含：

1. **BFF 模式**：定义、适用场景、与 API Gateway 的关系
2. **事件驱动架构**：事件定义规范、事件总线选择、幂等性
3. **CQRS 模式**：读写分离边界、查询模型设计、与事件驱动的组合
4. **多租户架构**：隔离策略（数据库级/Schema 级/行级）、租户上下文传递
5. **Saga 模式**：编排型 vs 协同型选择、补偿事务设计
6. **DDD 分层架构**：应用层/领域层/基础设施层的职责边界

---

## 设计变更三：新增 engineer-frontend-architect 技能

### 定位

在 architect 完成系统架构后，专门做前端的详细设计。解决"没有体现前端设计过程"问题。

### 触发条件

- 项目包含前端界面
- 当 **多个前端端** 存在时（如 AOPA 的 4 端），必须触发
- 单端简单项目（如一个管理后台）可选，由用户或 architect 判断

### 流程

| 步骤 | 名称 | 产出 |
|:----:|:----|:-----|
| 1 | 前端范围分析 | 端定义表（技术栈/设备/用户/设计系统归属） |
| 2 | 设计系统定义 | 跨端 Token + 端特有 Token（色板/间距/字体/圆角/阴影） |
| 3 | 页面树 & 路由 | 每个端的完整页面树 + 路由 + 嵌套布局 |
| 4 | 组件树设计 | 布局→页面→业务组件→通用 UI 层次 |
| 5 | 状态管理架构 | 全局状态 vs 局部状态 vs 服务端状态边界 |
| 6 | UI 状态机设计 | 每个核心页面的 loading/empty/error/edge cases |
| 7 | API 交互模式 | 数据获取策略、乐观更新、文件上传、认证 |
| 8 | 页面级设计总结 | 每个核心页面：一句话设计 + 状态机 + 数据需求 |

### 输出：`FRONTEND-DESIGN.md`

文档结构：

```markdown
# [项目名] — 前端设计文档

## 1. 前端范围
[端定义表: 每个端的技术栈、设备、用户、设计系统归属]

## 2. 设计系统 Token
[跨端 Token 定义: 主色、字体、间距、圆角、阴影]
[端特有 Token: 每个端特有的调整]

## 3. 页面树 & 路由
[每个端的完整页面树，含路由路径和嵌套布局]
[AOPA 示例: 机构端 /dashboard /students /exams /qualifications /finance]

## 4. 组件树
[按 UI 通用组件 → 业务组件 → 页面组件的层次]
[关键组件: DataTable、FormWizard、FileUploader、StatusBadge 等]

## 5. 状态管理架构
[全局状态、局部状态、服务端状态的边界划分]
[AOPA 示例: React Query 管理服务端状态，Zustand 管理 UI 状态]

## 6. UI 状态机
[每个核心页面: 完整的 UI 状态定义]
[覆盖: loading / empty / error / success / 空值 / 边界情况]

## 7. API 交互模式
[数据获取: SSR / SWR / 静态生成为每个页面的选择]
[操作: 乐观更新 / 悲观更新 / 轮询]
[文件上传: 分片/断点续传/水印]

## 8. 页面级设计总结
[每个核心页面: 一句话设计要点 + 数据需求 + UI 状态机]
```

### 与 orchestrator/workflow 的联动

- `FRONTEND-DESIGN.md` 中的页面和组件定义直接对应前端里程碑
- workflow 编码前端里程碑时读取 `FRONTEND-DESIGN.md` 获取精确的页面/组件/状态规范
- 当前 `frontend-guide.md`（目录规范/通用生态推荐）保留为轻量参考
- 新项目的前端开发以 `FRONTEND-DESIGN.md` 为准

### FRONTEND-DESIGN.md 模板

详见 `references/frontend-design-template.md`。

---

## 设计变更四：engineer-job 编排扩展

### 8 阶段编排

`run.wf.js` 从 6 阶段扩展到 8 阶段：

```javascript
const PHASES = [
  { phase: 0, skill: 'init-project',           label: '项目初始化' },
  { phase: 1, skill: 'engineer-requirements',   label: '需求分析' },      // NEW
  { phase: 2, skill: 'engineer-architect',      label: '架构蓝图' },      // IMPROVED
  { phase: 3, skill: 'engineer-frontend-architect', label: '前端设计' },  // NEW
  { phase: 4, skill: 'engineer-orchestrator',   label: '开发编排' },      // IMPROVED
  { phase: 5, skill: 'integrate',               label: '集成测试' },
  { phase: 6, skill: 'deploy',                  label: '部署配置' },
  { phase: 7, skill: 'report',                  label: '最终报告' },
]
```

### 并行 Phase 支持

工程化的编排器在 Phase 4 可并行调度前后端里程碑：

```
Phase 4 (orchestrator) 内部:
  ├── Track 1: 后端里程碑 (M1 数据模型 → M2 业务API → M3 高级API)
  └── Track 2: 前端里程碑 (P1 设计系统 → P2 核心页面 → P3 高级页面)
```

每个 Track 内部仍是串行的 engineer-workflow 调用，但两端之间无阻塞依赖。

---

## 向后兼容性

1. **现有 SKILL.md 不受影响** — 旧式手动执行对所有技能仍然可用
2. **简单项目不受影响** — 对于单功能项目（无多端、无前端），engineer-job 可以跳过 Phase 1 和 Phase 3
3. **现有 CONTEXT.md 格式完全兼容** — architect 的改进是增量新增内容，不改变已有结构
4. **现有 job.state.json 兼容** — 8 阶段只是数组扩展，不改变格式
5. **README.md 不受影响** — 安装方式不变

### 简单项目跳过逻辑

run.wf.js 在启动时检测：

```javascript
if (project_type === 'simple') {
  // 单功能/CLI/纯库，跳过需求和前端设计阶段
  skipPhase(1) // engineer-requirements
  skipPhase(3) // engineer-frontend-architect
}
```

判断简单项目的条件：
1. 只有一个前端端或无前端界面
2. 模块 <= 3 个
3. 用户角色 <= 2 个
4. 无明显多租户或跨模块流程

---

## 文件变更总览

### 新建文件

| # | 文件 | 预估行数 | 用途 |
|:-:|------|:--------:|------|
| 1 | `skills/engineer-requirements/SKILL.md` | ~400 | 需求分析技能 |
| 2 | `skills/engineer-requirements/references/requirements-template.md` | ~150 | REQUIREMENTS.md 模板 |
| 3 | `skills/engineer-frontend-architect/SKILL.md` | ~450 | 前端架构设计技能 |
| 4 | `skills/engineer-frontend-architect/references/frontend-design-template.md` | ~200 | FRONTEND-DESIGN.md 模板 |
| 5 | `skills/engineer-architect/references/enterprise-architecture-patterns.md` | ~250 | 企业架构模式参考 |

### 编辑文件

| # | 文件 | 改动量 | 改动内容 |
|:-:|------|:------:|---------|
| 1 | `skills/engineer-architect/SKILL.md` | +200 行左右 | 新增架构模式决策阶段 + 部署架构阶段 + 里程碑并行 |
| 2 | `skills/engineer-job/run.wf.js` | 重构 | 6→8 阶段；配置是否跳过 Phase 1/3 |
| 3 | `skills/engineer-job/SKILL.md` | +20 行 | 更新 8 阶段编排说明 |

### 无变更

| 文件 | 理由 |
|------|------|
| `engineer-orchestrator/SKILL.md` | 编排逻辑不变，输入文档更多但消费模式不变 |
| `engineer-workflow/SKILL.md` | 单功能开发流程不变，编码时读取的参考文档多了 FRONTEND-DESIGN.md |
| `engineer-inspector/SKILL.md` | 验收逻辑不变 |
| `README.md` | 安装方式不变 |

---

## 未纳入范围

1. 不修改 engineer-orchestrator 的内部编排逻辑 — 仅后端的里程碑列表多了前端里程碑
2. 不修改 engineer-workflow 的单功能开发流程 — 但前端里程碑的编码参考增加 FRONTEND-DESIGN.md
3. 不修改 engineer-inspector 的验收逻辑
4. 不涉及 init-project 的脚手架扩展（脚手架阶段不变）
5. 不涉及部署配置生成的变化
