"""合成文章生成器（确定性）。

用法: python3 -I gen.py <N> <site_dir> [--md <md_dir>]
- 在 <site_dir>/content/ 写 <slug>.html（已编译 HTML 片段）与 _meta.json。
- 共 N 篇：fixed-0001（约 8000 字，跨规模完全相同）+ essay-00001..essay-(N-1)。
- 每篇用以 slug 为种子的独立 RNG，所以小规模集合是大规模集合的前缀子集。
- --md 时同时输出同结构的 Markdown 到 <md_dir>（供可选的解析成本旁证）。
"""
import html
import json
import os
import random
import sys

# 常用汉字池（按大致常用度排序，用 Zipf 权重抽样构造“词表”）
CHARS = (
    "的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经"
    "十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相"
    "全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果"
    "料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则"
    "任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带"
    "安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装"
    "影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选"
    "标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严首底液官德随病苏失尔死讲配"
    "女黄推显谈罪神艺呢席含企望密批营项防举球英氧势告李台落木帮轮破亚师围注远字材排供河态封另施减树溶怎止案言士均武固叶鱼波视仅费紧爱"
    "左章早朝害续轻服试食充兵源判护司足某练差致板田降黑犯负击范继兴似余坚曲输修故城夫够送笔船占右财吃富春职觉汉画功巴跟虽杂飞检吸助升"
)
PUNCT_MID = "，，，，，，、、；："
PUNCT_END = "。。。。。。。？！"


def zipf_cum(n, s=1.05, offset=2.0):
    total = 0.0
    out = []
    for k in range(n):
        total += 1.0 / ((k + offset) ** s)
        out.append(total)
    return out


CHAR_CUM = zipf_cum(len(CHARS), s=0.9, offset=8.0)

# 共享“语言”：固定种子的 4000 词词表（1~4 字），Zipf 分布抽词，模拟真实文本的重复结构
_lang = random.Random("manzi-lang-v1")
VOCAB = []
for _ in range(4000):
    ln = _lang.choices([1, 2, 3, 4], weights=[25, 55, 15, 5])[0]
    VOCAB.append("".join(_lang.choices(CHARS, cum_weights=CHAR_CUM, k=ln)))
VOCAB_CUM = zipf_cum(len(VOCAB), s=1.0, offset=3.0)

CODE_TOKENS = ["const", "let", "return", "if", "for", "await", "import", "from", "export",
               "function", "data", "item", "list", "slug", "page", "render", "map", "filter",
               "=", "=>", "(", ")", "{", "}", "[", "]", ";", ".", "<", ">", "&&", "+", "1", "0", "'md'"]


class Writer:
    def __init__(self, rng):
        self.rng = rng
        self.count = 0  # 已产出的正文字符数（汉字 + 中文标点）

    def clause(self, lo=4, hi=12):
        words = self.rng.choices(VOCAB, cum_weights=VOCAB_CUM, k=self.rng.randint(lo, hi))
        return "".join(words)

    def sentence(self):
        parts = [self.clause() for _ in range(self.rng.randint(1, 4))]
        s = "".join(p + self.rng.choice(PUNCT_MID) for p in parts[:-1]) + parts[-1] + self.rng.choice(PUNCT_END)
        if self.rng.random() < 0.08:
            s = "“" + s + "”"
        elif self.rng.random() < 0.04:
            s = "《" + self.clause(1, 3) + "》" + s
        return s

    def text(self, target):
        """返回 [(kind, str)] 片段序列：kind ∈ {'t','a'}，用于同时渲染 HTML 与 Markdown。"""
        segs = []
        n = 0
        while n < target:
            s = self.sentence()
            if self.rng.random() < 0.06:
                anchor = self.clause(1, 3)
                href = "https://example.com/r/%d" % self.rng.randint(1, 99999)
                segs.append(("a", anchor, href))
                n += len(anchor)
            segs.append(("t", s))
            n += len(s)
        self.count += n
        return segs


def segs_html(segs):
    out = []
    for seg in segs:
        if seg[0] == "t":
            out.append(html.escape(seg[1], quote=False))
        else:
            out.append('<a href="%s">%s</a>' % (seg[2], html.escape(seg[1], quote=False)))
    return "".join(out)


def segs_md(segs):
    out = []
    for seg in segs:
        if seg[0] == "t":
            out.append(seg[1])
        else:
            out.append("[%s](%s)" % (seg[1], seg[2]))
    return "".join(out)


def code_block(rng):
    lines = []
    for _ in range(rng.randint(3, 12)):
        lines.append("  " * rng.randint(0, 3) + " ".join(rng.choices(CODE_TOKENS, k=rng.randint(3, 10))))
    return "\n".join(lines)


def build_article(slug, target_chars):
    rng = random.Random("article:" + slug)
    w = Writer(rng)
    blocks = []  # (type, payload)
    title = w.clause(2, 5)
    w.count = 0
    for _ in range(rng.randint(1, 2)):
        blocks.append(("p", w.text(rng.randint(60, 220))))
    sec = 0
    while w.count < target_chars:
        sec += 1
        blocks.append(("h2", w.clause(2, 5), "s%d" % sec))
        for _ in range(rng.randint(2, 6)):
            if w.count >= target_chars:
                break
            r = rng.random()
            if r < 0.10:
                blocks.append(("blockquote", w.text(rng.randint(40, 160))))
            elif r < 0.20:
                blocks.append(("ul", [w.text(rng.randint(10, 60)) for _ in range(rng.randint(3, 6))]))
            elif r < 0.24:
                blocks.append(("pre", code_block(rng)))
            elif r < 0.32:
                blocks.append(("h3", w.clause(2, 4)))
            else:
                blocks.append(("p", w.text(rng.randint(60, 280))))
    return title, blocks, w.count


def render_html(blocks):
    out = []
    for b in blocks:
        t = b[0]
        if t == "p":
            out.append("<p>%s</p>" % segs_html(b[1]))
        elif t == "h2":
            out.append('<h2 id="%s">%s</h2>' % (b[2], html.escape(b[1], quote=False)))
        elif t == "h3":
            out.append("<h3>%s</h3>" % html.escape(b[1], quote=False))
        elif t == "blockquote":
            out.append("<blockquote><p>%s</p></blockquote>" % segs_html(b[1]))
        elif t == "ul":
            out.append("<ul>%s</ul>" % "".join("<li>%s</li>" % segs_html(li) for li in b[1]))
        elif t == "pre":
            out.append("<pre><code>%s</code></pre>" % html.escape(b[1], quote=False))
    return "\n".join(out) + "\n"


def render_md(title, blocks):
    out = ["# " + title, ""]
    for b in blocks:
        t = b[0]
        if t == "p":
            out += [segs_md(b[1]), ""]
        elif t == "h2":
            out += ["## " + b[1], ""]
        elif t == "h3":
            out += ["### " + b[1], ""]
        elif t == "blockquote":
            out += ["> " + segs_md(b[1]), ""]
        elif t == "ul":
            out += ["- " + segs_md(li) for li in b[1]] + [""]
        elif t == "pre":
            out += ["```js", b[1], "```", ""]
    return "\n".join(out)


def target_for(slug):
    rng = random.Random("len:" + slug)
    r = rng.random()
    base = 2000 if r < 0.30 else (5000 if r < 0.80 else 15000)
    return int(base * rng.uniform(0.85, 1.15)), base


def date_for(slug):
    rng = random.Random("date:" + slug)
    y = rng.randint(2010, 2026)
    m = rng.randint(1, 12)
    d = rng.randint(1, 28)
    return "%04d-%02d-%02d" % (y, m, d)


def main():
    n = int(sys.argv[1])
    site = sys.argv[2]
    md_dir = None
    if "--md" in sys.argv:
        md_dir = sys.argv[sys.argv.index("--md") + 1]
        os.makedirs(md_dir, exist_ok=True)
    content = os.path.join(site, "content")
    os.makedirs(content, exist_ok=True)
    slugs = [("fixed-0001", 8000, 8000, "2020-06-15")]
    for i in range(1, n):
        s = "essay-%05d" % i
        t, base = target_for(s)
        slugs.append((s, t, base, date_for(s)))
    meta = []
    stats = {"2000": 0, "5000": 0, "15000": 0, "fixed": 1}
    total_chars = 0
    total_bytes = 0
    for slug, target, base, date in slugs:
        title, blocks, chars = build_article(slug, target)
        frag = render_html(blocks)
        with open(os.path.join(content, slug + ".html"), "w", encoding="utf-8") as f:
            f.write(frag)
        if md_dir:
            with open(os.path.join(md_dir, slug + ".md"), "w", encoding="utf-8") as f:
                f.write(render_md(title, blocks))
        meta.append({"slug": slug, "title": title, "date": date, "chars": chars})
        if slug != "fixed-0001":
            stats[str(base)] += 1
        total_chars += chars
        total_bytes += len(frag.encode("utf-8"))
    meta.sort(key=lambda m: (m["date"], m["slug"]), reverse=True)
    with open(os.path.join(content, "_meta.json"), "w", encoding="utf-8") as f:
        json.dump([{k: m[k] for k in ("slug", "title", "date")} for m in meta], f, ensure_ascii=False)
    fixed = next(m for m in meta if m["slug"] == "fixed-0001")
    longest = max((m for m in meta if m["slug"] < "essay-00100"), key=lambda m: m["chars"])
    summary = {"N": n, "length_buckets": stats, "total_chars": total_chars,
               "total_fragment_bytes": total_bytes, "fixed_chars": fixed["chars"],
               "longest": {"slug": longest["slug"], "chars": longest["chars"]}}
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
