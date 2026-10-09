# 智能时代蛮子 · 博客

独立个人博客工程；方向唯一正本为 [`.42cog/intent.md`](.42cog/intent.md)，当前草稿待负责人过目。实际进度见 [`state/board.md`](state/board.md)。

## 从这里开始

1. 看意向书的收敛方向，认可或修改它。
2. 按 [`skills/README.md`](skills/README.md) 接续四步方法；方法尚待跨谱系对抗性评审，不开始网站成品制作。
3. 先读 [旧博客来源索引](docs/research/001_reference-source.md)，再按需看原文，不把整个旧库带入上下文。

## 六组

| 组 | 位置 | 职责 |
|---|---|---|
| 开工手册与规约 | `CLAUDE.md`、`.42cog/`、`specs/`、本地 `.git` | 指令、身份与标准 |
| 真相源与参考 | `vault/`、`notes/`、`resources/` | 自有原件、核验事实与他人参考 |
| 脚本与扩展 | `scripts/`、`skills/`、两份插件清单 | 方法与确定性验证 |
| 作品 | `src/` | 新网站模块与获选文章；当前仅说明 |
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

当前只锁初始化验证底座；不安装任何工具，不执行原件中的脚本。网站框架、构建命令、域名与部署目标待研究，当前没有网站构建／上线成功的结论。

本地 Git 尚未提交、未配置 remote；被忽略的旧原件尤其是未提交文件需要单独确认异地备份。本项目未自动提交、推送、外发或发布。
