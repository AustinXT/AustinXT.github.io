#!/usr/bin/env node
// AI 自主开发外层调度器：逐个 issue 串行跑 worktree→Claude develop→push→Codex/GLM 双谱系 review→门禁→合并。
// 唯一副作用中心：所有 git-remote / CNB 写操作只在此发生；子进程（develop/fix/review）只碰 worktree 内代码。
// 状态持久化在 .ai/queue.json（原子落盘），崩溃/中断后重跑靠 reconcile 续。
// 零依赖：仅 Node 18+ 内置。
//
// 用法：
//   node .claude/skills/dev-autonomous/scripts/run-loop.mjs                      处理 queue 里所有非终态 issue
//   node .claude/skills/dev-autonomous/scripts/run-loop.mjs --issues 42 43       只跑指定编号
//   node .claude/skills/dev-autonomous/scripts/run-loop.mjs --label bug --limit 5
//   node .claude/skills/dev-autonomous/scripts/run-loop.mjs --dry-run            只打印每个 issue 将执行的动作
//   node .claude/skills/dev-autonomous/scripts/run-loop.mjs --selftest           mock 子进程跑状态机闭环（零联网/不起模型）
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync, symlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import * as P from "./platform.mjs";
import { gateDecision, REDLINE } from "./gate.mjs";
import { spawnDevelop, spawnFix, spawnReview, SUB_MODEL, agentProbe } from "./review-sub.mjs";
import { resolveRepo, resolveBase, snapshot, releaseDecision, PROJECT_CONFIG } from '../../pr-ready/scripts/review-runtime.mjs';
import { parseVp, validateVp, parseVerifyCmd, classifyRedFailure, verifySummary, verifyFailHint, VERIFY_HARD_FAIL } from "./verify.mjs";
import { autoLoadEnv, loadEnvIntoProcess } from "./platforms/common.mjs";
// 尽早灌全局+项目 env（selftest 跳过）。PLATFORM/SUB_MODEL/CLAUDE_BIN 在 platform.mjs/review-sub.mjs 的 import 期冻结，
// 那些模块自己顶部也调了 autoLoadEnv；此处覆盖 run-loop body 常量（WORKROOT/BASE_BRANCH/MAX_ATTEMPTS 等）。
autoLoadEnv();

const here = dirname(fileURLToPath(import.meta.url));
const root = resolveRepo();
const PATHS = {
  get aiDir() { return process.env.AI_DEV_DIR || resolve(root, ".ai"); },
  get queue() { return resolve(this.aiDir, "queue.json"); },
  get skill() { return resolve(here, "../SKILL.md"); }, // SKILL.md 在上一级（dev-autonomous/）
};
const WORKROOT = process.env.AI_DEV_WORKROOT || resolve(root, PROJECT_CONFIG.worktreeDirectory);
const MAX_ATTEMPTS = Number(process.env.AI_DEV_MAX_ATTEMPTS || 3);
const BASE = resolveBase(root);
const BASE_BRANCH = BASE.replace(/^origin\//, '');
const TEST_TIMEOUT = 5 * 60 * 1000; // 单条测试命令上限 5min（防 check.mjs 挂起/读 stdin 阻塞整个串行调度）
const VERIFY_TIMEOUT = 2 * 60 * 1000; // verify 脚本上限 2min（确定性、离线、有界；超时→killed→fixing）

let errors = 0;
const fail = (m) => { console.error("  ✗ " + m); errors++; };
const ok = (m) => console.log("  ✓ " + m);
const info = (m) => console.log("  • " + m);
const now = () => new Date().toISOString();

export function resolveTestCommands(override = process.env.AI_DEV_TEST_CMD) {
  if (override !== undefined && override !== '') {
    const cmds = override.split(';').map(s => s.trim()).filter(Boolean);
    if (!cmds.length) throw new Error('验证命令覆盖为空，不能放行');
    return cmds;
  }
  return [...PROJECT_CONFIG.testCommands];
}

// ---------- 副作用集合（selftest 可整体替换）----------
const IO = {
  git(args, cwd) { return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); },
  gitOk(args, cwd) { try { IO.git(args, cwd); return true; } catch { return false; } },
  worktreeAdd(branch, wt) {
    IO.git(["fetch", "origin", BASE_BRANCH], root); // 拉最新基线分支（非写死 dev；AI_DEV_BASE=main/master 时刷新正确 ref），保证本 issue 基线最新
    IO.git(["worktree", "add", "-b", branch, wt, BASE], root);
  },
  worktreeRemove(wt) { try { IO.git(["worktree", "remove", "--force", wt], root); } catch { /* 已不在 */ } },
  branchDelete(branch) { IO.gitOk(["branch", "-D", branch], root); },
  gitPush(branch, wt) { IO.git(["push", "-u", "origin", branch], wt); },
  commitChanges(wt, issueNumber) {
    // 开发子进程的 Claude 沙盒拒绝 Git 写操作；本地提交由已获批的宿主流程持有。
    const paths = [...new Set([
      ...IO.git(['diff','--name-only','-z','HEAD'],wt).split('\0'),
      ...IO.git(['ls-files','--others','--exclude-standard','-z'],wt).split('\0'),
    ].filter(Boolean))];
    if (!paths.length) return;
    if (paths.some(p=>REDLINE.some(re=>re.test(p)) || p.split('/').some(x=>/^\.env/.test(x)||x==='secrets'||/\.(pem|key)$/i.test(x)))) throw new Error('待提交改动触碰红线，转人工，不 stage 或 push');
    IO.git(['add','--',...paths],wt);
    if (IO.gitOk(['diff','--cached','--quiet'],wt)) return;
    IO.git(['commit','-m',`fix: address issue #${issueNumber}\n\nChange-By: ai\nAgent: Claude Code\nModel: ${process.env.AI_DEV_MODEL || 'configured Claude Code default (not independently asserted)'}\nSuggested-By: issue #${issueNumber}\nCo-authored-by: Claude <noreply@anthropic.com>`],wt);
  },
  headOf(wt) { try { return IO.git(["rev-parse", "HEAD"], wt); } catch { return null; } },
  hasNewCommits(wt) { try { return IO.git(["rev-list", "--count", `${BASE}..HEAD`], wt) !== "0"; } catch { return false; } },
  remoteBranchExists(branch) { return IO.gitOk(["ls-remote", "--exit-code", "origin", branch], root); },
  touchedPaths(wt) { try { return IO.git(["diff", "--name-only", `${BASE}...HEAD`], wt).split("\n").filter(Boolean); } catch { return null; } },
  // 探测本仓测试命令（去项目绑定）：AI_DEV_TEST_CMD > PROJECT_CONFIG.testCommands（全套项目闸门）
  resolveTestCmds(worktree) {
    return resolveTestCommands(); // 项目完整验证命令，禁止 no-op 放行
  },
  runTests(wt) {
    const cmds = IO.resolveTestCmds(wt);
    if (!cmds.length) return { pass: false, cmd: "(no test)", output: "未配置验证命令，不能放行" };
    for (const c of cmds) {
      const r = spawnSync("sh", ["-c", c], { cwd: wt, encoding: "utf8", timeout: TEST_TIMEOUT, maxBuffer: 8 * 1024 * 1024 });
      if (r.status !== 0) return { pass: false, cmd: c, output: ((r.stdout || "") + (r.stderr || "")) + (r.signal ? ` [signal=${r.signal}]` : "") };
    }
    return { pass: true, cmd: cmds.join(" && ") };
  },
  // L1 确定性 green：在 fix worktree 跑 verify.cmd（不经 shell；parseVerifyCmd 已强制 node <relpath>、路径不逃逸）
  runVerify({ worktree, cmd, timeoutMs = VERIFY_TIMEOUT }) {
    const pc = parseVerifyCmd(cmd, { worktree });
    if (pc.error) return { ran: false, exit: null, stdout: "", stderr: `verify.cmd 非法: ${pc.error}` };
    if (!existsSync(pc.scriptPath)) return { ran: false, exit: null, stdout: "", stderr: `verify 脚本不存在: ${pc.rel}` };
    const r = spawnSync(pc.bin, [pc.scriptPath], { cwd: worktree, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 });
    return { ran: true, exit: r.status, signal: r.signal, stdout: r.stdout || "", stderr: r.stderr || "" };
  },
  // L2 确定性 red-on-base（仅 bug）：fork-point base 检出 + 物化 verify 制品 + 跑 + try/finally 清理（不落盘 queue.json）
  runVerifyOnBase({ srcWorktree, fixBranch, baseRef, verifyCmd, verifyFiles = [], timeoutMs = VERIFY_TIMEOUT }) {
    const fork = IO.git(["merge-base", "HEAD", baseRef], srcWorktree); // pin fork point（防 base 漂移）
    const tmp = join(WORKROOT, `base-${process.pid}-${Date.now()}`);
    try {
      IO.git(["worktree", "add", "--detach", tmp, fork], root);
      IO.materializeVerifyFiles({ intoWorktree: tmp, fromBranch: fixBranch, paths: verifyFiles });
      // 可选：跨仓若目标代码 import npm 包，把 fix worktree 的 node_modules 软链进 base worktree（默认关：本仓零依赖，开了会掩盖真 module-not-found）
      if (process.env.AI_DEV_VERIFY_INSTALL_DEPS === "1") {
        const srcNm = join(srcWorktree, "node_modules");
        if (existsSync(srcNm)) { try { symlinkSync(srcNm, join(tmp, "node_modules"), "dir"); } catch { /* ignore */ } }
      }
      const pc = parseVerifyCmd(verifyCmd, { worktree: tmp });
      if (pc.error) return { ran: false, exit: null, stdout: "", stderr: `verify.cmd 非法: ${pc.error}`, forkSha: fork };
      const r = spawnSync(pc.bin, [pc.scriptPath], { cwd: tmp, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 });
      return { ran: true, exit: r.status, signal: r.signal, stdout: r.stdout || "", stderr: r.stderr || "", forkSha: fork };
    } finally {
      try { IO.git(["worktree", "remove", "--force", tmp], root); } catch { /* ignore */ }
      try { rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
      try { IO.git(["worktree", "prune"], root); } catch { /* ignore */ }
    }
  },
  materializeVerifyFiles({ intoWorktree, fromBranch, paths }) {
    for (const f of paths) IO.git(["checkout", fromBranch, "--", f], intoWorktree);
  },
  pruneStaleBaseWorktrees() { try { IO.git(["worktree", "prune"], root); } catch { /* ignore */ } },
  spawnDevelop, spawnFix, spawnReview,
  agentProbe,
  reviewSnapshot(wt) { return snapshot(wt, BASE).hash; },
  ensureWorkroot() { try { mkdirSync(WORKROOT, { recursive: true }); return true; } catch { return false; } },
  hasToken() { return !!(P.loadToken && P.TOKEN_KEY && P.loadToken({ keyName: P.TOKEN_KEY })); }, // preflight 用：本地查 token 是否存在（宿主环境）
  createPr: P.createPr, mergePr: P.mergePr, comment: P.comment, closeIssue: P.closeIssue,
};

// ---------- queue.json 原子读写 ----------
function loadQueue() {
  try { return JSON.parse(readFileSync(PATHS.queue, "utf8")); }
  catch { return { version: 1, generatedAt: now(), repo: P.REPO, issues: [] }; }
}
function saveQueue(q) {
  mkdirSync(PATHS.aiDir, { recursive: true });
  const tmp = PATHS.queue + ".tmp";
  writeFileSync(tmp, JSON.stringify(q, null, 2));
  renameSync(tmp, PATHS.queue); // 原子 rename（同目录）
}
function upsert(entry) {
  const q = loadQueue();
  const i = q.issues.findIndex((x) => x.issue_number === entry.issue_number);
  if (i >= 0) q.issues[i] = { ...q.issues[i], ...entry, updated_at: now() };
  else q.issues.push({ ...entry, created_at: now(), updated_at: now() });
  saveQueue(q);
}
function readEntry(n) { return loadQueue().issues.find((x) => x.issue_number === n) || null; }

function branchName(n, title) {
  const slug = (title || "fix").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `fix/issue-${n}-${slug || "fix"}`;
}
function worktreePath(n) { return join(WORKROOT, `issue-${n}`); }

// ---------- 断点恢复：transient 状态依据远端实物归位 ----------
function reconcile(e) {
  e.branch = e.branch || branchName(e.issue_number, e.title);
  e.worktree_path = e.worktree_path || worktreePath(e.issue_number);
  if (e.state === "merged" || e.state === "skipped") return e;
  if (e.pr_number && IO.remoteBranchExists(e.branch)) { e.state = "pr_open"; return e; }
  const remote = IO.remoteBranchExists(e.branch);
  const wtExists = existsSync(e.worktree_path);
  if (remote) {
    // 远端有分支但 worktree 丢了 → 重建（先本地同名分支，失败则 fetch 再建）
    if (!wtExists) {
      if (!IO.gitOk(["worktree", "add", e.worktree_path, e.branch], root)) {
        IO.gitOk(["fetch", "origin", `${e.branch}:${e.branch}`], root);
        IO.gitOk(["worktree", "add", e.worktree_path, e.branch], root);
      }
    }
    e.state = "developed"; // 重 push（幂等）→ 重 review
    return e;
  }
  if (wtExists) { e.state = IO.hasNewCommits(e.worktree_path) ? "developed" : "branched"; return e; }
  e.state = "queued"; return e;
}

// ---------- PR 标题/正文 ----------
function prTitle(e) { return `fix: ${e.title} (#${e.issue_number})`; }
function prBody(e) {
  const last = (e.reviews || []).slice(-2);
  const rsum = last.map((r) => `- ${r.model}: ${r.verdict?.verdict || "?"} — ${(r.verdict?.summary || "").slice(0, 120)}`).join("\n") || "-";
  const vr = e.verifyResult ? `\n验证：${e.verifyResult.summary || "?"}${e.verifyResult.redKind ? `（base red: ${e.verifyResult.redKind}）` : ""}` : "";
  const weak = e.verify_weak ? "\n⚠️ [verify_weak] 弱验证（manual/无法确定性验证），建议人工冒烟。" : "";
  return `自动修复 Issue #${e.issue_number}：${e.title}\n\n门禁：${(e.gate_reason || []).join("; ") || "通过"}${vr}${weak}\n\nCodex/GLM 双谱系 review：\n${rsum}\n\n由 dev-autonomous 流程自动处理。`;
}

// ---------- 单 issue 全流程（async 状态机循环）----------
// 两路结果须钉在 verifying 入口落盘的快照上，且当前快照未变（与交互 CLI 的 releaseDecision 同一规则）。
function reviewsPinned(entry, reviews, wt) {
  return !!entry.review_snapshot && releaseDecision(reviews, entry.review_snapshot, IO.reviewSnapshot(wt)).complete;
}
// 合并前不只核身份/快照，还要核结论：须是门禁判定 merge 时落盘的同一钉定快照（负面结论或旧轮次不会留下 gated_snapshot）。
function releaseApproved(entry, wt) {
  return !!entry.gated_snapshot && entry.gated_snapshot === entry.review_snapshot && reviewsPinned(entry, (entry.reviews || []).slice(-2).map(x => x.verdict), wt);
}
// 沙盒挡得住 push/外联，挡不住包装形式的本地 git commit（实测 sh -c "git commit" 可写 worktree 元数据）。
// 提交只能由宿主完成：子进程前后 HEAD 不一致或无法读取 → 失败关闭转人工，不采信本次结果。
function subprocessCommitted(entry, n, wt, headBefore) {
  const headAfter = IO.headOf(wt);
  if (headBefore !== null && headAfter === headBefore) return false;
  entry.state = "blocked"; entry.gate_reason = ["开发子进程擅自改动 Git 提交或 HEAD 不可读（before=" + headBefore + " after=" + headAfter + "），转人工"]; upsert(entry);
  fail(`#${n} 开发子进程擅自提交，阻断转人工`);
  return true;
}
async function processIssue(entry) {
  const n = entry.issue_number;
  if (entry.state === "merged") { ok(`#${n} 已合并，跳过`); return; }
  if (entry.state === "skipped") { info(`#${n} skipped（no-change），跳过`); return; }
  if (entry.state === "failed" || entry.state === "blocked") {
    if (!process.env.AI_DEV_RETRY_TERMINAL) { info(`#${n} 终态 ${entry.state}，跳过（AI_DEV_RETRY_TERMINAL=1 可重试）`); return; }
    entry.state = "queued"; entry.attempts = 0; entry.last_error = null;
  }
  entry = reconcile(entry);
  upsert(entry);

  let guard = 0;
  while (guard++ < 60) {
    const st = entry.state;
    if (st === "merged" || st === "failed" || st === "blocked" || st === "skipped") return; // 终态：退出本 issue
    const branch = entry.branch;
    const wt = entry.worktree_path;
    try {
      if (st === "queued") {
        IO.worktreeAdd(branch, wt);
        entry.state = "branched"; upsert(entry); ok(`#${n} worktree 已建 (${branch})`);
        continue;
      }
      if (st === "branched") {
        const headBefore = IO.headOf(wt);
        const r = IO.spawnDevelop({ issueNumber: n, issueTitle: entry.title, issueBody: entry.body, worktree: wt, base: BASE, skillPath: PATHS.skill, attempt: entry.attempts || 0 });
        if (subprocessCommitted(entry, n, wt, headBefore)) return;
        entry.vp = r.vp || null;
        // no-change：develop 判定无需改码 → skipped 终态（comment 理由 + 清分支；issue 默认留开，AI_DEV_AUTOCLOSE_NOCHANGE=1 才关）
        if (!r.isError && r.vp && r.vp.type === "no-change") {
          const reason = (Array.isArray(r.vp.acceptance) && r.vp.acceptance[0] && r.vp.acceptance[0].criterion) || String(r.summary || "").slice(0, 200) || "develop 判定无需改代码";
          entry.state = "skipped"; entry.skip_reason = reason; upsert(entry);
          try { await IO.comment(n, `🤖 AI 自主流程判定本 issue 无需改代码：${reason}`); } catch { /* ignore */ }
          if (process.env.AI_DEV_AUTOCLOSE_NOCHANGE === "1") { try { await IO.closeIssue(n, "not_planned"); } catch { /* ignore */ } }
          IO.worktreeRemove(wt); IO.branchDelete(branch);
          ok(`#${n} skipped（no-change）：${String(reason).slice(0, 80)}`);
          return;
        }
        if (!r.isError) IO.commitChanges(wt, n);
        if (r.isError || !IO.hasNewCommits(wt)) {
          entry.attempts = (entry.attempts || 0) + 1;
          entry.last_error = r.summary || "develop 无新 commit";
          if (entry.attempts >= MAX_ATTEMPTS) { entry.state = "failed"; upsert(entry); fail(`#${n} develop 反复失败: ${entry.last_error}`); return; }
          upsert(entry); info(`#${n} develop 失败(attempt ${entry.attempts})，重试`); continue;
        }
        entry.host_head = IO.headOf(wt); // 推送门禁基准：只有宿主自己提交后的 HEAD 可推送（落盘，崩溃恢复也生效）
        entry.state = "developed"; upsert(entry); ok(`#${n} develop 完成`);
        continue;
      }
      if (st === "developed") {
        // 子进程提交后宿主若在 HEAD 核对前崩溃，reconcile 会直接走到这里；未落盘或不一致的 HEAD 一律不推送。
        const head = IO.headOf(wt);
        if (!entry.host_head || head !== entry.host_head) {
          entry.state = "blocked"; entry.gate_reason = ["待推送 HEAD 不是宿主落盘的提交（host_head=" + (entry.host_head || "无") + " head=" + head + "），转人工"]; upsert(entry);
          fail(`#${n} 待推送 HEAD 未经宿主确认，阻断转人工`); return;
        }
        IO.gitPush(branch, wt);
        entry.state = "pushed"; upsert(entry); ok(`#${n} 已推送 ${branch}`);
        continue;
      }
      if (st === "pushed") {
        entry.state = "verifying"; upsert(entry); continue;
      }
      if (st === "verifying") {
        // 钉定入口快照并落盘：verify 证据与两路评审都必须对应它，之后任何漂移都使整组失效。
        entry.review_snapshot = IO.reviewSnapshot(wt); entry.gated_snapshot = null; upsert(entry);
        // 确定性验证（L1 green + bug 的 L2 red-on-base）→ 通过则带证据跑 Codex/GLM 双谱系 review；hard-fail 短路 fixing（省 review）
        const vp = entry.vp;
        const vval = vp ? validateVp(vp) : { ok: false, reason: "develop 未输出 VP" };
        if (!vval.ok) {
          entry.verifyResult = { summary: "green-fail", note: vval.reason };
          entry.fix_feedback = { kind: "verify", summary: "VP 缺失/非法", hint: `必须输出合法 Verify Plan（${vval.reason}）：见 SKILL 阶段1。bug/feature 须写并提交零依赖 verify 脚本。` };
          entry.attempts = (entry.attempts || 0) + 1;
          if (entry.attempts >= MAX_ATTEMPTS) { entry.state = "failed"; upsert(entry); fail(`#${n} verify(VP) 反复失败`); return; }
          entry.state = "fixing"; upsert(entry); info(`#${n} VP 缺失/非法 → 修订(attempt ${entry.attempts})`); continue;
        }
        if (vp.type === "no-change" || (vp.verify && vp.verify.kind === "manual")) {
          entry.verifyResult = { summary: "manual" }; // no-change 防御性兜底 / manual=无法确定性验证 → 弱验证
        } else {
          const pc = parseVerifyCmd(vp.verify.cmd, { worktree: wt });
          const vfiles = (vp.verify.files && vp.verify.files.length) ? vp.verify.files : (pc.rel ? [pc.rel] : []);
          const green = IO.runVerify({ worktree: wt, cmd: vp.verify.cmd });
          let red = null;
          if (vp.type === "bug") red = IO.runVerifyOnBase({ srcWorktree: wt, fixBranch: branch, baseRef: BASE, verifyCmd: vp.verify.cmd, verifyFiles: vfiles });
          const summary = verifySummary({ type: vp.type, greenRun: green, redRun: red });
          const vr = { summary, greenExit: green.exit, redExit: red && red.exit, baseStderr: red && red.stderr };
          if (summary === "trivial-red") vr.redKind = classifyRedFailure(red).kind;
          entry.verifyResult = vr;
          if (VERIFY_HARD_FAIL.has(summary)) {
            entry.fix_feedback = { kind: "verify", summary, hint: verifyFailHint(summary, green, red) };
            entry.attempts = (entry.attempts || 0) + 1;
            if (entry.attempts >= MAX_ATTEMPTS) { entry.state = "failed"; upsert(entry); fail(`#${n} verify 反复失败: ${summary}`); return; }
            entry.state = "fixing"; upsert(entry); info(`#${n} verify 未通过(${summary}) → 修订(attempt ${entry.attempts})`); continue;
          }
        }
        // verify 通过（含 manual 弱验证）→ Codex/GLM 双谱系 review（两路都带 verifyEvidence 判 honesty）→ cross_reviewed
        const vr = entry.verifyResult;
        const ve = { type: vp && vp.type, summary: vr.summary, greenExit: vr.greenExit, redExit: vr.redExit, baseStderr: vr.baseStderr };
        const mainV = IO.spawnReview({ worktree: wt, issueNumber: n, issueTitle: entry.title, issueBody: entry.body, verifyEvidence: ve, base: BASE });
        const subV = IO.spawnReview({ model: SUB_MODEL, worktree: wt, issueNumber: n, issueTitle: entry.title, issueBody: entry.body, verifyEvidence: ve, base: BASE });
        const at = now();
        entry.reviews = [...(entry.reviews || []), { at, model: "main", verdict: mainV }, { at, model: "sub", verdict: subV }];
        entry.state = "cross_reviewed"; upsert(entry);
        ok(`#${n} verify[${vr.summary}] + 双谱系 review (Codex:${mainV?.verdict || "?"} GLM:${subV?.verdict || "?"})`);
        continue;
      }
      if (st === "cross_reviewed") {
        const last = (entry.reviews || []).slice(-2);
        const mainV = last.find((r) => r.model === "main")?.verdict || null;
        const subV = last.find((r) => r.model === "sub")?.verdict || null;
        const honesty = [mainV?.verify_honesty, subV?.verify_honesty];
        const verifyHonesty = honesty.find(x=>x?.verdict==='bad') || honesty.find(x=>x?.verdict==='weak') || (honesty.every(x=>x?.verdict==='ok') ? honesty[0] : {verdict:'weak',reason:'外审缺 verify_honesty'});
        const test = IO.runTests(wt);
        const touched = IO.touchedPaths(wt);
        entry.tests = { ...test, ran_at: now() };
        if (touched) entry.touched_paths = touched;
        const decision = gateDecision({ mainVerdict: mainV, subVerdict: subV, identitiesOk: reviewsPinned(entry, [mainV, subV], wt), test, verifyResult: entry.verifyResult, verifyHonesty, touched, attempts: entry.attempts || 0, max: MAX_ATTEMPTS });
        entry.gate_reason = decision.reasons;
        entry.verify_weak = !!decision.weak;
        // 只有门禁判定 merge 的那个钉定快照才落盘为已放行；其它判定一律清空，后续合并前必须核对。
        entry.gated_snapshot = decision.decision === "merge" ? entry.review_snapshot : null;
        if (decision.decision === "merge") {
          entry.state = "gated"; upsert(entry); ok(`#${n} 最终门禁通过 → 合并${decision.weak ? " [verify_weak]" : ""}`);
        } else if (decision.decision === "fix") {
          entry.state = "fixing";
          if (decision.cause === "verify-honesty") entry.fix_feedback = { kind: "verify-honesty", reason: verifyHonesty.reason };
          else if (decision.cause === "test") entry.fix_feedback = { kind: "test", output: (test && test.output) || "" };
          else entry.fix_feedback = { kind: "review", verdict: { verdict: "request_changes", summary: [mainV?.summary, subV?.summary].filter(Boolean).join(" / "), issues: [...(mainV?.issues || []), ...(subV?.issues || [])] } };
          entry.attempts = (entry.attempts || 0) + 1;
          upsert(entry); info(`#${n} 需修订(${decision.cause || "review"}): ${decision.reasons.join("; ")}`);
        } else {
          entry.state = "blocked"; upsert(entry);
          try { const pr = await IO.createPr({ title: prTitle(entry), head: branch, base: BASE_BRANCH, body: prBody(entry) }); entry.pr_number = pr.number; upsert(entry); } catch (e) { fail(`#${n} 阻断后建 PR 失败: ${e.message}`); }
          try { await IO.comment(n, `⛔ AI 自主流程阻断（转人工）：${decision.reasons.join("; ")}`); } catch { /* ignore */ }
          fail(`#${n} 阻断(转人工): ${decision.reasons.join("; ")}`);
          return;
        }
        continue;
      }
      if (st === "fixing") {
        const headBefore = IO.headOf(wt);
        const r = IO.spawnFix({ issueNumber: n, worktree: wt, base: BASE, fix_feedback: entry.fix_feedback || { kind: "review", verdict: { verdict: "request_changes", summary: "修订", issues: [] } }, skillPath: PATHS.skill, attempt: entry.attempts || 0 });
        if (subprocessCommitted(entry, n, wt, headBefore)) return;
        if (r.isError) {
          entry.last_error = r.summary || "fix 失败";
          entry.attempts = (entry.attempts || 0) + 1; // 修订失败计入预算：否则 attempts 永不增长，下行 MAX_ATTEMPTS 判断成死代码，会空转到 guard=60
          if (entry.attempts >= MAX_ATTEMPTS) { entry.state = "failed"; upsert(entry); fail(`#${n} 修订反复失败: ${entry.last_error}`); return; }
          upsert(entry); info(`#${n} 修订失败(attempt ${entry.attempts})，重试`); continue;
        }
        if (r.vp) entry.vp = r.vp; // 修订后应重吐 VP
        IO.commitChanges(wt, n);
        entry.host_head = IO.headOf(wt);
        entry.state = "developed"; upsert(entry); ok(`#${n} 修订完成，重走 push/verify/review`);
        continue;
      }
      if (st === "gated") {
        if (!releaseApproved(entry, wt)) { entry.state='verifying'; upsert(entry); continue; }
        const pr = await IO.createPr({ title: prTitle(entry), head: branch, base: BASE_BRANCH, body: prBody(entry) });
        entry.pr_number = pr.number; entry.state = "pr_open"; upsert(entry); ok(`#${n} PR !${pr.number} 已建`);
        continue;
      }
      if (st === "pr_open") {
        if (!releaseApproved(entry, wt)) { entry.state='blocked'; entry.gate_reason=['PR 绿灯过期或缺双谱系结果；人工复核']; upsert(entry); return; }
        await IO.mergePr(entry.pr_number, { commit_title: prTitle(entry) });
        await IO.comment(n, `✅ 已由 AI 自主流程自动合并（PR !${entry.pr_number}）`);
        await IO.closeIssue(n, "completed");
        IO.worktreeRemove(wt); IO.branchDelete(branch);
        entry.state = "merged"; entry.merged_at = now(); upsert(entry); ok(`#${n} ✅ 已合并 (PR !${entry.pr_number})`);
        continue;
      }
      fail(`#${n} 未知状态 ${st}`); entry.state = "failed"; upsert(entry); return;
    } catch (err) {
      entry.last_error = String(err?.message || err);
      entry.attempts = (entry.attempts || 0) + 1;
      if (entry.attempts >= MAX_ATTEMPTS) entry.state = "failed";
      upsert(entry);
      fail(`#${n} 异常: ${entry.last_error}`);
      IO.worktreeRemove(wt);
      IO.branchDelete(branch); // 同步删本地分支：否则下次 worktreeAdd -b 与残留分支冲突 → 反复失败误判 failed（develop 工作本就要重跑）
      return; // 本次停止，下次 run-loop 靠 reconcile 续
    }
  }
  if (guard > 60) { entry.state = "failed"; entry.last_error = "状态机循环超限"; upsert(entry); fail(`#${n} 状态机循环超限`); }
}

// ---------- 启动预检（fail-fast：缺配置立即中止，不进循环、不处理任何 issue）----------
// 只读探测、无副作用（不建 worktree、不 push、不起 模型子进程）。dryRun 时跳过联网的 base 分支探测。
// 目的：把所有配置/环境问题暴露在最开始，而不是跑到 develop/双谱系 review 之后才中断。
function preflight({ dryRun = false } = {}) {
  const missing = [];
  if (!P.TOKEN_KEY) {
    missing.push("平台适配器未导出 TOKEN_KEY（platform.mjs 配置异常）");
  } else if (!IO.hasToken()) {
    missing.push(`平台 token ${P.TOKEN_KEY} 缺失（设 process.env.${P.TOKEN_KEY} 由宿主全局配置注入）`);
  }
  const cp = IO.agentProbe();
  if (!cp.ok) missing.push(`开发/评审 Harness 不可用：${cp.reason}`);
  if (!IO.ensureWorkroot()) missing.push(`WORKROOT 不可写：${WORKROOT}（可用 AI_DEV_WORKROOT 覆盖）`);
  if (!IO.gitOk(["remote", "get-url", "origin"], root)) missing.push("git remote origin 未配置（git remote add origin <url>）");
  if (!dryRun && !IO.gitOk(["ls-remote", "--exit-code", "origin", BASE_BRANCH], root)) {
    missing.push(`远端分支 origin/${BASE_BRANCH} 不存在（AI_DEV_BASE=${BASE_BRANCH}；确认主分支名或先 push）`);
  }
  return missing;
}

// ---------- 参数 / 预览 ----------
function parseArgs(argv) {
  const o = { issues: [], label: null, limit: 0, dryRun: false, watch: false, pollInterval: 0, selftest: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--repo") i++;
    else if (a === "-h" || a === "--help") o.help = true;
    else if (a === "--selftest") o.selftest = true;
    else if (a === "--dry-run") o.dryRun = true;
    else if (a === "--watch") o.watch = true;
    else if (a === "--poll-interval") o.pollInterval = parseInt(argv[++i], 10) || 0;
    else if (a === "--label") o.label = argv[++i] || null;
    else if (a === "--limit") o.limit = parseInt(argv[++i], 10) || 0;
    else if (a === "--issues") { while (i + 1 < argv.length && /^\d+$/.test(argv[i + 1])) o.issues.push(Number(argv[++i])); }
    else if (/^\d+$/.test(a)) o.issues.push(Number(a));
    else if (a.startsWith("--")) { console.error(`未知参数：${a}`); o.help = true; }
  }
  return o;
}
function describeNext(e) {
  const m = {
    queued: "建 worktree + 分支 → 起主模型 develop",
    branched: "起主模型 develop 子进程",
    developed: "git push 分支",
    pushed: "跑确定性 verify（green + bug 的 red-on-base）",
    verifying: "跑确定性 verify → 通过则 Codex/GLM 双谱系 review",
    cross_reviewed: "跑测试 + 门禁判定（含 verifyResult/verifyHonesty）",
    fixing: "起主模型修订子进程（带 fix_feedback：review/verify/verify-honesty/test）",
    gated: "建 PR",
    pr_open: "合并 PR + 关 issue + 清 worktree",
    merged: "（已完成）",
    failed: "（失败待查；AI_DEV_RETRY_TERMINAL=1 重试）",
    blocked: "（阻断，已建 PR 待人工）",
    skipped: "（no-change，已 comment + 清分支）",
  };
  return m[e.state] || "?";
}
function printHelp() {
  console.log(`AI 自主开发调度器（串行处理 queue 内 issue）

用法：
  node .claude/skills/dev-autonomous/scripts/run-loop.mjs [options]

选项：
  --repo <path>     显式项目根；默认当前 Git 工作目录，与全局技能安装位置无关
  --issues n1 n2 ..  只跑指定 issue 编号（与 --watch 互斥）
  --label <name>     只处理带该 label 的 issue
  --limit <n>        最多处理 n 个
  --watch            持续模式：每周期 pull-issues + 处理整个 queue，循环到信号（配合 launchd 看门狗用）
  --poll-interval <s> --watch 轮询间隔秒（默认 300，env AI_DEV_POLL_INTERVAL）
  --dry-run          只打印每个 issue 将执行的动作，不起子进程/不联网
  --selftest         mock 子进程跑状态机闭环（零联网）
  -h, --help

环境：AI_DEV_PLATFORM=cnb|github|gitcode(默认探测 origin) | 平台 token CNB_API_TOKEN|GITHUB_TOKEN|GITCODE_TOKEN(必) | AI_DEV_BASE(否则项目配置 origin/dev) | AI_DEV_AUTHORIZED_PROJECT(本次批量授权标识) | AI_DEV_MAX_ATTEMPTS(默认3) | AI_DEV_MODEL(默认 Claude Code 配置) | AI_DEV_REASONING(Claude --effort) | AI_DEV_WORKROOT | AI_DEV_POLL_INTERVAL(--watch 轮询秒，默认300)
看门狗：node .claude/skills/dev-autonomous/scripts/watchdog.mjs install [--label bug] [--poll-interval 300]（macOS launchd：开机自启 + 崩溃重启）；uninstall/status/logs 见 watchdog.mjs -h。
中断恢复：Ctrl-C 即可（每步已落盘，--watch 下当前 issue 跑完后优雅退出）；重跑/重启自动从 reconcile 续。`);
}

// ---------- 主流程 ----------
// 处理 queue 一轮（不 process.exit）→ { processed, hadError }。供一次性 main 与 --watch 复用。
async function runOnce(opt) {
  errors = 0; // 每轮重置（--watch 多轮下不累积）
  const q = loadQueue();
  let targets;
  if (opt.issues.length) {
    targets = q.issues.filter((i) => opt.issues.includes(i.issue_number));
    const missing = opt.issues.filter((n) => !q.issues.some((i) => i.issue_number === n));
    if (missing.length) fail(`queue 中无 issue ${missing.join(", ")}（先跑 pull-issues.mjs）`);
  } else {
    targets = q.issues.filter((i) => !["merged", "failed", "blocked", "skipped"].includes(i.state));
  }
  if (opt.label) targets = targets.filter((i) => (i.labels || []).includes(opt.label));
  if (opt.limit) targets = targets.slice(0, opt.limit);
  if (targets.length === 0) { console.log(`[${now()}] queue 无待处理 issue（空或全终态）`); return { processed: 0, hadError: false }; }
  console.log(`[${now()}] 待处理 ${targets.length} 个 issue（串行）${opt.dryRun ? " [dry-run]" : ""}`);
  for (const entry of targets) {
    console.log(`\n=== #${entry.issue_number} ${entry.title} [${entry.state}] ===`);
    if (opt.dryRun) { info(`将执行：${describeNext(entry)}`); continue; }
    await processIssue({ ...entry });
  }

  if (opt.dryRun) return { processed: targets.length, hadError: false };
  printSummary();
  return { processed: targets.length, hadError: errors > 0 };
}

// 汇总 + 转人工/失败原因直方图（数据驱动定位：看哪条门禁触发最多，对症下药）
function printSummary() {
  const q2 = loadQueue();
  const sum = { merged: 0, failed: 0, blocked: 0, skipped: 0, inprogress: 0 };
  for (const i of q2.issues) { if (i.state in sum) sum[i.state]++; else sum.inprogress++; }
  console.log(`\n[汇总] merged ${sum.merged} | failed ${sum.failed} | blocked ${sum.blocked} | skipped ${sum.skipped} | 进行中/其他 ${sum.inprogress}`);
  const reasons = {};
  for (const i of q2.issues) {
    if (["blocked", "failed"].includes(i.state) && Array.isArray(i.gate_reason)) {
      for (const r of i.gate_reason) { const k = String(r).replace(/:.*$/, "").slice(0, 50); reasons[k] = (reasons[k] || 0) + 1; }
    }
  }
  if (Object.keys(reasons).length) {
    console.log("[转人工/失败原因分布]");
    for (const [k, v] of Object.entries(reasons).sort((a, b) => b[1] - a[1])) console.log(`  ${v}× ${k}`);
  }
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help) { printHelp(); process.exit(0); }
  if (opt.selftest) return selftest();
  if (!opt.dryRun && process.env.AI_DEV_AUTHORIZED_PROJECT !== PROJECT_CONFIG.name) {
    console.error(`本项目未启用完整批量执行；按项目模板取得本次授权后才设置 AI_DEV_AUTHORIZED_PROJECT=${PROJECT_CONFIG.name}。未处理任何 issue。`);
    process.exit(1);
  }
  if (opt.watch && opt.issues.length) { info("--watch 忽略 --issues（持续处理整个 queue）"); opt.issues = []; }
  console.log(`[run-loop] 平台=${P.PLATFORM} base=${BASE_BRANCH} repo=${P.REPO}${opt.watch ? " [watch]" : ""}`);
  const missing = preflight({ dryRun: opt.dryRun });
  if (missing.length) {
    console.error(`\n✗ 启动预检失败，已中止（未处理任何 issue，避免跑到一半因缺配置中断）：`);
    for (const m of missing) fail(m);
    process.exit(1);
  }
  ok(`启动预检通过（token / 三 Harness / workroot / origin${opt.dryRun ? "" : " / base 分支"}）`);
  IO.pruneStaleBaseWorktrees(); // 回收上次崩溃残留的 base worktree
  // 每次评审 finally 只清理本次临时配置，不跨运行清扫。
  if (opt.watch) return runWatch(opt);
  const r = await runOnce(opt);
  process.exit(r.hadError ? 1 : 0);
}

// --watch 持续模式：每周期 pull-issues → runOnce → 可中断 sleep，直到信号。launchd KeepAlive 负责崩溃重启。
async function runWatch(opt) {
  let stopping = false;
  let wake = null; // 唤醒 sleep 用（信号可即时打断等待）
  const stop = (sig) => {
    if (!stopping) { stopping = true; info(`收到 ${sig}：当前 issue 跑完后优雅退出（再按一次强制退）`); if (wake) { const w = wake; wake = null; w(); } }
    else { process.exit(130); }
  };
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
  const pollSec = Number(opt.pollInterval) || Number(process.env.AI_DEV_POLL_INTERVAL) || 300;
  const labelArg = opt.label ? ["--label", opt.label] : [];
  const pullPath = resolve(here, "pull-issues.mjs");
  let cycle = 0;
  info(`--watch 启动：每 ${pollSec}s 轮询拉新 + 处理；Ctrl-C 优雅退出；彻底停止整个 agent 请用 watchdog.mjs uninstall`);
  while (!stopping) {
    cycle++;
    loadEnvIntoProcess({ override: true }); // 每周期重载全局+项目 env（覆盖），让运行中编辑（如轮换 key）即时生效
    console.log(`\n========== --watch 周期 ${cycle}（${now()}）==========`);
    // 拉新 issue（失败不致命：API 抖动 log + 下轮重试，不崩 watch）
    try {
      const pr = spawnSync("node", [pullPath, ...labelArg], { cwd: root, encoding: "utf8", timeout: 2 * 60 * 1000 });
      if (pr.status !== 0) fail(`pull-issues 失败(status=${pr.status})，本轮跳过拉新：${String(pr.stderr || "").slice(0, 200)}`);
      else if (pr.stdout) process.stdout.write(pr.stdout);
    } catch (e) { fail(`pull-issues 异常：${e.message}`); }
    if (stopping) break;
    await runOnce(opt);
    if (stopping) break;
    info(`本轮完成，${pollSec}s 后下一周期（可 Ctrl-C 优雅退出）`);
    await new Promise((resolve) => { wake = resolve; setTimeout(() => { wake = null; resolve(); }, pollSec * 1000); }); // 信号可即时唤醒
  }
  console.log(`\n[watch] 已优雅退出（共 ${cycle} 周期）`);
  process.exit(0);
}

// ---------- selftest：mock IO 跑状态机闭环 ----------
async function selftest() {
  let ok = 0, bad = 0;
  const tt = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); c ? ok++ : bad++; };
  const orig = { ...IO };
  const tmp = resolve(tmpdir(), "ai-dev-selftest-" + process.pid);
  process.env.AI_DEV_DIR = tmp;
  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }

  const reset = () => saveQueue({ version: 1, repo: "t", issues: [] });
  reset();
  const VP_BUG = { type: "bug", verify: { cmd: "node s.mjs", files: ["s.mjs"], kind: "selftest" }, repro: { expect: "fail-on-base" }, acceptance: [{ criterion: "c1", covered_by: "verify" }] };
  Object.assign(IO, {
    git: () => "", gitOk: () => true,
    worktreeAdd: () => {}, worktreeRemove: () => {}, branchDelete: () => {}, gitPush: () => {}, commitChanges: () => {},
    headOf: () => "mock-head", hasNewCommits: () => true, touchedPaths: () => ["src/a.js"], runTests: () => ({ pass: true, cmd: "node scripts/check.mjs" }),
    remoteBranchExists: () => false,
    resolveTestCmds: () => [],
    runVerify: () => ({ ran: true, exit: 0, stdout: "", stderr: "" }),           // L1 green
    runVerifyOnBase: () => ({ ran: true, exit: 1, stdout: "", stderr: "AssertionError" }), // L2 真 red
    materializeVerifyFiles: () => {}, pruneStaleBaseWorktrees: () => 0,
    spawnDevelop: () => ({ isError: false, summary: "done", vp: VP_BUG }),
    spawnFix: () => ({ isError: false, summary: "fixed", vp: VP_BUG }),
    spawnReview: (o) => ({ verdict: "approve", summary: o.model ? "sub" : "main", issues: [], verify_honesty: { verdict: "ok", reason: "" } }),
    agentProbe: () => ({ ok: true, version: "1.0" }),
    reviewSnapshot: () => "mock-snapshot",
    ensureWorkroot: () => true,
    hasToken: () => true,
    createPr: async () => ({ number: 123 }),
    mergePr: async () => ({}), comment: async () => ({}), closeIssue: async () => ({}),
  });

  const attachIdentity = fn => o => ({...fn(o),_review:{id:o.model?"glm":"codex",lineage:o.model?"zhipu":"openai",snapshot:"mock-snapshot",contextDigest:"mock-context"}});
  const reviewOrder = [];
  const mockReview = attachIdentity(IO.spawnReview);
  IO.spawnReview=o=>{reviewOrder.push(o.model || 'codex');return mockReview(o);};
  console.log("[selftest] bug red-green + 双谱系 approve → merged");
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 1, title: "bug", state: "queued", attempts: 0, reviews: [], labels: [] }] });
  await processIssue({ issue_number: 1, title: "bug", state: "queued", attempts: 0, reviews: [], labels: [] });
  let e = readEntry(1);
  tt(e && e.state === "merged", `queued→…→merged（实得 ${e?.state}）`);
  tt(e && e.pr_number === 123, "记录 pr_number");
  tt(reviewOrder.slice().sort().join(',') === 'codex,glm', "每轮 Codex/GLM 双谱系各审一次，无终审轮");
  tt(e && e.verifyResult && e.verifyResult.summary === "red-green", `verify 摘要=red-green（实得 ${e?.verifyResult?.summary}）`);
  tt(e && Array.isArray(e.reviews) && e.reviews.length === 2 && e.reviews.every(r => r.model === 'main' || r.model === 'sub'), "reviews 记 Codex+GLM");

  console.log("[selftest] verify green-fail → fixing（短路跳过 review）→ 修复后 green → merged");
  let gvCalls = 0;
  IO.runVerify = () => { gvCalls++; return gvCalls <= 1 ? { ran: true, exit: 1, stdout: "", stderr: "boom" } : { ran: true, exit: 0, stdout: "", stderr: "" }; };
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 8, title: "b8", state: "queued", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 8, title: "b8", state: "queued", attempts: 0, reviews: [] });
  e = readEntry(8);
  tt(e && e.state === "merged", `green-fail→fix→green→merged（实得 ${e?.state}）`);
  tt(e && e.verifyResult && e.verifyResult.summary === "red-green", `修复后 verify=red-green（实得 ${e?.verifyResult?.summary}）`);
  IO.runVerify = () => ({ ran: true, exit: 0, stdout: "", stderr: "" });

  console.log("[selftest] no-change → skipped（不再误计 failed）");
  IO.spawnDevelop = () => ({ isError: false, summary: "无需改码", vp: { type: "no-change", acceptance: [{ criterion: "咨询类，已说明" }] } });
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 9, title: "b9", state: "queued", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 9, title: "b9", state: "queued", attempts: 0, reviews: [] });
  e = readEntry(9);
  tt(e && e.state === "skipped", `no-change → skipped（实得 ${e?.state}）`);
  IO.spawnDevelop = () => ({ isError: false, summary: "done", vp: VP_BUG });

  console.log("[selftest] 子进程擅自提交（HEAD 变化）→ blocked，不推送");
  let head = "h0", pushed = 0; const origPush = IO.gitPush;
  IO.headOf = () => head; IO.gitPush = () => { pushed++; };
  IO.spawnDevelop = () => { head = "h1"; return { isError: false, summary: "done", vp: VP_BUG }; };
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 16, title: "b16", state: "queued", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 16, title: "b16", state: "queued", attempts: 0, reviews: [] });
  e = readEntry(16);
  tt(e && e.state === "blocked" && pushed === 0, `子进程提交 → blocked 且未推送（实得 ${e?.state}，push ${pushed} 次）`);
  IO.headOf = () => null; head = "h0";
  IO.spawnDevelop = () => ({ isError: false, summary: "done", vp: VP_BUG });
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 17, title: "b17", state: "queued", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 17, title: "b17", state: "queued", attempts: 0, reviews: [] });
  tt(readEntry(17)?.state === "blocked", "HEAD 不可读 → blocked（失败关闭）");
  IO.headOf = () => "mock-head"; IO.gitPush = origPush;

  console.log("[selftest] 崩溃恢复：developed 但 HEAD 不是宿主落盘提交 → blocked，不推送");
  pushed = 0; IO.gitPush = () => { pushed++; }; IO.headOf = () => "h-subprocess";
  const origRemote = IO.remoteBranchExists, origGitOk = IO.gitOk;
  IO.remoteBranchExists = () => true; IO.gitOk = () => true; // 真实崩溃恢复路径：reconcile 见远端分支 → developed
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 18, title: "b18", state: "developed", host_head: "h-host", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 18, title: "b18", state: "developed", host_head: "h-host", attempts: 0, reviews: [] });
  tt(readEntry(18)?.state === "blocked" && pushed === 0, `HEAD 漂移 → blocked 且未推送（实得 ${readEntry(18)?.state}，push ${pushed} 次）`);
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 19, title: "b19", state: "developed", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 19, title: "b19", state: "developed", attempts: 0, reviews: [] });
  tt(readEntry(19)?.state === "blocked" && pushed === 0, "无落盘 host_head → blocked 且未推送");
  IO.headOf = () => "mock-head"; IO.gitPush = origPush; IO.remoteBranchExists = origRemote; IO.gitOk = origGitOk;

  console.log("[selftest] 开发出错时携带的 no-change VP 不采信 → 不 skipped、不删分支");
  let removed = 0; const origRemove = IO.worktreeRemove;
  IO.worktreeRemove = (...a) => { removed++; return origRemove(...a); };
  IO.spawnDevelop = () => ({ isError: true, summary: "is_error", vp: { type: "no-change", acceptance: [{ criterion: "伪装无需改码" }] } });
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 15, title: "b15", state: "queued", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 15, title: "b15", state: "queued", attempts: 0, reviews: [] });
  e = readEntry(15);
  tt(e && e.state !== "skipped" && removed === 0, `出错的 no-change 不跳过（实得 ${e?.state}，删除 worktree ${removed} 次）`);
  IO.worktreeRemove = origRemove;
  IO.spawnDevelop = () => ({ isError: false, summary: "done", vp: VP_BUG });

  console.log("[selftest] manual（弱验证）→ merge + verify_weak");
  IO.spawnDevelop = () => ({ isError: false, summary: "done", vp: { type: "feature", verify: { kind: "manual" } } });
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 10, title: "b10", state: "queued", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 10, title: "b10", state: "queued", attempts: 0, reviews: [] });
  e = readEntry(10);
  tt(e && e.state === "merged", `manual → merged（实得 ${e?.state}）`);
  tt(e && e.verifyResult && e.verifyResult.summary === "manual" && e.verify_weak === true, `manual → verify_weak（实得 ${e?.verifyResult?.summary}/${e?.verify_weak}）`);
  IO.spawnDevelop = () => ({ isError: false, summary: "done", vp: VP_BUG });

  console.log("[selftest] request_changes → fix → 再 approve → merged");
  let mainCalls = 0;
  IO.spawnReview = attachIdentity((o) => {
    if (!o.model) { mainCalls++; return mainCalls <= 1 ? { verdict: "request_changes", summary: "fix me", issues: [{ severity: "major", file: "a", line: 1, problem: "p", suggestion: "s" }] } : { verdict: "approve", summary: "ok", issues: [] }; }
    return { verdict: "approve", summary: "sub", issues: [], verify_honesty: { verdict: "ok", reason: "" } };
  });
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 2, title: "b2", state: "queued", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 2, title: "b2", state: "queued", attempts: 0, reviews: [] });
  e = readEntry(2);
  tt(e && e.state === "merged", `fix 一轮后 merged（实得 ${e?.state}，主模型 review 共 ${mainCalls} 次）`);

  console.log('[selftest] GLM 负面 → 修复 → 双谱系重审');
  const dualOrder = []; let glmCalls = 0;
  IO.spawnReview = attachIdentity(o => {
    dualOrder.push(o.model || 'codex');
    if (o.model === SUB_MODEL && ++glmCalls === 1) return {verdict:'request_changes',summary:'fix dual',issues:[{severity:'major',file:'a',line:1,problem:'p',suggestion:'s'}]};
    return {verdict:'approve',summary:'ok',issues:[],verify_honesty:{verdict:'ok',reason:''}};
  });
  saveQueue({version:1,repo:'t',issues:[{issue_number:14,title:'dual fix',state:'queued',attempts:0,reviews:[]}]});
  await processIssue({issue_number:14,title:'dual fix',state:'queued',attempts:0,reviews:[]});
  tt(readEntry(14)?.state==='merged' && dualOrder.join(',')==='codex,glm,codex,glm', 'GLM 负面→修复→Codex/GLM 双谱系整组重跑');

  console.log("[selftest] 红线 → blocked（不合并）");
  IO.spawnReview = attachIdentity(() => ({ verdict: "approve", summary: "", issues: [] }));
  IO.touchedPaths = () => [".ai/queue.json"];
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 3, title: "b3", state: "queued", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 3, title: "b3", state: "queued", attempts: 0, reviews: [] });
  e = readEntry(3);
  tt(e && e.state === "blocked", `触碰 .ai → blocked（实得 ${e?.state}）`);
  IO.touchedPaths = () => ["src/a.js"];

  console.log("[selftest] 测试失败 → fix 轮 → 耗尽 blocked【行为变更：原直接 blocked】");
  IO.runTests = () => ({ pass: false, cmd: "node scripts/check.mjs", output: "FAIL" });
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 4, title: "b4", state: "queued", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 4, title: "b4", state: "queued", attempts: 0, reviews: [] });
  e = readEntry(4);
  tt(e && e.state === "blocked", `测试失败经 fix 轮耗尽 → blocked（实得 ${e?.state}）`);
  IO.runTests = () => ({ pass: true, cmd: "node scripts/check.mjs" });

  console.log("[selftest] review block → blocked");
  IO.spawnReview = attachIdentity(() => ({ verdict: "block", summary: "bad", issues: [] }));
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 5, title: "b5", state: "queued", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 5, title: "b5", state: "queued", attempts: 0, reviews: [] });
  e = readEntry(5);
  tt(e && e.state === "blocked", `review block → blocked（实得 ${e?.state}）`);

  console.log("[selftest] fixing 反复失败 → attempts 递增 → failed（不再空转 guard=60）");
  let fixCalls = 0;
  IO.spawnReview = attachIdentity((o) => o.model
    ? { verdict: "approve", summary: "sub", issues: [] }
    : { verdict: "request_changes", summary: "fix", issues: [{ severity: "major", file: "a", line: 1, problem: "p", suggestion: "s" }] });
  IO.spawnFix = () => { fixCalls++; return { isError: true, summary: "fix-broken" }; };
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 7, title: "b7", state: "queued", attempts: 0, reviews: [] }] });
  await processIssue({ issue_number: 7, title: "b7", state: "queued", attempts: 0, reviews: [] });
  e = readEntry(7);
  tt(e && e.state === "failed", `fixing 反复失败 → failed（实得 ${e?.state}）`);
  tt(e && e.attempts >= MAX_ATTEMPTS, `attempts 递增到上限（实得 ${e?.attempts}，MAX=${MAX_ATTEMPTS}）`);
  tt(fixCalls <= MAX_ATTEMPTS, `spawnFix 有界 ${fixCalls} 次（≤ MAX_ATTEMPTS=${MAX_ATTEMPTS}，不再空转到 guard=60）`);

  console.log('[selftest] 缺一路/重复谱系/过期快照不得合并');
  IO.spawnDevelop = () => ({isError:false,summary:'done',vp:VP_BUG});
  IO.spawnReview = attachIdentity(o=>o.model===SUB_MODEL ? {__parseError:true,reason:'unavailable'} : {verdict:'approve',summary:'ok',issues:[]});
  saveQueue({version:1,repo:'t',issues:[{issue_number:11,title:'missing glm',state:'queued',attempts:0,reviews:[]}]});
  await processIssue({issue_number:11,title:'missing glm',state:'queued',attempts:0,reviews:[]});
  tt(readEntry(11)?.state==='blocked','缺 GLM 结果 → blocked，不合并');
  IO.spawnReview = o=>({...attachIdentity(()=>({verdict:'approve',summary:'ok',issues:[]}))(o),_review:{id:o.model?'glm':'codex',lineage:'openai',snapshot:'mock-snapshot',contextDigest:'mock-context'}});
  saveQueue({version:1,repo:'t',issues:[{issue_number:12,title:'same family',state:'queued',attempts:0,reviews:[]}]});
  await processIssue({issue_number:12,title:'same family',state:'queued',attempts:0,reviews:[]});
  tt(readEntry(12)?.state==='blocked','重复谱系 → blocked，不合并');
  IO.spawnReview = attachIdentity(()=>({verdict:'approve',summary:'ok',issues:[]}));
  IO.reviewSnapshot = ()=>'stale-snapshot';
  saveQueue({version:1,repo:'t',issues:[{issue_number:13,title:'stale',state:'queued',attempts:0,reviews:[]}]});
  await processIssue({issue_number:13,title:'stale',state:'queued',attempts:0,reviews:[]});
  tt(readEntry(13)?.state==='blocked','过期快照 → blocked，不合并');
  IO.reviewSnapshot = ()=>'mock-snapshot';
  const mockGit=IO.git, mockGitOk=IO.gitOk, calls=[];
  IO.git=(args)=>{calls.push(args);return args[0]==='diff'?'src/a.mjs\0':args[0]==='ls-files'?'new-test.mjs\0':'';};
  IO.gitOk=()=>false;
  orig.commitChanges('/mock-worktree',42);
  tt(calls.some(a=>a[0]==='add'&&a[1]==='--'&&a.includes('src/a.mjs')&&a.includes('new-test.mjs')),'宿主提交只 stage 明确路径');
  IO.git=args=>args[0]==='diff'?'nested/.env.local\0':'';
  let refused=false;try{orig.commitChanges('/mock-worktree',42);}catch{refused=true;}
  tt(refused,'宿主提交在 stage/push 前拒绝密钥路径');
  IO.git=mockGit;IO.gitOk=mockGitOk;
  console.log("[selftest] reconcile 无实物 → queued");
  const e0 = reconcile({ issue_number: 99, title: "x", state: "pushed" });
  tt(e0.state === "queued", `transient pushed 无实物 → queued（${e0.state}）`);

  console.log("[selftest] 终态短路");
  saveQueue({ version: 1, repo: "t", issues: [{ issue_number: 6, title: "m", state: "merged", reviews: [] }] });
  await processIssue({ issue_number: 6, title: "m", state: "merged", reviews: [] });
  tt(readEntry(6).state === "merged", "merged 直接跳过不动");

  console.log('[selftest] 进入评审后快照漂移、两路都审到新快照 → 不合并');
  let snapCalls = 0; IO.reviewSnapshot = () => (snapCalls++ === 0 ? 's-entry' : 's-drifted');
  IO.spawnReview = o => ({verdict:'approve',summary:'ok',issues:[],verify_honesty:{verdict:'ok',reason:''},_review:{id:o.model?'glm':'codex',lineage:o.model?'zhipu':'openai',snapshot:'s-drifted',contextDigest:'mock-context'}});
  saveQueue({version:1,repo:'t',issues:[{issue_number:20,title:'drift after entry',state:'queued',attempts:0,reviews:[]}]});
  await processIssue({issue_number:20,title:'drift after entry',state:'queued',attempts:0,reviews:[]});
  tt(readEntry(20)?.state !== 'merged' && readEntry(20)?.state !== 'pr_open', `入口后漂移不放行（实得 ${readEntry(20)?.state}）`);
  IO.reviewSnapshot = () => 'mock-snapshot';
  console.log('[selftest] 负面结论被 blocked 后经 reconcile 恢复为 pr_open → 不合并');
  let merges = 0; const origMerge = IO.mergePr, origRemote2 = IO.remoteBranchExists;
  IO.mergePr = async () => { merges++; return {}; }; IO.remoteBranchExists = () => true;
  const neg = id => ({verdict:'request_changes',summary:'fix',issues:[{severity:'major',file:'a',line:1,problem:'p',suggestion:'s'}],verify_honesty:{verdict:'ok',reason:''},_review:{id,lineage:id==='codex'?'openai':'zhipu',snapshot:'mock-snapshot',contextDigest:'mock-context'}});
  const blockedEntry = {issue_number:21,title:'neg',state:'blocked',pr_number:9,attempts:3,review_snapshot:'mock-snapshot',reviews:[{model:'main',verdict:neg('codex')},{model:'sub',verdict:neg('glm')}]};
  const prevRetry = process.env.AI_DEV_RETRY_TERMINAL; process.env.AI_DEV_RETRY_TERMINAL = '1';
  saveQueue({version:1,repo:'t',issues:[blockedEntry]});
  await processIssue(JSON.parse(JSON.stringify(blockedEntry)));
  if (prevRetry === undefined) delete process.env.AI_DEV_RETRY_TERMINAL; else process.env.AI_DEV_RETRY_TERMINAL = prevRetry;
  tt(merges === 0 && readEntry(21)?.state !== 'merged', `负面结论不被 pr_open 合并（merge ${merges} 次，实得 ${readEntry(21)?.state}）`);
  IO.mergePr = origMerge; IO.remoteBranchExists = origRemote2;
  console.log("[selftest] preflight 收集缺失项（fail-fast，dryRun 跳过 base）");
  IO.gitOk = () => true;
  IO.agentProbe = () => ({ ok: true, version: "1.0" });
  IO.ensureWorkroot = () => true;
  IO.hasToken = () => true;
  tt(preflight({ dryRun: true }).length === 0, "配置齐全(dryRun) → 无缺失");
  tt(preflight({ dryRun: false }).length === 0, "配置齐全(含 base 探测) → 无缺失");
  IO.hasToken = () => false;
  let mf = preflight({ dryRun: true });
  tt(mf.some((s) => /token/i.test(s)), `缺 token → missing 含 token（实得 ${mf.join("; ")}）`);
  IO.hasToken = () => true;
  IO.agentProbe = () => ({ ok: false, reason: "ENOENT 未找到" });
  mf = preflight({ dryRun: true });
  tt(mf.some((s) => /Harness/.test(s)), "claude 不可用 → missing 含 claude");
  IO.agentProbe = () => ({ ok: true });
  IO.gitOk = (a) => a[0] !== "remote";
  mf = preflight({ dryRun: true });
  tt(mf.some((s) => /origin/.test(s)), "origin 未配置 → missing 含 origin");
  IO.gitOk = (a) => a[0] !== "ls-remote";
  mf = preflight({ dryRun: false });
  tt(mf.some((s) => /分支/.test(s)), `非 dryRun + base 不存在 → missing 含 base（实得 ${mf.join("; ")}）`);
  tt(preflight({ dryRun: true }).length === 0, "dryRun 不查 base → 齐全（base 探测被跳过）");
  IO.gitOk = () => true;

  Object.assign(IO, orig);
  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  delete process.env.AI_DEV_DIR;

  console.log(`\n${bad === 0 ? "✅ run-loop selftest PASS" : "❌ run-loop selftest FAIL"}  通过 ${ok}，失败 ${bad}`);
  process.exit(bad === 0 ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error("未捕获错误：", e); process.exit(1); });
}
