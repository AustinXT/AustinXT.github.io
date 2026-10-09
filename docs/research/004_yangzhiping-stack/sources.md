# 来源与证据索引

核查日期：2026-10-09；主要响应时间约 12:25 UTC。只读公开 HTTP 资源与 DNS，不运行下载脚本。

## 自有积累

- 已有取舍与确认：`../002_blog-direction-decision.md`，用于约束本轮不自动重选技术。
- 已有导航观察：`../003_blog-navigation-reference.md`，只用于组织参考，不证明现网框架。

## 他人积累：现网一手证据

公开材料本地隔离根目录：`../../../resources/yang-stack-20261009-y1j458tw/`，每个响应在独立子目录，均被 Git 忽略。下表的原始 HTML/JS/CSS 均为压缩单行，定位到 `body.txt:1` 后按标识检索。外部材料只读借鉴，不复制到作品。

| ID | 公开 URL | 本地文件与可核查标识 |
|---|---|---|
| E1 | https://yangzhiping.com/ | `home/body.txt:1`：`generator` 为 `v0.app`、`/_next/static/chunks/`、`self.__next_f.push`；`home/headers.txt`：Cloudflare |
| E2 | https://yangzhiping.com/essays/ | `essays/body.txt:1`：同 CSS/核心 JS、`v0.app`、RSC payload |
| E3 | https://yangzhiping.com/_next/static/chunks/023d923a37d494fc.js | `asset-3/body.txt:1`：`window.next={version:"16.0.10",appDir:!0}`、React DOM 版本导出 |
| E4 | https://yangzhiping.com/_next/static/chunks/45535c4da7d835d0.js | `asset-1/body.txt:1`：React hooks 与 `r.version="19.3.0-canary-52684925-20251110"` |
| E5 | https://yangzhiping.com/_next/static/chunks/9cae4f51311b1cf7.css | `asset-0/body.txt:1`：分开的 `@layer theme/base/components/utilities`、`@property --tw-…`、`--spacing:.25rem` |
| E6 | https://yangzhiping.com/_next/static/chunks/17df2d113f03491f.js | `asset-8/body.txt:1`：React 图标组件、`iconNode`、`lucide`；首页 SVG 有 `lucide-menu` 等类名 |
| E7 | https://yangzhiping.com/_next/static/chunks/turbopack-fa7716599204bcc7.js | `asset-4/body.txt:1`：被首页直接引用的 Turbopack runtime |
| E8 | https://yangzhiping.com/manifest.json | `manifest/body.txt`：公开 Web App manifest；单独不足以证明 service worker 或离线能力 |

### 关键原件哈希（SHA-256）

- E1：`8d1e15cd94277211d3742313f0c01fa0fd98e0d01b5d48e2155e321b3c023a64`
- E3：`2afe1c11e3fa149b52cee186a4c83e80a403e07ee3d1e6ba98a74c23f6043f39`
- E4：`a26bf3b40a3d027e584e158cb75b95e24da7b180bc9ee3a5f7a2429c0878dc09`
- E5：`699f183bbf797c01be0d9423aad5dde1b58abe77cb4e16eff3727e17298eb137`

资源 URL 可能随部署变化；哈希界定本次观测对象，不代表以后仍相同。

## 官方文档：只验证推断方法

- Next.js static export：https://nextjs.org/docs/app/guides/static-exports 。Context7 返回官方源码文档，说明 Server Components 也可在构建时生成静态 HTML 与导航 payload；因此 RSC 不等于现网运行 Node 服务。
- Tailwind CSS v4：https://tailwindcss.com/blog/tailwindcss-v4 。官方说明原生 cascade layers、registered properties 与主题变量；用于比对 E5，不用于猜小版本。

## 历史线索：降级，不证明现网

检索找到《理想的写作环境：Git+Github+Markdown+Jekyll》的转载，声称作者自 2010 年开始使用该组合。二手转载：https://www.cnblogs.com/panpanwelcome/p/14756196.html 。它指向旧原文 https://www.yangzhiping.com/tech/writing-space.html ，本次 curl 跟随跳转得到 HTTP 404，未读到一手正文。故仅登记“历史 Jekyll 线索”，不据此确认历史完整栈、迁移日期或当前 GitHub Pages 托管。

原始探测日志：`../../../_tmp/20261009-yang-stack/probe-result.txt`，临时材料不入库。探测方法、实际失败与验证边界见 `../../experiments/exp002-yang-stack/readme.md`。
