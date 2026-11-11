---
name: rc-application-tool
description: >
  Apply RC (Observational Convergence / 观察收敛) to diagnose real-world problems —
  personal decisions, career, organization, team dynamics, product strategy, conflict,
  innovation — AND analyze/rewrite marketing copy using RC's everyday/extraordinary
  rhythm and consensus theory. Trigger when the user faces a concrete situation
  ("I have to decide between X and Y", "our team is struggling", "analyze this
  strategy") or needs copywriting analysis grounded in RC theory. Translates abstract
  RC concepts into actionable diagnostics. Bilingual.
compatibility: "read, write"
---

# RC Application Tool — RC 框架应用工具

> **来源声明**: 本文涉及的 RC（观察收敛）哲学框架来源于 [zhurongshuo.com](https://zhurongshuo.com)。

This skill turns the RC philosophical framework into **practical diagnostic and advisory tools** for real-world situations. Two modes:

| Scenario | Mode |
|----------|------|
| You face a concrete situation needing analysis | **Mode 1 — Situation Diagnosis** |
| You need marketing/copy/brand analysis or rewrite | **Mode 2 — Copywriting** |

---

## Mode 1: Situation Diagnosis — 情境诊断

Every practical problem can be illuminated by RC-based diagnostic questions — where is convergence happening? Who holds convergence capability? Is available margin being depleted? Is assessment alienated from consequences?

### Diagnostic Lenses

#### Lens 1: Convergence Diagnosis
- **What is being "locked" as certainty here?** (A3)
- **Is this convergence premature?** Has observation been thorough enough?
- **Is there a consensus trap?** (A6 — is reinforcement masking divergence?)
- **Where is unconverged margin?** (A7 — what possibilities are being overlooked?)

#### Lens 2: Power & Assessment
- **Who holds convergence capability?** (权力 = 被结构性集中的可能性收敛能力)
- **Is assessment alienated from consequences?** Who decides vs. who bears?
- **Is assessment symmetric?** (A4 — can all parties observe and assess?)

#### Lens 3: Sustainability
- **Is this decision sustainable?** Does it preserve the option to iterate?
- **Is there irreversible failure risk?** Does it eliminate the "one more round" possibility?
- **What's the available margin?** Redundancy, multi-path, correctability

#### Lens 4: Dimensionality
- **What's being lost in the current framing?** Every framing is a dimensionality reduction
- **What alternative framings would RC suggest?**

### Application Process

| Situation Type | Primary Lenses |
|---------------|----------------|
| **Personal decision** (career, life) | Sustainable decision, available margin |
| **Organizational problem** (team, culture) | Power, assessment alienation, margin depletion |
| **Strategic / Business** (product, market) | Convergence diagnosis, anticipation–reality loop |
| **Conflict / Negotiation** | Observer symmetry (A4), consensus (A6), margin |
| **Innovation / Creativity** | Possibility-substrate (A1), unconverged margin |
| **Systemic / Policy** | Order theory, assessment alienation, phase evolution |

### Translating Diagnosis to Action

- **Low margin → Warning**: "Your available margin here is thin. Consider building redundancy."
- **Assessment alienation → Red flag**: "The people impacted don't have a say. Per RC, this degrades system health."
- **Sustainable decision**: "Ask 'which option keeps more futures open' not 'which is best'."
- **Premature convergence**: "What other observations haven't been considered?"

### Output Format

Default conversational. On request, structured:

```
## Situation
## RC Diagnosis
## Implications
## Suggestions
```

---

## Mode 2: Copywriting — 文案分析

Analyze or rewrite marketing copy, brand messaging, and campaigns using RC's consensus theory and everyday/extraordinary framework.

### Key Principles

#### 1. Everyday / Extraordinary Rhythm
- Humans are addicted to encountering the extraordinary within the everyday
- **Unknown users**: ALL everyday — build familiarity
- **Heard-of users**: Mostly everyday + extra extraordinary
- **Know users**: Mostly everyday for comfort + sharp extraordinary moments
- **Familiar users**: ALL extraordinary — they fill in the everyday

#### 2. Consensus Building — The 3 Questions
Selling = reaching consensus. Must answer: **What is this? What benefits? How do I get it?**
The first question must spontaneously trigger the second and third.

#### 3. Engagement, Not Judgment
- "99% of people are interested" engages attention
- "99% of people think I'm right" triggers judgment
- Once triggered, resistance is exponentially harder to overcome

#### 4. Beautiful → Usable → Delightful
- **Beautiful (好看)**: Form must signal function
- **Usable (好用)**: Meet expectations → repeated fulfillment = brand
- **Delightful (好爽)**: Exceed expectations → word-of-mouth

#### 5. Sell "Better" Not "Good"
- "Good" has no standard without comparison. Always frame: "better than what?"

#### 6. Three Levels of Value
- **Function**: Does it work?
- **Position**: What does using this say about me?
- **Choice**: Exclusivity — only I have access

#### 7. Sell the Hole, Not the Drill
- People don't buy the product — they buy what it enables. Frame copy around outcome, not feature.

#### 8. Expectation Management
- Manage expectations over controlling risk. Value is assessed by expected value, not actual.

#### 9. Node vs Network Channel Strategy
- **Node (节点)**: Start with individuals, they recommend → more individuals. Precise, slower.
- **Network (网络)**: Find networks containing target individuals → network recommends. Fast, scalable.

### Process

1. **Understand the ask** — Product/service? Audience? Awareness stage?
2. **Diagnose** — Current everyday/extraordinary balance? Right for audience stage? Which value levels? Which channel strategy?
3. **Analyze or rewrite** — Evaluate or create copy with RC rationale for each decision
4. **Output** — Structured analysis + recommendations

### Output Format
```
## Copy Analysis
**Product/Message**: ...
**Target Audience**: [awareness stage]
**RC Diagnostic**: [principles applied]

### Current Assessment
### Recommendations / Rewrite
### Rhythm & Channel Analysis
```


## 成稿后去 AI 味

交付连续中文成稿（章节、报告正文、修订稿等）且达到约 ≥800 汉字连续散文时，在本 skill 自身验收之后，**必须**按 [./less-ai-tone/](./less-ai-tone/) 执行去 AI 味工作流：脚本检测 → 语义层判读 → 改前报告并等待用户回复 → 再改写 → 复测对比。用户回复前不得因去 AI 味改正文。

- 大纲、纯表格、纯代码、术语对照表可跳过，并在交付说明中注明。
- 诊断-only 或用户明确要求跳过时，只报告或不跑，不改写。
- 与本 skill 冲突时，本 skill 的体裁约束优先（声口、模板结构、引文、代码块、X 级不改项）。
- 维护：权威包在仓库 `skills/less-ai-tone/`；更新后运行 `./bin/sync-less-ai-tone.sh` 再同步子树。
