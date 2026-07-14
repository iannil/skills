# engineer-cloner — 逆向站点克隆前置引擎 / Reverse Site-Clone Front-End Engine

**日期 / Date**: 2026-07-14
**状态 / Status**: 设计已批准 / Design approved
**方法论来源**: 沿用 engineer-* 技能链的"实现规划"方法论（`engineer-architect`、`engineer-job`、`engineer-orchestrator`）

---

## 1. 目标与定位 / Goal & Positioning

新增一个 engineer-* 家族的**前置观测 skill**：`engineer-cloner`。给定一个正在运行的目标站点地址与一个具有完整操作权限的账号，对其进行**授权范围内的逆向观测**，产出方法论标准的三文档体系（`REQUIREMENTS.md` / `CONTEXT.md` / `FRONTEND-DESIGN.md`）与一份诚实的保真差距报告（`CLONE-FIDELITY.md`），然后**交棒 `engineer-job`（或 `engineer-orchestrator`）** 完成全功能、全生命周期、高精度的站点克隆构建。

**它不重造构建流程。** 观测复用 `agent-browser` 技能，文档格式复用 `engineer-architect` / `engineer-frontend-architect`，构建复用 `engineer-job`。

### 在技能链中的位置

| 场景 | 入口 skill | 产出 |
|---|---|---|
| 从零做完整项目 | `engineer-job` | 完整项目 |
| **从已有运行站点克隆** | **`engineer-cloner`（本 skill）** | 三文档 + 保真报告 → 交棒 `engineer-job` |
| 复杂多模块、需求仍模糊 | `engineer-requirements` | `REQUIREMENTS.md` |
| 已有明确目标、无蓝图 | `engineer-architect` | `CONTEXT.md` |

**路由规则 / Routing rule**：当用户提供**目标 URL + 账号**并表达"克隆/复刻现有站点"时，`engineer-cloner` 优先于 `engineer-architect` / `engineer-job` 触发。cloner 完成三文档后再把 `engineer-job` 作为下游调用。

---

## 2. 核心原则 / Core Philosophy（四条）

### 原则一：观测即黑盒，推断即架构 / Observe the Black Box, Infer the Architecture

即使拥有完整操作权限的账号，可精确复刻的只有**客户端可观测的部分**：UI、交互、页面状态、以及客户端能看到的 API 契约（请求/响应结构、状态码、鉴权方式）。**服务端业务逻辑无法拷贝，只能推断为"行为等价"。** 本 skill 严禁声称复制了后端源码。这条边界必须写入产物 `CLONE-FIDELITY.md`，并把每一项能力标注为三档之一：

- **可观测精确 / Observable-exact** — 客户端可直接验证（UI、前端交互、API 契约形状）
- **推断 / Inferred** — 从行为与响应体反推（数据模型、后端规则、校验逻辑）
- **不可观测 / Unobservable** — 无法从客户端得知（服务端定时任务、内部集成、密钥、后台批处理）

### 原则二：覆盖靠账本，不靠记忆 / Coverage via Ledger, Not Memory

"全功能"是逆向克隆最难的部分——如何确信已发现所有功能？答案是**持久化功能账本 + loop-until-dry 发现循环**：

- 每发现一个功能就写入 `.agents/clone.ledger.json`（路由、名称、角色可见性、UI 状态、表单、观测到的 API 调用）
- **loop-until-dry**：持续遍历，直到连续 N 轮（默认 2 轮）不再发现新功能/新状态
- **覆盖 critic**：每轮结束反问"还有哪个导航项、弹窗、空态、错误态、分页、筛选、详情页没有打开？"

账本是跨会话可恢复的唯一真相源，对话上下文丢失也能从账本继续。

### 原则三：状态即文件 / 交棒复用 / State Is Files, Reuse the Chain

所有观测状态与产物落到文件系统，不活在对话里。cloner 产出三文档后交棒 `engineer-job`，不自行实现脚手架/编排/验收。

### 原则四：授权先行 / Authorization First

任何携带凭证的访问之前，先过一个轻量授权确认关卡：确认用户对目标站点**合法拥有权限或已获授权**（自有系统迁移/重建、或已获书面授权的重构）。同时确立**不克隆边界**：支付网关、第三方 SaaS 集成、他方密钥与受版权保护的原始媒体资产不纳入克隆。本 skill 做**功能重构**（design-language reconstruction + 现代栈重建），不做原始资产镜像拷贝。

---

## 3. 保真与技术栈决策（已确认）/ Fidelity & Stack Decisions

| 决策点 | 选择 | 含义 |
|---|---|---|
| 前端保真目标 | **设计语言重建**（提取 token + 组件） | 从原站提取设计系统写入 `FRONTEND-DESIGN.md`，用干净技术栈重建；视觉接近但代码全新，可维护、无资产拷贝风险 |
| 后端/整体技术栈 | **用推荐的现代栈重建** | 不拘泥原栈；由 architect 阶段按需求推荐现代栈，仅保证 API 契约与行为等价 |
| 观测引擎 | **依赖 `agent-browser` 技能** | cloner 只写观测方法论，登录/点击/截图/抓网络请求交给 agent-browser |
| 角色覆盖 | **默认最高权限账号** | 假设账号可见全部功能；文档中标注推断出的角色-权限矩阵 |

---

## 4. 逆向流水线 / Reverse Pipeline（七阶段）

前六阶段是 cloner 独有的逆向观测，第七阶段交棒。

| 阶段 | 名称 | 输入 → 输出 | 关键动作 |
|:--:|---|---|---|
| 0 | 授权与范围 / Authorize & Scope | 用户请求 → scope 记录 | 确认授权；记录目标 URL、凭证处理方式、**不克隆边界** |
| 1 | 侦察 / Recon（未登录） | 目标 URL → 指纹报告 | sitemap/robots、响应头与资源指纹**推断原栈**、公开页与首轮设计 token |
| 2 | 登录全站遍历 / Authenticated Traversal | 账号 → `clone.ledger.json` + 截图 | 经 agent-browser 用最高权限账号系统遍历每个视图，建功能账本；**loop-until-dry** + 覆盖 critic |
| 3 | 契约与数据模型提取 / Contract & Model Extraction | 网络抓包 → 数据字典 + API 契约 | 从流量重建 API 契约；从响应体反推实体关系 → 领域术语表 |
| 4 | 设计语言提取 / Design-Language Extraction | 截图 + DOM → 设计语言素材 | 提取设计 token（色彩/排版/间距）、组件清单、布局模式、UI 状态机（重建而非镜像） |
| 5 | 三文档合成 / Synthesize Docs | 以上全部 → 三文档 + 保真报告 | 合成 REQUIREMENTS/CONTEXT/FRONTEND-DESIGN + **CLONE-FIDELITY.md** |
| 6 | 交棒 / Handoff | 三文档 → 可运行克隆 | 调用 `engineer-job`/`engineer-orchestrator` 构建；**高保真验收 = 重建视图对比阶段 2 截图** |

### 阶段间数据流

```
scope 记录 (P0)
    ↓
指纹报告 (P1) ──────┐
    ↓               │
clone.ledger.json (P2) + 截图/抓包
    ↓               │
API 契约 + 数据字典 (P3)
    ↓               │
设计语言素材 (P4)    │
    ↓               ↓
REQUIREMENTS.md + CONTEXT.md + FRONTEND-DESIGN.md + CLONE-FIDELITY.md (P5)
    ↓
engineer-job 构建 + 截图对比验收 (P6)
```

### loop-until-dry 遍历（阶段 2 核心）

```
seen = 已发现功能集合
dry = 0
while dry < 2:
    对每个未展开的入口（导航项/按钮/链接/弹窗触发器）：
        经 agent-browser 打开 → 记录功能到 ledger → 截图 → 记录网络请求
    新功能数 = |本轮新增|
    if 新功能数 == 0: dry += 1
    else: dry = 0
    覆盖 critic 追问遗漏面（空态/错误态/分页/筛选/详情/多步表单）
```

---

## 5. 产物与文件结构 / Artifacts & File Layout

### 运行时产物 / Runtime artifacts

| 文件 | 用途 |
|---|---|
| `.agents/clone.ledger.json` | 功能账本 + 覆盖状态（跨会话可恢复的真相源） |
| `.agents/clone.observations/` | 截图、网络抓包、提取的设计 token 原始素材 |
| `REQUIREMENTS.md` | 从功能账本 + 流程 + 状态机合成（供 architect/job 消费） |
| `CONTEXT.md` | 推荐现代栈 + 数据模型 + API 契约 + 里程碑 |
| `FRONTEND-DESIGN.md` | 设计语言 + 页面树 + 组件树 |
| `CLONE-FIDELITY.md` | 诚实保真/差距报告：可观测精确 / 推断 / 不可观测 三档标注 |

### Skill 磁盘结构 / On-disk structure

```
skills/engineer-cloner/
  SKILL.md
  references/
    observation-playbook.md      # agent-browser 遍历方法论 + loop-until-dry 细则
    contract-extraction.md       # 从网络流量反推 API 契约与数据模型
    coverage-ledger.schema.json  # clone.ledger.json 的 JSON Schema
    fidelity-report-template.md  # CLONE-FIDELITY.md 模板
```

### SKILL.md frontmatter 约定

- `name: engineer-cloner`
- `description:` 强触发词 + 路由规则（有目标 URL+账号克隆现有站点时优先），中英双语，沿用家族风格
- `compatibility: "agent, bash, write, edit, read"`（观测经 agent-browser，需 agent 能力）

---

## 6. 模式 / Modes

沿用家族三模式：

| 模式 | 行为 |
|:--:|---|
| normal | 每阶段完成后展示摘要，关键决策等待用户确认（授权关卡始终确认） |
| auto | 自动推进，用推荐默认值；最终报告标注推断项与保真差距 |
| silent | 全自动，仅输出最终交棒指令与保真报告路径 |

**授权关卡例外**：无论何种模式，阶段 0 的授权确认与"不克隆边界"确认始终执行，不被 auto/silent 跳过。

---

## 7. 触发条件 / Triggering

**必须触发**：
- "克隆这个网站 / 复刻这个站点 / 逆向这个网站"
- "clone this site / reverse-engineer this site / rebuild this website"
- 用户提供了**目标 URL + 账号**并表达重建现有站点的意图

**不触发**（交给其他 skill）：
- 从零做新项目（无目标站点）→ `engineer-job`
- 已有本地代码做架构分析（非线上站点）→ `engineer-architect` 逆向模式

**优先级**：有目标 URL + 克隆意图 → cloner 优先于 architect/job；cloner 内部再调用 job 构建。

---

## 8. 边界情况 / Edge Cases

| 场景 | 处理 |
|---|---|
| 用户无法确认授权 | 停在阶段 0，不进行任何登录/凭证访问 |
| 目标站点有反爬/验证码 | agent-browser 降级为半自动，提示用户人工协助登录，记录到保真报告 |
| 某功能需支付/第三方真实交互 | 标注"不可观测/不克隆边界"，在 CLONE-FIDELITY.md 记录，克隆侧用占位/mock |
| 遍历中途会话中断 | 从 `clone.ledger.json` 恢复，跳过已覆盖功能继续 loop |
| 观测到的 API 契约不完整（如仅见成功态） | 在契约中标注"仅观测到 2xx"，错误态标 inferred |
| 站点为 SPA、路由不在 URL | 以交互路径（点击序列）作为功能账本主键，而非纯 URL |
| 原站含受版权媒体资产 | 不拷贝原始资产；FRONTEND-DESIGN.md 记录占位需求，构建侧用替代素材 |
| 重建视图与截图差异大（P6 验收） | 记录差异清单作为后续迭代项，不阻塞交付；auto/silent 下写入最终报告 |

---

## 9. 非目标 / Non-Goals（YAGNI）

- **不**镜像原始 HTML/CSS/JS/媒体资产（做设计语言重建，非拷贝）
- **不**实现内置浏览器（复用 agent-browser）
- **不**重造脚手架/编排/验收/部署（复用 engineer-job 链）
- **不**克隆支付网关、第三方 SaaS、密钥、服务端不可观测逻辑
- **不**声称复制了后端源码

---

## 10. 交付清单 / Deliverables

1. `skills/engineer-cloner/SKILL.md` — 主 skill 文件（双语，家族文风，七阶段流水线）
2. `skills/engineer-cloner/references/observation-playbook.md`
3. `skills/engineer-cloner/references/contract-extraction.md`
4. `skills/engineer-cloner/references/coverage-ledger.schema.json`
5. `skills/engineer-cloner/references/fidelity-report-template.md`
6. `README.md` / `README.zh-CN.md` — Engineering Skills 列表与"Pick the right entry skill"表各加一行
