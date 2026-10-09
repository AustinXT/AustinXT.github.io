# 002 · 初始化规则与本地边界初审

## 范围和实际执行

2026-10-09，只检查本轮新建的初始化文档、四个技能、Python 规则、Git 忽略和只读 CI。检查器不遍历旧原件，测试仅创建并清理自有临时夹具。本地新上下文从原件保全与隐私、确定性规则攻击、方法状态机三个对抗角度初审；它仍是同谱系，不是跨谱系方法评审。

## 初审发现、复现与修复

| 级别 | 明确触发条件 | 修复及验证 |
|---|---|---|
| P1 | 强制暂存 `.env` 或 `.env.production.local`，初版只拦 `.env.local` 与 `.key` | 统一拦 `.env` 与所有 `.env.*` 的索引路径，补忽略保护和两条反例 |
| P2 | 将完整旧仓库强制暂存为 gitlink，索引路径恰为 `vault/raw/05blog`，没有末尾斜杠，初版仅判断内部文件前缀 | 同时拦精确根路径和内部前缀；用临时夹具 `update-index --cacheinfo 160000,...` 构造 gitlink 反例，不创建真实项目提交 |

**未修复时的实际回归**：20 项运行，3 项失败；名称为 `test_dotenv_force_tracked`、`test_dotenv_variant_force_tracked`、`test_reference_gitlink_tracked`，断言均为预期拒绝未出现。其他原有 17 项通过。失败只发生在夹具，没有读取实际密钥或暂存实际原件。

**修复后的实际回归**：20 项全部通过。原件、敏感文件索引保护同时覆盖忽略配置被强制绕过的情况；新项目实际 Git 索引为空，原件不在本项目版本库。

## 最终本地检查

| 检查 | 实际结果 |
|---|---|
| `bash scripts/check-tools.sh` | 当前验证底座通过，Python 精确版本匹配；Hugo 未安装但当前不依赖 |
| `python3 -I scripts/check-manifests.py .` | 两份清单通过，识别四个方法 |
| `python3 -I scripts/check-system.py` | 结构、实体、独立 Git、原件与 dotenv 保护通过 |
| `python3 -I scripts/test-check-system.py` | 20 项全部通过，约 0.76 秒 |
| `bash -n scripts/check-tools.sh` | shell 语法通过 |
| 四次 `42plugin __ validate skills/<name>` | 全部 valid，无 errors / warnings |
| `git check-ignore` 与 `git ls-files --stage` | 原件及 dotenv 系列被忽略；实际索引为空 |
| Git 与移动收尾 | 新项目没有 remote 或提交；旧 HEAD 与工作区状态仍同移动前，旧路径不存在 |

意向三问的独立证据见 `001_intent-smoke.md`，移动证据只在 `../research/001_reference-source.md`，本报告不复制原文或保存旧正文。

## 尚未验证、没有执行

- 负责人尚未确认方向或定标；方法没有跨谱系放行，本地初审两个发现修复不等于所有质量问题均不存在。
- 未在 GitHub 运行 CI；只已运行本地等价规则，配置没有构建、上传或部署步骤。
- 网站框架、依赖锁、真实构建、参考站在线体验、旧 URL 完整映射、正文事实和素材权利均待 research / proto。
- 没有把工具存在当账号权限，没有安装、外发、付费、发布、提交或推送。
- 没有对旧原件做全量哈希、密钥或个人数据扫描；本地忽略和旧 Git 历史不证明未提交材料已异地备份。

结论：本地初始化底座及上述修复验证完成，保留方向确认、跨谱系授权和人的作品定标为接续门槛，不启动网站成品制作或批量迁移。
