---
name: pr-ready
description: Use BEFORE opening any PR. Runs the full pre-PR SOP - loads relevant invariants from MEMORY, spawns 3 parallel
  adversarial reviewers (sibling / concurrency / boundary) that write findings to disk, runs /simplify, and emits a P1/P2
  audit table for the PR description, then runs the formal Codex/GLM dual-lineage review on one frozen snapshot. Use whenever
  the user says "开 PR" / "提 PR" / "ready to merge" / "review my diff" / "pr-ready" / before any commit-and-push sequence.
metadata:
  author: zhiping
  title: PR 前 SOP 闸门（Codex/GLM 双谱系评审）
  description_zh: 开 PR 前的统一 SOP 入口 —— 模版配置式：加载项目模版的 invariant 触发表/评审维度/验收命令 + 派生 3 个对抗式 reviewer 并行 audit + 跑 simplify + Codex/GLM
    双谱系正式评审 + 生成 P1/P2 评审表
  version: 1.0.1
  license: 42plugin-team
  tags:
  - pr
  - review
  - audit
  - sibling
  - concurrency
  - boundary
  - sop
---

# /pr-ready — 开 PR 前 SOP 闸门

**manzi-blog 适配入口**：先读项目 `CLAUDE.md`、`.42cog/` 四份、`state/board.md` 与 `state/memory/MEMORY.md`。
项目模板与领域约束统一在 [项目适配](templates/manzi-blog.md)，基线和完整测试命令统一在
[项目配置](references/project.config.json)。项目规约与本轮明确授权优先；迁入技能不扩大提交、推送、外发、合并或发布权限。


**目标**：把历史平均 4–8 轮 PR 评审压到 2–3 轮，让 P1 在 平台 PR 创建 之前清零。
**触发**：准备开 PR/合并/推送、或说 `/pr-ready`。
**纪律**：本 skill **不直接改代码**——只产 audit 表 + 建议 patch，让主 session（用户监督下）决定是否应用；唯一例外是同步目标分支时解决合并冲突（见「同步目标分支」）。

## Step 0｜加载项目模版
方法论项目无关；**项目专属部分外置为模版**。检测项目（git remote/仓库名/AGENTS.md）→ 加载 `templates/<project>.md`（你为自己项目建的专属模版，可选）；无匹配 → `templates/generic.md`（读本项目 AGENTS.md 及其引用的开工协议/memory；缺失时读 CLAUDE.md）。模版提供三样后续引用：**§invariant 触发表**（diff 涉及哪类文件→cat 哪些 memory）、**§评审维度**（并发/资源安全、边界的项目特定清单）、**§验收命令**（fmt/lint/test）。

## Step 1｜状态预检（失败即中止）
`<基线>` 优先使用本次显式配置，否则取 project.config.json 中的 `origin/dev`；先 `git fetch origin`。
```bash
git status                       # 必须 clean 或仅 staged
git diff --name-only <基线> # 要审的文件集
git log <基线>..HEAD --oneline | head -20  # 进 PR 的 commit
```
有未 staged 改动 → 报错「先 staged 再跑」（避免审到不进 PR 的代码）；`git diff --name-only <基线>` 为空 → 短路「无改动可审，是否 rebase/切分支？」。

### 同步目标分支
正式评审前及合并前刷新目标分支，检查工作分支是否落后或有未解决冲突；普通同步与冲突处理自动继续。
- 只在具名工作分支操作，不直接写 dev/main；有在途修改先明确归属并保留，不 stash/丢弃/覆盖他人工作。
- 无未决冲突时普通 merge 同步目标，不 rebase 已发布分支、不 force push；已有 merge/rebase 先读取操作状态，完成现有冲突，不启动嵌套操作。
- 逐个读取 base/ours/theirs 保持双方有效变更；`state/board.md`、`state/changelog.md` 的独立条目全部保留、原文逐字节不改，按本项目账本现有日期格式保留；只有项目确有编号锚点规约及检查脚本时才用锚点／check-ledger；不整体 ours/theirs。生成文件经唯一生成器重建，不手改派生 hash/schema；冲突修复不顺手扩大范围。
- `git diff --name-only --diff-filter=U` 须为空并跑必要验证；同步或修复使旧评审失效，冻结新快照后重跑 Step 5。目标在同任务内重复漂移三次则报告，不强推或强制合并。

## Step 2｜载入相关 invariant
对照 Step 0 模版 **§invariant 触发表**，按 diff 文件路径/概念决定 `cat` 哪些 memory（generic 则读本项目 AGENTS.md / 开工协议的「改代码前必读 MEMORY 关键词触发表」，无则跳过）。把摘要（非全文）写 `_tmp/YYYYMMDD-pr-ready/invariants.md`（省 token）。

## Step 3｜派生 3 个并行 Explore 子代理（**强制写文件**）
**硬约束**：每个子代理把详细 finding 写 `_tmp/YYYYMMDD-pr-ready/<role>.md`；主 session 只读返回的 **≤200 字摘要 + 文件路径 + P1/P2 计数**（防 token 黑屏）。一条消息 3 个 Agent 调用（subagent_type=Explore）。先 `git diff <基线> > _tmp/YYYYMMDD-pr-ready/diff.patch`。

**Agent 1 · sibling-auditor**：识别 diff 里所有反模式签名（raw SQL UPDATE / hardcode 列表 / db.transaction 体内 await / FOR UPDATE / 视图 WHERE / 文案常量 / 跨语言 enum…）→ 每个签名 grep 整个 repo 列出全部 `path:line` sibling → 标注需同步修复/已修复/故意豁免。输出 `sibling.md`（签名→sibling 表→修复建议三段）。

**Agent 2 · concurrency / resource-safety adversary**：扮挑剔 reviewer 找**并发/原子性/资源安全**漏洞。输入含 `invariants.md`。**必查清单 = 模版 §评审维度·并发/资源安全**：
- **Web/DB 型**（带数据库的 web 服务）：db.transaction 体内非-tx await / CAS WHERE status + .returning() / FOR UPDATE vs FOR NO KEY UPDATE / SELECT→effect→UPDATE race / Worker shutdown / 配额预扣失败 reconcile。
- **Rust 系统型**（本地 CLI / 库 / 推理引擎）：`unsafe` 不变量 / `Send`+`Sync` 跨线程 / FFI 边界与生命周期 / RAII 临时资源清理(含失败路径) / panic 安全与错误传播 / 数据竞争与锁顺序。
- **其它**：读本项目 AGENTS.md / 开工协议的并发/资源 invariant；没有就用「**共享状态 + 失败路径 + 资源释放**」三问。
输出 `concurrency.md`。

**Agent 3 · boundary-critic**：扮极端边界 reviewer，必查：① 空数组/空 diff/空串/undefined/null ② 零额度/零长度/零文件 ③ 极大输入(>500MB/>10k 行/>1M 字符)是否 cap、是否在 alloc 前校验 ④ 边界数学(bit_idx%8、MB/MiB 混淆、off-by-one) ⑤ tri-state Option<bool> vs bool ⑥ 字段族跨文件漂移(枚举/白名单/上限多处 hardcode) ⑦ 派生上限 vs 上游库默认 cap(如 tiff 256MiB < 项目 400MB) ⑧ binary fixture 是否真实 binary（非「ColorType+字节值」伪造对）。输出 `boundary.md`。

## Step 4｜跑 `/simplify`
派完 3 子代理后（并发），主 session 对 staged diff 做简化检查（有 `/simplify` 就调用，否则直接检查死代码、重复与过度设计），识别可删死代码/可合并重复/可简化过度工程，输出 `_tmp/YYYYMMDD-pr-ready/simplify.md`。

## Step 5｜正式 Codex/GLM 双谱系评审
开发谱系是 Claude（Anthropic）；Step 3 的子代理和主 session 自审都属同谱系，不能冒充独立评审。正式评审只用 Codex（OpenAI，Codex CLI）与 GLM-5.3[1M]（智谱，OpenCode）两个谱系，每轮在同一冻结快照上并行审，没有备选池和单独终审轮。
配置唯一正本 [references/review.config.json](references/review.config.json)：具体模型、推理档位与服务档以本项目配置为准；GLM 使用 OpenCode（无 fast 开关）。执行前读 [references/review-protocol.md](references/review-protocol.md)。

把需求、验收标准、批准非目标、invariant 出处、调用方/sibling 上下文和既有测试证据写成批准外发的文件（外发前排除密钥/隐私，无外发授权则停），再调用（`<本技能目录>` 为加载本技能时给出的 Base directory，路径一律绝对）：
```sh
node "<本技能目录>/scripts/run-review.mjs" --repo /absolute/repo --base <基线> --prompt /absolute/context.md [--verify-evidence /absolute/evidence.json]
```
- 调用层经 stdin 喂提示词，不插值进 shell；两路是独立 Harness 进程、全工具禁用，只审所给文本证据，不承接作者会话、不共享彼此结论。证据不足先补材料。
- 选材：完整 tracked diff 与代码源码；>32KB 的已改文本文件只附可逐字节重建的宽 diff + 全文哈希；`state/board.md`、`state/changelog.md` 只发本次涉及的完整条目；`.pr-ready-generated.json` 登记的生成物只发复现回执。超限报错，不截断。
- 提供 `--verify-evidence` 时两路都须返回 `verify_honesty`，缺失即协议失败。
- 放行：同快照两份有效结果且无 P0/P1/P2；负面结论逐条核验、修正或给批准豁免，修正后在新快照上整组重跑。每路 CLI/协议失败最多重试一次，仍失败转人工，不换模型绕过；`--reviewer` 单路诊断不构成通过。
- 汇总 JSON 存调用层返回的 `artifactDir`。

## Step 6｜汇总生成 PR description 草稿
读 4 份 audit 文件与 Step 5 汇总 JSON 生成 `_tmp/YYYYMMDD-pr-ready/pr-description.md`：
```markdown
## 改了什么
<一句话>

## Invariant Audit 表
| Invariant | 是否守住 | 证据 |
|---|---|---|
| <按 Step 2 cat 的 invariant 逐条列> | ✅/❌ | `path:line` |

## Sibling Audit
<sibling.md 摘要 + 修复表>

## 边界覆盖
<boundary.md 关键命中>

## /simplify 应用情况
<哪些采纳 / 哪些故意未改>

## Codex/GLM 双谱系评审
| 谱系 | 模型 / Harness | 快照 | 结论 | P0–P2 |
|---|---|---|---|---|
| Codex | 配置中的模型与档位 / Codex CLI | <snapshot> | approve/… | 0 |
| GLM | 配置中的模型与档位 / OpenCode | <snapshot> | approve/… | 0 |

## 验收
- [ ] <模版 §验收命令逐条 checkbox：cargo fmt --check/clippy/test，或 bun typecheck/test>
- [ ] <feature-specific 验收点>
```
未实际执行的测试不得打勾。

## Step 7｜主 session 总结（≤200 字）
四句：① P1 命中 N 个、P2 命中 M 个（子代理汇总）② Codex/GLM 两路结论与快照（是否同快照无 P0–P2）③ 详情 `_tmp/YYYYMMDD-pr-ready/{sibling,concurrency,boundary,simplify}.md` 与 `artifactDir` ④ 草稿 `pr-description.md`。让用户决定「修 P1 后重跑」还是「直接开 PR 贴表」。

## 边界

| 维度 | 处理 |
|---|---|
| 二次执行 | `_tmp/YYYYMMDD-pr-ready/*` 全覆盖（当前 diff 快照，不累积） |
| 子代理超时 | 主 session 等 ≤2 min，超时报错退出，不部分提交 |
| 空 diff | Step 1 短路 |
| 超大 diff(>500 行) | 按目录/文件类型分批，每批独立产 audit 表 |
| 跨语言 PR | 每子代理按文件后缀分流加载不同 invariant 子集 |
| PR 已开 | Step 6 只出更新草稿，不自动 PATCH（远端写入须授权），不重开 |
| 评审 Harness 失败 | 每路重试一次，仍失败转人工，不降为单路、不换模型补位 |

## 不做的事
**不**直接 commit/push/gh pr create（mutation 由主 session 在用户监督下执行）；**不**修复 P1（只建议）；**不**跑 cargo test/bun test（那是验收 checkbox，非 skill 职责，避免超时）。
