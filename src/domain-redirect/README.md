# blog 域名跳转

主站由本仓库 main 的 GitHub Actions 构建并发布到 GitHub Pages，域名为 `https://nightvoyager.top`。

本目录是独立的 Vercel 静态跳转配置，项目根目录设为 `src/domain-redirect`，不安装依赖、不构建、不运行 Node 服务。只绑定 `blog.nightvoyager.top`；Vercel 在边缘以 HTTP 308 跳到 `https://nightvoyager.top`，保留路径与查询参数。Vercel 自动签发并续期 blog 的证书，DNS 按项目 Domains 页给出的 CNAME 配置。

发布后验证首页、文章路径和查询参数均跳到主站，并确认两个域名的证书可正常校验。`index.html` 只是无匹配平台规则时的入口说明，生产跳转由 `vercel.json` 完成。
