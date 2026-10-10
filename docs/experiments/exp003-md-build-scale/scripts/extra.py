"""补充统计：N=3000 全部文章 __PAGE__.txt / index.html 的 gzip 分布；各规模 JS 清单一致性。写 runs/extra.json"""
import gzip, json, os, statistics
EXP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def q(v, p):
    v = sorted(v); return v[min(len(v) - 1, int(p * len(v)))]
res = {}
out = os.path.join(EXP, "runs", "N3000", "out", "essays")
pg, hz, hraw = [], [], []
for d in os.listdir(out):
    if not (d.startswith("essay-") or d.startswith("fixed-")):
        continue
    p = os.path.join(out, d, "__next.essays.$d$slug.__PAGE__.txt")
    pg.append(len(gzip.compress(open(p, "rb").read(), 6, mtime=0)))
    h = open(os.path.join(out, d, "index.html"), "rb").read()
    hraw.append(len(h)); hz.append(len(gzip.compress(h, 6, mtime=0)))
res["N3000_articles"] = len(pg)
for name, v in (("page_segment_gzip6", pg), ("index_html_raw", hraw), ("index_html_gzip6", hz)):
    res[name] = {"mean": round(statistics.mean(v)), "p50": q(v, .5), "p90": q(v, .9), "max": max(v), "min": min(v)}
js = {}
for n in (100, 1000, 3000, 6000):
    m = json.load(open(os.path.join(EXP, "runs", "N%d" % n, "measure.json")))
    js[n] = (m["fixed"]["js_modern_srcs"], m["fixed"]["js_modern_plus_preload"], m["fixed"]["css"], m["fixed"]["html"]["raw"])
base = js[100]
res["js_identical_across_N"] = all(js[n][0] == base[0] and js[n][1] == base[1] for n in js)
res["css_identical_across_N"] = all(js[n][2] == base[2] for n in js)
res["fixed_html_raw_by_N"] = {n: js[n][3] for n in js}
json.dump(res, open(os.path.join(EXP, "runs", "extra.json"), "w"), indent=1)
print(json.dumps(res))
