# 核查与缺口

证据 ID 的唯一登记见 `sources.md`。

| 项目 | 状态 | 结论与依据 |
|---|---|---|
| 当前 Next.js / App Router | 已确认（发布包层） | E1–E3：直接资源引用、RSC、`window.next` 与 `appDir`；不是只命中文件名 |
| 当前 React / React DOM | 已确认（发布包层） | E3–E4：导出版本与 renderer 上下文 |
| Turbopack | 已确认（构建产物层） | E1、E7：实际引用 runtime；没有确认完整构建命令 |
| Tailwind CSS | 强证据推断 | E5 多个编译特征与官方 v4 文档一致；4 系判断强，小版本未确认 |
| Lucide React 图标 | 已确认（发布包层） | E6 的 React 图标组件与 E1 的 SVG 类名对应；版本未知 |
| v0.app | 已确认（声明层） | E1–E2 的 generator 标签；只确认标签，不能证明所有代码由 v0 生成 |
| Cloudflare | 已确认（边缘层） | E1 响应头 `server: cloudflare`、`cf-ray` 等；DNS A 返回 `172.67.195.147` 与 `104.21.52.52` |
| Vercel / Cloudflare Pages / GitHub Pages 源站 | 未确认 | 边缘响应不能识别源站；未出现 Vercel 特有头也不能排除 Vercel |
| SSR / SSG / static export | 未确认 | RSC 可静态导出；无构建配置或运行态实验 |
| TypeScript / shadcn/ui / Radix | 未确认 | v0 与 Tailwind 的常见组合不等于本站证据；未取得源码依赖表 |
| Markdown / MDX / CMS / 数据库 | 未确认 | 渲染 HTML 无法反推内容正本与后台 |
| 完整 PWA | 未确认 | E8 只能确认 manifest，不证明 service worker、安装与离线行为 |
| 历史 Jekyll | 二手线索 | 原文 URL 本次 404；转载不代表现网配置，也不能确定迁移时间 |

## 两类发现

- **它们做到的**：页面输出有明确的现代 React/Next 应用特征；导航与阅读组织可以作为独立设计参考。复用级别为“借鉴”，不是代码直接复用。
- **它们没做的**：本轮无法认定任何技术能力“没有”。未观测到后台、配置或仓库属于证据缺口，不是功能缺失，更不是商业机会或技术天堑。

## 验证后的修正

“现网仍是 Jekyll”与“Next/v0 必然部署 Vercel”均不应作为结论。CSS 的一次组合断言因预期合并层声明而失败，实际为分别声明各层；修正比对方法后保留 Tailwind 4 系强推断，但不提升为锁文件级确认。
