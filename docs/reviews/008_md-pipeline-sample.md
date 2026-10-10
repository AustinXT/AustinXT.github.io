# 正文 MD 管线：占位样本实施与验证记录

日期：2026-10-10。取舍与拍板的正本见 `../research/005_md-rendering/decision.md`。编译规则见 `../../src/site/README.md` 的「正文管线」一节。精确依赖以 `../../src/site/package.json` 和 `package-lock.json` 为准，本文不另存版本副本。

## 授权与范围

负责人先回复「其他的都按你的建议」，在问清 brotli 之后，又选了两项：

- 第 6 项：brotli 是托管的必要条件；
- 第 8 项：放行第一批依赖，并用占位文章跑通管线。

本轮范围是：

- 安装 6 个 MIT 包：gray-matter、unified、remark-parse、remark-gfm、remark-rehype、rehype-stringify；
- 正文目录与一篇占位文章；
- 编译管线和 `/essays/<slug>/` 详情页；
- Tailwind 排除正文目录；
- 规则检查与反例回归，并接入 CI。

本轮不做：迁移真实旧文、读取旧原件正文、装第二批（公式与高亮）、改随笔目录的空态、提交推送、发布。

## 实施结果

- 依赖：安装时用 `--save-exact --ignore-scripts`，新增 93 个包。对锁文件做了结构化比对，既有包的版本 0 个改变、0 个删除；只有 `debug` 和 `ms` 从开发依赖变为运行依赖，因为 micromark 要用到它们。随后从锁文件 `npm ci` 干净重建，`npm ls --all` 通过。
- 管线：front matter 不合规时构建直接失败。原生 HTML 默认丢弃，只保留其中的文字。草稿不导出。
- 产物：`/essays/pipeline-sample/` 的正文在 HTML 里，位于脚本之外。表格、删除线、代码块、引用、有序列表都正常渲染，`<span>` 被丢弃，h1 与 title 一致。随笔目录仍是空态，没有混进占位文章。

## 实际失败与处置

1. **样式排除的第一次红测无效。** 去掉 `@source not` 后，CSS 里照样没有自检类名。原因是类名前紧贴中文全角冒号，Tailwind 不把它当成一个独立的词。改成让类名单独占一行后，红测成立：没有排除规则时 CSS 命中 2 处，恢复规则后为 0。教训：自检串本身也要先证明它能触发问题。
2. **导出检查器的 CLI 正常用例返回 2。** macOS 的临时目录经由 `/var` 软链接，被软链接防护正确拒绝；这是夹具的问题，测试改为先解析成真实路径（与既有 `test-site-export.py` 的做法一致）。
3. **突变验证抓出两处测试漏洞。** 「脚本、模板里的文字不算正文」和「中间目录是软链接时拒绝」这两条规则，删掉后测试仍全绿。各补了一个反例，补完后复验，突变均被抓到。
4. **跨进程 HTTP 冒烟连不上。** 起本地 `http.server` 后，curl 连接超时，服务日志为空，像是沙箱拦截了跨进程连接。按既有教训没有反复重试，改为同进程起服务、用不走代理的客户端请求，四个路径均返回 200。新文章页为 `text/html`、14,020 B。

## 验证

| 检查 | 结果 |
|---|---|
| `node --test scripts/test-content-loader.mjs` | 21 项通过；8 个规则突变全部被抓到 |
| `python3 -I scripts/test-content-export.py` | 21 项通过；10 个规则突变全部被抓到（含补测后的 2 个） |
| `python3 -I scripts/check-content-export.py` | 1 篇导出，契约通过 |
| `python3 -I scripts/check-site-export.py` 与 `test-site-export.py` | 8 路由契约通过；18 项回归通过 |
| lint（零告警）、typecheck、build、`npm ls --all` | 通过 |
| 原型检查、`check-manifests.py`、`test-check-system.py`、`git diff --check` | 通过 |
| `python3 -I scripts/check-system.py` | **失败**：只报一条，本机 Python 3.14.7，`.python-version` 要求 3.14.8。未改锁定版本，由负责人决定 |

突变验证在副本上做，原文件没有动。副本原在 `_tmp/20261010-md-rendering/`，2026-10-10 按负责人决定随实验材料一起删除；结果以上表为准。

## 未验证

- 浏览器渲染与真机阅读；
- CI 云端运行；
- 真实旧文的写法覆盖：公式、旧 Hugo 短代码，以及表格里的 `<br/>` 被丢弃后的效果；
- 所有文章都是草稿时，静态导出能否通过；
- 托管上的压缩方式与目录拆分。

这是同谱系执行与本地验证，不是跨谱系评审，也不是负责人的验收。
