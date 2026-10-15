# 博客工程

基于 Next.js、React、Tailwind 的静态博客。文章和作品以 Markdown 为正本，构建时生成 HTML；阅读正文、年份归档、专栏与专题浏览不依赖客户端解析 Markdown。技术与依赖版本以 `package.json`、锁文件和 `.node-version` 为准。

已将旧库 134 篇文章与草稿迁入，全部先下架待校对；文章入口见 [校对清单](content/legacy-review.md)。

日常维护从 [content/README.md](content/README.md) 开始：上下架、专栏、专题、作品排序、简介和站点信息都在 `content/`，无需改页面代码。

## 已有能力

- 首页、随笔、作品、简介四菜单；移动端、暗色模式、键盘焦点、跳到正文与打印样式。
- 随笔 Markdown、自动摘要与阅读时间、章节目录、锚点、相邻文章和同主题阅读。
- 自动专栏与专题索引/详情、按年份归档、每页 100 篇的静态分页；无文章、全部草稿也能构建。
- 作品介绍、直接外链、指定排序及 24 件分页。首两项是 github-explore 和 AI 周报入口，周报改造另行进行。
- 本地关键词搜索：标题、摘要、专栏、专题，支持多词及随笔/作品过滤；索引按需加载，每批显示 20 条。全文检索未启用。
- 配置正式 URL 后自动生成 canonical、Open Graph、文章结构化数据、RSS（最新 50 篇）与 sitemap。未配置 URL 时禁止索引并隐藏订阅入口。
- 自定义 404、内容媒体同步、静态导出 DOM/链接/草稿检查和 CI；不依赖数据库或 CMS。

## 运行

从项目根执行。已有依赖使用锁文件重建，不引入新依赖：

```bash
npm --prefix src/site ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org
npm --prefix src/site run dev
```

预览仅绑定 `127.0.0.1:3000`。依赖安装授权沿用既有工程约定。

```bash
NEXT_TELEMETRY_DISABLED=1 npm --prefix src/site run build
python3 -I -m http.server 4173 --bind 127.0.0.1 --directory src/site/out
```

`predev` / `prebuild` 同步 `content/media/`。构建前清除旧导出，避免已经下架的页面残留。`out/`、`.next/`、`public/media/` 和类型缓存是可再生产物，不入 Git。

## 验证

完整验证脚本：`sh scripts/verify-blog.sh`，包括精确 Node、锁文件安装、依赖树、lint、内容和搜索测试、导出反例、迁移对账、构建、类型和真实静态导出检查。

按全局约定优先执行 `mac-offload`。worker 需使用 `.node-version` 与 `.python-version` 锁定版本；系统默认版本不一定匹配。本轮入口：

```bash
mac-offload run --output src/site/out --timeout 900 -- uv run --python 3.14.7 --no-project -- npm exec --yes --package=node@26.10.0 -- sh scripts/verify-blog.sh
```

`scripts/test-blog-lifecycle.mjs` 在**一次性 worker 快照**上实际构建全部下架与中文分类/分页/生产 SEO 场景，并在 finally 中恢复内容、重建真实站点。不要在有人同时编辑的工作区运行。

历史文章核验继续使用迁移台账，但新写文章无需登记。原件 `vault/raw/05blog/` 只读且不作为构建输入；worker 不传原件，所以迁移检查会明确报告未逐字比对。

## 部署

`out/` 可托管于支持静态文件和目录索引的服务器。托管取舍见 [006](../../docs/research/006_hosting/decision.md)。正式发布需一次配置 `content/site.json` 的 `url`，检查托管的 404、缓存、brotli 和旧链接 301，再上传整个新产物替换旧版本；只覆盖同名文件而不移除旧文件会使下架页面残留。

本轮完成本地工程，不自动注册账号、部署、改 DNS、提交或推送。AI 周报的业务改造在 github-explore 后续单独进行。验证结果及观察边界见 [状态板](../../state/board.md)。
