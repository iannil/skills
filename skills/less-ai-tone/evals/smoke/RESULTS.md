# less-ai-tone 小样本前后对比（smoke）

日期：本机评测产物。目的：回答「整合后长文是否更自然」。

## 设计

- 三类宿主样稿：小说（`novel.md`）、产品报告（`report.md`）、工程说明（`engineering.md`）
- 每篇约 900+ 汉字，故意植入 A/B/F 常见命中
- 流程：`detect.py --json` → 按 SKILL 规则最小改写 → 复测 → `report.py`
- **不是**宿主 skill 端到端生成盲测；**不是**多人主观评分

## 指标变化（密度 / 千字）

| 样本 | 翻案腔 | 提示语冒号 | 起手式 | 当…时/话题壳 | 破折号 |
|---|---|---|---|---|---|
| novel | 5.47→0 | 2.19→0 | 3.28→0 | 2.19→0 | 2.19→0 |
| report | 4.39→0 | 8.77→1.09 | 1.10→0 | 2.19→0 | 2.19→0 |
| engineering | 5.45→0 | 7.63→0 | 1.09→0 | 2.18→0 | 3.27→0 |

结构侧：三篇句长 CV 略升（更接近人类参考约 0.54）；mtld 粗估下降（换词轮换减少后的预期方向）。

## 主观阅读（单评，非正式盲测）

- **更自然之处**：开篇少宣告、少“不是…而是…”支架；连续说明段更像直接陈述。
- **仍不像“作者写的”之处**：样稿本就为测命中而造；改后信息保留，但声口/细节密度未自动变好。
- **工程稿**：模板结构保留后，腔调下降明显；这更像“少 AI 味”，不等于“更好读的架构文档”。

## 结论边界

1. **可支持**：在“已有 AI 腔成稿 + 按规则改写”条件下，可定位 A/B/F 命中显著下降，读感上的套话感减轻。
2. **不支持**：不能据此宣称「30 个宿主 skill 以后写出的长文一定更自然」。挂接只保证流程；自然度取决于是否执行、改写质量与体裁约束。
3. **公开研究口径**（629+270）说明的是特征有效性，不是本仓整合后的产品效果。

## 复现

```bash
python3 skills/less-ai-tone/scripts/detect.py skills/less-ai-tone/evals/smoke/before/novel.md --json
python3 skills/less-ai-tone/scripts/report.py \
  skills/less-ai-tone/evals/smoke/before/novel.md \
  skills/less-ai-tone/evals/smoke/after/novel.md \
  skills/less-ai-tone/evals/smoke/reports/novel-before.json \
  skills/less-ai-tone/evals/smoke/reports/novel-after.json
```
