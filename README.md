# 智能时代蛮子 · 博客

独立个人博客工程；方向唯一正本为 [`.42cog/intent.md`](.42cog/intent.md)，方向已确认。实际进度见 [`state/board.md`](state/board.md)，原生工程入口为 [`src/site/README.md`](src/site/README.md)。

## 从这里开始

1. 看意向书与状态板，按当前放行范围接续，不重复已确认的选择。
2. 按 [`skills/README.md`](skills/README.md) 接续四步方法；技术修订见 [取舍卡](docs/research/002_blog-direction-decision.md)，当前只放行最小工程壳，真实正文与人定标另行推进。
3. 先读 [旧博客来源索引](docs/research/001_reference-source.md)，再按需看原文，不把整个旧库带入上下文。

## 六组

| 组 | 位置 | 职责 |
|---|---|---|
| 开工手册与规约 | `CLAUDE.md`、`.42cog/`、`specs/`、本地 `.git` | 指令、身份与标准 |
| 真相源与参考 | `vault/`、`notes/`、`resources/` | 自有原件、核验事实与他人参考 |
| 脚本与扩展 | `scripts/`、`skills/`、两份插件清单 | 方法与确定性验证 |
| 作品 | `src/` | 阅读布局定标原件与独立原生工程壳；当前无整理正文 |
| 状态与文档 | `state/`、`docs/` | 接续、来源、取舍与评审 |
| 过程材料 | `_build/`、`_tmp/`、`_archive/` | 本地忽略，不作为唯一备份 |

## 旧项目与新项目

旧博客身份及位置只登记在 [`.42cog/meta.md`](.42cog/meta.md)。它已经**完整移动，而非拷贝**，保留原有 `.git` 与未提交改动；整目录被新仓库忽略，只读参考，不直接构建为新站。

未来只选择部分文章重新整理。参考站提供阅读与内容组织启发，不提供复制素材的权限。品牌与多渠道协同继续由上游项目负责，本项目承担博客工程。

## 本地检查

从本项目根运行：

```bash
bash scripts/check-tools.sh
python3 -I scripts/check-manifests.py .
python3 -I scripts/check-system.py
python3 -I scripts/test-check-system.py
```

上述命令只验证初始化底座；新工程依赖、lint、类型、构建与导出检查见 [`src/site/README.md`](src/site/README.md)，旧原型规则保留。依赖安装须明确授权，不执行参考原件脚本；本地构建不代表上线。

本地 Git 与远端身份见 [`.42cog/meta.md`](.42cog/meta.md)；当前基线已按明确授权本地保存，不推导新增成果提交或发布授权。被忽略旧原件尤其未提交文件的异地备份仍须单独确认。
