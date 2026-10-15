# 来源登记 · 新站静态产物放在哪里托管

> 核查日期 2026-10-10。路径中的 `R/` 指 `../../../resources/hosting-20261010/`（被 Git 忽略，只在本机，可重建）。
> 文档原件用 curl 取回，行号对应本地文件。所有实测的出口都在美国西部（M0），**不代表中国大陆**。

## 一、自有积累

| ID | 是什么 | 在哪 | 日期 | 还算数吗 |
|---|---|---|---|---|
| S1 | brotli 必要的拍板与依据；GitHub Pages 只回 gzip | `../005_md-rendering/decision.md` 拍板第 6 项；`../005_md-rendering/sources.md` O9 | 2026-10-10 | **算**，本题前提 |
| S2 | 本工程产物形态：`output: 'export'`、`trailingSlash: true`；每页 `index.html` + `index.txt` + 3 个 `__next.*.txt`；文件名里有 `$`（如 `__next.essays.$d$slug.__PAGE__.txt`） | `../../../src/site/next.config.ts`；`../../../src/site/out/essays/pipeline-sample/` | 2026-10-10 | **算**，部署前要确认各平台对 `$` 文件名无异常（未测） |
| S3 | 现网与 DNS：`nightvoyager.top` 的 NS 是 `dns1/dns2.hichina.com`（阿里云解析）；`blog.nightvoyager.top` CNAME 到 `austinxt.github.io`；旧文网址是百分号编码的中文 slug，如 `/%E5%AF%86%E7%A0%81%E5%AD%A6%E5%85%A5%E9%97%A8/` | `dig +short NS nightvoyager.top`；`dig +short CNAME blog.nightvoyager.top`；首页链接取自 `R/_bodies/blog.nightvoyager.top.html` | 2026-10-10 | **算**。说明换 DNS 托管商不是切换的必要前提，看平台 |
| S4 | 受众地域、预算、ICP 意愿都未提供 | `../../../.42cog/real.md:28` | 2026-10-10 | **算**：这是拍板项，不是调研能填的 |

## 二、官方文档

| ID | 是什么 | 在哪（原件:行号） | 关键原文（≤2 句） | 还算数吗 |
|---|---|---|---|---|
| D1 | Cloudflare 内容压缩：源站已压缩时怎么办 | https://developers.cloudflare.com/speed/optimization/content/compression/ ；`R/docs/cloudflare/speed_optimization_content_compression.mdx:136-147,160`；同页 Markdown 版 `…compression.index.md:144-158` | :136 "we will keep the same compression in the response sent to the website visitor if:" 条件之一是没开改写正文的功能（:140）。index.md:148 开了 Automatic HTTPS Rewrites、Email Address Obfuscation、Rocket Loader 等，"Cloudflare will need to decompress the response and compress it again" | **算**。免费档默认 zstd（:160）与「zstd 需在压缩规则里开」（:31）两处自相矛盾 |
| D2 | Cloudflare 缓存：默认不缓存 HTML；Cache Rules | `R/docs/cloudflare/cache_concepts_default-cache-behavior.md:51`；`cache_how-to_cache-rules.md:43`；`cache_how-to_edge-browser-cache-ttl.md:24` | "does not cache HTML or JSON by default"；免费档 Cache Rules 10 条 | 算 |
| D3 | Cloudflare 重定向 | `R/docs/cloudflare/rules_url-forwarding.md:47-62`；`rules_url-forwarding_single-redirects_settings.md:27` | 免费档 Single Redirects 10 条（支持通配，不支持正则）；Bulk Redirects 共 10,000 个网址；默认 301 | 算 |
| D4 | Cloudflare 接入方式 | `R/docs/cloudflare/dns_zone-setups.md:70`；`dns_zone-setups_partial-setup.md:23` | "If you are on a Free or Pro plan, primary setup (full) is the only one available"；CNAME 接入要 Business 及以上 | 算 |
| D5 | Cloudflare 中国网络 | `R/docs/cloudflare/china-network.md:17,50,57` | 中国网络只对 Enterprise 单独订阅，且要 ICP；境外网络服务大陆访客 "faces significant latency and reliability issues" | 算 |
| D6 | GitHub Pages 上限与能力 | https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits ；`R/docs/github-pages/github-pages-limits.md:17-23`；`creating-a-custom-404-page…md:15`；`jekyll-redirect-from_README.md:16`；`securing-your-github-pages-site-with-https.md:64` | 站点 ≤1 GB，部署超时 10 分钟，带宽软上限 100 GB/月；自定义 Actions 发布不受每小时 10 次构建限制。重定向插件只是 "an HTTP-REFRESH meta tag" | 算。文件数上限、自定义缓存头：未查到 |
| D7 | Cloudflare Pages | `R/docs/cloudflare/pages.md:19`；`pages_platform_limits.md:30-32,44-50,74`；`pages_configuration_serving-pages.md:21,25,29,55,89`；`pages_configuration_redirects.md:77-80`；`pages_configuration_headers.md:67`；`pages_configuration_custom-domains.md:32,40,48`；`pages_functions_pricing.md:31` | pages.md:19 "Start new projects with Workers." serving-pages.md:55 "Pages will also serve Gzip and Brotli responses whenever possible." 免费 20,000 个文件、单文件 25 MiB、每月 500 次构建；`_redirects` 2,000 条静态 + 100 条动态；`_headers` 100 条；子域名可在外部 DNS 用 CNAME，裸域名要迁 NS；静态请求免费且不限量 | **算**。Pages 已不是官方主推 |
| D8 | Cloudflare Workers 静态资源 | `R/docs/cloudflare/workers_platform_limits.md:378-379`；`workers_static-assets_routing_advanced_html-handling.md:63,67`；`workers_configuration_routing_custom-domains.md:35`；`workers_static-assets_billing-and-limitations.md:21`；`workers_static-assets_redirects.md:49` | 文件数同 Pages；默认 `/folder` 与 `/folder/index.html` 都 307 到 `/folder/`；自定义域名要 "An active Cloudflare zone"（即迁 NS）；静态请求免费 | 算。压缩方式：文档未写 |
| D9 | Netlify | `R/docs/netlify/blog_2020-05-20_brotli.txt:103,125`；`manage_routing_redirects_redirect-options.md:14,73,130-204,265-267`；`deploy_deploy-overview.md:32`；`manage_routing_redirects_overview.md:17-19`；`manage_routing_headers.md:96`；`build_caching_caching-overview.md:14,297`；`manage_domains_configure-domains_configure-external-dns.md:34,59,71`；`…credit-based-pricing-plans.md:12,55,109-120`；`…how-credits-work.md:31` | 2020 年官方博客：资源 "are now automatically compressed with Brotli encoding"（现行文档无规格）。每次部署文件数不限，单目录 ≤54,000；`_redirects` 默认 301、无条数上限。Free 每月 300 credits：每次正式部署 15、每 GB 流量 20、每万次请求 2；用完 "all of your web projects … are paused" | 算。大陆：只有论坛非员工回复，按未查到 |
| D10 | Vercel | `R/docs/vercel/how-vercel-cdn-works_compression.md:18,43`；`project-configuration_vercel-json.md:134,673,684,1704-1745`；`limits.md:59,63-65,149,151`；`routing_redirects_configuration-redirects.md:146`；`routing_redirects_bulk-redirects.md:83`；`domains_working-with-domains_add-a-domain.md:112-113`；`kb_accessing-vercel-hosted-sites-from-mainland-china.md:17-19`；`limits_fair-use-guidelines.md:95`；`plans_hobby.md:50,52,68` | "supporting both Gzip and Brotli compression"。CLI 上传源文件 ≤15,000 个；平台构建产出不限。重定向 ≤2,048 条，Bulk Redirects 不对 Hobby 开放。"Vercel has no servers or CDN nodes in mainland China"。Hobby "restricted to non-commercial personal use only" | 算 |
| D11 | 腾讯云 EdgeOne Pages（页面现名 EdgeOne Makers） | https://pages.edgeone.ai/zh/document/limits-and-quotas ；`R/docs/edgeone/limits-and-quotas.txt:292-318`；`eo-smart-compression.txt:40,117-125`；`edgeone-json.txt:282,315,353`；`custom-404-page.txt:219`；`configuring-cache.txt:220-224`；`domain-overview.txt:226-251`；`custom-domain.txt:224`；`pricing-page.txt:70`；`pricing-and-plans.txt:216-217` | 免费版单项目 20,000 个文件、单文件 25 MB、每月 500 次构建。「EdgeOne 默认全局开启 Gzip 或 Brotli 压缩」。redirect 上限 100 条、header 30 条，支持 `*`/`:splat`、301。大陆网络下默认域名「须使用系统生成的预览链接进行访问，该链接有效期为 3 小时」；大陆或全球（含大陆）可用区要工信部备案，「全球可用区（不含中国大陆）……不要求工信部备案」。「在推出收费版之前，即使超出免费版的用量限制也不会中断服务」 | 算。尾斜杠行为：文档未查到 |
| D12 | 阿里云 OSS + CDN | `R/docs/aliyun/oss-hosting-static-websites.txt:21-34`；`cdn-brotli.txt:28-29`；`cdn-add-domain.txt:18,31-36`；`cdn-url-rewrite.txt:62,128`；`cdn-cache-expiration.txt:81` | 「使用OSS Bucket域名访问HTML文件时……浏览器会强制下载」，要绑自定义域名，内地 Bucket 要 ICP。Brotli 支持类型列表里**没有 text/html**（:29）。仅中国内地或全球加速要备案。CDN「访问 URL 重写」的 Redirect 是 302，单域名 ≤50 条 | 算。OSS 重定向规则页取回是 404，未查到 |
| D13 | 腾讯云 COS + CDN | `R/docs/tencent-cos/cos-static-website-console.txt:56,68-74`；`cos-limits.txt:115`；`cos-api-put-bucket-website.txt:180,414`；`cdn-smart-compression.txt:37,53,56`；`cdn-access-url-rewrite.txt:39,50,56`；`cdn-getting-started.txt:66-68`；`cdn-billing-overview.txt:115-116` | COS 默认域名访问「弹出下载提示」；URL 以 `/` 结尾时匹配该目录的索引文档；对象数不限；RoutingRule ≤100 条。CDN 智能压缩默认类型含 text/html，支持 Brotli。CDN 重写是 302，≤100 条。中国境内、全球加速要备案；按流量计费 | 算。RoutingRule 回什么状态码：未查到 |

## 三、实测（只取响应头；原件见路径）

| ID | 测了什么 | 原件 | 关键结果 |
|---|---|---|---|
| M0 | 出口位置 | `R/_vantage/cf-trace.txt`（2026-10-10T10:02:35Z） | `colo=SJC`、`loc=US`（IP 行已删） |
| M1 | GitHub Pages 现网 | `R/github-pages-baseline/`（10:03Z 起） | 3 种 AE 都回 `content-encoding: gzip`，`cache-control: max-age=600`。`/<slug>` → 301 到 `/<slug>/`；`/<slug>/index.html` 200 不改写；404 真 404；`robots.txt` 为 `text/plain` |
| M2 | GitHub Pages + Cloudflare：9 个站（以 `server: cloudflare` 加透传的 `x-github-request-id` 认定源站） | `R/gh-pages-cloudflare/`（10:03–10:11Z） | **JS/CSS 共 13 个文件、26 个响应全部 gzip**（cf-cache-status 为 HIT／REVALIDATED／EXPIRED）。**首页 HTML**：未缓存（DYNAMIC）7 个中 6 个回 br／zstd（tldr.sh、d3js.org、neovim.io、servo.org、bulma.io、pandas.pydata.org），getbootstrap.com 透传 gzip；已缓存的 git-scm.com 回 gzip，numpy.org 回 br。例：`tldr-home.br-gzip.headers.txt` 为 `cf-cache-status: DYNAMIC` + `content-encoding: br`，`tldr-css.br-gzip.headers.txt` 为 `REVALIDATED` + `gzip` |
| M3 | Cloudflare Pages：`cloudflare-pages-template.pages.dev`、`ignext-demo.pages.dev` | `R/cloudflare-pages/`（10:09–10:11Z） | HTML、JS、CSS 共 12 个响应**全部 br**；声明 zstd 也回 br。`/index.html` → 308 到 `/`；无 `404.html` 的站点对不存在路径回 200（单页应用回退，与 D7 一致）。ignext 的 CSS 头是 `public, max-age=31536000, immutable, public, max-age=0, must-revalidate`：自定义头与默认头被拼在一起 |
| M4 | 推定为 Workers 静态资源的 `developers.cloudflare.com` | `R/cloudflare-workers/routing/` | `/pages` 与 `/pages/index.html` 都 307 到 `/pages/`，与 D8 一致；HTML 回 br。**平台归属未证实**，只当旁证 |
| M5 | Netlify：`docs.netlify.com`、`edge-functions-examples.netlify.app` | `R/netlify/`（10:09–10:11Z） | HTML、JS、CSS 共 8 个响应**全部 br**，无 zstd。`/x` → 301 到 `/x/`；`/x/index.html` 200；404 真 404；`.txt` 为 `text/plain` |
| M6 | Vercel：`next-blog-starter.vercel.app`、`nextjs.org` | `R/vercel/`（10:09–10:11Z） | HTML、JS、CSS 共 8 个响应**全部 br**，无 zstd。两站都是 Next 应用，不是纯静态；尾斜杠 308 是该站自己的配置，不代表平台默认 |
| M7 | EdgeOne Pages：`multiplepage-portfolio`、`astro-template`、`docusaurus-template`（均 `*.edgeone.app`，`server: edgeone-pages`），对照 `hono-template` | `R/edgeone/`（14:23–14:25Z） | **3 个静态站 12 个响应没有一个回 br**：10 个 gzip，astro 首页 2 次都不压缩。只有走函数渲染的 hono 首页回 br。`/posts`、`/posts/`、`/posts/index.html` 都直接 200，不跳转 |
| M8 | 国内 CDN 旁证：`cloudcache.tencent-cloud.com` 的 CSS（`server: tencent-cos`）、`g.alicdn.com` 的 JS（`server: Tengine`）、`cloud.tencent.com` 文档页 | `R/china-cdn-sidenote/`（14:26Z 起） | 都回 gzip。这些是厂商自家站点，配置未知，**不能说明 brotli 开关打开后的表现**（D12、D13 写明 brotli 需手动开） |
| M9 | yangzhiping.com | `R/yangzhiping-sidenote/` | 在 Cloudflare 后面，HTML、JS、CSS 都回 br；没有透传 GitHub 的头，源站未知，只当旁证 |

## 四、失败与拦截

- sandbox 没有拦截网络请求。
- `help.aliyun.com` 一次 GET 超时 15 秒（curl 错误 28），未重试，不影响结论。
- 阿里云「OSS 重定向规则」与「CDN 计费」两页取回的是 404 错误页（`R/docs/aliyun/oss-routing-rules.txt:1`、`cdn-billing.txt:1`），相关格标「未查到」。
- 三路文档分身中，EdgeOne 与国内对象存储一路中途被 API 额度打断。它已取回的原件由我直接读取核对，D11–D13 的每一条行号都由我本人查过。另两路的引文，我抽查了 D1（:136-147）、D6（:17-23）、D10（limits.md:149-151、kb:17-19、fair-use:95），都与原件一致。其余未抽查。
