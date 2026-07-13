# engineer-job 执行引擎参考 / Execution Engine Reference

> `run.wf.js` 的设计原理、使用方式和扩展指南。

## 设计原理 / Design Principles

`run.wf.js` 是一个 Workflow 脚本，利用 Workflow 工具的 `agent()` / `phase()` / `log()` API 实现多阶段编排。

### 三个核心原则

1. **文件即状态** — 所有进度写入 `.agents/` 目录，不依赖对话上下文
2. **阶段即子代理** — 每个 Phase 是一个独立 agent() 调用，上下文干净
3. **降级优于阻塞** — 遇错优先降级/跳过，而非停下等人

## 使用方式 / Usage

通过 Workflow 工具调用：

```javascript
Workflow({
  script: "skills/engineer-job/run.wf.js",
  args: {
    requirements: "做一个博客系统，支持文章的CRUD，使用Python FastAPI，SQLite存数据",
    mode: "auto",           // normal (默认) | auto | silent
    projectName: "blog-system"
  }
})
```

## 模式说明 / Mode Behavior

| 模式 | Phase 间推进 | 异常处理 |
|:----:|-------------|---------|
| normal | Phase 间自动推进（Workflow 工具自带节流） | 报告错误，降级后继续，最终报告中标明 |
| auto | 自动推进，最终报告输出降级记录 | 自动降级/跳过，记录到最终报告 |
| silent | 自动推进，无中间输出 | 静默处理，只记日志 |

## 恢复流程 / Recovery

`run.wf.js` 启动时自动检测 `.agents/job.state.json`：

1. 文件存在 → 读取当前 phase，跳过已完成的 phase，继续未完成的
2. 文件不存在 → 全新启动，从 Phase 0 开始

**手动恢复**：通过 CLI 查看当前状态后，重新调用 Workflow 工具即可自动恢复。

```bash
# 查看当前状态
node bin/engineer-job.js status
```

## 扩展指南 / Extending

- **新增 Phase**：在 `run.wf.js` 的 main loop 末尾追加一个新的 phase() + agent() 块
- **修改 Phase 逻辑**：编辑对应 phase 的 agent() prompt
- **自定义降级策略**：在每个 phase 的 `if (result?.status === 'BLOCKED')` 分支中修改处理逻辑

## 兼容性 / Compatibility

- `job.state.json` 格式与 `engineer-orchestrator` 和 `engineer-job/SKILL.md` 完全兼容
- CLI 零外部依赖，使用 Node.js 18+ 内置 API
- Workflow 脚本需要 Workflow 工具支持
