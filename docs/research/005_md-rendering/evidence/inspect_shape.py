#!/usr/bin/env python3
"""一次性结构核查: 只打印计数与形态, 不打印正文。用法: python3 -I inspect_shape.py <blog_root>"""
import os
import re
import sys
from collections import Counter

ROOT = sys.argv[1]
SAFE = re.compile(r"^[A-Za-z0-9_+#.\-]{1,24}$")
INLINE_CODE = re.compile(r"(?<!`)(`+)(?!`)((?:(?!\n[ \t]*\n).)+?)(?<!`)\1(?!`)", re.S)

base = None
for ln in open(os.path.join(ROOT, "config.toml"), encoding="utf-8"):
    m = re.match(r'\s*baseURL\s*=\s*["\']([^"\']*)', ln)
    if m:
        base = re.sub(r"^https?://", "", m.group(1)).split("/")[0].lower()
        break
print("baseURL host 已解析:", bool(base))

files = []
for d in ("content/posts", "content/briefing"):
    for n in sorted(os.listdir(os.path.join(ROOT, d))):
        if n.endswith(".md"):
            files.append(os.path.join(ROOT, d, n))


def strip_fm_and_code(text):
    lines = text.split("\n")
    start = 0
    fm = []
    if lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                fm = lines[1:i]
                start = i + 1
                break
    out, inf = [], None
    for ln in lines[start:]:
        if inf is None:
            m = re.match(r"^\s*(?:[-*+]|\d+[.)])?\s*(`{3,}|~{3,})(.*)$", ln)
            if m and not (m.group(1)[0] == "`" and "`" in m.group(2)):
                inf = (m.group(1)[0], len(m.group(1)))
                out.append("")
                continue
            out.append(ln)
        else:
            m = re.match(r"^\s*(`{3,}|~{3,})\s*$", ln)
            if m and m.group(1)[0] == inf[0] and len(m.group(1)) >= inf[1]:
                inf = None
            out.append("")
    t = "\n".join(out)
    t = INLINE_CODE.sub("", t)
    t = re.sub(r"\{\{([<%]).*?([%>])\}\}", " ", t, flags=re.S)
    return fm, t


raw_counts = Counter()
emoji = Counter()
lt_tok = Counter()
date_shape = Counter()
list_shape = Counter()
exp_past = exp_future = 0
layout_vals = set()
brace_in_math = brace_out_math = 0
brace_out_files = set()
dd_lines = Counter()
br_ctx = Counter()
bslash = Counter()
for p in files:
    text = open(p, encoding="utf-8").read()
    for pat in ("](/", "](./", "](../", "](#", "](http", "](<"):
        raw_counts[pat] += text.count(pat)
    if base:
        raw_counts["含本站域名的 URL"] += len(re.findall(r"https?://" + re.escape(base), text, re.I))
    fm, t = strip_fm_and_code(text)
    # front matter shapes
    key = None
    for ln in fm:
        m = re.match(r"^(\w+)\s*:\s*(.*)$", ln)
        if m:
            key, v = m.group(1), m.group(2).strip()
            if key in ("date", "expirydate"):
                vv = v.strip("'\"")
                shp = re.sub(r"\d", "9", vv)
                date_shape[f"{key}: {shp}"] += 1
                if key == "expirydate":
                    if vv[:10] < "2026-10-10":
                        exp_past += 1
                    else:
                        exp_future += 1
            if key in ("categories", "tags"):
                if v.startswith("["):
                    list_shape[f"{key}: 行内数组 [..]"] += 1
                elif v == "":
                    list_shape[f"{key}: 块列表 (- 项)"] += 1
                else:
                    list_shape[f"{key}: 标量"] += 1
            if key == "layout":
                layout_vals.add(v)
    # $$ structure
    lines = t.split("\n")
    for ln in lines:
        c = ln.count("$$")
        if c:
            s = ln.lstrip()
            kind = "表格行" if s.startswith("|") else ("列表项" if re.match(r"([-*+]|\d+[.)])\s", s) else ("引用" if s.startswith(">") else "普通段落"))
            dd_lines[f"含 $$ 的行: {kind}, 每行 {c} 个"] += 1
            if re.fullmatch(r"\s*\$\$.*\$\$\s*", ln):
                dd_lines["整行被 $$…$$ 包住"] += 1
    # braces inside math
    tm = t
    for m in re.finditer(r"\$\$.+?\$\$|(?<!\$)\$[^$\n]+?\$(?!\$)", tm, re.S):
        brace_in_math += m.group(0).count("{") + m.group(0).count("}")
    nomath = re.sub(r"\$\$.+?\$\$|(?<!\$)\$[^$\n]+?\$(?!\$)", " ", tm, flags=re.S)
    bo = nomath.count("{") + nomath.count("}")
    brace_out_math += bo
    if bo:
        brace_out_files.add(p)
    # emoji tokens
    for m in re.finditer(r"(?<![\w:/]):([a-z0-9_+\-]{2,30}):(?![\w/])", t):
        emoji[m.group(1)] += 1
    # '<' letter not tag
    for m in re.finditer(r"<([A-Za-z/!?][A-Za-z0-9\-]*)(.?)", t):
        if re.match(r"<[A-Za-z][A-Za-z0-9\-]*(?=[\s/>])[^<>]*?/?>", t[m.start():m.start() + 80]):
            continue
        if re.match(r"</[A-Za-z][A-Za-z0-9\-]*\s*>", t[m.start():m.start() + 40]):
            continue
        if re.match(r"<(?:https?|ftp|mailto):", t[m.start():m.start() + 10]):
            continue
        tok = m.group(1)
        nxt = m.group(2)
        nk = "空白" if nxt.isspace() else ("中日韩" if nxt and ord(nxt) > 0x2E80 else ("行末" if nxt == "" else repr(nxt)))
        lt_tok[f"<{tok if SAFE.match(tok) else '(?)'} 后随 {nk}"] += 1
    for ln in lines:
        if "<br" in ln:
            br_ctx["表格行" if ln.lstrip().startswith("|") else "非表格行"] += ln.count("<br")
        if "\\[" in ln:
            bslash["\\[ 同行有 \\]" if "\\]" in ln else "\\[ 同行无 \\]"] += ln.count("\\[")

print("原文中链接起始形态计数(含代码区):", dict(raw_counts))
print("date/expirydate 形态:", dict(date_shape))
print("expirydate 早于 2026-10-10:", exp_past, " 不早于:", exp_future)
print("categories/tags 形态:", dict(list_shape))
print("layout 取值种类数:", len(layout_vals))
print("$$ 行结构:", dict(dd_lines))
print("花括号: 在 $/$$ 数学内", brace_in_math, " 在数学外", brace_out_math, " 数学外涉及文件数", len(brace_out_files))
print("emoji 记号:", dict(emoji))
print("< 字母不成标签:", dict(lt_tok))
print("<br 上下文:", dict(br_ctx))
print("\\[ 形态:", dict(bslash))
