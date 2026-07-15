# engineer-poc — AI 高保真 POC 生成引擎 / Design Spec

> Date: 2026-07-15
> Status: Approved (brainstorming) → ready for implementation planning
> Family: engineer-* skill chain (methodology: 《基于实现规划的 AI 辅助编程实战》)

---

## 1. 目标 / Goal

新增一个技能 `engineer-poc`，把用户提供的需求转化为**高保真、可运行的纯前端 POC**（proof-of-concept 原型），满足：

- **全功能**：覆盖需求/前端设计里的每个页面、组件、交互、流程。
- **全生命周期**：每页覆盖 loading / empty / error / normal / edge 全状态 + 完整 mock CRUD 生命周期 + 跨页流程 + mock 登录/角色。
- **高精度、高保真**：贴近行业特性与风格，符合同类系统最佳实践。
- **纯前端**：无需后端介入，全部数据走可替换的 mock 数据层。
- **可停留 / 可跳过 / 可继续**：工程可停在 POC；可跳过 POC 直接实现；也可接着 POC 演进为完整功能。

POC 定位在 engineer-job 流程的**需求分析（Phase 1）+ 前端设计（Phase 3）之后、正式实现（Phase 4 orchestrate）之前**。

---

## 2. 已锁定的核心决策 / Locked Decisions

| 决策点 | 选择 | 含义 |
|:--|:--|:--|
| 原型策略 | **演进式（同栈可延续）** | POC = 真实前端工程骨架 + mock 数据层。"继续实现" = 抽掉 mock adapter、接真实 API，engineer-job Phase 4 直接在此基础上编排。 |
| 接入方式 | **独立技能 + 可选 Phase 3.5** | 新建独立技能 `engineer-poc`（可单独触发）；同时在 `engineer-job/run.wf.js` 插入可开关的 `poc` 阶段（`skip_poc` / `stop_at_poc`）。 |
| 行业保真机制 | **内置行业模式库 + 可选联网增强** | 内置 `references/industry-patterns.md` 打底；必要时 WebSearch 对特定行业增强。 |
| engineer-job 默认开关 | **默认生成 POC** | `skip_poc` 默认 `false`；仅对**有前端**的项目生效，无前端项目自动跳过 POC。 |

---

## 3. 核心理念 / Core Philosophy

POC 的职责是：在写下第一个真实后端接口之前，让**整个产品先"像真的、像做完了"**——每个页面、每个状态、每条流程都能在 mock 数据上点得动、走得通、贴合行业风格——同时诚实标注数据层是 mock 且**为演进而设计**。

不是一次性抛弃式样机，而是一副**真实前端骨架，其 mock 层被刻意设计成可被真实 API 替换的单一接缝**。

### 四条核心原则

1. **全功能靠账本，不靠记忆 / Coverage via Ledger, Not Memory**
   由 `REQUIREMENTS.md` + `FRONTEND-DESIGN.md` 驱动的 `.agents/poc.ledger.json`，配合 loop-until-dry + coverage critic，保证全页面 / 全状态覆盖。复用 `engineer-cloner` / `engineer-legacy-recon` 的账本范式。

2. **全生命周期即全状态 / Full Lifecycle Means Every State**
   每页必须覆盖 loading / empty / error / normal / edge，外加完整 mock CRUD 生命周期、跨页流程、mock 登录/角色。只画 happy path 不算 POC（呼应 `engineer-frontend-architect` 原则二）。

3. **行业保真优于通用模板 / Industry Fidelity Over Generic Templates**
   先识别行业（从 REQUIREMENTS 推断），套用 `references/industry-patterns.md` 的典型信息架构、组件、交互范式；设计 Token 取自 `FRONTEND-DESIGN.md`；必要时 WebSearch 增强。POC 要像"这个行业里的真实产品"，不是通用模板。

4. **Mock 层可演进，诚实标注 / Evolvable Mock Layer, Honest Labeling**
   全部数据走一个可替换的 mock adapter（单一接缝，见 `references/mock-layer-guide.md`）。`POC-FIDELITY.md` 逐资产标注三层级：

   | 层级 | 标签 | 含义 |
   |:--|:--|:--|
   | 真实交互 / Real | `真实交互` | 前端逻辑完整、状态齐全、可点可走，仅数据来自 mock。 |
   | mock 数据 / Mocked | `mock 数据` | 数据来自 mock adapter，契约按 CONTEXT.md 或推断，可演进为真实 API。 |
   | 占位未实现 / Placeholder | `占位未实现` | 支付网关 / 第三方 SaaS / 纯服务端算法 → 占位，留待 engineer-job 正式实现阶段接入。 |

---

## 4. 触发条件 / When to Trigger

**必须触发**（独立入口）：
- "做个原型 / 高保真原型 / POC / 样机 / 可点击 demo / 交互原型"
- "prototype / high-fidelity prototype / POC / clickable demo / interactive mockup"
- 用户已有需求或前端设计，想先出一个能演示、能点通的纯前端产品。

**链式触发**：
- engineer-job Phase 3（frontend）完成后自动进入 Phase 3.5（除非 `skip_poc`）。
- 用户在 requirements / frontend 设计完成后说"先出个原型""先做 POC"。

**不触发**：
- 纯后端 / CLI / 库项目（无前端）→ 自动跳过。
- 用户明确要求直接进入正式实现（`skip_poc`）。

**优先级**：
1. 用户表达"要一个可演示的高保真前端原型" → 优先触发 engineer-poc。
2. engineer-poc 完成后可停在交棒点（`stop_at_poc`），或交棒 engineer-job Phase 4 演进。

---

## 5. 模式选择 / Mode Selection

与家族一致（默认 normal）：

| 模式 | 行为 |
|:--:|:--|
| normal | 每阶段展示产出后等待确认；行业范式与设计 Token 需用户验证。 |
| auto | 用默认策略自动推进，仅在重大异常时暂停。 |
| silent | 全自动，仅记录日志，末尾输出交棒摘要。 |

---

## 6. 六阶段流水线 / Pipeline

| 阶段 | 名称 | 输入 → 输出 | 关键动作 | 失败处理 |
|:--:|:--|:--|:--|:--|
| 0 | 输入校验与行业识别 | 三文档 → POC 范围 + 行业匹配 | 读 REQUIREMENTS / FRONTEND-DESIGN（/CONTEXT）；缺则降级（从用户需求生成最小集）；识别行业匹配 `industry-patterns`；划定 do-not-fake 边界（支付/第三方→占位）。 | 三文档全缺 → 降级：从用户 prompt 生成最小需求+页面清单 |
| 1 | POC 脚手架 | 范围 → 演进式前端工程 | 按 FRONTEND-DESIGN 技术栈（默认 Vite + React/Vue）搭骨架，接入设计 Token、路由、**mock adapter 接缝**。 | 技术栈缺失 → 用默认栈，记录 |
| 2 | 覆盖账本构建 | FRONTEND-DESIGN → `poc.ledger.json` | 把每个页面/组件/状态/流程枚举进账本（coverage_status=planned）。 | — |
| 3 | 逐页高保真实现（loop-until-dry） | 账本 → 高保真页面 | 逐页实现全 UI 状态 + mock 数据 + 交互，套用行业范式；账本跑干；coverage critic 复查遗漏。 | 单页失败 → 降级为占位页，标 `占位未实现` |
| 4 | 全生命周期贯通 | 页面 → 可点通的产品 | 打通跨页流程、mock 登录/角色、内存持久化、灌真实感 seed 数据；run gate（build + 启动）。 | build 失败 → 强制修复循环；修不动标 DOES_NOT_RUN |
| 5 | 产物合成与交棒 | 全部 → POC 文档 + 归宿 | 写 `POC-MANIFEST.md` + `POC-FIDELITY.md` + 报告；然后 stop（stop_at_poc）或交棒 engineer-job Phase 4。 | — |

### loop-until-dry（阶段 3 核心）

```
frontier ← 账本中 coverage_status == "planned" 的页面/组件
repeat:
    new_nodes ← 0
    for each node in frontier:
        实现该页面全部 UI 状态 + mock 数据 + 交互（套用行业范式）
        发现的子视图 / 弹窗 / 状态分支 / 流程 若未在账本 → 加入账本(planned), new_nodes++
        node.coverage_status ← "implemented"
    coverage critic 复查：还有哪些页面/状态/流程/角色视图没覆盖？新增写入账本
    new_nodes += critic 新增
until new_nodes == 0
assert 每个 node 都 implemented 且带保真度层级
```

---

## 7. 产物 / Artifacts

| 产物 | 用途 |
|:--|:--|
| 可运行的纯前端 POC 工程（仓库内） | 演进式骨架，engineer-job Phase 4 在其上继续 |
| `.agents/poc.ledger.json` | 覆盖账本——所有页面/组件/状态/流程 + 保真度层级 + 覆盖状态；loop-until-dry 与恢复的唯一真相源（schema 见 references） |
| `src/mocks/`（或框架约定位置） | mock adapter + seed 数据——**可替换接缝**（演进为真实 API 时只改这一层） |
| `POC-MANIFEST.md` | 已建清单：页面/组件/路由/mock 端点 + **mock→真实演进映射**（engineer-job Phase 4 消费，做演进而非重建） |
| `POC-FIDELITY.md` | 逐资产诚实标注 `真实交互 / mock 数据 / 占位未实现`，供正式实现阶段对照 |

---

## 8. 与 engineer-job 集成 / Integration

### run.wf.js 改动

- 新增 `args.skip_poc`（默认 `false`）、`args.stop_at_poc`（默认 `false`）。
- 在 `frontend`（Phase 3）与 `orchestrate`（Phase 4）之间插入 `poc` 阶段。
- 逻辑：
  - `has_frontend == false` → 自动跳过 poc（无论开关）。
  - `skip_poc == true` → 跳过 poc，直接 orchestrate（保留旧行为的显式路径）。
  - `stop_at_poc == true` → poc 完成后直接进入 finalize + report，不做 orchestrate。
  - 否则 → poc 完成后 orchestrate 读取 `POC-MANIFEST.md`，**演进** mock 层为真实实现，而非重建页面。
- `job.state.json` 的 phases 增加 `poc` 段（status/skill/result/errors）。

### 手动链式（Workflow 不可用时）

frontend 完成 → `[Agent] engineer-poc` → 写 POC 工程 + POC-MANIFEST.md + POC-FIDELITY.md → orchestrator 读 MANIFEST 演进。

---

## 9. references/ 结构

| 文件 | 内容 |
|:--|:--|
| `industry-patterns.md` | 行业/形态模式库：admin 后台、SaaS、电商、金融、医疗、数据大屏等，每种含典型信息架构 + 组件 + 交互范式 + 最佳实践 |
| `poc-ledger.schema.json` | 覆盖账本 schema |
| `mock-layer-guide.md` | mock adapter 接缝规范，保证 mock→真实演进干净（单一接缝、契约对齐 CONTEXT.md） |
| `poc-manifest-template.md` | `POC-MANIFEST.md` + `POC-FIDELITY.md` 模板与三层级标注规范 |
| `pipeline.md` | 六阶段详细动作与恢复流程 |

---

## 10. 非目标 / Non-Goals

1. **不做后端** —— 无真实数据库、无真实 API，全走 mock 层。
2. **不做真实鉴权/支付** —— mock 登录/角色用于演示；支付/第三方标 `占位未实现`。
3. **非抛弃式** —— 演进式骨架，可被 engineer-job Phase 4 继续，不是一次性 mockup。
4. **不重造构建链** —— 脚手架之外的正式实现（架构编排/里程碑/验收/部署）交回 engineer-job，不重复实现。
5. **不臆造不可观测的服务端逻辑** —— 纯服务端算法用占位/合理 mock，诚实标注。

---

## 11. 交付范围 / Deliverables

1. `skills/engineer-poc/SKILL.md`
2. `skills/engineer-poc/references/`：`industry-patterns.md`、`poc-ledger.schema.json`、`mock-layer-guide.md`、`poc-manifest-template.md`、`pipeline.md`
3. `skills/engineer-job/run.wf.js`：插入 `poc` 阶段 + `skip_poc` / `stop_at_poc` 开关 + `job.state.json` 增段
4. `skills/engineer-job/SKILL.md`：阶段总览/流程图/三文档体系更新，纳入 POC 阶段
5. README.md + README.zh-CN.md：技能列表 + 决策表 + 文件树三处注册
6. （可选）tests / evals 与家族现有约定一致
