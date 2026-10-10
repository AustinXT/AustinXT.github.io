"""可选旁证：用 Python-Markdown 编译 N=3000 合成 Markdown（不是 remark/unified 实测）。
用法: python3 -I md_parse.py <md_dir> <N> <repeats>"""
import json, os, sys, time
import markdown
md_dir, n, reps = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
slugs = ["fixed-0001"] + ["essay-%05d" % i for i in range(1, n)]
texts = [open(os.path.join(md_dir, s + ".md"), encoding="utf-8").read() for s in slugs]
total_in = sum(len(t.encode("utf-8")) for t in texts)
runs = []
for _ in range(reps):
    conv = markdown.Markdown(extensions=["fenced_code"])
    t0 = time.perf_counter()
    out_bytes = 0
    for t in texts:
        out_bytes += len(conv.reset().convert(t).encode("utf-8"))
    runs.append(time.perf_counter() - t0)
fixed = markdown.Markdown(extensions=["fenced_code"])
t0 = time.perf_counter()
for _ in range(50):
    fixed.reset().convert(texts[0])
per_fixed_ms = (time.perf_counter() - t0) / 50 * 1000
print(json.dumps({"engine": "Python-Markdown " + markdown.__version__ + " + fenced_code", "N": n,
                  "md_input_bytes": total_in, "html_output_bytes": out_bytes,
                  "total_secs_runs": [round(r, 2) for r in runs],
                  "per_article_ms_avg": round(min(runs) / n * 1000, 2),
                  "fixed_0001_ms": round(per_fixed_ms, 2), "fixed_0001_md_bytes": len(texts[0].encode("utf-8"))}))
