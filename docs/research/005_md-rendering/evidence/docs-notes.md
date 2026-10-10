# 一手资料核查笔记：Markdown 渲染取舍（查询日期 2026-10-10）

> 只录一手来源。原文短引 ≤25 字。"推论"一律标出。

## 1. Next 16 MDX 指南（v16.4.0，lastUpdated 2026-08-10）
URL: https://nextjs.org/docs/app/guides/mdx

- ✅ 支持 .md，但要手动开：「Handling `.md` files」小节——"By default, `@next/mdx` only compiles files with the `.mdx` extension"；示例 `extension: /\.(md|mdx)$/`。文档原句写的是 "To handle `.md` files with webpack"。
  - 源码佐证（GitHub vercel/next.js packages/next-mdx/index.js）：Turbopack 分支同样用 `condition: { path: extension }`，并设 `as: '*.tsx'`——MD/MDX 文件被当作 TSX 模块进打包器。
- ✅ 编译位置：打包器 loader。安装清单含 `@mdx-js/loader`；源码 webpack 规则 `use: [babel, loader]`，Turbopack 规则 `loaders: [loader]`。
- ✅ .md 不按 MDX 严格语法解析（推翻"MDX 语法更严会卡中文 .md"的预判）：
  - mdxjs.com/packages/mdx/「CompileOptions」："`format` option supports a `'detect'` value, which is the default"；"use `'md'` for files with an extension in `mdExtensions`"。
  - mdxjs.com/packages/loader/「Options」："Options are the same as CompileOptions"。
  - @next/mdx 的 mdx-js-loader.js 源码不覆盖 `format`。→ 推论：经 @next/mdx 的 .md 按普通 Markdown 编译。
  - 但 md 格式下原生 HTML 不会渲染成元素：官方文档未写；mdx-js 维护者 wooorm 在 https://github.com/orgs/mdx-js/discussions/2026 (2022-04-29) 答 "Should work w/ `rehype-raw` (w/ `passThrough`…)"。
- ✅ Turbopack 插件限制：「Using Plugins with Turbopack」——"specify plugin names using a string"；Good to know："plugins without serializable options cannot be used yet with Turbopack, because JavaScript functions can't be passed to Rust"。
- ✅ Front matter：「Frontmatter」——"`@next/mdx` does **not** support frontmatter by default"，列 remark-frontmatter / remark-mdx-frontmatter / gray-matter；建议用 `fs` 或 globby 读目录取元数据，"can only be used server-side"。
- ✅ 动态路由：「Using dynamic imports」——`await import(\`@/content/${slug}.mdx\`)` + `generateStaticParams` + `dynamicParams = false`（"will 404"）。
- ❌ 远程 MDX：v16.4 页面没有「Remote MDX」小节，也没点名 next-mdx-remote 等包；只有引言一句 "remote MDX files fetched dynamically on the server"。（已用 curl 全文检索确认 "Remote MDX"/"next-mdx-remote" 出现 0 次。）
- 部分：unified 直用。「Deep Dive: How do you transform markdown into HTML?」给出 remark-parse → remark-rehype → rehype-sanitize → rehype-stringify 示例，但定位是解释 @next/mdx 底层："you **do not** need to use `remark` or `rehype` directly"。→ 不是官方推荐路线，只是机制上可行（见 §2 Server Components 构建期运行）。
- 其他：`experimental.mdxRs` "not recommended for production"；Helpful Links 列 Markdoc。

## 2. 静态导出（v16.4.0，lastUpdated 2026-08-09）
URL: https://nextjs.org/docs/app/guides/static-exports

- ✅ 「Server Components」：构建时运行，产出 "static HTML for the initial page load and a static payload for client navigation"。
- ✅ 「Unsupported Features」：`dynamicParams: true` 的动态路由、无 `generateStaticParams()` 的动态路由、依赖 Request 的 Route Handler、Cookies、Rewrites、Redirects、Headers、Proxy、ISR、默认 loader 的图片优化、Draft Mode、Server Actions、Intercepting Routes。
- ✅ 支持：Server Components、Client Components（客户端取数）、自定义 loader 的 next/image、`force-static` 的 GET Route Handler、Browser APIs（Client Components 也在构建期预渲染成 HTML）。
- 部分：产出文件。「Deploying」只列 HTML（`/out/index.html`、`/out/404.html`、`/out/blog/post-1.html`）。trailingSlash 文档：`/about` → `/about/index.html`（https://nextjs.org/docs/app/api-reference/config/next-config-js/trailingSlash）。
  - ❌ 官方文档没有写 RSC 负载文件名（`.txt`）。CDN 指南「Direction: Pathname-Based Cache Keying」称 `output: 'export'` 已用"按路径扩展名区分响应类型"的方案，例 `/my/page.rsc`、`/my/page.segments/…segment.rsc`（https://nextjs.org/docs/app/guides/cdn-caching）。具体文件名以本机 `out/` 实测为准。
- ✅ 客户端导航取什么：Streaming 指南「The component payload」——"On client-side navigation, only the component payload is fetched … no HTML is transferred"（https://nextjs.org/docs/app/guides/streaming）。

## 3. `<Link>` 预取
- Link API（v16.4.0，lastUpdated 2026-08-25）https://nextjs.org/docs/app/api-reference/components/link 「prefetch」：
  - 进入视口时预取；"**Prefetching is only enabled in production**"；过期后 hover 时再预取。
  - `"auto"`/`null`（默认）：静态路由 "the full route will be prefetched (including all its data)"；动态路由预取到最近 `loading.js`。
  - `true`：静态动态都全量；`false`："never happen both on entering the viewport and on hover"。
  - Version history：v15.4.0 加 `auto` 别名。
- Prefetching 指南（v16.4.0，lastUpdated 2026-10-05）https://nextjs.org/docs/app/guides/prefetching
  - 「What Next.js prefetches automatically」：调度使"a page full of links doesn't flood the network"。
  - 「Prefetch scheduling」：视口内 → hover/touch → 新替旧 → "Links scrolled off-screen are discarded"。
  - 「Client cache」：静态页客户端缓存 TTL 5 min（staleTimes.static）。
  - 「Troubleshooting › Preventing too many prefetches」：大列表（"infinite scroll table"）建议 `prefetch={false}`，或 hover 才预取（官方 HoverPrefetchLink 示例）。
- Next.js 16 发布博文（2025-10-21）https://nextjs.org/blog/next-16 「Enhanced Routing and Navigation」：
  - Layout deduplication："50 product links now downloads the shared layout once"。
  - Incremental prefetching：只取缓存里没有的部分；离开视口取消；hover/再进视口优先。
  - Trade-off："more individual prefetch requests, but with much lower total transfer sizes"。
- 推论（长列表几百条）：不会一次发几百个；只对视口内链接排队发起，滚出即丢弃；但每条静态文章链接默认"全量预取"，即整篇正文负载，滚动越多下载越多。

## 4. 初始 HTML 内嵌 RSC 负载
- ✅ Server and Client Boundary（v16.4.0）「State and interactivity」Good to know："On the initial load, the RSC Payload ships with the HTML." https://nextjs.org/docs/app/guides/server-and-client-boundary
- ✅ Streaming 指南「The component payload」："On initial load, it arrives embedded in the HTML stream"；「The HTML stream」：inline `<script>` 携带负载；示例输出 `self.__next_f.push`。
- ✅ RSC 负载内容（https://nextjs.org/docs/app/getting-started/server-and-client-components 「On the server」）："The rendered result of Server Components"。
- 部分：官方没有直接写"正文在 HTML 和负载里各一份"。唯一明说重复的是 inlineCss："Styles are duplicated during initial page load"（https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss）。正文重复是由上两条推出的。

## 5. unified 链路（npm registry，2026-10-10 查询）
| 包 | latest | 发布日期 | 协议 |
|---|---|---|---|
| unified | 11.0.5 | 2024-06-19 | MIT |
| remark-parse | 11.0.0 | 2023-09-18 | MIT |
| remark-gfm | 4.0.1 | 2025-02-10 | MIT |
| remark-rehype | 11.1.2 | 2025-04-02 | MIT |
| rehype-stringify | 10.0.1 | 2024-09-27 | MIT |
| rehype-raw | 7.0.0 | 2023-08-26 | MIT |
| rehype-sanitize | 6.0.0 | 2023-08-26 | MIT |
| remark-frontmatter | 5.0.0 | 2023-09-18 | MIT |
| gray-matter | 4.0.3 | 2021-04-24 | MIT |
| @next/mdx | 16.4.0 | 2026-10-06 | MIT |
| @mdx-js/mdx / loader | 3.1.1 | 2025-08-29 | MIT |
均为 ESM（`type: module`），gray-matter 除外（CJS）。

- remark-rehype README（https://github.com/remarkjs/remark-rehype）「Options」`allowDangerousHtml`："whether to persist raw HTML in markdown in the hast tree"（默认 false）；「Security」：可致 XSS，"Use rehype-sanitize to make the tree safe"。
- rehype-raw README（https://github.com/rehypejs/rehype-raw）：把 raw HTML 过 HTML 解析器重建树；「When should I use this?」"If your final result is HTML and you trust content, then 'strings' are fine"（即 remark-rehype + rehype-stringify 都开 allowDangerousHtml，不必 rehype-raw）。
- rehype-sanitize README（https://github.com/rehypejs/rehype-sanitize）：默认按 github.com 规则；「Security」"Use `rehype-sanitize` after the last unsafe thing"；id/name 加 `user-content-` 前缀防 DOM clobbering（会影响标题锚点）。
- remark-frontmatter README：只识别不解析，"Doesn't parse the data inside them"；取数据用 vfile-matter（仅 YAML）。
- gray-matter README：返回 `data` / `content` / `excerpt`，默认解析 YAML（链接 js-yaml）。

## 6. MDX 与 Markdown 差异
URL: https://mdxjs.com/docs/what-is-mdx/ 「MDX syntax › Markdown」"Some markdown features don't work in MDX"：
- 缩进代码块不生效（变成段落）；
- 自动链接 `<https://…>` 不生效；
- HTML 语法被 JSX 取代（`<img>` 须写 `<img />`）；
- HTML 注释不行，用 `{/* … */}`；
- 未转义的 `<` 和 `{` 须写 `\<` `\{`。
- 同页：bundler 集成下"change between MDX and markdown through the file extension (`.mdx` vs. `.md`)"。
- 结论：只有当 .md 被当 MDX 编译（改名 .mdx，或强制 `format: 'mdx'`）时，中文正文里以下写法会报错：裸 `<`（如 "a<b"、"<3"、"<待定>"）、裸 `{`（如 JSON 片段、"{n}"）、`<!-- 注释 -->`、`<br>` 等未闭合 HTML、`<https://…>`；缩进代码会静默变段落。默认 detect 下的 .md 不受这些限制。

## 7. 浏览器端解析器体积（bundlephobia API，2026-10-10，min / min+gzip）
| 包@版本 | min | gzip |
|---|---|---|
| marked@18.1.0 | 45.3 KB | 13.6 KB |
| markdown-it@15.0.2 | 97.6 KB | 40.5 KB |
| micromark@4.0.3 | 53.4 KB | 15.2 KB |
| micromark-extension-gfm@3.0.0 | 23.1 KB | 7.1 KB |
| react-markdown@10.1.0 | 113.6 KB | 34.1 KB |
| remark-gfm@4.0.1 | 30.4 KB | 9.8 KB |
- micromark+gfm 合计约 22 KB gz；react-markdown+remark-gfm 合计约 44 KB gz（两者共享 micromark 依赖，实际打包会略小，未实测）。
- 来源：`https://bundlephobia.com/api/size?package=<名>@<版本>`。

## 8. 内容层库
- Contentlayer：README "Contentlayer is no longer maintained due to lack of funding"（https://github.com/contentlayerdev/contentlayer）。npm contentlayer 0.3.4（2023-06-29）；next-contentlayer peer `next: ^12 || ^13`。分叉 contentlayer2 0.5.8（2025-05-03）。
- Velite：npm 0.4.0（2026-06-17）。官方 Next 指南（https://velite.js.org/guide/with-nextjs）："the `VeliteWebpackPlugin` does not function correctly when Turbopack is enabled"，改为在 next.config 里启动（需 ESM / top-level await）。未写 Next 16 版本号。
- Content Collections：@content-collections/core 0.15.3（2026-09-21）、@content-collections/next 0.2.11（2026-02-14），peer `next: ^12 … || ^16`；CHANGELOG 0.2.9 "Add support for Next.js 16"，0.2.0 "Support for turbopack"（https://github.com/sdorra/content-collections/blob/main/packages/next/CHANGELOG.md）。官网文档页被 Vercel 安全检查/429 拦截，未读到。

## 9. 搜索引擎与 JS 渲染
- Google（https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics，更新 2026-03-04）「How Google processes JavaScript」：三阶段 Crawling / Rendering / Indexing；渲染队列 "may stay on this queue for a few seconds, but it can take longer"；"server-side or pre-rendering is still a great idea"，且并非所有 bot 都能跑 JS。
- Google 动态渲染页（https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering，更新 2025-12-10）："Dynamic rendering is a workaround and not a recommended solution"；推荐 SSR、静态渲染或 hydration。
- 百度（有官方表述，但都很旧，且没有量化当前 JS 渲染能力）：
  - 「移动搜索_良好收录 › 机器可读」（https://ziyuan.baidu.com/college/courseinfo?id=156&page=3，最新更新 2015-06-02）："当前Baiduspider只能读懂文本内容"；"不要在希望搜索引擎可读的地方使用Ajax技术"。
  - 「百度Spider新增渲染抓取UA公告」（https://ziyuan.baidu.com/wiki/990，2017-03-24）：渲染抓取需访问 CSS、Javascript、图片；UA `Baiduspider-render/2.0`；没有说明覆盖范围或支持程度。
  - ❌ 没有找到 2017 年之后百度说明 JS 渲染支持程度的官方文档。
