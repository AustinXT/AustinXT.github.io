# 内容维护

日常只编辑这个目录。修改后重新构建，页面、归档、专栏、专题、搜索、RSS 和站点地图会从同一份内容更新；不需要改路由或组件。

## 随笔：`essays/<slug>.md`

```markdown
---
title: 一篇新随笔
date: 2026-10-15
slug: a-new-essay
description: 可选摘要；省略时自动从正文提取。
draft: true
categories: [学习与写作]
tags: [卡片, 写作]
---

正文从这里开始。

## 第一个小节

继续写作。支持列表、引用、表格、代码块和图片。
```

- `draft: true` 下架；`draft: false` 上架到构建产物。兼容既有文章，省略 `draft` 等同 `false`；新文建议明确写 `true`，完成后再改为 `false`。
- `categories` 是专栏，`tags` 是专题。填写中文或英文名称数组即可；新名称自动建页，删除最后一篇公开文章的某个名称后，对应分类页会消失。名称会去除首尾空白、合并重复项；可含内部空格，不能含 `/ \ ? # %`，也不能是 `.`、`..`。
- 不分类时写 `categories: []`、`tags: []`，也可省略。草稿不计入任何专栏、专题或年份统计。
- `date` 是原始写作日期；可加 `revised: 2026-10-16` 标注修订，不早于 `date`。
- `slug` 与文件名必须相同，使用小写英文字母、数字、单连字符，含字母、最长 40 字符；不要用 `categories`、`tags`、`archive`。URL 为 `/essays/<slug>/`，上架后尽量不改 slug。
- 页面用 `title` 生成唯一一级标题；正文旧有标题层级会在渲染时统一从二级开始，Markdown 源文不改。二级标题自动生成目录，二/三级标题自动生成锚点。原生 HTML 不执行。
- 专栏首页最多 4 项、专题最多 6 项，按文章数及名称排序；完整目录列出全部。年份和专题详情每页最多 100 篇，首页显示最新 5 篇。
- 新写文章不需要迁移台账；已登记的历史旧文仍由 `scripts/check-migration.py` 核对来源和日期。

`draft: false` 控制静态产物是否包含内容。网站上线后，需要部署新的 `out/` 才会在网上生效；旧内容可能仍留在第三方缓存或读者已下载的 RSS 中。

## 旧文逐篇校对

旧库 134 篇正文与草稿已经全部进入 `essays/`，其中 133 篇新迁入，另保留《卡片大法》的既有整理稿。全部显式设置 `draft: true`，所以校对前不会显示在博客、搜索、RSS 或站点地图。

从 [旧文校对清单](legacy-review.md) 点击文章即可打开 Markdown。按需核对正文、标题和日期，调整 `categories`、`tags`、`description`，准备好后把 `draft` 改为 `false`。不需要修改 `content` 外的台账，也不需要更新这张初始清单。

默认元数据优先保留旧值；12 篇缺标题、1 篇缺日期使用文件名/日期默认值并标注。原本空白的手稿保持为空草稿，上架前必须补正文；不补造文章内容。

完整来源、旧 front matter、校验摘要与默认值依据在 `legacy-index.json`，它是初始迁入记录，日常编辑文章时不用修改。旧公式、Mermaid、音频设置和缺失图片的校对提示见清单末尾。旧 `briefing/_index.md` 只有栏目标题，没有文章正文，因此不生成占位随笔。

## 作品：`works/<slug>.md`

与随笔使用相同字段，另可填写：

```yaml
externalUrl: https://example.com/project/
order: 1
```

`order` 为非负整数，数值小的排在前面；未填写的按日期倒序排在后面。作品卡片标题直接打开 `externalUrl`，同时保留「了解作品」介绍页；省略外链时标题打开介绍页。作品页和归档每页最多 24 件，首页显示前 3 件。

当前 `github-explore.md` 为第一个作品；`ai-weekly.md` 为第二个作品，暂时链接到现有 AI 日报，周报改造后只需更新这里的外链和介绍。

## 站点信息与简介

- `site.json`：站名、摘要、作者、首页介绍、正式域名与联系方式。
- `about.md`：简介的标题和正文；联系信息仍统一来自 `site.json`。
- `contact` 示例：`[{"label":"邮件","url":"mailto:hello@example.com"}]`；也支持 http(s) 链接。没有公开联系方式时保留空数组。
- 正式上线前只需在 `site.json` 将 `url` 设为站点根地址，例如 `https://blog.example.com`（无子目录、查询或片段）。正式 URL 会启用 canonical、索引、RSS 与站点地图。URL 为空时保留本地预览：禁止索引、不展示订阅入口，RSS 不产生虚假的文章链接。

## 图片与附件：`media/`

文件放在 `media/`，正文使用站内根路径：`![图片说明](/media/example.webp)`。支持子目录。也可以链接 PDF、音视频；单文件不超过 10 MB。

启动预览或构建会自动把媒体同步到派生目录 `public/media/`，不要手工编辑那个目录。增删媒体后，重新启动开发服务或重新构建。支持 png/jpg/jpeg/gif/webp/avif/svg/ico/pdf/mp3/mp4/webm/ogg，不接受软链接。

## 本地预览与验证

在项目根运行：

```bash
npm --prefix src run dev
# 浏览 http://127.0.0.1:3000
```

静态产物预览：

```bash
npm --prefix src run build
python3 -I -m http.server 4173 --bind 127.0.0.1 --directory src/out
```

项目遵循全局 mac-offload 约定：完整构建和批量验证优先交给 worker。工程命令与 CI 入口见上一级 README。
