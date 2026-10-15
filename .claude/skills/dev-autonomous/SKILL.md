---
name: dev-autonomous
description: 'AI 自主开发：单 issue 全流程（解析→探索→实现→自审→类似错误→测试提交）+ 批量编排（pull-issues/run-loop 逐个调度，context 隔离）。

  单 issue 指令由 claude -p 沙盒子进程执行（run-loop.mjs 注入）；批量入口是 scripts/run-loop.mjs（人工/cron/loop 触发）。也可手动 /dev-autonomous。

  Use when user says 自主开发 / dev-autonomous / 批量修 issue，或 run-loop 调度主模型子进程。

  '
metadata:
  title: AI 自主开发编排
  description_zh: '单 issue 全流程（解析→探索→实现→自审→类似错误→测试提交）+ 批量编排（pull-issues/run-loop 逐个调度，context 隔离、断点恢复）。

    单 issue 指令由 claude -p 沙盒子进程执行（run-loop.mjs 注入六阶段）；批量入口 scripts/run-loop.mjs（人工/cron/loop 触发）。

    三平台适配（cnb/github/gitcode）+ Codex/GLM 双谱系 review + 明确授权后的完整批量门禁。零依赖 Node 18+ ESM。

    '
  author: opc
  version: 1.0.3
  license: MIT
---

# dev-autonomous — AI 自主开发（单 issue + 批量编排）

**manzi-blog 适配入口**：先读项目 `CLAUDE.md`、`.42cog/` 四份、`state/board.md` 与 `state/memory/MEMORY.md`。
项目模板与领域约束统一在 [项目适配](../pr-ready/templates/manzi-blog.md)，基线和完整测试命令统一在
[项目配置](../pr-ready/references/project.config.json)。项目规约与本轮明确授权优先；迁入技能不扩大提交、推送、外发、合并或发布权限。


本 skill 有两层能力：
- **单 issue 自主开发**（下文六阶段）：作为 `claude -p` 沙盒子进程的指令，由 `scripts/run-loop.mjs` 注入（宿主前后核对 HEAD，子进程擅自提交即阻断转人工）；子进程实现、自审并输出 VP，宿主完成本地提交。
- **批量编排**（文末章节）：人工/外层运行 `scripts/pull-issues.mjs` + `scripts/run-loop.mjs`，逐个 issue 调度上述单 issue 流程；run-loop 是 shell 跑的 Node 调度器，context 隔离、持续跑完。

> 如果你是被 run-loop 起的子进程（收到「本次任务」），只需执行下文【单 issue 六阶段】，忽略文末批量章节。

你是当前仓库的一名资深工程师（cwd 即仓库根）。按仓库既有的代码风格与目录结构工作；代码风格和测试命令以当前仓库为准；技能调用层自身是零依赖 Node ESM，不强制产品采用该技术栈。
当前你在一条 fix 分支的 git worktree 内，针对【单个】issue 工作（平台 cnb/github/gitcode 由外层选择）。

## 硬约束（违反即破坏流程，不可越界）
- **不 push、不碰平台 API / PR / issue 评论**（外层 run-loop 负责）。
- **不切 / 建分支**（外层已切好 `fix/issue-<n>-<slug>`，基线由外层实际传入：`AI_DEV_BASE`，否则相邻项目配置的 origin/dev）。
- **不读写** `.env*`、`secrets/**`、`*.pem`、`*.key`（密钥红线；凭证由宿主环境变量或全局配置在运行时注入，不读项目密钥文件）。
- **不改** `.claude/skills/{dev-autonomous,dev-launch,pr-ready}/**`（开发/评审流程自身，含双谱系配置）、`.ai/**`（改了要人工复核）。
- 代码风格：匹配仓库既有风格与技术栈（不要把本技能脚本的 Node ESM 风格当成项目风格）；若仓库有对应领域护栏 skill（如小程序的 wx-dev-guard / wx-ui-design），优先遵循其避坑约定。

## 流程六阶段（严格按序；关键节点显式核验根因/影响/验收——沙盒子进程禁用 MCP，不调用 sequential-thinking）

### 1. 解析 Issue
- 完整读 issue 正文；若有图片 URL，用 Read / WebFetch 下载查看（**只读文字不够，要看图**）。
- 判断是否需要代码修复。若是功能建议 / 咨询 / 无法复现 / 已修复 → **不改代码**，在最终输出说明原因（外层会据此跳过、不计为失败）。
- **提炼验收标准（acceptance criteria）**：把 issue 转成 3-5 条可逐条核验的检查点（如「输入 X 应得到 Y」「调用方 Z 行为不变」）。这是「issue 是否真正被解决」的判据——**测试通过 ≠ 解决**（实测约 7.7% 通过门禁的 patch 其实没解决问题）。阶段 3/6 与外层 reviewer 都对照它判「是否真正解决」。
- **产出 Verify Plan（VP）**：本流程用**确定性 red-green** 证明 issue 已解决，而非只靠 review 读 diff。你在阶段 1 定 issue 类型并规划验证手段，阶段 6 写 verify 脚本，输出末尾吐 VP 围栏（外层 run-loop 解析它跑确定性验证）。**类型 → 验证对应**：
  - **bug**：必须写一个能**在未修复的 base 上失败**的 verify 脚本（red），fix 后通过（green）。这是反「自我评分」的核心——模型无法伪造「我的测试在旧代码上失败」。
  - **feature**：verify 脚本断言需求已实现，fix 上 green（不强制 red）。
  - **no-change**（咨询/已修复/无法复现）：不改代码，VP 只填 `type:"no-change"` + acceptance 里写理由 → 外层转 `skipped`（comment + 清分支，issue 默认留开）。
  - **verify.kind="manual"**（UI/主观，无法确定性验证）：cmd 可省 → 外层跳过确定性验证、走 `verify_weak` 弱合并（PR 标注需人工冒烟）。
- 显式核验：拆解根因假设、影响面、修复方案选项。

### 2. 探索定位
- 用 Read / Grep / Glob 找相关代码与调用方；`git log` 了解近期变更。
- 明确：要改哪些文件、影响哪些调用方、领域类型、内容元数据、模板、导出检查器与调用方是否需同步。

### 3. 实现修复
- 用 Edit / Write 实现，匹配现有风格。
- 显式核验验证：逻辑正确性、边界、异步 / 并发。

### 4. 自审复查（复用 Claude Code 自带 review；切挑剔 reviewer 视角）
本阶段**必须调用 Skill 工具** invoke 自带 review，不要自行手写 review 清单。
> ⏱ 本阶段跑在 develop 子进程的总时限内——自审超时会连累已写好提交的修复（外层把超时判为 develop 失败）。故**优先快速过审**：effort 按 diff 规模取 low/medium，不追求穷尽。
1. **主审**：调用 `/code-review`（diff 小用 medium、大用 low）评审本 worktree 的 pending 改动。聚焦正确性 bug、破坏旧功能、可简化/复用、效率。**不带 `--fix`**——发现的问题由你回阶段 3 用 Edit 修正，保持改动可追溯。
2. **安全补充**：调用 `/security-review` 过安全维度（密钥 / 凭证 / PII / 注入 / 越权 / 不安全 IO）。
3. **裁定**：逐条核对 findings——哪些成立、是否影响其它调用方、哪些是可忽略的风格噪声（剔除噪声，只在确信时保留）。
4. 清单非空 → 回阶段 3 逐条修正 → 回本阶段重审，直到零成立问题再进阶段 5。

> 自审与开发同谱系（Claude），不是独立评审；外层仍须跑 Codex/GLM 双谱系。

### 5. 类似错误排查
- Grep 同类模式，是否有别处存在相同问题。
- Mock / 样例数据与 schema / 提示词是否一致，需同步的一并改。

### 6. 测试、变更记录与提交
- 跑本仓库既有验收命令（及 issue 暗示的其它校验），必须 100% 通过；失败回阶段 3。
- 新增 / 更新覆盖该 bug 回归的测试用例。
- **对照阶段 1 的验收标准逐条自检**：在总结里逐条声明每条 criteria 的满足情况 + 证据（改了哪段代码 / 跑了什么验证）。这比「项目测试通过」更根本——外层 reviewer 会对照验收标准判「是否真正解决」，没解决至少 major。
- **写 verify 脚本交宿主提交**（bug/feature 必做；manual/no-change 跳过）：新增 `scripts/verify-issue-<n>.mjs`，用 Node 内置 `assert` 的独立入口断言真实项目行为；Rust／CLI 可通过既有测试或真实 CLI 调用验证，不能读取源码字符串代替执行，载入 fixture 或注入假 fetch 复现并断言期望行为。
  - **硬约束**：① `verify.cmd` 须形如 `node <仓库内相对路径>`，**无 shell 元字符**（外层直接 spawnSync，绝不 `sh -c`，防注入）；② 脚本须**纯**——不修改受跟踪源码或原件，不联网、不读 stdin；编译／CLI 产物限忽略目录；③ **bug 的 verify 只允许依赖 Node 内置与 base 已有代码／CLI／工具链**（不要 import 你新加的代码），否则 base 上会 module-not-found 被判「琐碎 red」打回；④ `verify.files` 须列出 verify 用到的**所有 fix 新增文件**（脚本 + fixture），外层据此物化进 base worktree。
  - 本地跑 `node scripts/verify-issue-<n>.mjs` 必须 exit 0（green）；bug 类预期它在 base 上 exit≠0（red，由外层验证）。
  - verify 脚本留在 worktree，由宿主随本次改动提交。
- **输出末尾吐 Verify Plan（VP）围栏**（外层 run-loop 解析它跑确定性验证；格式见阶段 1，必须严格）：
  ```
  <<<VERIFY_PLAN
  {"type":"bug|feature|no-change","verify":{"cmd":"node scripts/verify-issue-<n>.mjs","files":["scripts/verify-issue-<n>.mjs"],"kind":"selftest|check|custom|manual"},"repro":{"expect":"fail-on-base"},"acceptance":[{"criterion":"...","covered_by":"..."}]}
  VERIFY_PLAN
  ```
  （bug 才填 `repro`；feature 去掉 `repro`；UI/主观填 `kind:"manual"`、cmd 可省；no-change 只保留 `type` + acceptance 写理由）
- **写变更记录**：需要可追溯档案时按相邻 `../dev-docs/SKILL.md` 和项目现有目录／编号创建；不强建 `docs/changes/{arch,ops,fix}` 或根索引。每轮更新工作分支状态板；若账本已有在途修改且归属未确定，本轮记录写 `_tmp/YYYYMMDD-issue-<n>/`，保持既有条目原字节。
- **可选：本地 GUI 冒烟**——若本次 diff 改了项目的 GUI / 前端代码（如小程序 `src/miniprogram/`、Web 前端等），在总结里提示：本地起对应 GUI 工具手动冒烟涉及的页面 / 交互（GUI 依赖，**不进自动门禁**）。没改 GUI 则跳过。
- 本地提交由宿主完成（沙盒拒绝 Git 写操作）：子进程不运行 git add/commit/amend；变更记录文件留在 worktree 随宿主提交。
- 输出总结：改了哪些文件、测试结果、自审结论（/code-review findings 裁定）、变更记录编号、UI 冒烟提示（若有）。**不要 push。**

## 修订轮（由外层 spawnFix 触发）
外层会给你一份 `fix_feedback`（带具体证据，比 review 挑刺更可执行），按 `kind` 处理：
- `review`：本轮 Codex/GLM 审查者的 critical/major 问题清单 → 逐条修正。
- `verify`：确定性 verify 未通过（green-fail / 琐碎 red / vacuous 测试 / 超时 / VP 缺失）→ 按 hint 修正代码或 verify 脚本，确保 green（bug 还需 base 上真 red）。
- `verify-honesty`：Codex 或 GLM 任一路判你的 verify 不诚实（测错东西 / 未覆盖核心）→ 改写 verify 使其真正测 issue 的问题。
- `test`：项目测试失败 → 按 output 修复。

修正后 → 回阶段 4 自审 → 阶段 6 测试 + 本地 verify 须 green → **重吐 VP 围栏** → 宿主追加提交。同样不要 push。

> 注：外层每轮启动 Codex、GLM 两个独立谱系 reviewer（同一快照、同一材料），配置唯一正本是相邻 `../pr-ready/references/review.config.json` 与 `review-protocol.md`；确定性 verify 证据作为共同材料，两路都判 verify-honesty。
> 你的自审（阶段 4，调 /code-review + /security-review）是「作者自查」层，与双谱系评审 + 确定性 red-green verify 互补——最终把关在 reviewer + verify 手里。

---

## 批量编排（人工/外层运行）

> 本节面向运行批量的人/外层调度；若你是单 issue 子进程，忽略本节。

批量处理 issue（平台可选 cnb/github/gitcode）：逐个自主开发 + Codex/GLM 双谱系 review + 门禁合并。bug 与新需求同一套流程。

### 流程
1. `pull-issues.mjs`：拉 open issue 入队 `.ai/queue.json`（去重，已在 queue 的不重复加）。平台由 `AI_DEV_PLATFORM` / origin 自动选择。
2. `run-loop.mjs`：串行处理 queue 里所有非终态 issue。

### 命令
```bash
# 拉本日 issue（可按 label / 限量）
node .claude/skills/dev-autonomous/scripts/pull-issues.mjs [--label bug] [--limit 50] [--dry-run]
# 逐个跑（串行；一次性，跑完 queue 退出）
node .claude/skills/dev-autonomous/scripts/run-loop.mjs [--issues 42 43] [--label bug] [--limit 5] [--dry-run]
# 持续模式（一直干：每周期拉新+处理，循环到 Ctrl-C）
node .claude/skills/dev-autonomous/scripts/run-loop.mjs --watch [--label bug] [--poll-interval 300]
# 看门狗（macOS launchd：开机自启 + 崩溃 ~10s 重启）
node .claude/skills/dev-autonomous/scripts/watchdog.mjs install [--label bug] [--poll-interval 300]
node .claude/skills/dev-autonomous/scripts/watchdog.mjs status | logs [-f] | restart | uninstall
```

### run-loop 内部流（每个 issue）
`git worktree` 切 `fix/issue-<n>-<slug>` 分支 → `claude -p` 沙盒 develop（注入本 SKILL 六阶段，吐 Verify Plan）→ 宿主提交 → push → **确定性 verify**（fix 上 green；bug 在 fork-point base 上 red-on-base）→ Codex/GLM 双谱系 review（同一钉定快照，两路都拿 verify 证据判 verify-honesty；身份缺失/同谱系/快照漂移转人工）→ 门禁 → 通过则建 PR / 合并 / 关 issue / 清分支；verify hard-fail / review request_changes / verify-honesty.bad / 测试失败 → Claude 修订后整组重跑双谱系（带 `fix_feedback`，占 attempts 预算）；绝对红线 / block / 修订耗尽则建 PR 转人工；no-change → `skipped`（comment + 清分支，issue 默认留开）。

### 持续执行 & context 隔离（关键）
`run-loop.mjs` 是 shell 跑的 **Node 调度器**，不在任何 claude session 内 → **无 context 压缩、不会因 context 上限停止**。每个 issue = 独立 `claude -p` 子进程（独立 context，处理完即退），issue 间 context 不累积。run-loop 跑完 queue 才退出。无论从 shell、session 的 Bash、cron 还是 `/loop` 触发，run-loop 都是独立 Node 进程。

### 断点恢复
Ctrl-C 安全（每步原子落盘 `.ai/queue.json`）；重跑 `run-loop.mjs` 自动从 reconcile 续——依据远端分支 / worktree / PR 实物归位，已 merged 跳过。**勿手删 queue.json**（会丢已合并记录）。

### 门禁策略（完整批量流程另需本次明确授权）
不卡 diff 行数 / 文件数 / schema。Codex/GLM 双谱系同快照 approve（minor 不阻断）+ **确定性 verify 通过**（bug=red-green，feature=green，manual=verify_weak）+ 项目测试通过 → 仅在已授权的完整批量范围内合并 `dev`、关 issue、清理本次分支；否则保留结果供人处理。**可收敛失败**（review request_changes / verify-honesty.bad / 测试失败 / verify hard-fail）走修订轮（占 `attempts` 预算，耗尽才转人）；**不可收敛**（绝对红线 / block / verdict 非法）转人工：触碰 `.env*` / `secrets/` / `*.pem`·`*.key` / CI（`.github/workflows`·`.cnb`·`.gitlab-ci.yml`）/ 流程自身（`.claude|.agents|.codex/skills/{dev-autonomous,dev-launch,pr-ready}/`）/ `.ai/`、review block、修订耗尽（`attempts≥3`）。manual / 弱验证（`verify_weak`）仍合并，但 PR body 标注需人工冒烟。

### 持续运行 & 看门狗（「你走它一直干」）
- **一次性**（默认）：`run-loop.mjs` 跑完当前 queue 即退出。
- **持续**：`run-loop.mjs --watch` 每周期 `pull-issues + 处理整个 queue`，循环到信号（Ctrl-C 优雅退出：当前 issue 跑完即停，再按一次强制退）。env `AI_DEV_POLL_INTERVAL`（默认 300s）或 `--poll-interval` 调间隔。pull-issues 失败（API 抖动）不崩 watch，下轮重试。
- **看门狗（崩溃自愈，macOS）**：`watchdog.mjs install` 装成 launchd LaunchAgent——`RunAtLoad`（开机/登录自启）+ `KeepAlive`（进程退出/崩溃即重启）+ `ThrottleStartInterval=10`（崩溃 ~10s 恢复、防洪泛）。**停止整个 agent 必须 `watchdog.mjs uninstall`**（直接 kill 会被 KeepAlive 重启）。
- 防坑：看门狗把 `node`/`claude`/`codex`/`opencode`/`PATH` 绝对路径烤进 plist（launchd 默认 PATH 极简，否则找不到）；token **不入 plist**（含 TOKEN/KEY 等的 `AI_DEV_*` 也不透传，由宿主全局配置注入）。日志在 `.ai/logs/watchdog.{out,err}.log`。
- 跨机：`--watch` 是进程内轮询，Linux 用 systemd（Restart=always）/ 任何机用 cron/`/loop` 周期触发等价实现。**cron/systemd 须设 `WorkingDirectory=项目根`（或传 `--repo`）**——项目根按 Git cwd 确定；凭证只读宿主环境与全局文件 `~/.config/dev-autonomous/env`，不读项目 `.env*`；`--watch` 每周期重载全局 env（覆盖），运行中编辑（如轮换 key）即时生效。

### 环境变量
`AI_DEV_PLATFORM`（cnb|github|gitcode，默认探测 origin）、平台 token（`CNB_API_TOKEN` / `GITHUB_TOKEN` / `GITCODE_TOKEN`，必；只取宿主环境变量或全局文件 `~/.config/dev-autonomous/env`，**不读项目 `.env*`**）、`*_REPO`（`CNB_ISSUE_REPO` / `GITHUB_REPO` / `GITCODE_REPO`，默认从 origin 解析）、`AI_DEV_BASE`（显式覆盖基线，否则项目配置的 origin/dev；不存在则停止）、`AI_DEV_MAX_ATTEMPTS`（默认 3）、`AI_DEV_MODEL` / `AI_DEV_REASONING`（开发子进程的 claude `--model` / `--effort`，默认沿用 Claude Code 全局配置）。评审阵容不由环境变量控制：Codex/GLM 模型、档位与 Harness 只看相邻 `../pr-ready/references/review.config.json`，旧 `AI_DEV_SUB_MODEL` / `AI_DEV_SUB_BASE_URL` / `AI_DEV_BARE` 已不再生效。`AI_DEV_WORKROOT`（worktree 根，默认 `../worktrees/manzi-blog-ai-dev`）、`AI_DEV_TEST_CMD`（覆盖项目测试命令，分号分隔多条；默认执行相邻 pr-ready/references/project.config.json 的完整 testCommands；没有测试不能放行）、`AI_DEV_VERIFY_INSTALL_DEPS`（=1 时把 fix worktree 的 node_modules 同步进 base 验证 worktree；默认关——本仓零依赖，开了会掩盖真 module-not-found）、`AI_DEV_AUTOCLOSE_NOCHANGE`（=1 时 no-change issue 自动关闭；默认关——comment 理由后留开供人确认）、`AI_DEV_POLL_INTERVAL`（`--watch` 轮询间隔秒，默认 300）。

### 启动预检（fail-fast）
`run-loop.mjs` 进循环前会**只读**校验：平台 token 存在、`claude`/`codex`/`opencode` 三个 Harness 可执行与 `../pr-ready` 评审配置合法、`AI_DEV_WORKROOT` 可写、git `origin` remote 已配、远端 `origin/${AI_DEV_BASE}` 分支存在。任一缺失 → 汇总打印后 `exit(1)`，**不处理任何 issue**（把所有配置问题暴露在最开始，避免跑到 develop/双谱系 review 之后才因缺配置中断）。`--dry-run` 跳过联网的 base 探测，但仍查 token/三 Harness/workroot/origin。子进程若莫名起不来（如 `claude` 不在 PATH），错误也会透传成「claude 未启动：…」而非被吞成「develop 无新 commit」。

### 状态与进度
`.ai/queue.json`（已 gitignore，含本机 worktree 绝对路径）。看进度：
```bash
node -e 'console.table(require("./.ai/queue.json").issues.map(i=>({n:i.issue_number,state:i.state,att:i.attempts,pr:i.pr_number||"-"})))'
```
