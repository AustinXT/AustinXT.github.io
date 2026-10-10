"""参照站核查：读 resources/md-render-yang-20261010/ 下已下载文件，只读、不执行下载内容。
用法: python3 -I analyze.py <资源根目录> <curl-log.tsv> <输出文件>
输出里不含对方正文，只有计数、字节、标签、标识符。"""
import gzip
import hashlib
import html as htmlmod
import json
import re
import statistics
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(sys.argv[1])
LOG = Path(sys.argv[2])
OUT = Path(sys.argv[3])
BROTLI = "/opt/homebrew/bin/brotli"
lines = []


def w(*a):
    lines.append(" ".join(str(x) for x in a))


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def br(data, q):
    r = subprocess.run([BROTLI, "-c", "-q", str(q)], input=data, capture_output=True, check=True)
    return len(r.stdout)


def gz(data):
    return len(gzip.compress(data, compresslevel=6, mtime=0))


SCRIPT_RE = re.compile(r"<script([^>]*)>(.*?)</script>", re.S)
CF_A_RE = re.compile(r'<a href="https://yangzhiping\.com/cdn-cgi/content\?id=[^"]*"[^>]*>.*?</a>', re.S)


def strip_cf(s):
    n_a = len(CF_A_RE.findall(s))
    s = CF_A_RE.sub("", s)
    n_s = 0

    def repl(m):
        nonlocal n_s
        if "__CF$cv$params" in m.group(2):
            n_s += 1
            return ""
        return m.group(0)

    s = SCRIPT_RE.sub(repl, s)
    return s, n_a, n_s


def flight_parts(s):
    tags = [m for m in SCRIPT_RE.finditer(s) if "self.__next_f" in m.group(2)]
    dec = []
    for m in tags:
        arg = re.match(r"\s*self\.__next_f\.push\((.*)\)\s*$", m.group(2), re.S)
        if arg:
            v = json.loads(arg.group(1))
            if v[0] == 1:
                dec.append(v[1])
    return tags, "".join(dec)


def no_script(s):
    return SCRIPT_RE.sub("", s)


def article_region(s):
    a = s.find("<article")
    b = s.find("</article>")
    return (a, b) if a >= 0 and b > a else (None, None)


def text_nodes(fragment):
    frag = re.sub(r"<[^>]+>", "\x00", fragment)
    return [htmlmod.unescape(t) for t in frag.split("\x00") if t.strip()]


def visible_chars(fragment):
    t = "".join(text_nodes(fragment))
    nonws = len(re.sub(r"\s", "", t))
    cjk = len(re.findall(r"[\u3400-\u9fff\uf900-\ufaff]", t))
    return nonws, cjk


TAGS = ["article", "h1", "h2", "h3", "h4", "p", "strong", "a", "ul", "ol", "li", "blockquote", "img", "pre", "code", "table", "figure", "hr"]


def tag_counts(fragment):
    return {t: len(re.findall(rf"<{t}[\s>/]", fragment)) for t in TAGS}


def img_info(fragment):
    out = []
    for m in re.finditer(r"<img\b([^>]*)>", fragment):
        at = m.group(1)
        src = (re.search(r'\ssrc="([^"]*)"', at) or [None, ""])[1]
        ext = re.search(r"\.(webp|avif|jpe?g|png|gif|svg)(?:[?&\"]|$)", src.lower())
        out.append({
            "src_kind": "/_next/image" if "/_next/image" in src else (src.split("/")[1] if src.startswith("/") else src.split(":")[0]),
            "ext": ext.group(1) if ext else "?",
            "loading": (re.search(r'loading="([^"]*)"', at) or [None, "-"])[1],
            "width": bool(re.search(r"\swidth=", at)),
            "height": bool(re.search(r"\sheight=", at)),
            "srcset": "srcSet=" in at or "srcset=" in at,
            "decoding": (re.search(r'decoding="([^"]*)"', at) or [None, "-"])[1],
            "fetchpriority": (re.search(r'fetch[pP]riority="([^"]*)"', at) or [None, "-"])[1],
            "data-nimg": "data-nimg" in at,
        })
    return out


def balanced_end(d, st):
    depth = 0
    j = st
    while j < len(d):
        c = d[j]
        if c == '"':
            j += 1
            while d[j] != '"':
                j += 2 if d[j] == "\\" else 1
        elif c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return j + 1
        j += 1
    return j


def dsih(dec):
    """dangerouslySetInnerHTML 出现处：报元素类型与内容类型，不报内容。"""
    res = []
    for m in re.finditer(r"dangerouslySetInnerHTML", dec):
        back = dec[max(0, m.start() - 400):m.start()]
        el = re.findall(r'\["\$","([a-zA-Z0-9]+)",[^,]*,\{', back)
        typ = re.findall(r'"type":"([^"]+)"', back[-200:])
        body = dec[m.end():m.end() + 3000]
        hm = re.match(r'":\{"__html":"((?:[^"\\]|\\.)*)"', body)
        content = json.loads('"' + hm.group(1) + '"') if hm else ""
        kind = "?"
        if content.lstrip().startswith("{") or content.lstrip().startswith("["):
            try:
                j = json.loads(content)
                kind = "JSON-LD @type=" + str(j.get("@type") if isinstance(j, dict) else [x.get("@type") for x in j])
            except Exception:
                kind = "JSON-like (parse failed)"
        elif re.search(r"localStorage|classList|matchMedia|theme", content):
            kind = "inline JS (theme keywords: " + ",".join(sorted(set(re.findall(r"localStorage|classList|matchMedia|theme", content)))) + ")"
        elif el and el[-1] == "style":
            kind = "CSS (" + ",".join(sorted(set(re.findall(r"@font-face|@import|:root|--[a-z-]+|@media|html|body|font-family", content)))[:6]) + ")"
        elif "<p" in content or "<h" in content:
            kind = "HTML string with tags"
        res.append({"offset_in_decoded": m.start(), "element": el[-1] if el else "?", "type_attr": typ[-1] if typ else "-", "html_len": len(content), "kind": kind})
    return res


def dup_analysis(raw, a, b, dec, flight_tags):
    """正文文本节点在 RSC 内嵌数据里重复的情况，以及 HTML 首次出现到内嵌副本的字节距离。"""
    art = raw[a:b]
    m = re.search(r'<div class="article-content"', art)
    body_start = a + (m.start() if m else 0)
    frag = raw[body_start:b]
    # 段落级
    paras = re.findall(r"<(p|h3|h4|li|blockquote)\b[^>]*>(.*?)</\1>", frag, re.S)
    p_total = p_found = 0
    for tag, inner in paras:
        nodes = [t for t in text_nodes(inner) if len(t.strip()) >= 2]
        if not nodes:
            continue
        p_total += 1
        if all(json.dumps(t, ensure_ascii=False)[1:-1] in dec for t in nodes):
            p_found += 1
    # 字符级
    nodes = text_nodes(frag)
    tot = sum(len(t) for t in nodes)
    found = sum(len(t) for t in nodes if json.dumps(t, ensure_ascii=False)[1:-1] in dec)
    # 距离：只取无需转义的文本节点，在原始字节里定位
    rawb = raw.encode()
    flight_start = min(m.start() for m in flight_tags) if flight_tags else len(raw)
    fs_b = len(raw[:flight_start].encode())
    dists = []
    pos_b = len(raw[:body_start].encode())
    end_b = len(raw[:b].encode())
    for t in nodes:
        if len(t) < 8 or re.search(r'["\\<&\n]', t):
            continue
        tb = t.encode()
        h = rawb.find(tb, pos_b, end_b)
        if h < 0:
            continue
        pos_b = h + len(tb)
        f = rawb.find(tb, fs_b)
        if f > 0:
            dists.append(f - h)
    return p_total, p_found, tot, found, dists


def compress_report(name, raw_s, flight_tags):
    full = raw_s.encode()
    nofl = SCRIPT_RE.sub(lambda m: "" if "self.__next_f" in m.group(2) else m.group(0), raw_s).encode()
    fl_only = "".join(m.group(0) for m in flight_tags).encode()
    r = {"raw": (len(full), len(nofl), len(fl_only))}
    for label, fn in [("gzip6", gz), ("br11", lambda d: br(d, 11)), ("br5", lambda d: br(d, 5))]:
        cf, cn, co = fn(full), fn(nofl), fn(fl_only)
        r[label] = (cf, cn, co)
    w(f"[compress] {name}: raw full={len(full)} no_flight={len(nofl)} flight_only={len(fl_only)} flight_share_raw={(len(full)-len(nofl))/len(full):.1%}")
    for label in ["gzip6", "br11", "br5"]:
        cf, cn, co = r[label]
        w(f"  {label}: full={cf} no_flight={cn} flight_standalone={co} | marginal(full-no_flight)={cf-cn} "
          f"= {(cf-cn)/cf:.1%} of full, +{(cf-cn)/cn:.1%} over no_flight; marginal/standalone={(cf-cn)/co:.1%}")
    return r


# ---------- 0. 文件清单 ----------
w("# 参照站核查原始测量  (resources/md-render-yang-20261010/)")
w("## 0. 请求日志 (curl-log.tsv: N, UTC, dir, http, ttfb, total, wire_bytes, redirects, url_effective, rc, url)")
log = [l.split("\t") for l in LOG.read_text().splitlines() if l.strip()]
for r in log:
    w("  " + " | ".join(r))
w(f"  HTTP 请求合计 = {sum(1 + int(r[7]) for r in log)} (另有任务前已存在的 smoke-detail 1 次，不计入本轮)")
urlmap = {r[2]: r[10] for r in log}
urlmap["smoke-detail"] = "https://yangzhiping.com/essays/20260822/ (任务前已下载)"
w("\n## 0b. 文件清单: dir | url | file | bytes | sha256")
for d in sorted(p for p in ROOT.iterdir() if p.is_dir()):
    for f in ["body.txt", "headers.txt"]:
        p = d / f
        if p.exists():
            w(f"  {d.name} | {urlmap.get(d.name, '?')} | {p} | {p.stat().st_size} | {sha(p)}")

# ---------- 计时 ----------
w("\n## 8. 计时 (秒) run1 / run2")
by = {}
for r in log:
    k = r[2][3:] if r[2].startswith("t2-") else r[2]
    by.setdefault(k, []).append((r[4], r[5]))
for k, v in by.items():
    if not k.startswith("chunk"):
        w(f"  {k}: " + " ; ".join(f"ttfb={a} total={b}" for a, b in v))

# ---------- 1/2/4/7. 详情页 ----------
details = {"20260214": "detail-20260214", "20260602": "detail-20260602", "20260822": "smoke-detail", "book-9787111509271": "detail-book-9787111509271"}
w("\n## 1/2/4/7. 详情页")
for label, d in details.items():
    p = ROOT / d / "body.txt"
    raw = p.read_text(encoding="utf-8")
    origin, n_a, n_s = strip_cf(raw)
    tags, dec = flight_parts(raw)
    ns = no_script(raw)
    a, b = article_region(ns)
    w(f"\n### {label} ({p})")
    w(f"  bytes={len(raw.encode())} chars={len(raw)} cf_injected_anchor={n_a} cf_challenge_script={n_s}")
    w(f"  tags(whole page, scripts removed)={tag_counts(ns)}")
    if a is not None:
        art = ns[a:b]
        mm = re.search(r'<div class="article-content"', art)
        w(f"  <article> span in no-script html: [{a},{b}) ; article-content div present={bool(mm)}")
        w(f"  tags(inside <article>)={tag_counts(art)}")
        if mm:
            body_frag = art[mm.start():]
            w(f"  tags(inside .article-content)={tag_counts(body_frag)}")
            nonws, cjk = visible_chars(body_frag)
            w(f"  visible chars .article-content: non-whitespace={nonws} cjk={cjk}")
        nonws, cjk = visible_chars(art)
        w(f"  visible chars <article>: non-whitespace={nonws} cjk={cjk}")
        # article 在原始 HTML 中的字节位置 vs 第一个 flight script
        ra = raw.find("<article")
        w(f"  raw byte offset <article>={len(raw[:ra].encode())} </article>={len(raw[:raw.find('</article>')].encode())} first_flight_script={len(raw[:tags[0].start()].encode()) if tags else '-'}")
    fl_bytes = sum(len(m.group(0).encode()) for m in tags)
    w(f"  flight scripts={len(tags)} bytes(incl <script> tags)={fl_bytes} share={fl_bytes/len(raw.encode()):.1%} decoded_rsc_bytes={len(dec.encode())}")
    w(f"  RSC element counts: p={dec.count('[\"$\",\"p\",')} h3={dec.count('[\"$\",\"h3\",')} h4={dec.count('[\"$\",\"h4\",')} strong={dec.count('[\"$\",\"strong\",')} img={dec.count('[\"$\",\"img\",')} client_module_rows(I)={len(re.findall(r'(?m)^[0-9a-f]+:I\[', dec))}")
    w(f"  client module exports: {sorted(set(re.findall(r'(?m)^[0-9a-f]+:I\[\d+,\[[^\]]*\],\"([^\"]*)\"\]', dec)))}")
    rowtype = {k: v for k, v in re.findall(r'(?m)^([0-9a-f]+):(I\[|\["\$","[a-z0-9]+")', dec)}
    ia = dec.find('"article-content"')
    if ia >= 0:
        st = dec.rfind('["$","div"', 0, ia)
        sub = dec[st:balanced_end(dec, st)]
        rows_txt = {m.group(1): m.group(2) for m in re.finditer(r'(?m)^([0-9a-f]+):(.*)$', dec)}
        seen, todo = set(), re.findall(r'"\$L([0-9a-f]+)"', sub)
        while todo:
            x = todo.pop()
            if x in seen:
                continue
            seen.add(x)
            todo += re.findall(r'"\$L([0-9a-f]+)"', rows_txt.get(x, ""))
        kinds = Counter(("client" if rowtype.get(x, "?").startswith("I[") else rowtype.get(x, "?").replace('["$","', "host:").rstrip('"')) for x in seen)
        w(f"  article-content subtree: inline bytes={len(sub.encode())} lazy rows reachable={len(seen)} -> kinds {dict(kinds)}")
    keys = Counter(re.findall(r'\["\$","([a-z0-9]+)","([a-z0-9]+)-\d+"', dec))
    w(f"  RSC (element,key-prefix) pairs with key pattern name-N: {dict(keys)}")
    w(f"  raw markdown marks in RSC: '\\n## '={dec.count(chr(10)+'## ')} '**'={len(re.findall(r'\*\*[^*]{1,40}\*\*', dec))} md-link={len(re.findall(r'\]\((?:https?:|/)', dec))} ; html-string '<p'={dec.count('<p')} '\\u003cp'={dec.count('u003cp')}")
    w(f"  dangerouslySetInnerHTML in RSC: {dsih(dec)}")
    w(f"  inline <script type=application/ld+json> in HTML: {len(re.findall(r'<script[^>]*application/ld\+json', raw))}")
    w(f"  streaming markers: $RC={raw.count('$RC')} id=\"S:={raw.count('id=\"S:')} <template={raw.count('<template')}")
    imgs = img_info(ns)
    art_imgs = img_info(ns[a:b]) if a is not None else []
    w(f"  images whole page={len(imgs)} inside article={len(art_imgs)}")
    for i in imgs:
        w(f"    img {i}")
    if a is not None and "article-content" in raw and label != "book-9787111509271":
        ra, rb = raw.find("<article"), raw.find("</article>")
        pt, pf, tot, fnd, dists = dup_analysis(raw, ra, rb, dec, tags)
        w(f"  dup: blocks(p/h3/h4/li/blockquote with text)={pt} fully_in_RSC={pf} ; text chars={tot} found_in_RSC={fnd} ({fnd/max(tot,1):.1%})")
        if dists:
            w(f"  dup distance HTML->RSC copy (bytes): n={len(dists)} min={min(dists)} median={int(statistics.median(dists))} max={max(dists)} over_32KiB={sum(1 for x in dists if x > 32768)}")
    compress_report(label, raw, tags)
    compress_report(label + " (cf-stripped)", origin, flight_parts(origin)[0])

# ---------- 3. JS ----------
w("\n## 3. 外部 JS")
pages = {d: (ROOT / d / "body.txt").read_text(encoding="utf-8") for d in ["detail-20260214", "detail-20260602", "smoke-detail", "detail-book-9787111509271", "list-essays", "list-tags", "list-tag-letters", "list-books"]}
for d, s in pages.items():
    w(f"  {d}: script src = {re.findall(r'<script[^>]*src=\"([^\"]+)\"', s)}")
sets = {d: tuple(re.findall(r'<script[^>]*src="([^"]+)"', s)) for d, s in pages.items()}
w(f"  三篇随笔详情 JS 列表完全相同: {len({sets['detail-20260214'], sets['detail-20260602'], sets['smoke-detail']}) == 1}")
TERMS = ["marked", "markdown-it", "markdownit", "micromark", "mdast", "remark", "rehype", "unified", "commonmark", "gfm", "markdown", "shiki", "prism", "highlight.js", "hljs", "katex", "mathjax", "dangerouslySetInnerHTML"]
total_js = 0
for d in sorted(p for p in ROOT.iterdir() if p.name.startswith("chunk-")):
    js = (d / "body.txt").read_bytes()
    total_js += len(js) if "3ef7ad" not in d.name else 0
    w(f"\n  {d.name}: bytes={len(js)} sha256={hashlib.sha256(js).hexdigest()}")
    for t in TERMS:
        hits = [m.start() for m in re.finditer(re.escape(t.encode()), js, re.I)]
        if hits:
            w(f"    term '{t}': {len(hits)} hits")
            for h in hits[:6]:
                ctx = js[max(0, h - 70):h + len(t) + 70].decode("utf-8", "replace").replace("\n", " ")
                w(f"      @{h}: …{ctx}…")
    vm = re.findall(rb'version[=:]"(1\d\.\d+\.\d+[^"]*)"', js)
    if vm:
        w(f"    version strings: {sorted(set(v.decode() for v in vm))}")
w(f"\n  随笔详情 9 个 JS 合计 bytes(解压后)={total_js}")

# ---------- 6. 目录页 ----------
w("\n## 6. 目录页")
ESSAY = re.compile(r'href="(/essays/(?!tags/|tag/)[^"#?]+/)"')
for d in ["list-essays", "list-tags", "list-tag-letters", "list-books"]:
    s = pages[d]
    ns = no_script(s)
    tags, dec = flight_parts(s)
    ess = sorted(set(ESSAY.findall(ns)) - {"/essays/"})
    ess_dec = sorted(set(re.findall(r'/essays/(\d{8})/', dec)))
    tagl = sorted(set(re.findall(r'href="/essays/tag/([^"/]+)/"', ns)))
    books = sorted(set(re.findall(r'href="/books/([^"/]+)/"', ns)))
    years = Counter(x[8:12] for x in ess if re.match(r"/essays/\d{8}/", x))
    w(f"\n### {d}: bytes={len(s.encode())} flight_share={sum(len(m.group(0).encode()) for m in tags)/len(s.encode()):.1%}")
    w(f"  distinct essay detail links (HTML)={len(ess)} ; non-date-slug essay links={[x for x in ess if not re.match(r'/essays/\d{8}/', x)][:10]}")
    w(f"  essay ids in RSC={len(ess_dec)} ; ids in RSC not in HTML={len(set(ess_dec) - {x[8:16] for x in ess})}")
    w(f"  years of linked essays={dict(sorted(years.items()))}")
    w(f"  tag links={len(tagl)} ; book links={len(books)}")
    pag = {k: len(re.findall(k, ns)) for k in [r"page/2", r"\?page=", r"/page/", "下一页", "上一页", "加载更多", "查看更多", "更多文章", r'rel="next"', "load more", "Load more", "分页"]}
    w(f"  pagination markers (HTML)={ {k: v for k, v in pag.items() if v} or 'none'}")
    pag2 = {k: len(re.findall(k, dec)) for k in [r"page/2", r"\?page=", "下一页", "加载更多", "查看更多"]}
    w(f"  pagination markers (RSC)={ {k: v for k, v in pag2.items() if v} or 'none'}")
    yh = re.findall(r"<h[1-4][^>]*>\s*((?:19|20)\d\d)\s*(?:年)?\s*</h[1-4]>", ns)
    w(f"  year headings h1-h4={yh} ; archive-like hrefs={sorted(set(re.findall(r'href=\"(/[^\"]*(?:archive|/20\d\d/)[^\"]*)\"', ns)))[:10]}")
    w(f"  tags={tag_counts(ns)} imgs={len(img_info(ns))}")
    w(f"  buttons={len(re.findall(r'<button', ns))} details={len(re.findall(r'<details', ns))}")
    if d == "list-tags":
        for t in tagl:
            m = re.search(rf'href="/essays/tag/{re.escape(t)}/"[^>]*>(.*?)</a>', ns, re.S)
            inner = m.group(1) if m else ""
            nums = re.findall(r">\s*\(?(\d+)\)?\s*(?:篇)?\s*<", ">" + inner + "<")
            w(f"    tag {t}: numbers_in_anchor={nums}")
    if d == "list-essays":
        all_ids = set()
        for dd in ["list-essays", "list-tags", "list-tag-letters"]:
            all_ids |= set(re.findall(r'href="/essays/(\d{8})/"', no_script(pages[dd])))
        w(f"  union of essay ids across /essays/, /essays/tags/, /essays/tag/letters/ = {len(all_ids)}")
        w(f"  20260214 linked from /essays/: {'/essays/20260214/' in ess} ; 20260602: {'/essays/20260602/' in ess} ; 20260822: {'/essays/20260822/' in ess}")
    if d == "list-books":
        w(f"  book ids={books}")
        w(f"  img info sample={img_info(ns)[:3]}")
        exts = Counter(i['ext'] for i in img_info(ns)); lz = Counter(i['loading'] for i in img_info(ns))
        w(f"  img ext={dict(exts)} loading={dict(lz)} wh={Counter((i['width'], i['height']) for i in img_info(ns))}")

# ---------- 5. 响应头 ----------
w("\n## 5. 响应头关键字段 (最后一跳)")
KEYS = ["cache-control", "cf-cache-status", "age", "etag", "last-modified", "x-nextjs-cache", "x-nextjs-prerender", "x-nextjs-stale-time", "x-powered-by", "x-vercel-cache", "x-vercel-id", "server", "content-encoding", "link", "vary"]
for d in sorted(p for p in ROOT.iterdir() if p.is_dir()):
    h = (d / "headers.txt").read_text(errors="replace").replace("\r", "")
    blocks = [b for b in h.split("\n\n") if b.strip() and not b.startswith("HTTP/1.1 200 Connection established")]
    last = blocks[-1] if blocks else ""
    status = last.split("\n")[0]
    hd = {}
    for ln in last.split("\n")[1:]:
        if ":" in ln:
            k, v = ln.split(":", 1)
            hd[k.strip().lower()] = v.strip()
    w(f"  {d.name}: {status} | " + " | ".join(f"{k}={hd[k]}" for k in KEYS if k in hd) + f" | x-nextjs*/x-vercel* = {[k for k in hd if k.startswith(('x-nextjs', 'x-vercel', 'x-powered'))] or 'none'}")

# ---------- 两次请求是否同字节 ----------
w("\n## 附. 两次请求去掉 Cloudflare 注入后是否逐字节相同")
for d in ["list-essays", "list-tags", "list-tag-letters", "detail-20260214", "detail-20260602", "list-books", "detail-book-9787111509271"]:
    x = strip_cf((ROOT / d / "body.txt").read_text(encoding="utf-8"))
    y = strip_cf((ROOT / ("t2-" + d) / "body.txt").read_text(encoding="utf-8"))
    w(f"  {d}: identical_after_strip={x[0] == y[0]} (cf anchors {x[1]}/{y[1]}, cf scripts {x[2]}/{y[2]})")
x = strip_cf((ROOT / "smoke-detail" / "body.txt").read_text(encoding="utf-8"))
y = strip_cf((ROOT / "t2-detail-20260822" / "body.txt").read_text(encoding="utf-8"))
w(f"  20260822 (smoke 07:13Z vs t2): identical_after_strip={x[0] == y[0]} (cf anchors {x[1]}/{y[1]}, cf scripts {x[2]}/{y[2]})")


# ---------- 补充 ----------
w("\n## 补充 A. /essays/ 内嵌的全量索引 (RSC 里的客户端组件 props)")
_, dec_e = flight_parts(pages["list-essays"])
for r in re.findall(r'(?m)^([0-9a-f]+):I\[(\d+),\[([^\]]*)\],"([^"]*)"\]', dec_e):
    if r[3] not in ("default", "OutletBoundary", "ViewportBoundary", "MetadataBoundary", "IconMark"):
        w(f"  client ref row {r[0]} module {r[1]} export '{r[3]}' chunks {re.findall(r'chunks/([0-9a-f]+)\.js', r[2])}")
i = dec_e.find('"essaysByYear":')
if i >= 0:
    j = i + len('"essaysByYear":')
    obj, end = json.JSONDecoder().raw_decode(dec_e[j:])
    allp = [e for v in obj.values() for e in v]
    w(f"  essaysByYear @decoded_offset={i}: json_bytes={len(dec_e[j:j+end].encode())} years={len(obj)} entries={len(allp)} distinct_slugs={len(set(e['slug'] for e in allp))} entry_keys={sorted(set(k for e in allp for k in e))}")
    w(f"  per-year={ {k: len(v) for k, v in sorted(obj.items())} }")
    w(f"  next prop after essaysByYear: {re.findall(r'\"([A-Za-z]+)\":', dec_e[j+end:j+end+200])[:3]}")
ns_e = no_script(pages["list-essays"])
w(f"  HTML year buttons={len(re.findall(r'<button[^>]*>\s*(?:19|20)\d\d\s*</button>', ns_e))} ; date-slug links rendered in HTML={len(set(re.findall(r'href=\"/essays/(\d{8}(?:-\d+)?)/\"', ns_e)))}")
w(f"  /essays/ 页独有 JS: {sorted(set(sets['list-essays']) - set(sets['detail-20260214']))} (预算用尽，未下载)")

w("\n## 补充 B. 正文文本节点在 RSC 中出现次数 (>=10 字的文本节点)")
for d in ["detail-20260214", "detail-20260602", "smoke-detail"]:
    s0 = pages[d]
    _, dd = flight_parts(s0)
    a0 = s0.find('<div class="article-content"'); b0 = s0.find("</article>")
    nodes0 = [t for t in text_nodes(s0[a0:b0]) if len(t.strip()) >= 10]
    w(f"  {d}: nodes={len(nodes0)} occurrences_in_RSC={dict(Counter(dd.count(json.dumps(t, ensure_ascii=False)[1:-1]) for t in nodes0))}")

w("\n## 补充 C. 正文渲染器的类名/客户端组件名是否出现在客户端 JS")
for t in ["article-content", "1.0625rem", "leading-[1.9]", "essaysByYear", "EssaysClient"]:
    hits = {d.name: (d / "body.txt").read_bytes().count(t.encode()) for d in sorted(ROOT.iterdir()) if d.name.startswith("chunk-")}
    w(f"  '{t}': total_hits={sum(hits.values())}")

w("\n## 补充 D. 作品详情页")
sb = pages["detail-book-9787111509271"]; nsb = no_script(sb)
w(f"  literal '**' in visible HTML (no scripts)={nsb.count('**')} ; inside <p> context ; in JSON-LD=0 expected")
w(f"  <link rel=preload as=image> in HTML={len(re.findall(r'<link rel=\"preload\" as=\"image\"', sb))}")
for i2 in img_info(nsb):
    w(f"  img {i2}")
w(f"  data-nimg values (books index)={Counter(re.findall(r'data-nimg=\"([^\"]+)\"', pages['list-books']))}")


w("\n## 补充 E. JS 线上字节、与昨日存档比对、RSC 第 0 行标志")
wire = {r[2]: int(r[6]) for r in log}
ess_js = [d for d in wire if d.startswith("chunk-") and "3ef7ad" not in d]
w(f"  随笔详情 9 个 JS: wire(gzip)={sum(wire[d] for d in ess_js)} decoded={total_js} ; 其中 noModule a6dad97d9634a72d: wire={wire['chunk-08-a6dad97d9634a72d']} decoded={(ROOT/'chunk-08-a6dad97d9634a72d'/'body.txt').stat().st_size}")
OLD = ROOT.parent / "yang-stack-20261009-y1j458tw"
for d in sorted(p2 for p2 in ROOT.iterdir() if p2.name.startswith("chunk-")):
    h = d.name.split("-", 2)[2]
    match = "?"
    for od in OLD.iterdir():
        hp = od / "headers.txt"
        if hp.exists() and f"chunks/{h}.js" in hp.read_text(errors="replace"):
            match = f"{od.name} sha_equal={sha(od / 'body.txt') == sha(d / 'body.txt')}"
    w(f"  {d.name}: old_archive={match}")
for d in ["detail-20260214", "detail-20260602", "smoke-detail", "detail-book-9787111509271", "list-essays", "list-tags", "list-tag-letters", "list-books"]:
    _, dd = flight_parts(pages[d])
    m0 = re.search(r'(?m)^0:(\{.*)$', dd)
    r0 = m0.group(1) if m0 else ""
    w(f"  {d}: buildId={(re.search(r'\"b\":\"([^\"]+)\"', r0) or [None, '?'])[1]} row0_flags={re.findall(r'\"([sS])\":(true|false)', r0)}")
w("  注: 本地 src/site/node_modules/next (16.4.0) dist/server/app-render/app-render.js:393/1259/1360 写 S: ctx.renderCapabilities.supportsPerSegmentPrefetching；"
  "1883 行(动态渲染路径)取 renderOpts.cacheComponents，1894 行(预渲染路径)恒为 true。参照站 JS 内版本串为 16.0.10，二者语义是否一致未核实。")

OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"wrote {OUT} ({len(lines)} lines)")
