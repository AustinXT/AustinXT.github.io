# exp002：参照站技术栈的有界取证

日期：2026-10-09。判断正本见 `../../research/004_yangzhiping-stack/decision.md`，来源与哈希见该目录 `sources.md`，不另存一份技术栈答案。

## 假设与范围

- 待证伪猜测：历史 Jekyll 写作教程仍能代表当前网站。
- 首页冒烟后，扩展到随笔页、首页实际引用的 11 个 CSS/JS 资源、manifest 及旧教程原文 URL。仅公开 GET 与 DNS，不运行下载代码，不扫描其他域名或接口。
- 从 `www` 跟随公开 301 到主域名；外部响应各在新建空子目录。自写脚本与下载材料分离，Python 使用 `-I`。

## 可追溯现场

- 自写取证脚本：`../../../_tmp/20261009-yang-stack/probe.py`。
- 原始日志：`../../../_tmp/20261009-yang-stack/probe-result.txt`。
- 本地材料：`../../../resources/yang-stack-20261009-y1j458tw/`。均不入 Git；不删除原件。
- 断言脚本：`../../../_tmp/20261009-yang-stack/verify.py`，从项目根执行：

```bash
python3 -I _tmp/20261009-yang-stack/verify.py resources/yang-stack-20261009-y1j458tw
```

这不是整站构建测试；资料失效或本地材料缺失时不能假称已复验。

## 实际失败与处置

1. WebFetch 的正文提取未保留技术资源，不能凭提取结果说站点没有脚本；改读 curl 原始 HTML。
2. Python urllib 直连三页均 HTTP 403；改用已成功的 curl，没有尝试认证或绕过访问控制。
3. 旧教程 URL 跟随跳转返回 HTTP 404；停止将其作为已核一手正文，转载只登记历史线索。
4. CSS 初次组合断言失败：期待 `@layer theme,base,components,utilities` 合并声明，但产物分别声明四层。检查真实 CSS 后改为层集合比对，同时要求 `@property --tw-` 与主题 spacing；不靠改阈值伪造证据。
5. Chrome DevTools 找不到 DevToolsActivePort，未启动或配置浏览器；保留未验证边界。

## 对抗性验证方法

- **历史视角攻击现网结论**：不只找 Next 字样，要求页面直接引用资源、版本导出上下文与第二页面同栈；现网证据反驳“仍是 Jekyll”。
- **部署视角攻击托管推断**：Cloudflare 头只认代理；Next 官方 static export 文档证明 RSC 也可能来自静态产物，拒绝把 RSC/v0 推成 Vercel 或 SSR。
- **样式视角攻击关键词识别**：单个 class 不够；检查 CSS 的层、registered properties、主题变量组合，与官方 v4 文档核对；小版本仍未知。

这是单执行者分视角静态核查，不是独立代理、跨谱系评审或人的验收。本轮未发送项目正文给外部模型，未克隆公开仓库、安装依赖、修改原型或发布。

## 验证红线

七项组合断言均通过，仅验证公开产物特征。单个只读新上下文 high 检查只喂取舍卡，三问验收通过，未见历史与代理边界夸大；它没有核验原始证据，不是跨谱系评审。源码语言、完整依赖树、运行后台、CMS、数据库、源站、SSR/SSG 模式、完整 PWA、交互与移动端均未验证，不把文本验收当作这些事项放行。
