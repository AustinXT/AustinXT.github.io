# Codex/GLM 双谱系评审调用及证据契约

模型/Harness 默认只定义在 `review.config.json`。谱系按实际提供方，Harness 单独记录。
唯一调用层是本技能目录下的 `scripts/`（项目内 `.claude/skills/pr-ready/scripts/`），dev-launch 经相邻目录 `../pr-ready/` 复用。Claude Code 负责开发主流程（Anthropic 谱系）；评审只用另外两个谱系：Codex（OpenAI）与 GLM（智谱）。

## 配置与认证

`AI_REVIEW_CONFIG` 可指向完整配置，必须恰好包含 codex/glm 两个不同谱系。模型切换需用户明确授权，每轮两路在同一快照并行启动，没有单独终审轮；不能自动选别名/档位。
开发 `AI_DEV_MODEL` / `AI_DEV_REASONING` 可覆盖 Claude Code 既有默认（分别映射 `--model` / `--effort`），与评审参数分开。
批量开发子进程开启 Claude Code 沙盒（写入限于 worktree，禁止非沙盒命令，外联被拒），按任意层级拒读密钥（沙盒对 Bash 同样执行）。Git deny 规则只按命令前缀匹配，实测 `sh -c "git commit"` 仍能写 worktree 元数据，因此宿主在子进程前后核对 HEAD，变化或不可读即失败关闭转人工；Git 本地提交只由已获批外层宿主完成，不放开沙盒。默认模型继承时提交记录明确注明未独立确认，不伪造模型或作者身份；需要精确模型审计时显式设置 AI_DEV_MODEL。

- GLM 默认规格为 `zhipuai-coding-plan/glm-5.3[1m]`（GLM-5.3[1M]）。配置必须显式包含 `contextWindow: 1000000`、`maxOutputTokens: 131072`；调用层将规格映射为 OpenCode 支持的 `zhipuai-coding-plan/glm-5.3`，通过子进程配置注入上下文/输出上限及 `OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX=131072`，避免默认 32K 输出限制截断推理与结论。
- GLM review 固定 high 档位：配置 `variant: "high"`，子进程注入 OpenCode model variant `high: {reasoningEffort: "high"}`，显式 `--variant high`。模型、1M 上下文与输出上限保持原规格。
- Codex 默认评审为 `gpt-6.1-sol` / `high`，`serviceTier: "fast"` 并启用 `fast_mode`（不再显式禁用）。
- Codex 评审从唯一配置读取 `model`、`reasoning` 与 `serviceTier`，分别显式传递模型、`model_reasoning_effort` 与 `service_tier`；自定义配置省略 `serviceTier` 时继承用户档位。
- Codex/OpenCode 复用既有登录，不修改全局账号设置。Codex 评审以本次空临时目录为 `-C`，加 `--ignore-user-config --ignore-rules` 不加载用户配置与规则（用户 MCP 如 node_repl 可绕过 shell 开关读取任意文件），并 `--disable` shell_tool、apps、plugins、浏览器、computer_use、hooks；与 GLM 路一样只审 stdin 证据。2026-10-07 实测：旧参数下 Codex 经 MCP 读到仓外文件，新参数下回答 NO_TOOLS。
- 平台 token 不传入子进程。禁止读取项目 `.env*`、`secrets/**`、`*.pem`、`*.key`；宿主认证只用已有配置或符号引用，不打印凭证。

参数来源：[OpenCode permissions](https://opencode.ai/docs/permissions/)、[运行时配置优先级](https://opencode.ai/docs/config/)、[Claude CLI](https://code.claude.com/docs/en/cli-reference)（开发子进程）。升级后核对 --help，未知参数不能忽略。

主会话前置材料与调用层审计产物都先检查忽略规则，只写入被 Git 忽略的 `.agents/notes/pr-ready/<日期-唯一ID>/`，否则回退 `~/.cache/pr-ready/<项目ID>/`；以调用结果的 `artifactDir` 为准。

## 快照与结果

快照绑定 base commit、HEAD、完整 tracked diff 和工作区状态；新文件先纳入明确 staged 范围。密钥路径在读 diff 前拒绝；超预算报错，不截断洗绿。
共同证据保留完整 diff 与代码；仅两份状态账本 `state/board.md`、`state/changelog.md` 按 diff 的新文件行区间选择完整二级标题条目（包含 blockquote 标题），附原行号、全文件 SHA-256 和省略声明。未变历史不属于代码证据；必要的历史决策/invariant 仍由主会话具名补入共同材料。两路选材及摘要相同，contextDigest 同时绑定实际源码证据。
改动过的文本文件（base 中为普通 blob、严格 UTF-8）超过 32768 字节时，SOURCE 不附全文，改附该文件带 30 行上下文的宽 diff，并给出全文 sha256、总行数与 base blob；宽 diff 取 git 原始输出（不裁尾部空白），调用层把它的各 hunk 按序应用到 base 原始 blob（须无 NUL、严格 UTF-8），重建结果须与工作区原始字节逐字节相等才采用；二进制、`-diff` 属性、filter、换行转换、无法精确重建或宽 diff 不小于全文时一律附全文（只改模式且内容不变时直接附模式变更）。评审者需要更多上下文时应明确提出，不得臆测。evidenceProfile 由 `full-diff-added-sources` 起头，按固定顺序追加实际出现的标记（`generated-receipts`、`wide-context-large-modified`），以 `-v1` 收尾。新增文本文件的完整源码已在 diff 中时，仅在逐字节重建匹配 UTF-8 原文后省去 SOURCE 的第二份全文，附行数、完整哈希与具名说明；修改文件、过滤器差异、无法精确重建或非 UTF-8 均回退原规则。完整 diff 必须随同发送，源码不截断。
确定性生成物可在项目根受跟踪的普通文件 `.pr-ready-generated.json`（schema `pr-ready/generated-artifacts/v1`，不得含重复键）按组登记：精确的生成物 `paths`、复现检查 `check`、检查程序与生成器源码 `sources`、超时。`check` 只接受白名单形式：`python3` 或 `node`、其固定参数（python3 仅 `-I`/`-B`）、一个与 `sources` 条目逐字相同的脚本、之后只允许不带值的 `--name` 开关；路径均须规范（无 `./`、`..`、以 `-` 开头的段、换行或受保护段），`sources` 与登记路径不相交，登记文件与 `sources` 须是无 NUL 的严格 UTF-8 且不超过 1 MB。diff 触及登记路径时，调用层先一次性捕获全部受跟踪普通文件的字节（跳过 symlink、gitlink、symlink 祖先下的文件，以及受保护的密钥路径——它们不被读取也不进入副本），并证明评审可见：仓库无 assume-unchanged/skip-worktree 等非常规索引标记、无 filter 属性、原始字节与 git 过滤后的对象一致（无换行或内容转换）、不在 diff 中的文件与 base blob 及模式完全一致。省略路径在 base 与 head 两侧都只能是普通文件或不存在，且不能是其他改动路径的祖先；排除后的 diff 路径清单须逐项等于「全部改动 − 省略」。双路入口为每组从这份捕获写出一个全新的隔离临时副本（无 .git，检查进程不继承 NODE_OPTIONS/NODE_PATH/PYTHONPATH 等注入变量）运行检查，要求退出码 0，随后真实仓库快照与捕获指纹都须不变；冻结回执交两路共用。回执附：登记全文与哈希、每组检查 argv 与 sources、退出码、输出哈希与末行、每个省略路径的 base/head 模式、base blob、head 哈希、字节数与增删行数，以及本次运行的每个 `sources` 文件完整内容（即使未改动；与登记文件一样不在 SOURCE 重复发送）。快照哈希仍按完整 diff 计算，回执计入 contextDigest，evidenceProfile 追加 `generated-receipts` 标记（仅有回执时为 `full-diff-added-sources-generated-receipts-v1`）。runReview 收到冻结回执时，除检查输出外的一切（省略清单、sources、diff、捕获指纹、回执正文）都按当前仓库重新推导并逐项比对；检查输出以运行它的双路入口为信任边界，worker 只原样透传。每次启动 Harness 前后、重试前及入口最终放行前都复核快照与捕获指纹，任一变化即整组失效。任何不满足的条件都在启动 Harness 前拒绝，不降级为发送全文。评审者义务：必须从 sources 全文确认每个检查确实从已审输入重新生成其组内全部登记路径并逐字节比对；登记路径被删除时，须确认删除由已审输入决定；发现空跑、只查存在性或不比对内容的检查，对应路径按证据缺失给 request_changes。残留风险：检查脚本间接加载的仓库模块须由项目在 `sources` 中声明齐全，调用层无法证明，评审者应核对；检查命令来自被审仓库，与运行项目测试同等信任；sources 全文外发属于新增外发面，仍由主会话外发预检把关。
配置 `maxInputBytes` 与 `maxInputChars` 分别限制字节和字符，发送前全部校验；字符数按 JavaScript UTF-16 长度保守计量。Codex CLI 的输入硬上限为 1048576 字符（2026-10-08 实测：1048577 字符即被拒），`maxInputChars` 不得高于此值；`maxInputBytes` 为 3145728，可容纳满额的三字节字符。旧配置省略 `maxInputChars` 时使用该上限。输入超限在启动 Harness 前报错，不原样重试确定性超限。
共同上下文须包含需求、批准非目标、完整验收标准、invariant、跨文件/sibling 源码与测试证据；主会话负责外发权限。
运行目录唯一，保存脱敏 prompt、stdout、stderr 和结果，失败的 SDK 结构化错误也保留。结果记录 reviewer、Harness、请求模型、声明谱系、快照和制品路径。请求模型不是服务端真实权重证明，首次及路由变化后须实测。
正式 CLI 用隔离 worker 并行调用 Codex、GLM 双谱系，等待两路结果后统一核对快照、contextDigest 与谱系；两路有效 approve 且无 P0–P2 才通过。批量调用遵循原 critical/major 与 verify-honesty 策略。每路独有临时目录及有界重试；worker 异常也是无效结果，不能以另一路替代。单路 `--reviewer` 仍只用于诊断。

JSON 含 verdict（approve/request_changes/block）、summary、issues；finding 含 severity（critical/major/minor）、可选 priority（0–3）、file、line、problem、suggestion。外审收到 Verify Evidence 时必须另含 verify_honesty（ok/weak/bad + reason）。
交互按 P0–P2 阻断；批量保持原 critical/major 阻断、minor 酌情策略及已批准弱验证策略。
两路须合法、不同谱系、同快照，测试后和发布前重验。缺一份、旧队列的三谱系或 DeepSeek 结果、认证/限流/超时/协议/异常退出或材料变化都不算通过。
每路基础设施/协议失败最多重试一次；合法负面结论不碰运气重试。补材料/修代码后在新快照上整组重跑双谱系，不只重跑给出负面结论的那一路。

## 显式模块模式（Source 候选，部署前须完成验证）

默认 stock CLI、协议正文与评审选材保持原规则。模块模式显式提供
`--module-assignment <批准 JSON>` 或 `--module-plan <冻结 JSON>`，两者恰选一个，
并提供原 `--prompt` 与明确的 `--module-honesty ok|ok-or-weak`。模块模式不接受
`--reviewer`；单路诊断沿用 stock，不产生整合票。未知、重复或缺值参数均拒绝。
可选 `--module-binary-evidence-index <PATH>` 与
`--module-binary-evidence-index-sha <64 lowercase hex SHA256>` 必须成对提供；
任一 flag 都进入严格模块 parser。两者均缺省只用于无 binary 的捕获。SHA 来自
授权 Root 交接，不能从所给 index 反推或用通过状态替代，也不创建空 index。

profile 固定 `module-stock-selection-complete-closure-v1`；capture 为
`pr-ready/root-captured-stock-module-material/v1`，plan 为
`pr-ready/stock-module-plan/v1`，session 为
`pr-ready/root-captured-stock-module-session/v1`。旧 text-only schema/profile/session
和票不能重放。Root 实际捕获同一最终快照：保留 stock opaque snapshot hash，
另绑定完整 raw `--binary` Git diff 的真实 SHA256。所有 changed 路径按 names 顺序
各一完整原始段，拼接必须逐字节等于同一次 global 输出；禁止 trim、重排或逐路径
重新生成 full diff 来猜分段。changed path 恰有一个 owner，闭包及 declared seam
参与者持有完整具名 Source；Root 仍须审真实 caller 闭包，机械 coverage 不替代它。

每条闭包路径实际捕获 stage0 tracked current 与 base 的 regular 全 bytes/mode/SHA；
added base、deleted current 明确 absent，不用空 bytes 冒充。pure 主体为 deleted 的
base，或其它 change 的 current；两侧 pins 仍进 session/context 并重验。每次 prepare
独立 Path→bytes 首捕获，hash/解码/派生使用同一份 raw，不跨调用缓存。untracked、
冲突 stage、symlink/submodule、nonregular、逃逸/保护路径、非 A/M/D 或不完整 diff
均在零 Worker/Harness 阶段拒绝，不能筛掉 fixture、大文件或隐式 fallback 到 stock。
完整 raw 严格 NUL-free UTF8 roundtrip 则为 utf8；其它完整 bytes 为 canonical binary
Base64。禁止有损解码、文本伪装 binary 或 selected Source 替代全 bytes pins。

只有 `state/board.md`、`state/changelog.md` 的 nondeleted UTF8 使用原 stateExcerpt：
完整 changed entries、blockquote 二级标题、current 原行号及全文件 SHA/bytes。
owning `--unified=0` diff 保持完整 raw、含 unchanged 的精确空输出；与完整 diff 的
路径、mode、checked blob-ID prefix、完整增删流及当前 hunk 内容必须闭合。deleted
账本发送完整 base，zeroContextDiff 为 null。新增 non-state UTF8 仅由 frozen pure
renderer 在完整 all-added diff 逐字节重建成功后去掉第二份 Source；失败回全 UTF8。
其它代码不得 excerpt。所有相关模块仍收到完整 diff；cap 不增，材料不截断。

changed binary 要求完整 `GIT binary patch` 正反两块和一个 full-index 行，blob IDs
各为同宽 40 或 64 个 hex 字符。unchanged binary 明确不支持，在零 Harness 阶段
拒绝，不能过滤或造假 changed diff。binary raw 全 bytes 保留在捕获中，发送正文
只有完整 binary diff 与诚实 descriptor（完整 bytes/SHA、独立 evidence 引用），
不将 Base64 当源码正文或声称 reviewer 收到完整 binary body。binary 模块即使
verifyEvidence 为 null，也强制合法 verify_honesty；bad 不通过。

Root index exact 为 `{schema,snapshot,entries}`，schema 固定
`pr-ready/root-binary-evidence-index/v1`；snapshot exact 为
`{baseSha,head,hash,names,fullDiffSHA}`，等于实际最终快照。entries 按 changed binary
路径顺序各一次，exact `{path,reference}`，reference exact `{path,bytes,sha256}`；
无 text、unchanged、重复或额外条目。index 的真实完整 raw SHA 必须等于 Root 交接值。
各完整独立 JSON 使用既有 `pr-ready/root-binary-independent-check/v1`，subject 绑定
实际 primary bytes/revision、per-file diff SHA 与最终 snapshot/base/head；完整
verifierSourcePins、originalBytes、全部 fixture entries 与 fixedExpected coverage、
strict failureCount=0 均须闭合。严格 raw JSON 拒 duplicate decoded keys/unknown。

index 按 Root 批准的 regular 控制路径读取并校真实 raw SHA；完整 proof JSON、
每个 verifier Source pin 与 fixedExpected reference 均按 repo 内 safe regular 无 symlink
路径实际读/hash：proof/producer Source 上限 1000000
bytes，fixedExpected raw reference 沿既有 32 MiB control IO ceiling，只做全 bytes/SHA
绑定，不作为业务 parser 或新 verifier。缺失、冲突、unsafe 或错 SHA 引用拒绝。
Root 必须在调用前真正认证授权 index 及执行完整原 bytes/全部 entries/固定 Expected
独立核验；actor='Root'、failureCount=0、传入 SHA 或字段计数都不证明执行。这一
真实来源是 Root 信任边界，本机制不制造签名、凭空生成 verifier 票或执行 producer。

完整主/双侧 Source pins、Source/selection 两类 SHA 与 pins、raw zero diff、proof
JSON 与真实 control 元数据进入 plan/context。prompt、配置、验证证据及五个机制
Source pins 同样绑定；assignment/plan 的语义进 planDigest，原文件另在 controls
重验，避免 self-reference。一次性冻结所有 module/两路完整 packet、校验配置的
maxInputBytes（当前 3145728）与 maxInputChars（Codex 硬上限 1048576 UTF16）后才建 Worker。worker exact
只收 `{mode,id,moduleId,repo,base,session}`；session 是唯一控制来源，无第二组 override。

仍按 moduleIds 顺序对各模块并行执行 Codex/GLM 双路；only 全模块当前双路强合取
可总体通过。每次 prepare 返回前、
调用/attempt 前后、CLI 阶段与门禁前后，实际重新捕获整个 snapshot、主/双侧 Source、
index、完整 proof/producer/reference/control bytes，并与首 session 精确比较；任何
变化使整组失效。局部票不能作总体票。合法负面不重试；原唯一 runtime 的实际
buildInvocation/parseOutput/validateVerdict/redact、路由/隔离、有界重试及 finally
清理保持。receipt 绑定实际发送全文 SHA/bytes/UTF16、moduleId、planDigest、context
与 fresh snapshot，是成功实际调用后的身份记录，不是服务端权重证明。

本 Source 候选不部署 global、不换配置/模型/权限、不加 cap、不导入旧票或隐藏 fallback。
Root 尚须实际 Source 受理、独立 binary 检查认证、语法/窄 race 与零 Harness 控制、
真实所有 packet 容量、官方独立调用、当前 integration CI 与授权部署；Source 正逆
或 typed metadata 一致均不供应正式、fit 或 Ready 票。
