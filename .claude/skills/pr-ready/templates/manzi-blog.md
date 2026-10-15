# manzi-blog · 开发与评审项目适配

本模板由 dev-launch、dev-req、dev-autonomous 与 pr-ready 共用。方向只引用 `.42cog/intent.md`；不复制意向正文。
机器配置唯一正本为 [project.config.json](../references/project.config.json)：目标分支为 `origin/dev`，平台与仓库身份以此及实际 origin 核对。
其中 testCommands 是完整验证清单；在仓库根逐条执行，不能用一个成功命令代表全套通过。

## §invariant 触发表

- 开工手册与授权：`CLAUDE.md`；当前阶段：`state/board.md`；按概念加载 `state/memory/MEMORY.md` 的实际链接。
- 领域与作品：Next／React 静态导出工程在 src/site/，八页定标原件在 src/reading/；根目录没有 npm 应用。
- 本项目直接参考：`CLAUDE.md` · `specs/proto-checklist.md` · `src/site/README.md` · `docs/research/007_migration-ledger.md` · `state/memory/20261009-dom-boundary-checks.md` · `state/memory/20261009-browser-preview-fallback.md`。
- 文档命名／索引：`specs/README.md` 与所写目录的 README；没有 specs/ledger.md 或 check-ledger.py，不套用源项目编号锚点。

## §评审维度

正文 frontmatter、阅读路由、年份／主题索引、HTML 编码和正文容器保持一致；缓存／生成参数与内容更新同步。迁移台账的原 URL、新 URL、原始日期与来源对账；缺原件时只做登记检查。静态导出覆盖链接、资源和无正文占位的边界。

vault/raw/05blog/ 与其独立 Git 历史只读；旧文只证明当时事实，新增解释不得伪装成原文。文章逐篇放行，draft:false、技术构建与人审不等于公开发布授权。保持个人声音和已有 URL，不能以全量迁文、批量改名或部署扩大任务。

## §验收命令

读取 [project.config.json](../references/project.config.json) 的 testCommands。它与项目原生配置／CI 对照维护；验证失败保留原始输出，缺依赖不自动安装，不跳过命令。
确认本地版本与依赖可用后再运行构建。机器通过只代表技术结果，实效验收留给人。

## §需求与交付

信息流示例：获选旧文指针 → 整理草稿／元数据 → 迁移台账 → 阅读页面与索引 → 本地导出检查 → 人审。实体可为 Rust 结构、Markdown／文件或页面派生数据，不强行建 SQL 表、管理后台或云服务。
交付形态：网站代码或经授权的单篇整理稿；上线、域名与发布另行授权。
期望功能由负责人确认；已确定范围直接执行，只有真实取舍需要拍板。长内容进 `docs/` 或 `_tmp/YYYYMMDD-<slug>/`，对话只给路径与摘要。

## §批量启动边界

默认使用单条 issue 的本地流程。run-loop 实际运行会调用模型、提交、推送、写 PR／issue、合并及清理工作副本；安装本技能没有授予这些动作。
负责人明确授权本次完整批量范围后，宿主才可在本次命令的环境设置 `AI_DEV_AUTHORIZED_PROJECT=manzi-blog`；此值是已授权执行标识，不是授权来源，不写进全局配置或看门狗。
帮助、自检和 dry-run 不需要此标识；dry-run 不调用模型或平台写接口。测试命令以项目配置为准，AI_DEV_TEST_CMD 只能有理由地临时覆盖，不得弱化验证。
