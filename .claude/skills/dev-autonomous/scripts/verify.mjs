#!/usr/bin/env node
// Verify Plan（VP）解析 + 确定性验证结果的分类纯函数。
// 目的：把「issue 是否真正被解决」从「LLM 读 diff 猜」升级为「确定性 red-green 证明」——
//   bug 的 verify 脚本必须在未修复的 base 上 FAIL（red）、在 fix 上 PASS（green）；
//   模型无法伪造「我的测试在旧代码上失败」，因为旧代码是 git 里固定的（反「自我评分」核心）。
// 全部纯函数（零 IO），selftest 覆盖各分类、VP 围栏解析、verify.cmd 注入拒绝、type×green/red 组合。
// 自检：node .claude/skills/dev-autonomous/scripts/verify.mjs --selftest
import { resolve, relative, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

export const VP_TYPES = new Set(["bug", "feature", "no-change"]);
export const VERIFY_KINDS = new Set(["selftest", "check", "custom", "manual"]);
// verifySummary 的所有可能取值（verifying 状态据此判定 hard-fail 短路 / gate 据此判 merge）
export const SUMMARIES = ["red-green", "passed", "no-red", "trivial-red", "green-fail", "killed", "manual", "no-change"];

// ---------- VP 定界符（避开 ```json，防与阶段4 review 输出混淆）----------
export const VP_FENCE = "VERIFY_PLAN";

// 从文本取 JSON 对象（移植自 review-sub.extractJsonObject，避免循环依赖，独立内联）
function extractJsonObject(s) {
  if (s == null) return null;
  let t = String(s).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch { /* fallthrough */ }
  const i = t.indexOf("{"), j = t.lastIndexOf("}");
  if (i >= 0 && j > i) { try { return JSON.parse(t.slice(i, j + 1)); } catch { /* fallthrough */ } }
  return null;
}

// 解析 develop/fix 输出里的 VP（<<<VERIFY_PLAN ... VERIFY_PLAN 围栏内）→ vp 对象 | null
export function parseVp(text) {
  if (!text) return null;
  const m = String(text).match(new RegExp(`<{3}${VP_FENCE}\\s*([\\s\\S]*?)${VP_FENCE}`));
  if (!m) return null;
  return extractJsonObject(m[1]);
}

// VP 形状校验 → {ok, reason?}
export function validateVp(vp) {
  if (!vp || typeof vp !== "object") return { ok: false, reason: "VP 非对象" };
  if (!VP_TYPES.has(vp.type)) return { ok: false, reason: `type 非法: ${vp.type}` };
  if (vp.type === "no-change") return { ok: true }; // no-change 只需 type（develop 给理由即可）
  const v = vp.verify;
  if (!v || typeof v !== "object") return { ok: false, reason: "缺 verify 对象" };
  if (!VERIFY_KINDS.has(v.kind)) return { ok: false, reason: `verify.kind 非法: ${v.kind}` };
  if (v.kind === "manual") return { ok: true }; // manual 不需 cmd（无法确定性验证）
  if (typeof v.cmd !== "string" || !v.cmd.trim()) return { ok: false, reason: "verify.cmd 缺失" };
  return { ok: true };
}

// ---------- 安全：解析 verify.cmd（绝不 sh -c，防注入）----------
// 强制 cmd 形如 `node <repo 内 relpath>`；relpath 解析后须在 worktree 内、无 .. 逃逸、.mjs/.cjs/.js。
// 不检查文件存在（那是 IO 层 runVerify 的事），这里只校验形状/路径安全。
export function parseVerifyCmd(cmd, { worktree } = {}) {
  if (typeof cmd !== "string" || !cmd.trim()) return { error: "verify.cmd 为空" };
  if (!worktree) return { error: "未提供 worktree（无法做路径安全校验）" };
  const m = cmd.trim().match(/^node\s+([^\s]+)$/);
  if (!m) return { error: "verify.cmd 必须形如 `node <脚本路径>`（禁止 shell 元字符 / 管道 / 分号 / 其它命令）" };
  let rel = m[1];
  if (isAbsolute(rel)) return { error: "脚本路径须为仓库内相对路径（禁止绝对路径）" };
  if (rel.includes("..")) return { error: "脚本路径禁止 .. 逃逸" };
  if (!/\.(mjs|cjs|js)$/i.test(rel)) return { error: "脚本须 .mjs / .cjs / .js" };
  const abs = resolve(worktree, rel);
  const back = relative(worktree, abs);
  if (back.startsWith("..") || isAbsolute(back)) return { error: "脚本路径逃逸 worktree" };
  return { bin: "node", scriptPath: abs, rel };
}

// ---------- 退出码分类 ----------
export function classifyExit({ exit, signal } = {}) {
  if (signal === "SIGTERM" || signal === "SIGKILL") return "killed";
  if (exit === 0) return "green";
  if (exit != null && exit !== 0) return "red";
  return "killed"; // 无 exit 无 signal
}

// ---------- red 失败原因分类（决定是否「琐碎 red」）----------
// 仅在对 base 的 red-on-base 跑有意义：assertion=真复现；其余=琐碎（module/syntax/enoent/network=环境/引用问题，不是 bug 真复现）
export function classifyRedFailure({ exit, stdout = "", stderr = "" } = {}) {
  const out = `${stdout}\n${stderr}`;
  if (exit === 0) return { kind: "green-on-base", trivial: false, evidence: "base 上 exit 0（vacuous 测试，没复现 bug）" };
  if (/Cannot find module|ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND/i.test(out)) return { kind: "module", trivial: true, evidence: "module not found（base 上引用了 fix 才有的模块）" };
  if (/SyntaxError|Unexpected (token|end of)/i.test(out)) return { kind: "syntax", trivial: true, evidence: "syntax error" };
  if (/ENOENT|no such file or directory/i.test(out)) return { kind: "enoent", trivial: true, evidence: "enoent（文件缺失）" };
  if (/ECONN|getaddrinfo|fetch failed|socket hang up|ETIMEDOUT|ECONNREFUSED|network is unreachable/i.test(out)) return { kind: "network", trivial: true, evidence: "network（联网非确定性）" };
  return { kind: "assertion", trivial: false, evidence: out.slice(0, 200) }; // 真 red：断言失败
}

// ---------- 综合 verify 摘要 ----------
// 入参：{type, greenRun, redRun?}  greenRun/redRun = {exit, signal, stdout, stderr} | null
// 出参：SUMMARIES 之一。hard-fail（green-fail/killed/trivial-red/no-red）由 run-loop verifying 状态短路 → fixing。
export function verifySummary({ type, greenRun, redRun = null } = {}) {
  if (type === "no-change") return "no-change";
  if (type === "manual") return "manual";
  if (!greenRun) return "green-fail";
  const ge = classifyExit(greenRun);
  if (ge === "killed") return "killed";
  if (ge === "red") return "green-fail"; // fix 上都没过 → 最优先 hard-fail
  // ge === green
  if (type === "feature") return "passed";
  // type === bug：还需 red-on-base
  if (!redRun) return "no-red";
  const re = classifyExit(redRun);
  if (re === "green") return "no-red"; // base 上通过 = vacuous
  if (re === "killed") return "killed";
  const rf = classifyRedFailure(redRun);
  if (rf.trivial) return "trivial-red";
  return "red-green"; // 真 red-green：bug 真复现 + fix 通过
}

// hard-fail 摘要集合（verifying 状态据此短路直奔 fixing，跳过 review）
export const VERIFY_HARD_FAIL = new Set(["green-fail", "killed", "trivial-red", "no-red"]);

// 给 fix 子进程的可读反馈（按 summary）
export function verifyFailHint(summary, green = {}, red = null) {
  switch (summary) {
    case "green-fail": return `verify 在 fix 分支上未通过（exit ${green.exit ?? "?"}）：${String((green.stderr || "") + (green.stdout || "")).slice(0, 200)}。请修正代码使 verify green。`;
    case "no-red": return red ? "verify 在 base 上 exit 0（vacuous 测试，没复现 bug）。请改写 verify 使其真正断言 bug 行为、在旧代码上因断言失败而 exit≠0。" : "bug 类未跑 red-on-base。";
    case "trivial-red": return `verify 在 base 上的失败是琐碎的（${red ? classifyRedFailure(red).evidence : "?"}），不是 bug 真复现。请确保 verify 只经 base 已有入口测可观察行为，在 base 上因断言失败 exit≠0。`;
    case "killed": return "verify 超时或被杀（可能死循环 / 读 stdin / 联网）。请确保 verify 确定性、离线、有界。";
    default: return `verify 未通过（${summary}）。`;
  }
}

// ---------- 离线自检 ----------
function selftest() {
  let ok = 0, bad = 0;
  const tt = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); c ? ok++ : bad++; };
  const j = (o) => JSON.stringify(o);

  console.log("[selftest] parseVp");
  tt(j(parseVp(`前文\n<<<${VP_FENCE}\n{"type":"bug","verify":{"cmd":"node s.mjs","kind":"selftest"}}\n${VP_FENCE}\n后文`)) === j({ type: "bug", verify: { cmd: "node s.mjs", kind: "selftest" } }), "围栏内裸 JSON");
  tt(j(parseVp(`<<<${VP_FENCE}\n\`\`\`json\n{"type":"feature","verify":{"cmd":"node x.js","kind":"custom"}}\n\`\`\`\n${VP_FENCE}`)) === j({ type: "feature", verify: { cmd: "node x.js", kind: "custom" } }), "围栏内带 ```json");
  tt(parseVp("无 VP 围栏的普通输出") === null, "无围栏 → null");
  tt(parseVp(`<<<${VP_FENCE}\n{不是合法json}\n${VP_FENCE}`) === null, "围栏内非法 JSON → null");

  console.log("[selftest] validateVp");
  tt(validateVp({ type: "bug", verify: { cmd: "node s.mjs", kind: "selftest" } }).ok === true, "bug+selftest+cmd → ok");
  tt(validateVp({ type: "feature", verify: { cmd: "node x.js", kind: "custom" } }).ok === true, "feature → ok");
  tt(validateVp({ type: "no-change" }).ok === true, "no-change 只需 type → ok");
  tt(validateVp({ type: "feature", verify: { kind: "manual" } }).ok === true, "manual 不需 cmd → ok");
  tt(validateVp({ type: "x" }).ok === false, "非法 type → !ok");
  tt(validateVp({ type: "bug" }).ok === false, "bug 缺 verify → !ok");
  tt(validateVp({ type: "bug", verify: { cmd: "node s.mjs", kind: "weird" } }).ok === false, "非法 kind → !ok");
  tt(validateVp({ type: "bug", verify: { kind: "selftest" } }).ok === false, "selftest 缺 cmd → !ok");

  console.log("[selftest] parseVerifyCmd（注入拒绝）");
  const wt = "/wt";
  tt(parseVerifyCmd("node scripts/verify-issue-1.mjs", { worktree: wt }).bin === "node", "合法 node relpath → bin=node");
  tt(parseVerifyCmd("node x.cjs", { worktree: wt }).rel === "x.cjs", ".cjs 允许");
  tt(!!parseVerifyCmd("node x.sh", { worktree: wt }).error, ".sh 拒绝");
  tt(!!parseVerifyCmd("node ../escape.mjs", { worktree: wt }).error, ".. 逃逸拒绝");
  tt(!!parseVerifyCmd("node /abs/x.mjs", { worktree: wt }).error, "绝对路径拒绝");
  tt(!!parseVerifyCmd("node x.mjs; rm -rf .", { worktree: wt }).error, "分号注入拒绝");
  tt(!!parseVerifyCmd("node x.mjs | tee log", { worktree: wt }).error, "管道注入拒绝");
  tt(!!parseVerifyCmd("sh -c x", { worktree: wt }).error, "非 node 拒绝");
  tt(!!parseVerifyCmd("node foo/../../../etc/passwd", { worktree: wt }).error, "复合 .. 逃逸拒绝");
  tt(!!parseVerifyCmd("node x.mjs", { worktree: undefined }).error, "无 worktree 拒绝（无法做路径安全）");

  console.log("[selftest] classifyExit");
  tt(classifyExit({ exit: 0 }) === "green", "exit 0 → green");
  tt(classifyExit({ exit: 1 }) === "red", "exit≠0 → red");
  tt(classifyExit({ signal: "SIGTERM" }) === "killed", "SIGTERM → killed");
  tt(classifyExit({}) === "killed", "无 exit/signal → killed");

  console.log("[selftest] classifyRedFailure");
  tt(classifyRedFailure({ exit: 1, stderr: "Error: Cannot find module './fix'" }).trivial === true, "module not found → trivial");
  tt(classifyRedFailure({ exit: 1, stderr: "SyntaxError: Unexpected token" }).kind === "syntax", "SyntaxError → syntax");
  tt(classifyRedFailure({ exit: 1, stderr: "ENOENT: no such file" }).kind === "enoent", "ENOENT → enoent");
  tt(classifyRedFailure({ exit: 1, stderr: "fetch failed: ECONNREFUSED" }).kind === "network", "network → network");
  tt(classifyRedFailure({ exit: 1, stderr: "AssertionError [ERR_ASSERTION]" }).trivial === false, "AssertionError → 真 red（非 trivial）");
  tt(classifyRedFailure({ exit: 0 }).kind === "green-on-base", "exit 0 → green-on-base（vacuous）");

  console.log("[selftest] verifySummary（type × green/red 矩阵）");
  tt(verifySummary({ type: "no-change" }) === "no-change", "no-change → no-change");
  tt(verifySummary({ type: "manual" }) === "manual", "manual → manual");
  tt(verifySummary({ type: "feature", greenRun: { exit: 0 } }) === "passed", "feature green → passed");
  tt(verifySummary({ type: "feature", greenRun: { exit: 1 } }) === "green-fail", "feature green 失败 → green-fail");
  tt(verifySummary({ type: "feature", greenRun: { signal: "SIGTERM" } }) === "killed", "feature killed → killed");
  tt(verifySummary({ type: "bug", greenRun: { exit: 0 }, redRun: { exit: 1, stderr: "AssertionError" } }) === "red-green", "bug 真 red-green → red-green");
  tt(verifySummary({ type: "bug", greenRun: { exit: 0 }, redRun: { exit: 0 } }) === "no-red", "bug base exit 0 → no-red（vacuous）");
  tt(verifySummary({ type: "bug", greenRun: { exit: 0 }, redRun: { exit: 1, stderr: "Cannot find module" } }) === "trivial-red", "bug base 琐碎 red → trivial-red");
  tt(verifySummary({ type: "bug", greenRun: { exit: 0 }, redRun: null }) === "no-red", "bug 未跑 red → no-red");
  tt(verifySummary({ type: "bug", greenRun: { exit: 1 }, redRun: { exit: 1 } }) === "green-fail", "bug green 先败 → green-fail（最优先）");

  console.log("[selftest] VERIFY_HARD_FAIL + verifyFailHint");
  tt(VERIFY_HARD_FAIL.has("green-fail") && VERIFY_HARD_FAIL.has("trivial-red") && !VERIFY_HARD_FAIL.has("red-green"), "hard-fail 集合边界正确");
  tt(/fix 分支上未通过/.test(verifyFailHint("green-fail", { exit: 1, stderr: "boom" })), "green-fail hint 含原因");
  tt(/vacuous/.test(verifyFailHint("no-red", {}, { exit: 0 })), "no-red hint 含 vacuous");
  tt(/琐碎/.test(verifyFailHint("trivial-red", {}, { exit: 1, stderr: "Cannot find module" })), "trivial-red hint 含琐碎");

  console.log(`\n${bad === 0 ? "✅ verify selftest PASS" : "❌ verify selftest FAIL"}  通过 ${ok}，失败 ${bad}`);
  process.exit(bad === 0 ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--selftest")) selftest();
  else { console.log("用法：node .claude/skills/dev-autonomous/scripts/verify.mjs --selftest"); process.exit(0); }
}
