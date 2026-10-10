# 两类来源 · 正文 MD：浏览器解析还是发布前编译

> 核查日期 2026-10-10。`resources/` 被 Git 忽略，只在本机，可重建；判断所需的关键数字已写进本目录的 `gap.md` 与 `decision.md`。统计、探测记录与文档短引原在 `_tmp/`，2026-10-10 负责人决定删除实验材料前移入本目录的 `evidence/`。

## 一、自有积累：可照搬，先确认权利与时效

| ID | 是什么 | 在哪 | 还算数吗 | 判据 |
|---|---|---|---|---|
| S1 | 旧博客 69 篇非草稿（posts 68 + briefing 1）的写法统计：只有计数，没有正文 | `evidence/own-scan.txt`（217 行；脚本 `scan_own.py`、`inspect_shape.py` 在同目录） | **算**：这就是将来要迁的那批 MD 的写法 | 抽查 4 项与独立 `grep` 一致：69 篇、12 篇有 `expirydate`、0 篇写 slug/url；公式行 `$$` 在代码外只有 1 篇（第 96 行），「4 篇用公式」口径偏宽，含疑似货币 `$`（第 101、141 行） |
| S2 | 旧 Hugo 的 markup 配置：goldmark `unsafe=true`、七项扩展、KaTeX、mermaid、`/:slug/` | `vault/raw/05blog/config.toml`，摘要见 S1 第 177–217 行 | **作为事实算，作为标准不算** | 证明旧站多年来一直是「发布前编译」，读者端不解析 MD；具体开关是旧实践，不自动成为新标准 |
| S3 | 本项目工程：Next 16.4.0 App Router、`output: 'export'`、`trailingSlash` | `../../../src/site/next.config.ts`、`package.json` | **算** | 当前技术正本见 `../002_blog-direction-decision.md:156` 起的修订节 |

## 二、他人积累：只读借鉴，先查协议

| ID | 是什么 | 在哪 | 协议 | 角色 | 读多深 | 还活着吗 |
|---|---|---|---|---|---|---|
| O1 | yangzhiping.com 现网：随笔目录、标签总页、1 个标签页、3 篇随笔详情、书目录与 1 本书详情、详情页引用的 10 个 JS | `../../../resources/md-render-yang-20261010/`（各响应各占一个子目录）；URL、字节、SHA-256、测量见 `evidence/probe-result.txt` | 未声明开源；**只读借鉴，不复制正文、代码与设计资产** | 要比的 | 逐条核查，共 25 次 GET 加 1 次冒烟 | 2026-10-10 07:17–07:19 UTC 全部 200；JS 的 SHA 与 `../004_yangzhiping-stack/sources.md` 所记昨日存档一致 |
| O2 | Next.js v16.4 官方文档：MDX 指南、静态导出、`<Link>` API、Prefetching 指南、Server/Client 边界 | 出处与短引见 `evidence/docs-notes.md` 第 1–4 节 | 文档 | 规则 | 逐条 | 各页 lastUpdated 为 2026-08 至 2026-10 |
| O3 | Next 官方示例 `examples/blog-starter`（canary 分支） | `../../../resources/md-render-docs-20261010/blog-starter-*/body.txt` | MIT（Next.js 仓库） | 要学的 | 只读架构 | `api.ts:16` 用 gray-matter 读 front matter；`markdownToHtml.ts:4` 用 remark + remark-html 在构建时编译；`[slug]/page.tsx:66` 用 generateStaticParams；`post-body.tsx:12` 用 dangerouslySetInnerHTML 插入 |
| O4 | `@mdx-js/mdx` 官方 readme | `../../../resources/md-render-docs-20261010/mdx-pkg-readme/body.txt:379-394` | MIT | 规则 | 一段 | `format` 默认 `'detect'`：`.md` 按普通 Markdown 编译，只有 `.mdx` 才走 MDX 语法 |
| O5 | unified 生态 npm 元数据：remark-gfm 4.0.1、remark-rehype 11.1.2、rehype-sanitize 6.0.0、gray-matter 4.0.3 | `docs-notes.md` 第 5 节 | 均为 MIT | 零件 | 一两行 | 最近发布 2021–2025；未安装、未实测 |
| O6 | bundlephobia：浏览器端解析器 min+gzip 体积 | `docs-notes.md` 第 7 节 | — | 零件 | 一行 | 第三方测量，2026-10-10 查询 |
| O7 | Google Search Central《JavaScript SEO 基础》；百度搜索资源平台 | `docs-notes.md` 第 9 节 | 文档 | 规则 | 一段 | Google 有渲染队列，建议预渲染；**百度没有官方文档说明它渲染 JS 到什么程度** |
| O8 | 内容层库：Contentlayer、Velite、Content Collections | `docs-notes.md` 第 8 节 | — | 零件 | 一行 | Contentlayer 官方写明不再维护；Velite 的 webpack 插件在 Turbopack 下失效；Content Collections 声称支持 Next 16，但官网被拦，未读到 |
| O9 | GitHub Pages 的响应压缩方式 | 2026-10-10 用 `curl -H 'Accept-Encoding: br, gzip'` 实测两个站点：`austinxt.github.io` 301 跳转到 `blog.nightvoyager.top`（`server: GitHub.com`），`pages.github.com`；两者都返回 `content-encoding: gzip`。只保留了响应头，没有存正文 | — | 规则 | 两次请求 | 只证明这两个站点当时的行为，不等于 GitHub 官方声明不支持 brotli；在前面加 CDN 代理后的行为未测 |

O2、O4–O8 由子代理检索。我回到一手源文件抽查了两条：O4 见 `mdx-pkg-readme/body.txt:379-394`；O2 的预取规则见 Next 仓库文档源文件，取在 `../../../resources/md-render-docs-20261010/next-link-doc/body.txt:298,302`（只在生产环境预取；静态路由默认预取整条路由及其数据）和 `next-prefetch-guide/body.txt:317-326`（大列表建议 `prefetch={false}`）。O3 由我直接取回。O5–O8 未抽查。

## 三、自己跑的（做法，不是来源）

本地规模实验：`../../experiments/exp003-md-build-scale/readme.md`。
