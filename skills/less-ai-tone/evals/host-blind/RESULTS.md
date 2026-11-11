# 真实宿主前后对照 + 盲评结果

协议见 [PROTOCOL.md](./PROTOCOL.md)。

## 宿主成稿

| ID | 宿主方法 | before 汉字（约） | 主要改前信号 |
|---|---|---:|---|
| N | write-webnovel 正文 | ~1120 | 破折号过密（约 6.3/千字）、少量顿号并列 |
| P | fde-product-analysis-framework 分析段 | ~904 | 翻案腔、顿号并列、破折号 |
| E | fde-requirements 业务说明 | ~1009 | 翻案腔、事件枚举顿号（多保留） |

生成时跳过去 AI 味挂接；after 假设用户已回复「按建议改」。

## 脚本层（密度 / 千字，磁盘复测）

| 样本 | 翻案腔 | 破折号 | 分号 | 顿号并列≥3 |
|---|---|---|---|---|
| N | 0 → 0 | 6.25 → 0 | 1.79 → 0 | 1.79 → 0 |
| P | 1.11 → 0 | 2.21 → 0 | 3.32 → 0 | 4.43 → 0 |
| E | 0.99 → 0 | 0 → 0 | 3.96 → 0 | 4.96 → 2.95（事件枚举保留） |

## 盲评

见 [blind/SCORECARD.md](./blind/SCORECARD.md)、[blind/scores.json](./blind/scores.json)。
终版采用独立盲评子代理分数（只读 before/after 正文，未读 edit-log）。

- 综合分：N 18→19，P 18→20，E 18→19
- AI 味：三篇各降 1 分；信息完整均为 5→5
- 体感：P 最明显；N/E 属轻度增量，单读不易察觉

## 结论（可对外说的边界）

1. **在本轮 3 篇宿主风格成稿上**，跑完 less-ai-tone 后：客观命中下降，盲评综合分 3/3 不降反升，信息未损。  
2. **提升是轻度去套话，不是自然度跃迁**：小说/需求 before 已较具体时，收益接近观测下限；产品分析翻案腔清理更明显。  
3. **仍不能外推为**「安装挂接后所有长文自动更自然」——必须实际执行检测→确认→改写。  
4. 工程/需求文保留状态机与事件枚举时，顿号密度不会、也不应清零。  
5. 证据等级：有脚本对照 + 独立盲评卡；仍非多人评分、非线上真实用户长文。

## 复现

```bash
# 指标
python3 skills/less-ai-tone/scripts/detect.py skills/less-ai-tone/evals/host-blind/before/P.md --json
python3 skills/less-ai-tone/scripts/report.py \
  skills/less-ai-tone/evals/host-blind/before/P.md \
  skills/less-ai-tone/evals/host-blind/after/P.md \
  skills/less-ai-tone/evals/host-blind/reports/P-before.json \
  skills/less-ai-tone/evals/host-blind/reports/P-after.json
```
