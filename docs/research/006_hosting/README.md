# 006 · 新站静态产物放在哪里托管

> 2026-10-10 起。四步走第二步：系统分析。**分析即取舍。**

## 这次要决定的

新站的静态产物 `src/site/out/` 放在哪里托管。「GitHub Pages + 前置 CDN」这类组合也算候选。前提已定：托管必须以 brotli（或 zstd）下发 HTML、JS、CSS（`../005_md-rendering/decision.md` 拍板第 6 项）。

## 五份文件，按这个顺序走

| # | 文件 | 干什么 | 状态 |
|---|---|---|---|
| 1 | [must-know.md](must-know.md) | **决策点**：不可妥协的 3 条与排除项 | ☑ AI 草稿，待负责人确认 |
| 2 | [sources.md](sources.md) | 来源登记：自有积累、官方文档、实测 | ☑ |
| 3 | 派活 | 本次照 `../005_md-rendering/assign.md` 的做法分三路取文档，不另写模板 | ☑ 三路：Cloudflare 与 GitHub Pages ／ Netlify 与 Vercel ／ EdgeOne 与国内对象存储 |
| 4 | [gap.md](gap.md) | **核查矩阵**：6 个候选 × 8 个核查项 | ☑ |
| 5 | [decision.md](decision.md) | **取舍卡**：首选、备选、风险、哪里要你拍板 | ☑ 待拍板 |

原始证据都在 `../../../resources/hosting-20261010/`（被 Git 忽略，只在本机）：
- 响应头：`<候选>/*.headers.txt`，路由测试在 `<候选>/routing/`；
- 文档原件：`docs/<平台>/`；
- 取证脚本：`_scripts/probe.sh`（压缩）、`_scripts/route.sh`（跳转与 404）；
- 出口位置：`_vantage/cf-trace.txt`。

## 取证方法与边界

- **只取响应头**。命令形如 `curl -q -sS -o /dev/null -D - -H 'Accept-Encoding: br, gzip' <url>`，每个网址再用 `zstd, br, gzip` 测一次。
- **没用 `--compressed`**：本机 curl 只会解 gzip，遇到 br 会报错退出。只看响应头，不解压也够。
- **加了 `-q`**：本机 curl 配置文件改过 User-Agent，`-q` 让它不读配置，结果可复现。
- **出口在美国西部**。本机经代理出网，Cloudflare 报 `colo=SJC`、`loc=US`；GitHub 报 `x-github-edge-region: westus3`。**所有实测都不代表中国大陆的访问情况。**
- 只做公开网页 GET 与公开 DNS 查询。没有注册、登录、部署、付费，没改 DNS，没装工具，没读凭据。

## 什么时候算够

> **能列出「需要你拍板的地方」，就够了。**

## 验证记录（2026-10-10）

- **规则核对**：`gap.md` 每一格都能追到 `sources.md` 的 ID；`decision.md` 正文字数已数过，见文末。
- **对抗视角**：本次未做独立子代理审查，也未外发评审。负责人要的话，可照 005 的做法补一轮。
