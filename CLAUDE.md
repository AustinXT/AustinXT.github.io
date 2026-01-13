# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作提供指导。

**重要说明：本项目的所有文档、注释和生成内容都应使用中文。**

## 项目概述

这是一个基于 Hugo 的个人博客（夜航星 / Night Voyager），使用 FixIt 主题。网站语言为中文（zh-CN），内容涵盖认知心理学、学习方法、数据分析和编程等主题。

- **基础 URL：** https://austinxt.github.io（自定义域名：blog.nightvoyager.top）
- **主题：** FixIt（作为 git 子模块安装在 `themes/FixIt/` 目录）
- **Hugo 版本：** 0.154.5 extended（在 `.github/workflows/hugo.yml` 中指定）

## 常用命令

```bash
# 开发服务器（支持热重载）
hugo server

# 开发服务器（编辑布局文件时使用，完整重建）
hugo server --disableFastRender

# 生产环境构建（输出到 public/ 目录）
hugo

# 创建新文章
hugo new posts/YYYY-MM-DD-title.md

# 创建新笔记/讨论
hugo new talks/YYYY-MM-DD-title.md
```

## 项目架构

### 内容组织
- `content/posts/` - 已发布文章（约 70 篇）
- `content/talks/` - 讨论笔记和随想（约 43 篇）
- `content/draft/` - 草稿文章（未发布）

### 配置文件
- `config.toml` - Hugo 主配置文件，包含 SEO 验证码、菜单结构、主题设置、Giscus 评论、Fuse 搜索和标记选项

### 自定义布局
- `layouts/_partials/head/seo.html` - 增强的 SEO 元数据模板，包含 JSON-LD schema、AI 友好标签和搜索引擎验证码
- `layouts/partials/head/custom.html` - 自定义 head 内容
- `layouts/partials/audio-player.html` - 音频播放器组件（在 `params.customPartials.postContentBefore` 中配置）

### 静态资源
- `static/robots.txt` - SEO 爬虫规则，包含对 AI 爬虫的明确授权（GPTBot、Claude-Web 等）
- `static/ai.txt` - AI 使用政策声明（CC-BY-NC-4.0 许可证）
- `static/CNAME` - GitHub Pages 自定义域名配置

### 主题
FixIt 主题作为 git 子模块安装。请勿直接修改 `themes/FixIt/` 目录下的文件。如需自定义，请在 `layouts/` 目录中创建覆盖模板。

## Front Matter 模板

文章使用 YAML 格式的 front matter，主要字段如下：
```yaml
title: 文章标题
subtitle: 副标题
date: YYYY-MM-DD
description: SEO 描述
tags: [标签1, 标签2]
categories: [分类]
featuredImage: /images/image.jpg
lightgallery: true
```

## 部署

网站使用 GitHub Actions 自动部署。推送到 `main` 分支会触发：
1. 使用 `--gc --minify` 参数构建 Hugo
2. 上传到 GitHub Pages

详见 `.github/workflows/hugo.yml` 工作流配置。无需手动部署。
