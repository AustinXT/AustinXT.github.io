"""汇总 runs/ 下各规模测量 → results.json + results.md。用法: python3 -I report.py"""
import json
import os

EXP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = os.path.join(EXP, "runs")
NS = [100, 1000, 3000, 6000]


def load(p):
    return json.load(open(os.path.join(R, p)))


M = {n: load("N%d/measure.json" % n) for n in NS}
contam = load("N100-contaminated-twscan/measure.json")
extra = load("extra.json")
lengths = load("extra_lengths_N3000.json")
mdp = load("md_parse_3000.json")
results = {"scales": {str(n): M[n] for n in NS}, "contaminated_N100_tailwind_scan": contam,
           "extra": extra, "lengths_N3000": lengths, "python_markdown_side_evidence": mdp,
           "env": {"next": "16.4.0", "node": "26.10.0", "cpu_cores": 10, "mem_GB": 16,
                   "load_avg_after_N6000": "57.69 36.73 20.19 (1/5/15 min, 采样于 15:27)"}}
json.dump(results, open(os.path.join(EXP, "results.json"), "w"), ensure_ascii=False, indent=1)

KB = lambda b: "%.1f" % (b / 1024)
MB = lambda b: "%.1f" % (b / 1e6)
L = []
w = L.append
w("# 实验：Next 16 静态导出 × 文章数规模（候选 A：构建时 HTML）\n")
w("> 原始数字见同目录 `results.json`；各规模产物在 `runs/N<N>/`（out、dotnext、build.log、time.txt、run.json、measure.json）。")
w("> 机器：10 核 / 16 GB，macOS 27.0.1，Node 26.10.0，Next 16.4.0（Turbopack），9 个静态生成 worker。")
w("> KB = 1024 字节；gzip 为 level 6；br11 / br5 为 `/opt/homebrew/bin/brotli -q 11 / -q 5`。合成正文为 Zipf 抽样的常用汉字词表，压缩率与真实文本会有偏差。\n")

w("## §1 构建（N × 指标）\n")
w("| N | 构建墙钟 s | 单进程最大 RSS MB | 进程树 RSS 峰值 MB（0.5 s 采样） | Turbopack 编译 s | TypeScript s | 静态生成 s | 导出复制 s | 静态页数 | out/ MB | out/ 文件数 |")
w("|---|---|---|---|---|---|---|---|---|---|---|")
tr = {}
for n in NS:
    m = M[n]
    b = m["build"]
    # trace 中的阶段（见 §7 说明），这里只取 build.log 可解析项
    w("| %d | %.2f | %.0f | %.0f | %.2f | %.2f | %.2f | %s | %d | %s | %d |" % (
        n, b["wall_secs_python"], b["time_maxrss_bytes_single_process"] / 1e6,
        b["sampled_tree_rss_peak_bytes"] / 1e6, m["log"]["compile_secs"], m["log"]["typescript_secs"],
        m["log"]["generate_secs"], {100: "0.10", 1000: "0.96", 3000: "2.64", 6000: "7.39"}[n],
        m["log"]["static_pages"], MB(m["out_total_bytes"]), m["out_file_count"]))
w("\n- 「导出复制 s」取自 `runs/N<N>/dotnext/trace` 的 `output-export-full-static-export` 段。")
w("- 增量斜率：100→1000 为 %.1f ms/篇，1000→3000 为 %.1f ms/篇，3000→6000 为 %.1f ms/篇。" % (
    (M[1000]["build"]["wall_secs_python"] - M[100]["build"]["wall_secs_python"]) / 900 * 1000,
    (M[3000]["build"]["wall_secs_python"] - M[1000]["build"]["wall_secs_python"]) / 2000 * 1000,
    (M[6000]["build"]["wall_secs_python"] - M[3000]["build"]["wall_secs_python"]) / 3000 * 1000))
w("- ⚠ N=6000 受外部负载污染：与 N 无关的阶段也一起变慢（Turbopack 编译 1.32→3.23 s，TypeScript 1.08→1.55 s）；构建结束约 1 分钟后测得负载均值 57.7 / 36.7 / 20.2（1/5/15 分钟，10 核机器），当时有其他项目的 Rust 测试进程（199% CPU）和 Spotlight 索引（mdworker）在跑。因此 N=6000 的超线性无法区分是 Next 本身还是外部负载。N≤3000 三次的 N 无关阶段稳定（编译 1.32–1.40 s，TypeScript 1.02–1.14 s），彼此可比；但 5 分钟负载均值 36.7 说明它们很可能也在负载下运行，绝对值应视为偏上限。")
w("- 单进程最大 RSS 来自 `/usr/bin/time -l`，是“最大的那一个进程”的峰值，不是总和；总和看进程树采样列。\n")

w("### §1b out/ 构成（N=3000）\n")
w("| 文件类别 | 文件数 | MB |")
w("|---|---|---|")
for k, v in M[3000]["out_by_kind"].items():
    w("| %s | %d | %s |" % (k, v["files"], MB(v["bytes"])))
w("\n- `index.txt` 与 `__next._full.txt` 逐字节相同（fixed-0001 已用 cmp 核对；两类总字节也相等），所以 out/ 里每篇正文共存 5 份：HTML 标记、HTML 内嵌 RSC、index.txt、_full.txt、__PAGE__.txt。\n")

w("## §2 fixed-0001 详情页（8236 字，片段 26301 B）\n")
w("| N | index.html 原始 B | gzip6 | br11 | br5 | 内嵌 RSC 脚本数 | 内嵌 RSC 原始占比 | 去内嵌后 gzip6 / br11 / br5 | 内嵌数据代价%（gzip6 / br11 / br5，相对去内嵌） | 正文在 HTML / 内嵌 RSC / 页面分段 |")
w("|---|---|---|---|---|---|---|---|---|---|")
for n in NS:
    f = M[n]["fixed"]
    s = f["html_without_inline_rsc"]
    c = f["inline_rsc_cost_pct_vs_stripped"]
    w("| %d | %d | %d | %d | %d | %d | %.1f%% | %d / %d / %d | +%.1f / +%.1f / +%.1f | %s / %s / %s |" % (
        n, f["html"]["raw"], f["html"]["gzip6"], f["html"]["br11"], f["html"]["br5"], f["inline_rsc_script_count"],
        100 * f["inline_rsc_share_raw"], s["gzip6"], s["br11"], s["br5"], c["gzip6"], c["br11"], c["br5"],
        f["body_in_html_markup"], f["body_in_inline_rsc_text"], f["body_in_page_segment_txt"]))
w("\n### §2b 只归因“正文那一份重复”（N=3000；把内嵌数据合成单个 push，比较含正文与去正文两版，模型与真实页面的 gzip 偏差 <3%）\n")
w("| 文章 | 片段原始 B | 片段 gzip6 | 页面 gzip6 | 重复再付比例 gzip6（占片段单独压缩） | 同 br11 | 同 br5 | 重复使整页 gzip6 增加 | 整页 br11 增加 |")
w("|---|---|---|---|---|---|---|---|---|")
rows = [("essay-00094（前 100 篇最短，1814 字）", lengths["essay-00094"]), ("essay-00088（前 100 篇中位，5331 字）", lengths["essay-00088"]),
        ("fixed-0001（8236 字）", M[3000]["fixed"]), ("essay-00030（17174 字，前 100 篇最长）", M[3000]["longest_first100"])]
for name, f in rows:
    r = f["body_dup_repaid_pct_of_fragment_alone"]
    c = f["body_dup_cost_pct_of_page"]
    w("| %s | %d | %d | %d | %.1f%% | %.1f%% | %.1f%% | +%.1f%% | +%.1f%% |" % (
        name, f["fragment"]["raw"], f["fragment"]["gzip6"], f["html"]["gzip6"], r["gzip6"], r["br11"], r["br5"], c["gzip6"], c["br11"]))
w("\n- 原始字节：内嵌那份是 JSON 转义后的副本（`<` → `\\u003c` 等），为片段的 106–109%。")
w("- 与 gzip 32 KB 滑动窗口的机制一致：片段 ≤17 KB 时第二份几乎被去重（再付 8–14%）；片段 26 KB 时再付 76%；55 KB 时 98%。brotli（4 MB 窗口）各长度都只再付 6–10%。\n")

w("## §3 详情页引用的 JS / CSS（跨规模）\n")
f3 = M[3000]["fixed"]
w("| N | 现代 JS 文件数 | JS 原始 B | JS gzip6 B | noModule polyfill 原始 / gzip6 | CSS 原始 / gzip6 | 清单与 N=100 相同 |")
w("|---|---|---|---|---|---|---|")
for n in NS:
    f = M[n]["fixed"]
    w("| %d | %d | %d | %d | %d / %d | %d / %d | %s |" % (
        n, len(f["js_modern_srcs"]), f["js_modern_plus_preload"]["raw"], f["js_modern_plus_preload"]["gzip6"],
        f["js_nomodule"]["raw"], f["js_nomodule"]["gzip6"], f["css"]["raw"], f["css"]["gzip6"],
        f["js_modern_srcs"] == M[100]["fixed"]["js_modern_srcs"]))
w("\n- JS 清单（N=3000）：" + "、".join("`%s`" % s.rsplit("/", 1)[-1] for s in f3["js_modern_srcs"]) + "。")
w("- fixed-0001 index.html 在四个规模下都是 %d B（sha 不同只因 buildId 不同）。" % M[100]["fixed"]["html"]["raw"])
w("- N=3000 全部 3000 篇的 index.html：原始均值 %s KB（p50 %s / p90 %s / 最大 %s KB），gzip6 均值 %s KB（p90 %s KB）。\n" % (
    KB(extra["index_html_raw"]["mean"]), KB(extra["index_html_raw"]["p50"]), KB(extra["index_html_raw"]["p90"]),
    KB(extra["index_html_raw"]["max"]), KB(extra["index_html_gzip6"]["mean"]), KB(extra["index_html_gzip6"]["p90"])))

w("## §4 路由目录下的导出文件（<Link> 预取会取的负载）\n")
for key, label in (("fixed", "/essays/fixed-0001/"), ("all", "/essays/all/"), ("page1", "/essays/page/1/")):
    w("**%s**\n" % label)
    w("| 文件 | " + " | ".join("N=%d 原始 / gzip6" % n for n in NS) + " |")
    w("|---|" + "---|" * len(NS))
    for name in M[100][key]["route_files"]:
        cells = []
        for n in NS:
            v = M[n][key]["route_files"].get(name)
            cells.append("%d / %d" % (v["raw"], v["gzip6"]) if v else "—")
        w("| `%s` | %s |" % (name, " | ".join(cells)))
    w("")
w("- 预取协议（读源码 `node_modules/next/dist/client/components/segment-cache/cache.js` 第 1139–1206 与 2521–2527 行）：导出模式下每个被预取的链接先 HEAD 请求目标页，再 GET `<route>/__next._tree.txt`，然后按分段 GET `__next.<segment>.txt`。fixed-0001 为 `_tree`（%d B gzip）+ `__PAGE__`（%d B gzip）。" % (
    M[3000]["fixed"]["route_files"]["__next._tree.txt"]["gzip6"], M[3000]["fixed"]["route_files"]["__next.essays.$d$slug.__PAGE__.txt"]["gzip6"]))
w("- N=3000 全部文章的 `__PAGE__.txt` gzip6：均值 %s KB，p50 %s，p90 %s，最大 %s KB。**浏览器里实际触发几次预取未实测**（未启动浏览器）；“一屏 K 条链接 × 均值”只是推算，不是实测。\n" % (
    KB(extra["page_segment_gzip6"]["mean"]), KB(extra["page_segment_gzip6"]["p50"]), KB(extra["page_segment_gzip6"]["p90"]), KB(extra["page_segment_gzip6"]["max"])))

w("## §5 全量列表 /essays/all/ 与分页 /essays/page/1/（每页 20 篇）\n")
w("| N | all 原始 B | all gzip6 | all br11 | all br5 | all 内嵌 RSC 占比 | all `<a>` 数 | page/1 原始 | page/1 gzip6 | page/1 br11 | page/1 br5 | page/1 内嵌占比 |")
w("|---|---|---|---|---|---|---|---|---|---|---|---|")
for n in NS:
    a, p = M[n]["all"], M[n]["page1"]
    w("| %d | %d | %d | %d | %d | %.1f%% | %d | %d | %d | %d | %d | %.1f%% |" % (
        n, a["html"]["raw"], a["html"]["gzip6"], a["html"]["br11"], a["html"]["br5"], 100 * a["inline_rsc_share_raw"], a["a_tag_count"],
        p["html"]["raw"], p["html"]["gzip6"], p["html"]["br11"], p["html"]["br5"], 100 * p["inline_rsc_share_raw"]))
a1, a6 = M[1000]["all"]["html"], M[6000]["all"]["html"]
w("\n- 全量列表的边际成本（1000→6000）：原始 %.0f B/篇，gzip6 %.1f B/篇，br11 %.1f B/篇；N=3000 时 gzip6 %s KB，br11 %s KB。" % (
    (a6["raw"] - a1["raw"]) / 5000, (a6["gzip6"] - a1["gzip6"]) / 5000, (a6["br11"] - a1["br11"]) / 5000,
    KB(M[3000]["all"]["html"]["gzip6"]), KB(M[3000]["all"]["html"]["br11"])))
w("- 全量列表的 `__PAGE__.txt`（被预取时取的那份）在 N=3000 为 %s KB gzip6。\n" % KB(M[3000]["all"]["route_files"]["__next.essays.all.__PAGE__.txt"]["gzip6"]))

w("## §6 可选旁证：Python-Markdown 解析 3000 篇（不是 remark/unified 实测）\n")
w("| 引擎 | 篇数 | MD 输入 MB | HTML 输出 MB | 两轮总耗时 s | 平均 ms/篇 | fixed-0001 ms |")
w("|---|---|---|---|---|---|---|")
w("| %s | %d | %s | %s | %s | %.2f | %.2f |" % (mdp["engine"], mdp["N"], MB(mdp["md_input_bytes"]), MB(mdp["html_output_bytes"]),
                                           " / ".join(str(x) for x in mdp["total_secs_runs"]), mdp["per_article_ms_avg"], mdp["fixed_0001_ms"]))
w("\n- 单线程，在 §1 所述高负载期间测得。它只说明“纯解析大约毫秒级/篇”的数量级；remark/rehype（JS）、代码高亮（Shiki）、数学公式等插件都未测。\n")

w("## §7 失败、偏差与改动（原样记录）\n")
c = contam
w("1. **第 1 次构建（N=100）被 Tailwind 扫描污染，已作废并保留在 `runs/N100-contaminated-twscan/`。** 克隆位于父仓库忽略的 `_tmp/` 下，Tailwind v4 自动源检测因此扫了 26017 个文件（node_modules 25888、content/ 101），原工程只扫 21 个（`scripts/tw_scan.cjs` 实测）。后果：CSS %d B（修正后 %d B），编译 %.1f s（修正后 %.1f s），墙钟 %.2f s（修正后 %.2f s）。" % (
    c["fixed"]["css"]["raw"], M[100]["fixed"]["css"]["raw"], c["log"]["compile_secs"], M[100]["log"]["compile_secs"],
    c["build"]["wall_secs_python"], M[100]["build"]["wall_secs_python"]))
w("2. 先在克隆根目录放了一份 `.gitignore`，**没有生效**（扫描数不变），随后删除。")
w("3. 最终改法：只改克隆里的 `app/globals.css`，把 `@import \"tailwindcss\";` 换成 `source(none)` 并逐条列出 `@source`（app/ components/ lib/ 和根目录配置文件），复核扫描集合为 24 个文件（`scripts/tw_scan_explicit.cjs`）。这相当于假设真实工程的正文放在 `src/site` 之外。")
w("4. 共构建 5 次：N=100（作废）、100、1000、3000、6000。无构建报错，无超时，日志里没有 warning。")
w("5. N=6000 计时受外部负载污染（见 §1）。构建额度已用完，没有复跑。")
w("6. 未测：真实浏览器的预取次数与流量、hydration/INP/LCP、代码高亮等真实 MD 插件管线、增量构建（Turbopack 构建缓存）。\n")
w("## §8 克隆中新增或修改的文件\n")
w("- 新增：`site/lib/exp-content.ts`、`site/app/essays/[slug]/page.tsx`、`site/app/essays/all/page.tsx`、`site/app/essays/page/[n]/page.tsx`、`site/content/`（6000 篇 HTML + `_meta.json`；在 N=6000 后保留）、`site/content-md/`（6000 篇 MD）。")
w("- 修改：`site/app/globals.css`（仅前几行，见 §7-3）。`src/site/` 原件未改动。")
w("- 脚本：`scripts/gen.py`、`run_build.py`、`measure.py`、`extra.py`、`md_parse.py`、`report.py`、`tw_scan*.cjs`。")
open(os.path.join(EXP, "results.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
print("ok", len(L))
