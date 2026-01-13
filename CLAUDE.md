# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hugo-based personal blog (夜航星 / Night Voyager) using the FixIt theme. The site is in Chinese (zh-CN) and covers topics like cognitive psychology, learning methods, data analysis, and programming.

- **Base URL:** https://austinxt.github.io (Custom domain: blog.nightvoyager.top)
- **Theme:** FixIt (installed as git submodule in `themes/FixIt/`)

## Common Commands

```bash
# Development server with live reload
hugo server

# Development with full rebuild on changes (use when editing layouts)
hugo server --disableFastRender

# Production build (outputs to public/)
hugo

# Create new post
hugo new posts/YYYY-MM-DD-title.md

# Create new talk/note
hugo new talks/YYYY-MM-DD-title.md
```

## Architecture

### Content Organization
- `content/posts/` - Published articles (~70 posts)
- `content/talks/` - Discussion notes and quick thoughts (~43 entries)
- `content/draft/` - Draft articles (not published)

### Configuration
- `config.toml` - Main Hugo configuration including SEO verification codes, menu structure, theme settings, and markup options

### Custom Layouts
- `layouts/_partials/head/seo.html` - Enhanced SEO metadata template with JSON-LD schema, AI-friendly tags, and search engine verification codes

### Static Assets
- `static/robots.txt` - SEO crawler rules including explicit AI crawler permissions (GPTBot, Claude-Web, etc.)
- `static/ai.txt` - AI usage policy declaration (CC-BY-NC-4.0 license)
- `static/CNAME` - GitHub Pages custom domain configuration

### Theme
The FixIt theme is a git submodule. Do not modify files inside `themes/FixIt/` directly. Use `layouts/` directory for customizations that override theme templates.

## Front Matter Template

Posts use YAML front matter with these key fields:
```yaml
title: Post title
subtitle: Subtitle
date: YYYY-MM-DD
description: SEO description
tags: [tag1, tag2]
categories: [category]
featuredImage: /images/image.jpg
lightgallery: true
mathjax: false  # Enable per-post for math content
```

## Deployment

The site deploys to GitHub Pages. After running `hugo`, commit the `public/` directory and push to trigger deployment.
