#!/usr/bin/env node
// 门禁判定纯函数：综合「Codex + GLM 双谱系 review + 测试 + 触碰路径」给出 merge/fix/human 决策。
// 设计原则（用户决策）：门禁放宽——不卡 diff 行数/文件数/schema，质量押在双谱系 review + 测试；
//   只保留绝对红线（密钥/secrets/流程自身变更）转人工，绝不自动合并。
// 零依赖纯函数。自检：node .claude/skills/dev-autonomous/scripts/gate.mjs --selftest
import { pathToFileURL } from "node:url";

// 绝对红线路径正则：触碰即转人工（不自动合并）
// 确定性、非 LLM 门：blast-radius 类风险挪到这里判（参 Anthropic auto-mode 17% FNR —— 这类判断不该压给 reviewer 模型）
export const REDLINE = [
  /^\.env(\..*)?$/i, // .env / .env.local / .env.*
  /^secrets\//, // secrets/**
  /\.(pem|key)$/i, // *.pem / *.key
  /^\.(claude|agents|codex)\/skills\/(dev-autonomous|dev-launch|pr-ready)\//, // 流程自身
  /^\.ai\//, // 状态/配置
  /^\.github\/(workflows|actions)\//i, // GitHub Actions CI（自动合并改 CI 风险高）
  /^\.cnb\//i, // CNB CI 配置
  /^\.cnb\.yml$/i, // 本项目 CNB 入口也须人工核对
  /(^|\/)hi\.md$/, // 人类手稿只读
  /^(vault\/raw|notes|resources)\//, // 原件与第三方参考只读
  /^\.42cog\//, // 方向与认知不交给批量修复改写
  /^specs\//, // 标准修订须按项目明确批准
  /^\.gitlab-ci\.yml$/i, // GitLab CI
];

const VERDICTS = new Set(["approve", "request_changes", "block"]);

function hitRedline(touched) {
  if (!Array.isArray(touched)) return [];
  return touched.filter((p) => REDLINE.some((re) => re.test(p)));
}

// 阻断级问题（critical/major）；minor 不阻断（用户决策：门禁放宽，minor 只记建议、不卡合并）
function blockingIssues(v) {
  if (!v || !Array.isArray(v.issues)) return [];
  return v.issues.filter((i) => i && (i.severity === "critical" || i.severity === "major"));
}
function minorIssues(v) {
  if (!v || !Array.isArray(v.issues)) return [];
  return v.issues.filter((i) => i && i.severity === "minor");
}
// 一个 reviewer 的「有效 verdict」：request_changes 但无 critical/major（仅 minor 或无具体条目）→ 降级 approve，不卡合并。
// minor-only 的 request_changes 常是挑剔/风格，反复来回会耗尽 attempts 转人；降级 approve 直接放行（minor 建议仍记录展示）。
function effectiveVerdict(v) {
  if (!v || !VERDICTS.has(v.verdict)) return "unknown";
  if (v.verdict === "request_changes" && blockingIssues(v).length === 0) return "approve";
  if (v.verdict === 'approve' && blockingIssues(v).length) return 'request_changes';
  return v.verdict;
}
// 综合两 reviewer 的「有效」verdict：
//   任一 verdict 非法 → unknown（转 human，不冒险 merge）；
//   任一 block → block；任一有效 request_changes（含 critical/major）→ request_changes；否则 approve。
//   minorCount 一并带回（供 merge 理由展示，不阻断）。
function combineVerdicts(main, sub) {
  const items = [main, sub];
  if (items.some(x=>!x)) return { verdict: "unknown" };
  for (const v of items) if (!VERDICTS.has(v?.verdict)) return { verdict: "unknown" };
  const minorN = items.reduce((s, v) => s + minorIssues(v).length, 0);
  const evs = items.map(effectiveVerdict);
  if (evs.includes("block")) return { verdict: "block", minorCount: minorN };
  if (evs.includes("request_changes")) {
    const blockingN = items.reduce((s, v) => s + blockingIssues(v).length, 0);
    return { verdict: "request_changes", minorCount: minorN, blockingCount: blockingN };
  }
  return { verdict: "approve", minorCount: minorN };
}

// 主判定（短路优先级）：
//   红线 > git 异常 > block > verdict 非法/缺失 > request_changes(可收敛→fix/耗尽→human)
//   > verifyHonesty.bad(→fix) > 测试失败(→fix，行为变更：原 human) > merge 裁定(manual/honesty.weak→merge+weak，否则 merge)
// 入参：{ mainVerdict, subVerdict, test:{pass,cmd,output}, verifyResult:{summary}, verifyHonesty:{verdict:"ok"|"weak"|"bad",reason}, touched, attempts, max }
// 出参：{ decision: "merge"|"fix"|"human", reasons:[...], weak?:true }
// 注：verifyResult 的 hard-fail（green-fail/killed/trivial-red/no-red）已在 run-loop 的 verifying 状态短路→fixing；
//   到此处 summary 仅 red-green/passed/manual（no-change 在 branched 状态已转 skipped，不经 gate）。
export function gateDecision({ mainVerdict, subVerdict, identitiesOk = true, test, verifyResult, verifyHonesty, touched, attempts = 0, max = 3 } = {}) {
  // (1) 绝对红线：触碰受保护路径 → human（不自动合并）
  const hit = hitRedline(touched);
  if (hit.length) return { decision: "human", reasons: [`diff 触碰红线路径: ${hit.join(", ")}`] };

  // (2) git 异常（touched===null）→ human
  if (touched == null) return { decision: "human", reasons: ["git diff 异常，无法判定改动面"] };

  // (3) 综合 verdict：block / 非法(unknown) → human（不可收敛）
  if (!identitiesOk) return {decision:'human',reasons:['双谱系身份缺失、重复或快照过期']};
  const cv = combineVerdicts(mainVerdict, subVerdict);
  if (cv.verdict === "block")
    return { decision: "human", reasons: [`review block 未解决: ${[mainVerdict?.summary, subVerdict?.summary].filter(Boolean).join(" / ") || ""}`] };
  if (cv.verdict === "unknown")
    return { decision: "human", reasons: ["review verdict 缺失或非法"] };

  // (4) request_changes（含 critical/major）→ 可收敛 fix / 耗尽 human
  if (cv.verdict === "request_changes") {
    if (attempts >= max) return { decision: "human", reasons: [`修订次数耗尽 (attempts=${attempts}, max=${max})`] };
    return { decision: "fix", cause: "review", reasons: [`review request_changes: ${cv.blockingCount || 0} 条 critical/major 待修${cv.minorCount ? `（另 ${cv.minorCount} minor 不阻断）` : ""}`] };
  }

  // (5) verifyHonesty.bad（Codex/GLM 任一路判 verify 不诚实：测错东西/琐碎 red/未覆盖 acceptance）→ 可收敛 fix / 耗尽 human
  if (verifyHonesty && verifyHonesty.verdict === "bad") {
    if (attempts >= max) return { decision: "human", reasons: [`verify-honesty 反复不通过 (attempts=${attempts}): ${verifyHonesty.reason || ""}`] };
    return { decision: "fix", cause: "verify-honesty", reasons: [`verify-honesty: ${verifyHonesty.reason || "评审判定 verify 不诚实"}`] };
  }

  // (6) 测试失败（check.mjs 等）→ 可收敛 fix / 耗尽 human（行为变更：原直接 human；现把 stderr 当 fix 反馈）
  if (test && test.pass === false) {
    if (attempts >= max) return { decision: "human", reasons: [`测试反复失败 (attempts=${attempts}) [${test.cmd || "?"}]: ${(test.output || "").slice(0, 120)}`] };
    return { decision: "fix", cause: "test", reasons: [`测试失败 [${test.cmd || "?"}]: ${(test.output || "").slice(0, 160)}`] };
  }

  // (7) merge 裁定：reviews approve + honesty≠bad + test 过 + verify 已过筛
  const weak = (verifyResult && verifyResult.summary === "manual") || (verifyHonesty && verifyHonesty.verdict === "weak");
  const vsum = verifyResult?.summary || "(无 verify)";
  return { decision: "merge", weak: !!weak, reasons: [`双谱系 review(approve) + 测试通过 + verify[${vsum}]${cv.minorCount ? `（${cv.minorCount} minor 不阻断）` : ""}${weak ? " [verify_weak：需人工冒烟]" : ""}`] };
}

// ---------- selftest ----------
function selftest() {
  let ok = 0, bad = 0;
  const tt = (cond, msg) => { console.log((cond ? "  ✓ " : "  ✗ ") + msg); cond ? ok++ : bad++; };
  const APPROVE = { verdict: "approve", summary: "ok", issues: [] };
  const REQ = (n = 1) => ({ verdict: "request_changes", summary: "s", issues: Array.from({ length: n }, () => ({ severity: "major", file: "a", line: 1, problem: "p", suggestion: "s" })) });
  const REQ_MINOR = (n = 1) => ({ verdict: "request_changes", summary: "s", issues: Array.from({ length: n }, () => ({ severity: "minor", file: "a", line: 1, problem: "p", suggestion: "s" })) });
  const BLOCK = { verdict: "block", summary: "bad", issues: [] };
  const dec = (o) => gateDecision({ test: { pass: true }, touched: ["src/a.js"], max: 3, ...o }).decision;

  tt(gateDecision({subVerdict:APPROVE,test:{pass:true},touched:["a"]}).decision==="human","缺 Codex 不得放行");
  tt(gateDecision({mainVerdict:APPROVE,test:{pass:true},touched:["a"]}).decision==="human","缺 GLM 不得放行");
  tt(gateDecision({mainVerdict:APPROVE,subVerdict:APPROVE,touched:["a"],identitiesOk:false}).decision==="human","同谱系/旧快照不得放行");
  console.log("[selftest] 红线拦截");
  tt(dec({ mainVerdict: APPROVE, subVerdict: APPROVE }) === "merge", "正常路径 → merge");
  tt(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: [".env.local"] }).decision === "human", "触碰 .env.local → human");
  tt(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: [".claude/skills/dev-autonomous/scripts/platforms/cnb.mjs"] }).decision === "human", "触碰流程自身（脚本） → human");
  tt(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: [".claude/skills/dev-autonomous/SKILL.md"] }).decision === "human", "触碰自身 skill → human");
  tt(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: [".ai/queue.json"] }).decision === "human", "触碰 .ai → human");
  tt(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: ["src/a.js", "secrets/k.js"] }).decision === "human", "触碰 secrets/ → human");
  tt(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: ["config/server.pem"] }).decision === "human", "触碰 *.pem → human");
  tt(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: [".github/workflows/ci.yml"] }).decision === "human", "触碰 .github/workflows CI → human");
  tt(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: [".cnb/pipeline.yml"] }).decision === "human", "触碰 .cnb CI → human");

  console.log("[selftest] git 异常 / 测试失败");
  tt(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: null }).decision === "human", "touched=null → human");
  tt(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: false, cmd: "node scripts/check.mjs", output: "FAIL" }, touched: ["src/a.js"], max: 3 }).decision === "fix", "测试失败(未耗尽) → fix【行为变更：原 human】");
  tt(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: false, output: "FAIL" }, touched: ["src/a.js"], attempts: 3, max: 3 }).decision === "human", "测试失败(耗尽) → human");

  console.log("[selftest] verdict 组合");
  tt(dec({ mainVerdict: APPROVE, subVerdict: BLOCK }) === "human", "GLM block → human");
  tt(dec({ mainVerdict: BLOCK, subVerdict: APPROVE }) === "human", "Codex block → human");
  tt(gateDecision({ mainVerdict: REQ(2), subVerdict: APPROVE, test: { pass: true }, touched: ["src/a.js"], attempts: 1, max: 3 }).decision === "fix", "request_changes 未耗尽 → fix");
  tt(gateDecision({ mainVerdict: REQ(), subVerdict: APPROVE, test: { pass: true }, touched: ["src/a.js"], attempts: 3, max: 3 }).decision === "human", "request_changes 耗尽 → human");
  tt(dec({ mainVerdict: REQ_MINOR(2), subVerdict: APPROVE }) === "merge", "request_changes 仅 minor → 降级 merge（不阻断）");
  tt(dec({ mainVerdict: REQ_MINOR(1), subVerdict: REQ_MINOR(1) }) === "merge", "双方仅 minor → merge");
  tt(gateDecision({ mainVerdict: REQ(1), subVerdict: REQ_MINOR(3), test: { pass: true }, touched: ["src/a.js"], attempts: 0, max: 3 }).decision === "fix", "含 major → 仍 fix（minor 不影响升级行）");
  tt(dec({ mainVerdict: { verdict: "?" }, subVerdict: APPROVE }) === "human", "verdict 非法 → human");
  tt(dec({ mainVerdict: null, subVerdict: null }) === "human", "verdict 缺失 → human");

  console.log("[selftest] verify 集成");
  const VR = (summary) => ({ summary });
  const H_OK = { verdict: "ok", reason: "" };
  const H_WEAK = { verdict: "weak", reason: "manual-ish" };
  const H_BAD = { verdict: "bad", reason: "测错了东西" };
  tt(dec({ mainVerdict: APPROVE, subVerdict: APPROVE, verifyResult: VR("red-green"), verifyHonesty: H_OK }) === "merge", "bug red-green + approve + honesty ok → merge");
  tt(dec({ mainVerdict: APPROVE, subVerdict: APPROVE, verifyResult: VR("passed"), verifyHonesty: H_OK }) === "merge", "feature passed + honesty ok → merge");
  tt(dec({ mainVerdict: APPROVE, subVerdict: APPROVE, verifyResult: VR("red-green"), verifyHonesty: H_BAD }) === "fix", "honesty.bad(未耗尽) → fix");
  tt(dec({ mainVerdict: APPROVE, subVerdict: APPROVE, verifyResult: VR("red-green"), verifyHonesty: H_BAD, attempts: 3 }) === "human", "honesty.bad(耗尽) → human");
  const mm = gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: ["src/a.js"], verifyResult: VR("manual"), verifyHonesty: H_OK, max: 3 });
  tt(mm.decision === "merge" && mm.weak === true, "manual → merge + weak");
  const ww = gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: ["src/a.js"], verifyResult: VR("red-green"), verifyHonesty: H_WEAK, max: 3 });
  tt(ww.decision === "merge" && ww.weak === true, "honesty.weak → merge + weak");
  tt(/verify_weak/.test(gateDecision({ mainVerdict: APPROVE, subVerdict: APPROVE, test: { pass: true }, touched: ["src/a.js"], verifyResult: VR("manual"), max: 3 }).reasons.join("")), "weak merge 的 reasons 含 [verify_weak]");

  console.log(`\n${bad === 0 ? "✅ gate selftest PASS" : "❌ gate selftest FAIL"}  通过 ${ok}，失败 ${bad}`);
  process.exit(bad === 0 ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--selftest")) selftest();
  else { console.log("用法：node .claude/skills/dev-autonomous/scripts/gate.mjs --selftest"); process.exit(0); }
}
