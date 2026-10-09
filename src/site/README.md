# site — 博客原生工程

技术选择唯一正本：[取舍卡修订](../../docs/research/002_blog-direction-decision.md)。精确依赖以 `package.json`、`package-lock.json` 为准，Node 以 `.node-version` 为准；不用 canary，不共享第二套锁文件。

## 当前范围

这是可构建的本地工程壳，不是网站发布或文章迁移完成。结构依据 [原型标准](../reading/standard.md) 的修改 1–3 独立实现；原八页原型与唯一占位正文仍在定标模块，不覆盖、不复制正文，不导入旧原件。

- 四菜单：首页、随笔、作品、简介；首页依次速览简介、随笔、作品、联系；联系归简介。
- 随笔预留专栏前四、专题前六、全部非空年份及完整分类／专题入口；当前无正文和年份，真实名称待确认，不做假的索引算法或条目。
- 作品实际列表为空；单独的 Lucide 图标入口到详情工程占位，明确非实际作品。
- `/essays/preview/` 只验证临时文章路由，不是获选旧文地址或第二正文；未来生产路径仍需冻结。
- 默认 Server Components，系统字体、本地打包样式与图标；无数据库、CMS、第三方字体、统计或外发表单。
- `output: 'export'` 与 `trailingSlash` 生成本地 `out/`；不是源站平台或 HTTP 301 策略。共享导航在 `components/site-nav.tsx`，全局样式仅在 `app/globals.css`。

## 项目根运行

依赖安装须获明确授权；本轮批准的工程安装已执行。以下命令不会安装全局工具或发布站点：

```bash
npm --prefix src/site ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org
NEXT_TELEMETRY_DISABLED=1 npm --prefix src/site run lint
NEXT_TELEMETRY_DISABLED=1 npm --prefix src/site run typecheck
NEXT_TELEMETRY_DISABLED=1 npm --prefix src/site run build
python3 -I scripts/check-site-export.py
python3 -I scripts/test-site-export.py
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

导出检查只读固定路由与指定本地资源，框架自身 `/_next/` 脚本和 RSC 产物允许；这不是任意 JavaScript 审计。构建、静态规则、浏览器行为、真实正文与人验收分层记录。实际失败、兼容性修正、评审和未验证项见 [本轮验证记录](../../docs/reviews/007_next-stack-bootstrap.md)，接续见 [状态板](../../state/board.md)。

禁止从本工程的存在推导域名、Cloudflare／Vercel、公开发布、旧站替换或未迁 URL 处置授权。下一阶段先复现布局定标，再单篇整理与唯一正文／生产 URL 核验。
