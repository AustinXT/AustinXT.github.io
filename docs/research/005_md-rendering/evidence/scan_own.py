#!/usr/bin/env python3
"""只读扫描旧 Hugo 博客 Markdown 写法特征。只输出计数、键名、标签名、语言名、路径形态。
用法: python3 -I scan_own.py <blog_root> <out_file>
"""
import os
import re
import sys
import math
import statistics
import unicodedata
from collections import Counter, defaultdict

ROOT = sys.argv[1]
OUT = sys.argv[2]
DIRS = ["content/posts", "content/briefing"]

HTML_TAGS = set("""a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption
cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer
form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu
meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script
section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead
time title tr track u ul var video wbr center font big strike tt svg path math""".split())
VOID = {"br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr", "param"}
SECTION_ALLOW = {"posts", "briefing", "draft", "categories", "tags", "page", "images", "img", "about",
                 "search", "index.xml", "sitemap.xml", "series", "archives"}
SAFE_TOKEN = re.compile(r"^[A-Za-z0-9_+#.\-]{1,24}$")


def is_cjk(ch):
    o = ord(ch)
    return (0x4E00 <= o <= 0x9FFF or 0x3400 <= o <= 0x4DBF or 0x20000 <= o <= 0x2FA1F or
            0xF900 <= o <= 0xFAFF or 0x3040 <= o <= 0x30FF or 0xAC00 <= o <= 0xD7AF)


def is_punct(ch):
    return unicodedata.category(ch).startswith("P") or unicodedata.category(ch).startswith("S")


def pct(sorted_vals, p):
    if not sorted_vals:
        return 0
    k = max(0, math.ceil(p * len(sorted_vals)) - 1)
    return sorted_vals[k]


def safe(tok):
    return tok if SAFE_TOKEN.match(tok or "") else "(非常规记号)"


class Stat:
    """计数器: name -> [文件集合, 总次数]"""

    def __init__(self):
        self.files = defaultdict(set)
        self.total = Counter()

    def add(self, key, f, n=1):
        if n <= 0:
            return
        self.files[key].add(f)
        self.total[key] += n

    def fmt(self, key):
        return f"{len(self.files[key])} 文件 / {self.total[key]} 次"


S = Stat()
fm_kind = Counter()
fm_keys = Stat()
fm_nested = Stat()
shortcodes = Stat()
sc_close = Stat()
html_open = Stat()
html_close = Stat()
pseudo_tags = Stat()
fence_lang = Stat()
img_form = Stat()
link_form = Stat()
lt_class = Stat()
sizes = []
cjks = []
per_dir = Counter()
baseurl_host = None
TODAY = "2026-10-10"
X = defaultdict(set)
LAYOUT_VALUES = set()
IMG_HOSTS = Counter()
MDX_HARD = defaultdict(set)
MATH_ESC = Counter()

with open(os.path.join(ROOT, "config.toml"), encoding="utf-8") as fh:
    for line in fh:
        m = re.match(r'\s*baseURL\s*=\s*"([^"]*)"', line)
        if m:
            h = re.sub(r"^https?://", "", m.group(1)).split("/")[0].lower()
            baseurl_host = h
            break

files = []
for d in DIRS:
    p = os.path.join(ROOT, d)
    for name in sorted(os.listdir(p)):
        if name.endswith(".md") and os.path.isfile(os.path.join(p, name)):
            files.append((d, os.path.join(p, name)))
            per_dir[d] += 1

INLINE_CODE = re.compile(r"(?<!`)(`+)(?!`)((?:(?!\n[ \t]*\n).)+?)(?<!`)\1(?!`)", re.S)
SHORTCODE = re.compile(r"\{\{([<%])(.*?)([%>])\}\}", re.S)
COMMENT = re.compile(r"<!--.*?-->", re.S)
AUTOLINK = re.compile(r"<(?:https?|ftp|mailto):[^\s<>]*>|<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>")
TAG_OPEN = re.compile(r"<([A-Za-z][A-Za-z0-9\-]*)(?=[\s/>])([^<>]*?)(/?)>", re.S)
TAG_CLOSE = re.compile(r"</([A-Za-z][A-Za-z0-9\-]*)\s*>")
LINK = re.compile(r"(!?)\[((?:[^\[\]\n]|\[[^\]\n]*\])*)\]\(\s*<?([^)\s>]*)>?(?:\s+(?:\"[^\"]*\"|'[^']*'|\([^)]*\)))?\s*\)")
FENCE = re.compile(r"^( {0,3}|\s*(?:[-*+]|\d+[.)])?\s*)(`{3,}|~{3,})(.*)$")
TABLE_DELIM = re.compile(r"^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$|^\s*\|\s*:?-+:?\s*\|\s*$")
LIST_ITEM = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+")

for d, path in files:
    f = os.path.relpath(path, ROOT)
    raw = open(path, "rb").read()
    sizes.append(len(raw))
    if raw.startswith(b"\xef\xbb\xbf"):
        S.add("BOM", f)
    if b"\r\n" in raw:
        S.add("CRLF 换行", f, raw.count(b"\r\n"))
    text = raw.decode("utf-8", errors="replace").replace("\r\n", "\n")
    lines = text.split("\n")

    # ---- front matter ----
    body_start = 0
    fm_lines = []
    if lines and lines[0].strip() in ("---", "+++"):
        delim = lines[0].strip()
        for i in range(1, len(lines)):
            if lines[i].strip() == delim:
                fm_lines = lines[1:i]
                body_start = i + 1
                break
        fm_kind["YAML (---)" if delim == "---" else "TOML (+++)"] += 1
    else:
        fm_kind["无 front matter"] += 1
    parent = None
    for ln in fm_lines:
        if fm_kind and lines[0].strip() == "---":
            m = re.match(r"^([A-Za-z_][\w\-]*)\s*:", ln)
            if m:
                parent = m.group(1)
                fm_keys.add(parent, f)
                if re.match(r"^draft\s*:\s*true\s*$", ln.strip(), re.I):
                    S.add("draft: true", f)
                if re.match(r"^draft\s*:\s*false\s*$", ln.strip(), re.I):
                    S.add("draft: false", f)
                continue
            m = re.match(r"^\s+([A-Za-z_][\w\-]*)\s*:", ln)
            if m and parent:
                fm_nested.add(f"{parent}.{m.group(1)}", f)
        else:
            m = re.match(r"^\s*\[([^\]]+)\]\s*$", ln)
            if m:
                parent = m.group(1)
                fm_keys.add(f"[{parent}]", f)
                continue
            m = re.match(r"^\s*([A-Za-z_][\w\-]*)\s*=", ln)
            if m:
                key = m.group(1) if parent is None else f"{parent}.{m.group(1)}"
                (fm_keys if parent is None else fm_nested).add(key, f)
                if re.match(r"^draft\s*=\s*true\s*$", ln.strip(), re.I):
                    S.add("draft: true", f)
                if re.match(r"^draft\s*=\s*false\s*$", ln.strip(), re.I):
                    S.add("draft: false", f)

    body_lines = lines[body_start:]
    body = "\n".join(body_lines)
    cjk = sum(1 for ch in body if is_cjk(ch))
    cjks.append(cjk)

    # ---- shortcodes (raw body, 含代码块内) ----
    for m in re.finditer(r"\{\{[<%]\s*/\*", body):
        S.add("转义短代码 {{</* */>}}", f)
    for m in SHORTCODE.finditer(body):
        inner = m.group(2).strip()
        kind = "{{<" if m.group(1) == "<" else "{{%"
        S.add(f"短代码定界 {kind}", f)
        if inner.startswith("/*"):
            continue
        mm = re.match(r"(/?)\s*([\w./\-]+)", inner)
        if not mm:
            shortcodes.add("(无法识别)", f)
            continue
        if mm.group(1):
            sc_close.add(safe(mm.group(2)), f)
        else:
            shortcodes.add(f"{safe(mm.group(2))} ({kind})", f)

    # ---- fenced code masking ----
    masked = []
    in_fence = None
    fence_open_line = 0
    fenced_lines_in_code = []
    for ln in body_lines:
        if in_fence is None:
            m = FENCE.match(ln)
            if m:
                ch = m.group(2)[0]
                if ch == "`" and "`" in m.group(3):
                    masked.append(ln)
                    continue
                in_fence = (ch, len(m.group(2)))
                info = m.group(3).strip()
                lang = info.split()[0] if info else ""
                lang = re.sub(r"\{.*$", "", lang)
                S.add("围栏代码块", f)
                fence_lang.add(safe(lang.lower()) if lang else "(无语言名)", f)
                if "{" in info:
                    S.add("围栏信息串带 {属性}", f)
                if ch == "~":
                    S.add("围栏用 ~~~", f)
                masked.append("")
                continue
            masked.append(ln)
        else:
            m = re.match(r"^\s*(`{3,}|~{3,})\s*$", ln)
            if m and m.group(1)[0] == in_fence[0] and len(m.group(1)) >= in_fence[1]:
                in_fence = None
                masked.append("")
                continue
            fenced_lines_in_code.append(ln)
            masked.append("")
    if in_fence is not None:
        S.add("未闭合围栏", f)
    code_text = "\n".join(fenced_lines_in_code)
    for m in SHORTCODE.finditer(code_text):
        S.add("短代码出现在围栏代码内", f)

    # ---- indented code (粗略) ----
    prev_blank = True
    prev_nonblank = ""
    in_list_ctx = False
    for ln in masked:
        if ln.strip() == "":
            prev_blank = True
            continue
        if LIST_ITEM.match(ln):
            in_list_ctx = True
        elif not ln.startswith((" ", "\t")) and prev_blank:
            in_list_ctx = False
        if prev_blank and re.match(r"^( {4,}|\t)\S", ln) and not in_list_ctx and not LIST_ITEM.match(ln):
            S.add("缩进代码块候选(前空行+4空格/Tab, 非列表上下文)", f)
        prev_blank = False
        prev_nonblank = ln

    # ---- line-level extension syntax on masked lines ----
    for i, ln in enumerate(masked):
        if TABLE_DELIM.match(ln) and "|" in ln:
            S.add("表格(分隔行)", f)
        if re.match(r"^\s*[-*+]\s+\[[ xX]\]\s", ln):
            S.add("任务列表项", f)
        if re.match(r"^\[\^[^\]]+\]:", ln):
            S.add("脚注定义 [^x]:", f)
        if re.match(r"^:\s+\S", ln) and i > 0 and masked[i - 1].strip() and not LIST_ITEM.match(masked[i - 1]):
            S.add("定义列表候选(: 开头行)", f)
        if re.match(r"^#{1,6}\s.*\{#[^}]+\}\s*$", ln):
            S.add("标题锚点 {#id}", f)
        if re.match(r"^#{1,6}\s.*\{\.[^}]+\}\s*$", ln):
            S.add("标题属性 {.class}", f)
        if re.match(r"^\s*>\s*\[!\w+\]", ln):
            S.add("GitHub 式提示块 > [!TYPE]", f)
        if re.match(r"^(import|export)\s", ln):
            S.add("行首 import/export (MDX 会当 ESM)", f)
        if re.match(r"^\s*\$\$", ln):
            S.add("行首 $$ (块公式定界)", f)
        if re.match(r"^\s*\\\[\s*$", ln):
            S.add("行首 \\[ (块公式定界)", f)
        if re.match(r"^ {0,3}<[A-Za-z!/]", ln):
            S.add("行首 HTML (HTML 块候选)", f)

    # ---- inline-level, exclude inline code ----
    mtext = "\n".join(masked)
    n_inline = len(INLINE_CODE.findall(mtext))
    S.add("行内代码 `…`", f, n_inline)
    t = INLINE_CODE.sub(lambda m: " " * 0, mtext)

    # HTML comments
    comments = COMMENT.findall(t)
    S.add("HTML 注释 <!-- --> (正文, 含 more)", f, len(comments))
    S.add("<!--more--> 摘要分隔", f, sum(1 for c in comments if re.match(r"<!--\s*more\s*-->", c)))
    t = COMMENT.sub(" ", t)
    # shortcodes removed
    t_nosc = SHORTCODE.sub(" ", t)

    # autolinks
    al = AUTOLINK.findall(t_nosc)
    S.add("尖括号自动链接 <https://…>/<邮箱>", f, len(al))
    t2 = AUTOLINK.sub(" ", t_nosc)

    # HTML tags
    for m in TAG_OPEN.finditer(t2):
        name = m.group(1).lower()
        attrs = m.group(2)
        if name in HTML_TAGS:
            html_open.add(name, f)
            if name in VOID and not m.group(3):
                S.add("空元素未自闭合 (<br> 等, JSX 报错)", f)
            if re.search(r"\bstyle\s*=\s*[\"']", attrs):
                S.add("style=\"…\" 字符串属性 (JSX 需对象)", f)
            if re.search(r"\bclass\s*=", attrs):
                S.add("class= 属性", f)
        else:
            pseudo_tags.add(safe(m.group(1)), f)
    for m in TAG_CLOSE.finditer(t2):
        name = m.group(1).lower()
        if name in HTML_TAGS:
            html_close.add(name, f)
        else:
            pseudo_tags.add("/" + safe(m.group(1)), f)

    # bare '<'
    for m in re.finditer(r"<", t2):
        nxt = t2[m.end():m.end() + 1]
        if nxt and (nxt.isascii() and nxt.isalpha() or nxt in "/!?"):
            # 字母开头: 若不构成可识别标签, 计伪标签/不完整
            seg = t2[m.start():m.start() + 60]
            if TAG_OPEN.match(seg) or TAG_CLOSE.match(seg):
                continue
            lt_class.add("< + 字母//!? 但不成标签", f)
            continue
        if nxt == "":
            cls = "< 行末"
        elif nxt == "\n":
            cls = "< 行末"
        elif nxt.isdigit():
            cls = "< + 数字"
        elif nxt in " \t":
            cls = "< + 空白"
        elif nxt in "-=":
            cls = "< + - 或 ="
        elif is_cjk(nxt):
            cls = "< + 中日韩字符"
        else:
            cls = "< + 其他符号"
        lt_class.add(cls, f)

    # braces
    nb_open = t2.count("{")
    nb_close = t2.count("}")
    S.add("{ (排除代码/短代码/注释)", f, nb_open)
    S.add("} (排除代码/短代码/注释)", f, nb_close)
    S.add("{ 或 } 所在行数", f, sum(1 for ln in t2.split("\n") if "{" in ln or "}" in ln))

    # footnote refs
    S.add("脚注引用 [^x]", f, len(re.findall(r"\[\^[^\]]+\](?!:)", t2)))
    # strikethrough
    S.add("删除线 ~~…~~", f, len(re.findall(r"~~[^~\n]+~~", t2)))
    single_tilde_lines = 0
    for ln in t2.split("\n"):
        s = re.sub(r"~~+", "", ln)
        if s.count("~") >= 2:
            single_tilde_lines += 1
    S.add("同一行 ≥2 个单 ~ (GFM 可能误判删除线)", f, single_tilde_lines)
    # math
    S.add("$$ 出现", f, t2.count("$$"))
    S.add("\\( 出现", f, t2.count("\\("))
    S.add("\\[ 出现", f, len(re.findall(r"\\\[", t2)))
    inl = re.findall(r"(?<![\\$])\$(?![\s$])[^$\n]+?(?<![\s\\])\$(?![\d$])", t2.replace("$$", "  "))
    S.add("行内 $…$ (粗略, 可能含货币)", f, len(inl))
    S.add("$ 单字符总数", f, t2.replace("$$", "").count("$"))
    # emoji
    S.add(":emoji: 代码 (enableEmoji)", f, len(re.findall(r"(?<![\w:/]):(?=[a-z0-9_+\-]*[a-z])[a-z0-9_+\-]{2,30}:(?![\w/])", t2)))
    # bare URLs (linkify)
    t3 = LINK.sub(" ", t2)
    t3 = re.sub(r"^\s*\[[^\]]+\]:\s*\S+.*$", " ", t3, flags=re.M)
    bare = list(re.finditer(r"(?<![\w(\"'=/])(?:https?://|www\.)[^\s<>()\[\]]+", t3))
    S.add("裸 URL (linkify 依赖)", f, len(bare))
    S.add("裸 URL 紧贴中日韩字符/全角标点 (自动链接边界风险)", f,
          sum(1 for b in bare if any(is_cjk(c) or (ord(c) > 0x2000 and is_punct(c)) for c in b.group(0))))
    # typographer
    S.add('直引号 " (typographer 会转弯引号)', f, t3.count('"'))
    S.add("-- 或 ... (typographer 会转破折/省略号)", f, len(re.findall(r"(?<!-)--(?!-)|\.\.\.", t3)))
    # link reference definitions
    S.add("链接引用定义 [x]: url", f, len(re.findall(r"^\s{0,3}\[[^\]^]+\]:\s*\S", t2, re.M)))
    S.add("引用式图片 ![..][..]", f, len(re.findall(r"!\[[^\]]*\]\[[^\]]*\]", t2)))
    # CJK emphasis flanking
    for m in re.finditer(r"(?<!\*)\*\*(?!\*)", t2):
        before = t2[m.start() - 1] if m.start() > 0 else " "
        after = t2[m.end()] if m.end() < len(t2) else " "
        if is_punct(before) and (is_cjk(after) or after.isalnum()):
            S.add("** 前为标点后为文字 (CommonMark 不能闭合)", f)
        if is_punct(after) and (is_cjk(before) or before.isalnum()):
            S.add("** 后为标点前为文字 (CommonMark 不能开启)", f)
    S.add("** 总数", f, len(re.findall(r"(?<!\*)\*\*(?!\*)", t2)))

    # images & links
    for m in LINK.finditer(t2):
        is_img, url = m.group(1) == "!", m.group(3)
        if is_img:
            S.add("图片 ![](…)", f)
            stat = img_form
        else:
            S.add("链接 [](…)", f)
            stat = link_form
        if re.match(r"^https?://", url, re.I):
            host = re.sub(r"^https?://", "", url, flags=re.I).split("/")[0].lower()
            if baseurl_host and host.endswith(baseurl_host.replace("www.", "")):
                stat.add("本站域名完整 URL", f)
            else:
                stat.add("http(s) 外链", f)
        elif url.startswith("//"):
            stat.add("协议相对 //", f)
        elif url.startswith("/"):
            segs = [s for s in url.split("?")[0].split("#")[0].split("/") if s]
            if not segs:
                stat.add("/ 根", f)
            elif segs[0] in SECTION_ALLOW:
                stat.add(f"/{segs[0]}/…", f)
            elif len(segs) == 1 and "." in segs[0]:
                stat.add("/<文件>", f)
            else:
                stat.add(f"/<非常规首段>/… ({len(segs)} 段)", f)
        elif url.startswith("#"):
            stat.add("# 页内锚点", f)
        elif url.startswith("data:"):
            stat.add("data: URI", f)
        elif url.startswith("mailto:"):
            stat.add("mailto:", f)
        elif url.startswith("../"):
            stat.add("相对 ../", f)
        elif url.startswith("./"):
            stat.add("相对 ./", f)
        elif url == "":
            stat.add("(空)", f)
        else:
            stat.add("相对 (裸文件名/目录)", f)
    for m in re.finditer(r"<img\b[^>]*\bsrc\s*=\s*[\"']([^\"']*)", t2, re.I):
        S.add("HTML <img src>", f)
    for m in SHORTCODE.finditer(body):
        inner = m.group(2)
        if re.match(r"\s*(rel)?ref\b", inner):
            S.add("ref/relref 短代码内部链接", f)

    # ---- 补充 A: front matter 形态 (不报值) ----
    has_slug = False
    for ln in fm_lines:
        m = re.match(r"^(\w+)\s*:\s*(.*)$", ln)
        if not m:
            continue
        k, v = m.group(1), m.group(2).strip()
        vv = v.strip("'\"")
        if k in ("slug", "url", "aliases"):
            has_slug = has_slug or k in ("slug", "url")
        if k in ("date", "expirydate"):
            X[f"{k} 形态 {re.sub(chr(92) + 'd', '9', vv)}"].add(f)
            if vv[:10] < TODAY:
                X[f"{k} 早于 {TODAY}"].add(f)
            else:
                X[f"{k} 不早于 {TODAY}"].add(f)
        if k in ("categories", "tags"):
            X[f"{k} 写法: " + ("行内数组 [..]" if v.startswith("[") else ("块列表" if v == "" else "标量"))].add(f)
        if k == "layout":
            LAYOUT_VALUES.add(vv)
        if k == "title":
            if any(is_cjk(c) for c in vv):
                X["title 含中日韩字符"].add(f)
            if re.search(r"[\s\"'?#%&/:：？，。、！（）《》“”]", vv):
                X["title 含空格/标点(urlize 会改写)"].add(f)
    if fm_lines and not has_slug:
        X["无 slug 也无 url (/:slug/ 回落到 title)"].add(f)

    # ---- 补充 B: 数学区内外 ----
    MATH = re.compile(r"\$\$.+?\$\$|(?<!\$)\$(?![\s$])[^$\n]+?(?<![\s\\])\$(?!\$)", re.S)
    spans = [m.group(0) for m in MATH.finditer(t2)]
    S.add("数学区段 ($$…$$ 与 $…$)", f, len(spans))
    S.add("  其中 $$…$$ 单行内联(行内不独占)", f,
          sum(1 for ln in t2.split("\n") if "$$" in ln and not re.fullmatch(r"\s*\$\$.*\$\$\s*", ln)))
    S.add("  含 $$ 的表格行", f, sum(1 for ln in t2.split("\n") if "$$" in ln and ln.lstrip().startswith("|")))
    odd = 0
    for ln in t2.split("\n"):
        if "$" in ln and ln.lstrip().startswith("|"):
            cells = re.split(r"(?<!\\)\|", ln)
            odd += sum(1 for c in cells if c.count("$") % 2 == 1)
    S.add("  表格单元 $ 数为奇数 (数学内含 | 被切断)", f, odd)
    S.add("  { } 在数学内", f, sum(sp.count("{") + sp.count("}") for sp in spans))
    S.add("  < 在数学内", f, sum(sp.count("<") for sp in spans))
    S.add("  \\+ASCII 标点 在数学内 (goldmark 会反转义, remark-math 不会)", f,
          sum(len(re.findall(r"\\[!-/:-@\[-`{-~]", sp)) for sp in spans))
    S.add("  * 或 _ 在数学内 (goldmark 可能当强调)", f, sum(sp.count("*") + sp.count("_") for sp in spans))
    nomath = MATH.sub(" ", t2)
    S.add("{ } 在数学外", f, nomath.count("{") + nomath.count("}"))
    S.add("< (非标签) 在数学外", f,
          sum(1 for m in re.finditer(r"<", nomath)
              if not (TAG_OPEN.match(nomath[m.start():m.start() + 200]) or TAG_CLOSE.match(nomath[m.start():m.start() + 40]))))
    for ln in nomath.split("\n"):
        if "{" in ln or "}" in ln:
            s_ = ln.lstrip()
            kind = ("表格行" if s_.startswith("|") else "列表项" if LIST_ITEM.match(ln) else
                    "标题" if s_.startswith("#") else "引用" if s_.startswith(">") else "段落")
            S.add(f"  数学外 {{}} 所在行: {kind}", f)
            if "{{" in ln or "}}" in ln:
                S.add("  数学外 {} 行含双花括号", f)
            if "\\" in ln:
                S.add("  数学外 {} 行含反斜杠 (疑似未包 $ 的 LaTeX)", f)
    for m in re.finditer(r"<", nomath):
        seg = nomath[m.start():m.start() + 200]
        if TAG_OPEN.match(seg) or TAG_CLOSE.match(seg):
            continue
        nx = nomath[m.end():m.end() + 1]
        cls = ("字母" if nx.isascii() and nx.isalpha() else "数字" if nx.isdigit() else "空白/行末" if (nx == "" or nx.isspace())
               else "- 或 =" if nx in "-=" else "中日韩" if is_cjk(nx) else "其他符号")
        S.add(f"  数学外裸 < 后随: {cls}", f)
        MDX_HARD[f].add("裸 <")
    if nomath.count("{") + nomath.count("}"):
        MDX_HARD[f].add("{ }")
    if AUTOLINK.search(t_nosc):
        MDX_HARD[f].add("<自动链接>")
    if SHORTCODE.search(body):
        MDX_HARD[f].add("短代码")
    for sp in spans:
        for e in re.findall(r"\\[!-/:-@\[-`{-~]", sp):
            MATH_ESC[e] += 1

    # ---- 补充 C: ** 成对模拟 (按段落依序配对) ----
    def ws(c):
        return c == "" or c.isspace()

    for para in re.split(r"\n[ \t]*\n", t2):
        ds = [m for m in re.finditer(r"(?<!\*)\*\*(?!\*)", para)]
        for i in range(0, len(ds) - 1, 2):
            o_, c_ = ds[i], ds[i + 1]
            ob = para[o_.start() - 1] if o_.start() else ""
            oa = para[o_.end()] if o_.end() < len(para) else ""
            cb = para[c_.start() - 1] if c_.start() else ""
            ca = para[c_.end()] if c_.end() < len(para) else ""
            left = (not ws(oa)) and (not is_punct(oa) or ws(ob) or is_punct(ob))
            right = (not ws(cb)) and (not is_punct(cb) or ws(ca) or is_punct(ca))
            S.add("** 成对(依序配对)", f)
            if not (left and right):
                S.add("** 成对但 CommonMark 不成粗体 (中日韩标点邻接)", f)

    # ---- 补充 D: 图片主机形态 (不报主机名) ----
    for m in LINK.finditer(t2):
        if m.group(1) == "!" and re.match(r"^https?://", m.group(3), re.I):
            u = m.group(3)
            IMG_HOSTS[re.sub(r"^https?://", "", u, flags=re.I).split("/")[0].lower()] += 1
            S.add("图片 http:// (非 https)" if u.lower().startswith("http://") else "图片 https://", f)
    if baseurl_host:
        S.add("本站域名出现次数 (正文全文, 含代码)", f, len(re.findall(re.escape(baseurl_host), body, re.I)))

# ================= output =================
o = []
P = o.append
N = len(files)
P("# own-scan: 旧 Hugo 博客 Markdown 写法统计（只含计数/键名/标签名/语言名/路径形态）")
P(f"# 范围: {', '.join(f'{d}={per_dir[d]}' for d in DIRS)}  合计 {N} 个 .md")
P("# 口径: 正文=front matter 之后; 『排除代码』=去掉围栏代码块与行内代码; 未注明者已额外去掉 HTML 注释与短代码")
P("")
P("## 1 规模")
ss, cs = sorted(sizes), sorted(cjks)
P(f"文件数: {N}")
P(f"字节(整文件) min/中位/p90/max: {ss[0]} / {int(statistics.median(ss))} / {pct(ss, .9)} / {ss[-1]}")
P(f"中日韩字符(正文, 汉字+假名+谚文, 不含标点) min/中位/p90/max: {cs[0]} / {int(statistics.median(cs))} / {pct(cs, .9)} / {cs[-1]}")
P(f"总字节: {sum(sizes)}   总中日韩字符: {sum(cjks)}")
for k in ("BOM", "CRLF 换行"):
    P(f"{k}: {S.fmt(k)}")
P("")
P("## 2 front matter")
for k, v in fm_kind.most_common():
    P(f"{k}: {v} 篇")
P(f"draft: true: {len(S.files['draft: true'])} 篇   draft: false: {len(S.files['draft: false'])} 篇")
P("顶层字段名频次 (篇数):")
for k in sorted(fm_keys.files, key=lambda k: (-len(fm_keys.files[k]), k)):
    P(f"  {k}: {len(fm_keys.files[k])}")
P("嵌套字段 (父.子, 篇数):")
for k in sorted(fm_nested.files, key=lambda k: (-len(fm_nested.files[k]), k)):
    P(f"  {k}: {len(fm_nested.files[k])}")
P("")
P("## 3 Hugo 短代码 (正文原样, 含围栏代码内)")
for k in ("短代码定界 {{<", "短代码定界 {{%", "转义短代码 {{</* */>}}", "短代码出现在围栏代码内", "ref/relref 短代码内部链接"):
    P(f"{k}: {S.fmt(k)}")
P("按名称 (开标签):")
if not shortcodes.files:
    P("  (0)")
for k in sorted(shortcodes.files, key=lambda k: -shortcodes.total[k]):
    P(f"  {k}: {shortcodes.fmt(k)}")
P("闭合标签:")
if not sc_close.files:
    P("  (0)")
for k in sorted(sc_close.files, key=lambda k: -sc_close.total[k]):
    P(f"  /{k}: {sc_close.fmt(k)}")
P("")
P("## 4 原生 HTML (排除代码)")
for k in ("HTML 注释 <!-- --> (正文, 含 more)", "<!--more--> 摘要分隔", "行首 HTML (HTML 块候选)"):
    P(f"{k}: {S.fmt(k)}")
P("开标签 (已知 HTML 元素):")
if not html_open.files:
    P("  (0)")
for k in sorted(html_open.files, key=lambda k: -html_open.total[k]):
    P(f"  <{k}>: {html_open.fmt(k)}")
P("闭标签:")
if not html_close.files:
    P("  (0)")
for k in sorted(html_close.files, key=lambda k: -html_close.total[k]):
    P(f"  </{k}>: {html_close.fmt(k)}")
for k in ("空元素未自闭合 (<br> 等, JSX 报错)", "style=\"…\" 字符串属性 (JSX 需对象)", "class= 属性", "HTML <img src>"):
    P(f"{k}: {S.fmt(k)}")
P("")
P("## 5 MDX 风险点 (排除代码, 已去注释与短代码)")
P("非 HTML 名的 <标签> (伪标签/占位符):")
if not pseudo_tags.files:
    P("  (0)")
for k in sorted(pseudo_tags.files, key=lambda k: -pseudo_tags.total[k]):
    P(f"  <{k}>: {pseudo_tags.fmt(k)}")
P("裸 < 按后随字符分类:")
if not lt_class.files:
    P("  (0)")
for k in sorted(lt_class.files, key=lambda k: -lt_class.total[k]):
    P(f"  {k}: {lt_class.fmt(k)}")
for k in ("{ (排除代码/短代码/注释)", "} (排除代码/短代码/注释)", "{ 或 } 所在行数", "尖括号自动链接 <https://…>/<邮箱>",
          "缩进代码块候选(前空行+4空格/Tab, 非列表上下文)", "行首 import/export (MDX 会当 ESM)"):
    P(f"{k}: {S.fmt(k)}")
P("")
P("## 6 扩展语法")
P(f"围栏代码块: {S.fmt('围栏代码块')}")
for k in ("围栏信息串带 {属性}", "围栏用 ~~~", "未闭合围栏", "行内代码 `…`"):
    P(f"{k}: {S.fmt(k)}")
P("围栏语言名:")
for k in sorted(fence_lang.files, key=lambda k: -fence_lang.total[k]):
    P(f"  {k}: {fence_lang.fmt(k)}")
for k in ("表格(分隔行)", "脚注引用 [^x]", "脚注定义 [^x]:", "任务列表项", "删除线 ~~…~~",
          "同一行 ≥2 个单 ~ (GFM 可能误判删除线)", "$$ 出现", "行首 $$ (块公式定界)", "\\( 出现", "\\[ 出现",
          "行首 \\[ (块公式定界)", "行内 $…$ (粗略, 可能含货币)", "$ 单字符总数", "定义列表候选(: 开头行)",
          "标题锚点 {#id}", "标题属性 {.class}", "GitHub 式提示块 > [!TYPE]", ":emoji: 代码 (enableEmoji)",
          "裸 URL (linkify 依赖)", "裸 URL 紧贴中日韩字符/全角标点 (自动链接边界风险)",
          '直引号 " (typographer 会转弯引号)', "-- 或 ... (typographer 会转破折/省略号)",
          "** 总数", "** 前为标点后为文字 (CommonMark 不能闭合)", "** 后为标点前为文字 (CommonMark 不能开启)"):
    P(f"{k}: {S.fmt(k)}")
mer = fence_lang.total.get("mermaid", 0)
P(f"mermaid (围栏语言): {len(fence_lang.files.get('mermaid', set()))} 文件 / {mer} 次")
P("")
P("## 7 图片与链接")
P(f"图片 ![](…): {S.fmt('图片 ![](…)')}")
for k in ("引用式图片 ![..][..]", "HTML <img src>", "链接 [](…)", "链接引用定义 [x]: url"):
    P(f"{k}: {S.fmt(k)}")
P("图片路径形态:")
if not img_form.files:
    P("  (0)")
for k in sorted(img_form.files, key=lambda k: -img_form.total[k]):
    P(f"  {k}: {img_form.fmt(k)}")
P("链接目标形态:")
for k in sorted(link_form.files, key=lambda k: -link_form.total[k]):
    P(f"  {k}: {link_form.fmt(k)}")
P("")
P("## 9 补充核查")
P("9A front matter 形态 (篇数, 不报值):")
for k in sorted(X):
    P(f"  {k}: {len(X[k])}")
P(f"  layout 取值种类数: {len(LAYOUT_VALUES)}")
P("9B 数学区内外 (排除代码/注释/短代码):")
for k in ("数学区段 ($$…$$ 与 $…$)", "  其中 $$…$$ 单行内联(行内不独占)", "  含 $$ 的表格行",
          "  表格单元 $ 数为奇数 (数学内含 | 被切断)", "  { } 在数学内", "  < 在数学内",
          "  \\+ASCII 标点 在数学内 (goldmark 会反转义, remark-math 不会)", "  * 或 _ 在数学内 (goldmark 可能当强调)",
          "{ } 在数学外", "< (非标签) 在数学外"):
    P(f"  {k}: {S.fmt(k)}")
for k in sorted(k for k in S.total if k.startswith("  数学外 {}")) + \
        sorted(k for k in S.total if k.startswith("  数学外裸 <")):
    P(f"  {k}: {S.fmt(k)}")
P(f"  数学内 \\+标点 记号分布: " + ", ".join(f"{k}={v}" for k, v in MATH_ESC.most_common()))
P("9E MDX 硬错误候选 (数学外 { }、数学外裸 <、<自动链接>、短代码) 文件并集:")
P(f"  并集文件数: {len(MDX_HARD)} / {N}")
for combo, n in Counter(" + ".join(sorted(v)) for v in MDX_HARD.values()).most_common():
    P(f"  {combo}: {n} 文件")
P("9C 粗体 ** 依序配对模拟:")
for k in ("** 成对(依序配对)", "** 成对但 CommonMark 不成粗体 (中日韩标点邻接)"):
    P(f"  {k}: {S.fmt(k)}")
P("9D 图片主机 (不报主机名):")
P(f"  图片外链主机种类数: {len(IMG_HOSTS)}   最多主机占比: "
  f"{(IMG_HOSTS.most_common(1)[0][1] / sum(IMG_HOSTS.values()) * 100 if IMG_HOSTS else 0):.0f}%   "
  f"是否本站域名: {'是' if baseurl_host and IMG_HOSTS and IMG_HOSTS.most_common(1)[0][0].endswith(baseurl_host) else '否'}")
for k in ("图片 https://", "图片 http:// (非 https)", "本站域名出现次数 (正文全文, 含代码)"):
    P(f"  {k}: {S.fmt(k)}")
P("")
P("## 8 config.toml (只摘 markup/highlight/math/goldmark/permalinks 相关键)")
WANT_SEC = re.compile(r"^(markup(\..*)?|permalinks|params\.page\.code(\..*)?|params\.page\.math)$", re.I)
WANT_TOP = {"theme", "enableEmoji", "hasCJKLanguage"}
SECRET = re.compile(r"(key|token|secret|passw|appid|clientid|^id$|repo$)", re.I)
sec = None
with open(os.path.join(ROOT, "config.toml"), encoding="utf-8") as fh:
    for ln in fh:
        s = ln.strip()
        if not s or s.startswith("#"):
            continue
        m = re.match(r"^\[+([^\]]+)\]+$", s)
        if m:
            sec = m.group(1).strip().strip('"')
            if WANT_SEC.match(sec):
                P(f"[{sec}]")
            continue
        m = re.match(r"^([A-Za-z_][\w\-]*)\s*=\s*(.*?)\s*(#.*)?$", s)
        if not m:
            continue
        k, v = m.group(1), m.group(2)
        if (sec is None and k in WANT_TOP) or (sec and WANT_SEC.match(sec)):
            if SECRET.search(k):
                v = "(凭据类, 不报)"
            P(f"  {(sec + '.') if sec else ''}{k} = {v}")

with open(OUT, "w", encoding="utf-8") as fh:
    fh.write("\n".join(o) + "\n")
print(f"wrote {OUT}: {len(o)} lines")
