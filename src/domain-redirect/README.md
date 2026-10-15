# blog 域名跳转

主站由本仓库 main 的 GitHub Actions 构建并发布到 GitHub Pages，域名为 `https://nightvoyager.top`。

本目录是独立的 Vercel 静态跳转配置，不安装依赖、不构建、不运行 Node 服务。只绑定 `blog.nightvoyager.top`；Vercel 在边缘以 HTTP 308 跳到 `https://nightvoyager.top`，保留路径、尾斜杠与查询参数，自动管理 blog 的证书。

## 当前生产配置

- 项目：[nightvoyager-blog-redirect](https://vercel.com/nightvoyagers-projects-b690a6a8/nightvoyager-blog-redirect)。本轮经 Vercel Drop 上传本目录三个文件，未连接 Git provider；后续 main 推送只自动发布 Pages 主站，不会自动修改此 Vercel 项目。
- 生效跳转在项目的 [CDN → Routing Rules](https://vercel.com/nightvoyagers-projects-b690a6a8/nightvoyager-blog-redirect/cdn/routing)：规则 `blog-to-nightvoyager`（ID `e098b53f-68c3-4331-9e78-4247d76b6659`）。其源路径正则、目标及状态码与 `vercel.json` 的 `routes` 一致；编辑后须 Publish。
- DNS：阿里云的 `blog` CNAME 指向 `cb13ab7b32e6a5f6.vercel-dns-017.com`，TTL 10 分钟。主域名继续指向 Pages，未加入 Vercel 项目。
- `index.html` 只是无匹配路由时的入口说明。**Drop 实测不会应用上传的 vercel.json**，不能仅上传文件就声称跳转已生效；此文件保存可追溯的等价路由配置，使用原生 Vercel 构建部署时才由平台读取。当前生产以已发布 CDN 路由及线上验收为准。

## 验证与维护

2026-10-16 已验证首页和 `/essays/card-method/?from=blog&topic=cards` 返回 308，Location 完整保留路径与查询；跟随跳转后文章页返回 200。两域名证书均由 curl 默认校验通过，未跳过证书验证。

修改跳转时同步此配置与平台规则，并在切换 DNS 前先用项目的 `nightvoyager-blog-redirect.vercel.app` 地址验证。项目级 Pattern 的目标 `:path*` 本轮实测会残留星号并丢失尾斜杠，故采用捕获完整路径的 Regex 与 `$1`；不要未经实测改回通配模式。平台规则机制见 [Vercel 官方说明](https://vercel.com/docs/routing/project-routing-rules)。
