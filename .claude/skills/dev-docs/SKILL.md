---
name: dev-docs
description: Use when writing a tracked, sequentially-numbered project doc under docs/ - a change record (arch/ops/fix under
  docs/changes/), a research doc (findings/sources under docs/research/), or an implementation plan (docs/plan/). Determines
  family + type, assigns next number, creates the file with correct frontmatter, and updates all relevant index files.
metadata:
  author: zhiping
  title: 写编号文档（变更/研究）
  description_zh: 在 docs/ 下创建顺序编号的可追踪文档——变更记录（changes：arch/ops/fix）、研究文档（research：findings 研究结果 / sources 原始资料）或实施计划（plan：执行前蓝图），自动分配编号并同步全部索引
  version: 1.0.1
  license: 42plugin-team
  tags:
  - docs
  - changes
  - research
  - plan
  - arch
  - ops
  - fix
  - findings
  - sources
  - documentation
---

# dev-docs · manzi-blog 编号文档

**manzi-blog 适配入口**：先读项目 `CLAUDE.md`、`.42cog/` 四份、`state/board.md` 与 `state/memory/MEMORY.md`。
项目模板与领域约束统一在 [项目适配](../pr-ready/templates/manzi-blog.md)，基线和完整测试命令统一在
[项目配置](../pr-ready/references/project.config.json)。项目规约与本轮明确授权优先；迁入技能不扩大提交、推送、外发、合并或发布权限。

在 docs/ 下创建可追溯的调研、计划、评审或决策文档。命名和目录以项目 specs/README.md 为准，不迁入 LXCoding 的目录层级或账本锚点。

1. 先完整读取所写目录已有 README／index，再查看同类文档原件的命名、frontmatter 和引用方式；目录列表是列表，不能当映射猜路径。
2. 调研进 docs/research/、计划进 docs/plan/、评审进 docs/reviews/；如果已有 changes/arch／ops／fix 才沿用它。尚无 changes/ 时，决策／操作记入现有计划或调研档案，短里程碑写 state/changelog.md，不预建三族骨架。
3. 对实际目录同时扫描 NNN_slug.md 与 NNN_slug/ 的最大三位编号，再分配下一号；编号一经引用不重排。保留项目既有文档／目录式研究组织，不自动拆成 findings／sources。
4. 文件名 NNN_kebab-case.md；项目采用目录式研究时可用 NNN_kebab-case/README.md。只创建本次要用的文件，不复制正文保存版本。
5. frontmatter 沿用同类原件；有 type／number／date／title 就保持其类型，无 frontmatter 的现有项目不强制换格式。状态、来源、采纳理由和未验证项写清楚。
6. 仅更新实际存在的目录索引，先核其表格／链接格式再追加；没有根 docs/README.md 不为了技能默认值造一份索引。首次创建档案目录时建立它的唯一 README 索引。

正文按目的组织：研究先写结论及来源／缺口；计划先写问题、范围、依赖顺序、验收和需人拍板项；评审先写快照、材料范围、P0–P3 与结论。不把待拍板记成已采纳，不把 AI 判断记成人的实效验收。
出处用已有路径与行号；原件保持只读，录音／正文不另放 notes/。一次性材料写 _tmp/YYYYMMDD-<slug>/，不强迫每个小修复生成长档案。

退出条件：编号无冲突，引用路径真实存在，既有索引同步且无重复正文，文档状态和验证声明有实际证据。只写本次授权范围内的文件，不自动提交、发布或推送。
