#!/usr/bin/env node
// CNB(cnb.cool) 平台适配器：仅 dev-autonomous 自主开发流程使用。
// 提供 issue 拉取/评论/关闭、PR 创建/合并。认证读 CNB_API_TOKEN（process.env 或根目录 .env.local），绝不打印值。
// 端点约定：https://api.cnb.cool/$REPO/-/<seg>，如 issues/42、pulls、pulls/9/merge。
// REPO 根据实际 origin 解析（CNB_ISSUE_REPO 可显式覆盖）。
// call/重试/解析/normalizeIssue 由 platforms/common.mjs 共享提供。
//
// 自检：node .claude/skills/dev-autonomous/scripts/platforms/cnb.mjs --selftest
import { pathToFileURL } from "node:url";
import { createCall, parseEnvText, loadToken, normalizeIssue, F , remoteRepo } from "./common.mjs";

const API = "https://api.cnb.cool";
export const REPO = process.env.CNB_ISSUE_REPO || remoteRepo();
const KEY_NAME = "CNB_API_TOKEN";
export const TOKEN_KEY = KEY_NAME; // 供外层 preflight 本地校验 token 是否存在（不联网）

const call = createCall({
  urlFor: (seg) => `${API}/${REPO}/-/${seg}`,
  authHeaders: (t) => ({ Authorization: `Bearer ${t}`, Accept: "application/json" }),
  keyName: KEY_NAME,
  label: "CNB",
});

// 透传共享工具（保持与原 cnb.mjs 导出一致）
export { parseEnvText, loadToken, normalizeIssue };

// ---------- 导出接口 ----------
export async function getIssue(n) { return call("GET", `issues/${n}`); }

// listIssues：返回原始（未规范化）数组 + hasMore。state=open|closed，labels 逗号分隔，page 从 1 起。
export async function listIssues({ state = "open", labels, page = 1, page_size = 50 } = {}) {
  const q = new URLSearchParams({ state, page: String(page), page_size: String(page_size) });
  if (labels) q.set("labels", Array.isArray(labels) ? labels.join(",") : labels);
  const data = await call("GET", `issues?${q}`);
  const arr = Array.isArray(data) ? data : (data?.items || data?.data || data?.issues || []);
  return { issues: arr, hasMore: arr.length === page_size && arr.length > 0 };
}

// 翻页累积 + 规范化（默认 open；maxPages 防失控）
export async function listAllIssues({ state = "open", labels, page_size = 50, maxPages = 50 } = {}) {
  const out = [];
  let page = 1;
  while (page <= maxPages) {
    const { issues, hasMore } = await listIssues({ state, labels, page, page_size });
    for (const it of issues) out.push(normalizeIssue(it));
    if (!hasMore || issues.length === 0) break;
    page++;
  }
  return out;
}

export async function comment(n, body) { return call("POST", `issues/${n}/comments`, { body }); }
export async function closeIssue(n, reason = "completed") {
  return call("PATCH", `issues/${n}`, { state: "closed", state_reason: reason });
}

// createPr：PR 已存在（CNB errcode 2009003）→ 不报错，从 errparam.number 取已存在 PR 号返回
export async function createPr({ title, head, base = "dev", body }) {
  try { return await call("POST", "pulls", { title, base, head, body }); }
  catch (e) {
    const ec = e?.payload?.errcode ?? e?.payload?.code;
    const num = e?.payload?.errparam?.number ?? e?.payload?.number;
    if (ec === 2009003 && num) return { number: num, __alreadyExists: true };
    throw e;
  }
}

// mergePr：对「已合并」幂等容错（重跑/竞态）
export async function mergePr(n, { merge_style = "merge", commit_title } = {}) {
  try { return await call("PUT", `pulls/${n}/merge`, { merge_style, commit_title }); }
  catch (e) {
    if (/already|merged|已合并/i.test(e?.message || "")) return { __alreadyMerged: true };
    throw e;
  }
}

// ---------- 离线自检（保留 CNB 平台特定断言：URL /-/、errcode 2009003、merge_style、page_size）----------
async function selftest() {
  let ok = 0, bad = 0;
  const tt = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); c ? ok++ : bad++; };
  const j = (o) => JSON.stringify(o);
  const prevTok = process.env[KEY_NAME];
  process.env[KEY_NAME] = "fake-selftest-tok";
  const orig = F.fetch;
  let cap = null;

  console.log("[selftest] call URL/方法/Bearer 头（CNB /-/ 路径）");
  F.fetch = async (url, init) => {
    cap = { url, method: init.method, authFmt: /^Bearer\s+\S+$/.test(init.headers?.Authorization || ""), hasBody: "body" in init, body: init.body };
    return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) };
  };
  try {
    await getIssue(42);
    tt(cap.url === `${API}/${REPO}/-/issues/42`, "GET issues/42 URL（/-/ 形状）");
    tt(cap.method === "GET" && cap.authFmt && !cap.hasBody, "GET + Bearer 头、无 body");

    await comment(42, "hi");
    tt(cap.url.endsWith("/issues/42/comments") && cap.method === "POST", "POST comments 端点/方法");
    tt(JSON.parse(cap.body).body === "hi", "POST body 透传");

    await mergePr(9, { commit_title: "t" });
    tt(cap.url.endsWith("/pulls/9/merge") && cap.method === "PUT", "PUT pulls/9/merge 端点/方法");
    tt(JSON.parse(cap.body).merge_style === "merge", "merge 用 merge_style 字段（CNB 专有）");
  } finally { F.fetch = orig; }

  console.log("[selftest] 429 退避重试");
  let tries = 0;
  F.fetch = async () => { tries++; if (tries === 1) return { ok: false, status: 429, text: async () => "rate" }; return { ok: true, status: 200, text: async () => "{}" }; };
  try {
    await getIssue(7);
    tt(tries === 2, `429 后重试一次（共 ${tries} 次）`);
  } finally { F.fetch = orig; }

  console.log("[selftest] createPr 吃 errcode 2009003（PR 已存在）");
  F.fetch = async () => ({ ok: false, status: 400, text: async () => JSON.stringify({ errcode: 2009003, errparam: { number: 99 } }) });
  try {
    const pr = await createPr({ title: "t", head: "b", base: "dev", body: "x" });
    tt(pr && pr.number === 99 && pr.__alreadyExists === true, "2009003 → 返回已有 PR 号不抛");
  } finally { F.fetch = orig; }

  console.log("[selftest] mergePr 吃已合并");
  F.fetch = async () => ({ ok: false, status: 409, text: async () => "Pull request already merged" });
  try {
    const r = await mergePr(9);
    tt(r && r.__alreadyMerged === true, "已合并(409) → 幂等返回不抛");
  } catch (e) { tt(false, "mergePr 已合并不应抛: " + e.message); }
  finally { F.fetch = orig; }

  console.log("[selftest] listAllIssues 分页累积（page_size）");
  let pageCalls = 0;
  F.fetch = async (url) => {
    pageCalls++;
    const u = new URL(url, "http://x");
    const page = Number(u.searchParams.get("page"));
    const ps = Number(u.searchParams.get("page_size"));
    const arr = page === 1 ? Array.from({ length: ps }, (_, i) => ({ number: i + 1, title: "t", labels: [] })) : [];
    return { ok: true, status: 200, text: async () => JSON.stringify(arr) };
  };
  try {
    const list = await listAllIssues({ page_size: 2 });
    tt(list.length === 2 && pageCalls === 2, `分页 page_size=2：取满翻页、空页停止（共 ${pageCalls} 次请求）`);
    tt(list[0].number === 1 && Array.isArray(list[0].labels), "issue 已规范化");
  } finally { F.fetch = orig; }

  if (prevTok === undefined) delete process.env[KEY_NAME]; else process.env[KEY_NAME] = prevTok;
  console.log(`\n${bad === 0 ? "✅ cnb selftest PASS" : "❌ cnb selftest FAIL"}  通过 ${ok}，失败 ${bad}`);
  process.exit(bad === 0 ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--selftest")) selftest();
  else { console.log("用法：node .claude/skills/dev-autonomous/scripts/platforms/cnb.mjs --selftest"); process.exit(0); }
}
