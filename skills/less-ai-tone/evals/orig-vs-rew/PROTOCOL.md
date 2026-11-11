# 原版 vs 本仓 同稿改写对照

## 问题

同一 3 篇 `before/{N,P,E}.md`，分别按：

- **orig**：`~/.dsh/skills/lieflat-less-ai-tone`（原版）
- **rew**：`skills/less-ai-tone`（本仓 MIT 改写包）

在「用户已回复按建议改」前提下改写，比较脚本命中下降与盲评自然度。

## 约束

- before 冻结，不可改
- 两边都只改可定位 A/B/语义/F 局部；遵守各自 X/C/H
- 信息守恒；N 保情节声口；E 保状态机与标题
- 盲评只看匿名 A/B/C 三稿（before / orig-after / rew-after 打乱），不知来源

## 成功解读（预登记）

### v1 延续

- **延续**：rew 综合分 ≥ before，且与 orig 差距 ≤1；或 rew/orig 相对 before 同向改善
- **退化**：rew 综合分 < before，或明显低于 orig（≥2）且信息受损

### v2 效果持平（本轮目标）

- **持平通过**：N/P/E 三篇 `after-rew` 综合分均 **≥** `after-orig`，且均 ≥ before；信息完整不降
- **检测不回退**：before 上本仓 detect 与原版 detect 关键密度一致；after-rew 主信号（翻案腔/装饰破折号等拟改项）清零或有保留举证
- **措辞独立**：after-rew 不得与 after-orig 全文哈希相同（允许同指标、不同句子）
