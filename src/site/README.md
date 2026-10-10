# site — 博客原生工程

技术选择唯一正本：[取舍卡修订](../../docs/research/002_blog-direction-decision.md)。精确依赖以 `package.json`、`package-lock.json` 为准，Node 以 `.node-version` 为准；不用 canary，不共享第二套锁文件。

## 当前范围

这是可构建的本地工程，不是网站发布或文章迁移完成。结构依据 [原型标准](../reading/standard.md) 的修改 1–3 独立实现；原八页原型与唯一占位正文仍在定标模块，不覆盖、不复制正文，不导入旧原件。

- 四菜单：首页、随笔、作品、简介；首页依次速览简介、随笔、作品、联系；联系归简介。
- 随笔预留专栏前四、专题前六、全部非空年份及完整分类／专题入口；分类与专题的真实名称待确认，仍是空态。
- 作品实际列表为空；单独的 Lucide 图标入口到详情工程占位，明确非实际作品。
- 默认 Server Components，系统字体、本地打包样式与图标；无数据库、CMS、第三方字体、统计或外发表单。
- `output: 'export'` 与 `trailingSlash` 生成本地 `out/`；不是源站平台或 HTTP 301 策略。共享导航在 `components/site-nav.tsx`，全局样式仅在 `app/globals.css`。

## 正文管线

取舍正本见 [005 取舍卡](../../docs/research/005_md-rendering/decision.md)：发布前编译，读者端不解析 Markdown。

- **正文正本**：`content/essays/*.md`，HTML 只是构建产物。作品详情的正文将来放在 `content/works/`，目前还没有建。
- **编译**：`lib/content.ts` 在构建时用 gray-matter 读 front matter，用 unified 链（remark-parse → remark-gfm → remark-rehype → rehype-stringify）编译成 HTML，并给 h2/h3 加锚点（取标题文字，重名加序号），h2 收进文章目录。
- **路由**：`app/essays/[...path]/` 一个路由承接三种页面，`generateStaticParams` 静态导出，`dynamicParams = false`：
  - 文章 `/essays/<slug>/`；
  - 年份 `/essays/<年>/`，列当年全部文章；
  - 年份分页 `/essays/<年>/page/<n>/`，只在当年超过 `YEAR_PAGE_SIZE`（100 篇）时从第 2 页起生成。
  - 合成一个路由，是因为静态导出不许 `generateStaticParams` 返回空数组（2026-10-10 实测会构建失败），单独的分页路由在没有分页时会让构建失败。同理，**至少要有一篇非草稿文章**，否则这个路由没有参数可生成。
- **front matter 规则**（不合规则构建直接失败）：
  - 必填 `title`、`date`（`YYYY-MM-DD`，旧文取原件的原始日期）、`slug`；可选 `revised`（整理日期，不早于 `date`）、`description`、`categories`、`tags`、`draft`。
  - 其他字段名一律拒绝，防止拼写错误。
  - 文件名必须等于 `slug`；slug 只能用小写字母、数字和单个连字符，必须含字母（纯数字留给年份页），且不能与 `categories`、`tags` 等静态路由重名。
  - `draft: true` 的文章不导出。
- **原生 HTML 默认关闭**：MD 里的 HTML 标签会被丢弃，只保留其中的文字。
- **样式**：`globals.css` 用 `@source not "../content"` 排除正文目录，免得文章里的词被 Tailwind 当成类名；正文排版类为 `.essay-body`。
- **目录**：`/essays/` 的时间线列全部非空年份，文章条目放在年份页，所以随笔首页的大小不随篇数增长；首页随笔速览列最新 `HOME_RECENT`（5）篇。目录类链接都设 `prefetch={false}`。两个上限与 `scripts/check-site-export.py` 里的同名常量要保持一致。
- **当前内容**：首篇旧文《卡片大法》（`content/essays/card-method.md`），正文逐字保留原件，只把标题上提一级；登记在 [迁移台账](../../docs/research/007_migration-ledger.md)，`scripts/check-migration.py` 逐字比对。它是 AI 整理稿，待负责人核对，不是可发布状态。
- **网址**：`/essays/<slug>/` 是已确认的网址形状；具体网址冻结仍单独放行。

## 项目根运行

依赖安装须获明确授权；本轮批准的工程安装已执行。以下命令不会安装全局工具或发布站点：

```bash
npm --prefix src/site ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org
NEXT_TELEMETRY_DISABLED=1 npm --prefix src/site run lint
NEXT_TELEMETRY_DISABLED=1 npm --prefix src/site run typecheck
NEXT_TELEMETRY_DISABLED=1 npm --prefix src/site run build
python3 -I scripts/check-site-export.py
python3 -I scripts/test-site-export.py
node --test scripts/test-content-loader.mjs
python3 -I scripts/check-content-export.py
python3 -I scripts/test-content-export.py
python3 -I scripts/check-migration.py
python3 -I scripts/test-migration.py
```

`ci --ignore-scripts` 验证锁文件重建，安装包的 lifecycle scripts 不执行；本工程所需原生包由官方 registry 的锁定依赖提供。Next 维护的 `next-env.d.ts`、`.next/`、`out/`、类型缓存均为可再生产物，不入 Git。Next 16 的 lint 独立执行并以零告警为闸，不依赖 `next build` 代跑。

开发预览：

```bash
NEXT_TELEMETRY_DISABLED=1 npm --prefix src/site run dev
```

仅绑定 `127.0.0.1`。验证实际导出，可另在空闲端口运行：

```bash
python3 -I -m http.server 4173 --bind 127.0.0.1 --directory src/site/out
```

它是本地标准库 HTTP 服务，不是 Node 生产服务器；打开 `http://127.0.0.1:4173/`。手机真机访问须另安排，不把浏览器移动视口冒充人的手机验收。

## 验证边界

导出检查只读固定路由、`essays/` 下的派生页与指定本地资源，框架自身 `/_next/` 脚本和 RSC 产物允许；这不是任意 JavaScript 审计。构建、静态规则、浏览器行为、真实正文与人验收分层记录。实际失败、兼容性修正、评审和未验证项见 [本轮验证记录](../../docs/reviews/007_next-stack-bootstrap.md)，接续见 [状态板](../../state/board.md)。

禁止从本工程的存在推导域名、Cloudflare／Vercel、公开发布、旧站替换或未迁 URL 处置授权。首篇已整理，待负责人核对内容、声音与排版；生产 URL 冻结与旧链接跳转等托管选定后再定。
