"""测量一次规模构建的产物。用法: python3 -I measure.py <N>

读 runs/N<N>/out 与 run.json、build.log，写 runs/N<N>/measure.json。
"""
import gzip
import hashlib
import json
import os
import re
import subprocess
import sys

EXP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BROTLI = "/opt/homebrew/bin/brotli"
PUSH_RE = re.compile(r"<script>self\.__next_f\.push\((.*?)\)</script>", re.S)


def gz(b):
    return len(gzip.compress(b, compresslevel=6, mtime=0))


def br(b, q):
    r = subprocess.run([BROTLI, "-c", "-q", str(q)], input=b, capture_output=True, check=True)
    return len(r.stdout)


def sizes(b):
    return {"raw": len(b), "gzip6": gz(b), "br11": br(b, 11), "br5": br(b, 5)}


def next_escape(s):
    """模拟 Next 内联脚本的编码：JSON 字符串 + 转义 < > & U+2028/9。"""
    j = json.dumps(s, ensure_ascii=False)
    return (j.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
            .replace("\u2028", "\\u2028").replace("\u2029", "\\u2029"))


def flight_text(htmlb):
    parts = []
    for m in PUSH_RE.finditer(htmlb.decode("utf-8")):
        arr = json.loads(m.group(1))
        if len(arr) >= 2 and arr[0] == 1 and isinstance(arr[1], str):
            parts.append(arr[1])
    return "".join(parts)


def page_analysis(out, route, fragment_path=None):
    d = os.path.join(out, route.strip("/"))
    hp = os.path.join(d, "index.html")
    htmlb = open(hp, "rb").read()
    html_s = htmlb.decode("utf-8")
    scripts = [m.group(0) for m in PUSH_RE.finditer(html_s)]
    inline_bytes = sum(len(s.encode("utf-8")) for s in scripts)
    stripped = PUSH_RE.sub("", html_s).encode("utf-8")
    full_sz = sizes(htmlb)
    strip_sz = sizes(stripped)
    res = {
        "route": route,
        "sha256": hashlib.sha256(htmlb).hexdigest()[:16],
        "html": full_sz,
        "inline_rsc_script_count": len(scripts),
        "inline_rsc_bytes": inline_bytes,
        "inline_rsc_share_raw": round(inline_bytes / len(htmlb), 4),
        "html_without_inline_rsc": strip_sz,
        "inline_rsc_cost_pct_vs_stripped": {k: round(100 * (full_sz[k] - strip_sz[k]) / strip_sz[k], 1)
                                            for k in ("raw", "gzip6", "br11", "br5")},
        "a_tag_count": html_s.count("<a "),
    }
    # 页面引用的 JS / CSS
    srcs = re.findall(r'<script src="([^"]+)"([^>]*)>', html_s)
    modern = [s for s, attrs in srcs if "noModule" not in attrs]
    nomodule = [s for s, attrs in srcs if "noModule" in attrs]
    preload = re.findall(r'<link rel="preload" as="script"[^>]*href="([^"]+)"', html_s)
    css = re.findall(r'<link rel="stylesheet" href="([^"]+)"', html_s)

    def fsum(lst):
        raw = g = 0
        for s in lst:
            b = open(os.path.join(out, s.lstrip("/")), "rb").read()
            raw += len(b)
            g += gz(b)
        return {"raw": raw, "gzip6": g}

    all_js = sorted(set(modern) | set(preload))
    res["js_modern_srcs"] = sorted(set(modern))
    res["js_preload_only"] = sorted(set(preload) - set(modern))
    res["js_nomodule_srcs"] = nomodule
    res["js_modern_plus_preload"] = fsum(all_js)
    res["js_nomodule"] = fsum(nomodule)
    res["css"] = fsum(css)
    # 路由目录下的文件（预取负载）
    files = {}
    for name in sorted(os.listdir(d)):
        p = os.path.join(d, name)
        if os.path.isfile(p):
            b = open(p, "rb").read()
            files[name] = {"raw": len(b), "gzip6": gz(b), "br11": br(b, 11)}
    res["route_files"] = files
    tree = files.get("__next._tree.txt", {"raw": 0, "gzip6": 0, "br11": 0})
    pagefile = [v for k, v in files.items() if k.endswith("__PAGE__.txt")]
    if pagefile:
        res["prefetch_per_link_tree_plus_page"] = {k: tree[k] + pagefile[0][k] for k in ("raw", "gzip6", "br11")}
    # 正文重复分析
    if fragment_path:
        frag = open(fragment_path, encoding="utf-8").read()
        fragb = frag.encode("utf-8")
        ft = flight_text(htmlb)
        res["fragment"] = sizes(fragb)
        res["body_in_html_markup"] = frag.strip() in html_s
        res["body_in_inline_rsc_text"] = frag in ft
        res["body_in_index_txt"] = frag in open(os.path.join(d, "index.txt"), encoding="utf-8").read()
        pf = [k for k in files if k.endswith("__PAGE__.txt")]
        res["body_in_page_segment_txt"] = bool(pf) and frag in open(os.path.join(d, pf[0]), encoding="utf-8").read()
        res["inline_rsc_text_chars"] = len(ft)
        # 归因：把内嵌数据合成为单个 push（同一编码器），比较“含正文 / 去掉正文”两版
        strip_s = stripped.decode("utf-8")
        pos = strip_s.rfind("</body>")
        def with_flight(text):
            tag = "<script>self.__next_f.push([1,%s])</script>" % next_escape(text)
            return (strip_s[:pos] + tag + strip_s[pos:]).encode("utf-8")
        w = sizes(with_flight(ft))
        wo = sizes(with_flight(ft.replace(frag, "", 1)))
        res["attr_with_body_in_rsc"] = w
        res["attr_without_body_in_rsc"] = wo
        res["body_dup_repaid_pct_of_fragment_alone"] = {
            k: round(100 * (w[k] - wo[k]) / res["fragment"][k], 1) for k in ("raw", "gzip6", "br11", "br5")}
        res["body_dup_cost_pct_of_page"] = {
            k: round(100 * (w[k] - wo[k]) / wo[k], 1) for k in ("raw", "gzip6", "br11", "br5")}
    return res


def parse_log(path):
    s = open(path, encoding="utf-8", errors="replace").read()
    out = {}
    m = re.search(r"Compiled successfully in ([\d.]+)(m?s)", s)
    if m:
        out["compile_secs"] = float(m.group(1)) / (1000 if m.group(2) == "ms" else 1)
    m = re.search(r"Finished TypeScript in ([\d.]+)(m?s)", s)
    if m:
        out["typescript_secs"] = float(m.group(1)) / (1000 if m.group(2) == "ms" else 1)
    m = re.search(r"Generating static pages using (\d+) workers \((\d+)/(\d+)\) in ([\d.]+)(m?s)", s)
    if m:
        out["workers"] = int(m.group(1))
        out["static_pages"] = int(m.group(3))
        out["generate_secs"] = float(m.group(4)) / (1000 if m.group(5) == "ms" else 1)
    out["warnings"] = [l.strip() for l in s.splitlines() if re.search(r"warn|⚠|Error", l, re.I)][:20]
    return out


def main():
    n = int(sys.argv[1])
    run_dir = os.path.join(EXP, "runs", "N%d" % n)
    out = os.path.join(run_dir, "out")
    run = json.load(open(os.path.join(run_dir, "run.json")))
    content = os.path.join(EXP, "site", "content")
    total = count = 0
    cats = {}
    for root, _, fs in os.walk(out):
        for f in fs:
            sz = os.path.getsize(os.path.join(root, f))
            total += sz
            count += 1
            if root.startswith(os.path.join(out, "_next")):
                c = "_next/static"
            elif f.endswith("__PAGE__.txt"):
                c = "__PAGE__.txt"
            else:
                c = f if f in ("index.html", "index.txt", "__next._full.txt", "__next._tree.txt") else "other"
            cats.setdefault(c, [0, 0])
            cats[c][0] += 1
            cats[c][1] += sz
    rec = {
        "N": n,
        "build": run,
        "log": parse_log(os.path.join(run_dir, "build.log")),
        "out_total_bytes": total,
        "out_file_count": count,
        "out_by_kind": {k: {"files": v[0], "bytes": v[1]} for k, v in sorted(cats.items())},
        "fixed": page_analysis(out, "/essays/fixed-0001/", os.path.join(content, "fixed-0001.html")),
        "longest_first100": page_analysis(out, "/essays/%s/" % run["gen"]["longest"]["slug"],
                                          os.path.join(content, run["gen"]["longest"]["slug"] + ".html")),
        "all": page_analysis(out, "/essays/all/"),
        "page1": page_analysis(out, "/essays/page/1/"),
    }
    with open(os.path.join(run_dir, "measure.json"), "w") as f:
        json.dump(rec, f, ensure_ascii=False, indent=1)
    fx = rec["fixed"]
    print(json.dumps({"N": n, "out_MB": round(total / 1e6, 1), "files": count,
                      "fixed_html": fx["html"], "fixed_inline_share": fx["inline_rsc_share_raw"],
                      "dup_cost_vs_stripped": fx["inline_rsc_cost_pct_vs_stripped"],
                      "repaid": fx["body_dup_repaid_pct_of_fragment_alone"],
                      "body_in": [fx["body_in_html_markup"], fx["body_in_inline_rsc_text"], fx["body_in_page_segment_txt"]],
                      "js": fx["js_modern_plus_preload"], "all_html": rec["all"]["html"],
                      "page1_html": rec["page1"]["html"], "log": rec["log"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
