#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""less-ai-tone：改前/改后对比报告。

本文件为本仓库原创实现。MIT 许可。

用法：
    python3 scripts/report.py 原文.md 改后.md before.json after.json \
        [--semantic labeled.json] [--out 报告.md] [--format md|html]
"""
from __future__ import annotations

import argparse
import difflib
import html
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from detect import REGEX_HITS  # noqa: E402

LEVEL_OF = {nm: lv for lv, nm, *_ in REGEX_HITS}

METRIC_ROWS = [
    ("翻案腔", "不是A而是B 对举", "低", 0.22),
    ("提示语冒号", "结论提示冒号", "低", 0.08),
    ("顿号并列≥3", "密集并列", "低", 1.78),
    ("过长前置定语", "前置定语长", "低", 0.1),
]

STRUCT_ROWS = [
    ("句长CV", "句长起伏", "越高越参差", "人类≈0.54 / AI≈0.46"),
    ("节长CV", "节长参差", "越高越参差", "人类≈0.83 / AI≈0.31"),
    ("小标题/千字", "分节密度", "越低越整篇连写", "人类≈0.32 / AI≈1.26"),
    ("两句同构/百段", "相邻句同构", "越低越好", "人类≈5.52 / AI≈8.71"),
    ("三句同构/百段", "三连同构(粗筛)", "越低越好", "人类≈0.41 / AI≈0.84"),
    ("mtld粗估", "换词多样性", "低于人类≈自然", "人类≈143 / AI≈227"),
]

FINGERPRINT_ROWS = [
    ("破折号", "分模型偏好；>2/千字优先处理"),
    ("分号", "可安全拆句时默认拟改"),
    ("引号", "偏少不构成补引号理由"),
]

CSS = """
body{font-family:-apple-system,"PingFang SC",sans-serif;max-width:760px;margin:40px auto;line-height:1.9;font-size:16px;padding:0 20px;color:#222}
h1{font-size:22px}h2{font-size:19px;border-bottom:2px solid #ccc;padding-bottom:6px;margin-top:2.2em}
table{border-collapse:collapse;width:100%;font-size:14px;margin:0.6em 0 1.4em}
th,td{border:1px solid #ddd;padding:5px 10px;text-align:left;vertical-align:top}
th{background:#f5f5f5}
.del{color:#aaa;text-decoration:line-through}.ins{color:#d32f2f;font-weight:600}
.up{color:#c62828;font-weight:600}.down{color:#2e7d32;font-weight:600}.flat{color:#777}
"""


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dens(data, name):
    return data.get("density", {}).get(name)


def char_dens(data, name):
    return data.get("char_density", {}).get(name)


def struct(data, name):
    return data.get("structure", {}).get(name)


def fmt_num(v):
    if v is None:
        return "—"
    if isinstance(v, float):
        return f"{v:.3f}".rstrip("0").rstrip(".")
    return str(v)


def md_arrow(before, after, better="low"):
    if before is None or after is None or before == after:
        return "→"
    if better == "low":
        return "↓" if after < before else "↑"
    if better == "high":
        return "↑" if after > before else "↓"
    return "→"


def html_arrow(before, after, better="low"):
    mark = md_arrow(before, after, better)
    cls = "flat" if mark == "→" else ("down" if mark == "↓" else "up")
    return f'<span class="{cls}">{mark}</span>'


def inline_diff_md(a: str, b: str) -> str:
    """Word-ish diff marked with <del>/<ins> for markdown reports."""
    sm = difflib.SequenceMatcher(None, a, b)
    parts = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            parts.append(a[i1:i2])
        elif tag == "delete":
            parts.append(f"<del>{a[i1:i2]}</del>")
        elif tag == "insert":
            parts.append(f"<ins>{b[j1:j2]}</ins>")
        elif tag == "replace":
            parts.append(f"<del>{a[i1:i2]}</del><ins>{b[j1:j2]}</ins>")
    return "".join(parts)


def inline_diff_html(a: str, b: str) -> str:
    sm = difflib.SequenceMatcher(None, a, b)
    parts = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            parts.append(html.escape(a[i1:i2]))
        elif tag == "delete":
            parts.append(f'<span class="del">{html.escape(a[i1:i2])}</span>')
        elif tag == "insert":
            parts.append(f'<span class="ins">{html.escape(b[j1:j2])}</span>')
        elif tag == "replace":
            parts.append(
                f'<span class="del">{html.escape(a[i1:i2])}</span>'
                f'<span class="ins">{html.escape(b[j1:j2])}</span>'
            )
    return "".join(parts)


def summarize_semantic(sem):
    if not sem:
        return None
    lines = ["### 语义层判读汇总", ""]
    meta = sem.get("meta", {})
    lines.append(
        f"候选总数：{meta.get('n_candidates', '—')} "
        f"（rename {meta.get('n_rename', 0)} / cohesion {meta.get('n_cohesion', 0)} / "
        f"colon {meta.get('n_colon', 0)} / iso3 {meta.get('n_iso3', 0)}）"
    )

    rename = sem.get("rename", [])
    labeled = [x for x in rename if x.get("label")]
    if labeled:
        score = {"0组": 0, "1组": 1, "2组": 2, "3组及以上": 3}.get
        vals = [score(x["label"], 0) for x in labeled]
        avg = sum(vals) / len(vals) if vals else 0
        heavy = sum(1 for v in vals if v >= 2) / len(vals) if vals else 0
        lines.append(f"- 同义重命名：平均 {avg:.2f} 次/段；重灾段占比 {heavy:.0%}")

    coh = [x for x in sem.get("cohesion", []) if x.get("label")]
    if coh:
        longest = cur = 0
        for x in coh:
            if x["label"] == "明确承接":
                cur += 1
                longest = max(longest, cur)
            else:
                cur = 0
        lines.append(f"- 衔接连环：最长明确承接 {longest}")

    col = [x for x in sem.get("colon", []) if x.get("label")]
    if col:
        concl = sum(1 for x in col if x["label"] == "结论提示")
        lines.append(f"- 结论提示冒号：{concl}/{len(col)}")

    iso = [x for x in sem.get("iso3", []) if x.get("label")]
    if iso:
        high = sum(1 for x in iso if x["label"] == "高度同构")
        lines.append(f"- 高度同构三连：{high}/{len(iso)}")

    lines.append("")
    return "\n".join(lines)


def build_md(before, after, src_text, dst_text, sem=None):
    lines = ["# 去AI味前后对比报告", "", "## 指标对比", ""]
    lines.append("| 指标 | 改前 | 改后 | 方向 | 人类参考 |")
    lines.append("|---|---:|---:|:---:|---|")
    for key, title, better, href in METRIC_ROWS:
        b, a = dens(before, key), dens(after, key)
        lines.append(
            f"| {title} | {fmt_num(b)} | {fmt_num(a)} | {md_arrow(b, a, 'low')} | {href}/千字 |"
        )
    for key, title, tip, href in STRUCT_ROWS:
        better = "high" if key in {"句长CV", "节长CV"} else "low"
        if key == "mtld粗估":
            better = "low"
        b, a = struct(before, key), struct(after, key)
        lines.append(
            f"| {title} | {fmt_num(b)} | {fmt_num(a)} | {md_arrow(b, a, better)} | {href} |"
        )
    for key, tip in FINGERPRINT_ROWS:
        b, a = char_dens(before, key), char_dens(after, key)
        lines.append(
            f"| {key} | {fmt_num(b)} | {fmt_num(a)} | {md_arrow(b, a, None)} | {tip} |"
        )
    lines.append("")

    lines.append("## 分级命中变化")
    lines.append("")
    lines.append("| 级别 | 特征 | 改前处数 | 改后处数 |")
    lines.append("|---|---|---:|---:|")
    for lv, nm, *_ in REGEX_HITS:
        nb = len(before.get("hits", {}).get(nm, []))
        na = len(after.get("hits", {}).get(nm, []))
        if nb or na:
            lines.append(f"| {lv} | {nm} | {nb} | {na} |")
    lines.append("")

    sem_block = summarize_semantic(sem)
    if sem_block:
        lines.append(sem_block)

    lines.append("## 正文对照")
    lines.append("")
    lines.append("改动处用 `<del>原文</del><ins>新文字</ins>` 标记；其余保持 Markdown。")
    lines.append("")
    src_paras = src_text.splitlines()
    dst_paras = dst_text.splitlines()
    sm = difflib.SequenceMatcher(None, src_paras, dst_paras)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            lines.extend(dst_paras[j1:j2])
        elif tag == "replace":
            # line-level replace with inline diff when 1:1
            a_lines = src_paras[i1:i2]
            b_lines = dst_paras[j1:j2]
            if len(a_lines) == len(b_lines):
                for al, bl in zip(a_lines, b_lines):
                    lines.append(inline_diff_md(al, bl))
            else:
                for al in a_lines:
                    lines.append(f"<del>{al}</del>")
                for bl in b_lines:
                    lines.append(f"<ins>{bl}</ins>")
        elif tag == "delete":
            for al in src_paras[i1:i2]:
                lines.append(f"<del>{al}</del>")
        elif tag == "insert":
            for bl in dst_paras[j1:j2]:
                lines.append(f"<ins>{bl}</ins>")
    lines.append("")
    lines.append(
        "复测说明：拟改的 A/B/语义/F 局部命中应清零或显著下降；"
        "C 级分布指标只报告，不追求机械参差化；X 永不改。"
    )
    return "\n".join(lines)


def build_html(before, after, src_text, dst_text, sem=None):
    rows = []
    for key, title, better, href in METRIC_ROWS:
        b, a = dens(before, key), dens(after, key)
        rows.append(
            f"<tr><td>{html.escape(title)}</td><td>{fmt_num(b)}</td>"
            f"<td>{fmt_num(a)}</td><td>{html_arrow(b, a, 'low')}</td>"
            f"<td>{href}/千字</td></tr>"
        )
    for key, title, tip, href in STRUCT_ROWS:
        better = "high" if key in {"句长CV", "节长CV"} else "low"
        if key == "mtld粗估":
            better = "low"
        b, a = struct(before, key), struct(after, key)
        rows.append(
            f"<tr><td>{html.escape(title)}</td><td>{fmt_num(b)}</td>"
            f"<td>{fmt_num(a)}</td><td>{html_arrow(b, a, better)}</td>"
            f"<td>{html.escape(href)}</td></tr>"
        )
    body_diff = []
    src_paras = src_text.splitlines()
    dst_paras = dst_text.splitlines()
    sm = difflib.SequenceMatcher(None, src_paras, dst_paras)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for line in dst_paras[j1:j2]:
                body_diff.append(f"<p>{html.escape(line)}</p>")
        elif tag == "replace":
            a_lines = src_paras[i1:i2]
            b_lines = dst_paras[j1:j2]
            if len(a_lines) == len(b_lines):
                for al, bl in zip(a_lines, b_lines):
                    body_diff.append(f"<p>{inline_diff_html(al, bl)}</p>")
            else:
                for al in a_lines:
                    body_diff.append(f"<p><span class=\"del\">{html.escape(al)}</span></p>")
                for bl in b_lines:
                    body_diff.append(f"<p><span class=\"ins\">{html.escape(bl)}</span></p>")
        elif tag == "delete":
            for al in src_paras[i1:i2]:
                body_diff.append(f"<p><span class=\"del\">{html.escape(al)}</span></p>")
        elif tag == "insert":
            for bl in dst_paras[j1:j2]:
                body_diff.append(f"<p><span class=\"ins\">{html.escape(bl)}</span></p>")

    sem_html = ""
    sem_block = summarize_semantic(sem)
    if sem_block:
        sem_html = "<h2>语义层判读汇总</h2><pre>" + html.escape(sem_block) + "</pre>"

    return f"""<!doctype html><html lang="zh"><head><meta charset="utf-8">
<title>去AI味前后对比报告</title><style>{CSS}</style></head><body>
<h1>去AI味前后对比报告</h1>
<h2>指标对比</h2>
<table><tr><th>指标</th><th>改前</th><th>改后</th><th>方向</th><th>参考</th></tr>
{''.join(rows)}
</table>
{sem_html}
<h2>正文对照</h2>
{''.join(body_diff)}
</body></html>"""


def main():
    ap = argparse.ArgumentParser(description="less-ai-tone 前后对比报告")
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("before_json")
    ap.add_argument("after_json")
    ap.add_argument("--semantic")
    ap.add_argument("--out")
    ap.add_argument("--format", choices=["md", "html"], default="md")
    args = ap.parse_args()

    src_text = Path(args.src).read_text(encoding="utf-8", errors="ignore")
    dst_text = Path(args.dst).read_text(encoding="utf-8", errors="ignore")
    before = load_json(Path(args.before_json))
    after = load_json(Path(args.after_json))
    sem = load_json(Path(args.semantic)) if args.semantic else None

    if args.format == "html":
        content = build_html(before, after, src_text, dst_text, sem)
    else:
        content = build_md(before, after, src_text, dst_text, sem)

    if args.out:
        Path(args.out).write_text(content, encoding="utf-8")
        print(f"报告已写 → {args.out}")
    else:
        print(content)


if __name__ == "__main__":
    main()
