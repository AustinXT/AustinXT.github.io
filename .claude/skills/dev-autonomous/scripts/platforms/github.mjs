#!/usr/bin/env node
// GitHub 平台适配器：仅 dev-autonomous 自主开发流程使用。
// 认证读 GITHUB_TOKEN（回退 GH_TOKEN），端点 https://api.github.com/repos/$REPO/<seg>。
// 重复建 PR → 422（GitHub 无干净「已存在」错误码）→ 先 GET pulls?head={owner}:{branch}&state=open 预检取已有号。
// GITHUB_API 可覆盖（自建 GHE）；GITHUB_REPO 默认同 CNB 仓。call/重试/解析/normalizeIssue 由 common.mjs 共享。
//
// 自检：node .claude/skills/dev-autonomous/scripts/platforms/github.mjs --selftest
import { pathToFileURL } from "node:url";
import { createCall, normalizeIssue, F , remoteRepo } from "./common.mjs";

const API = process.env.GITHUB_API || "https://api.github.com";
export const REPO = process.env.GITHUB_REPO || remoteRepo();
const OWNER = REPO.split("/")[0];
// 仅在「只 export 了 GH_TOKEN」时才用 GH_TOKEN；否则一律 GITHUB_TOKEN——让 loadToken 去 env + .env.local/.env 查
// GITHUB_TOKEN。避免「只在 .env.local 放 GITHUB_TOKEN（未 export）」时误判为 GH_TOKEN 而认证失败。
const KEY_NAME = process.env.GH_TOKEN && !process.env.GITHUB_TOKEN ? "GH_TOKEN" : "GITHUB_TOKEN";
export const TOKEN_KEY = KEY_NAME; // 供外层 preflight 本地校验 token 是否存在（不联网）

const call = createCall({
  urlFor: (seg) => `${API}/repos/${REPO}/${seg}`,
  authHeaders: (t) => ({ Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }),
  keyName: KEY_NAME,
  label: "GitHub",
});

export { normalizeIssue };

// ---------- 导出接口 ----------
export async function getIssue(n) { return call("GET", `issues/${n}`); }

// GitHub 分页用 per_page（非 page_size）
export async function listIssues({ state = "open", labels, page = 1, per_page = 50 } = {}) {
  const q = new URLSearchParams({ state, page: String(page), per_page: String(per_page) });
  if (labels) q.set("labels", Array.isArray(labels) ? labels.join(",") : labels);
  const data = await call("GET", `issues?${q}`);
  const arr = Array.isArray(data) ? data : (data?.items || data?.data || data?.issues || []);
  return { issues: arr, hasMore: arr.length === per_page && arr.length > 0 };
}

export async function listAllIssues({ state = "open", labels, per_page = 50, maxPages = 50 } = {}) {
  const out = [];
  let page = 1;
  while (page <= maxPages) {
    const { issues, hasMore } = await listIssues({ state, labels, page, per_page });
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

// createPr：重复建 PR → 422 → GET pulls?head={owner}:{branch}&state=open 预检取已有 number
export async function createPr({ title, head, base = "dev", body }) {
  try { return await call("POST", "pulls", { title, base, head, body }); }
  catch (e) {
    if (e?.status !== 422) throw e;
    const q = new URLSearchParams({ head: `${OWNER}:${head}`, state: "open" });
    const list = await call("GET", `pulls?${q}`);
    const found = Array.isArray(list) ? list[0] : (list?.items?.[0] || list?.[0]);
    if (found?.number != null) return { number: found.number, __alreadyExists: true };
    throw e; // 预检也没找到 → 重抛原 422
  }
}

// mergePr：GitHub 用 merge_method；已合并/重复合并容错
export async function mergePr(n, { merge_method = "merge", commit_title } = {}) {
  try { return await call("PUT", `pulls/${n}/merge`, { merge_method, commit_title }); }
  catch (e) {
    if (/already|merged/i.test(e?.message || "")) return { __alreadyMerged: true };
    throw e;
  }
}

// ---------- 离线自检 ----------
async function selftest() {
  let ok = 0, bad = 0;
  const tt = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); c ? ok++ : bad++; };
  const KEY = KEY_NAME; // 模块加载时求值的实际 token env 名（GITHUB_TOKEN 或 GH_TOKEN）
  const prev = process.env[KEY];
  process.env[KEY] = "fake-gh-tok";
  const orig = F.fetch;
  let cap = null;

  console.log("[selftest] call URL / Bearer / X-GitHub-Api-Version");
  F.fetch = async (url, init) => {
    cap = { url, method: init.method, auth: init.headers?.Authorization, apiVer: init.headers?.["X-GitHub-Api-Version"], accept: init.headers?.Accept, body: init.body };
    return { ok: true, status: 200, text: async () => "{}" };
  };
  try {
    await getIssue(42);
    tt(cap.url === `${API}/repos/${REPO}/issues/42`, "GET issues/42 URL（repos/ 形状）");
    tt(cap.apiVer === "2022-11-28" && /^Bearer\s+\S+$/.test(cap.auth || ""), "X-GitHub-Api-Version + Bearer 头");
    tt((cap.accept || "").includes("vnd.github"), "Accept vnd.github+json");

    await listIssues({ page: 1, per_page: 2 });
    tt(cap.url.includes("per_page=2") && !cap.url.includes("page_size"), "分页用 per_page（非 page_size）");

    await mergePr(9, { commit_title: "t" });
    tt(cap.url.endsWith("/pulls/9/merge") && cap.method === "PUT", "PUT pulls/9/merge");
    tt(JSON.parse(cap.body).merge_method === "merge", "merge 用 merge_method 字段");
  } finally { F.fetch = orig; }

  console.log("[selftest] createPr 422 → 预检 GET pulls?head=");
  const calls = [];
  F.fetch = async (url, init) => {
    calls.push({ url, method: init.method });
    if (init.method === "POST") return { ok: false, status: 422, text: async () => JSON.stringify({ message: "Validation Failed" }) };
    return { ok: true, status: 200, text: async () => JSON.stringify([{ number: 77, head: { ref: "b" } }]) };
  };
  try {
    const pr = await createPr({ title: "t", head: "b", base: "dev", body: "x" });
    tt(pr && pr.number === 77 && pr.__alreadyExists === true, "422 → 预检 GET 取已有 PR 号不抛");
    tt(calls.some((c) => c.method === "GET" && c.url.includes(`head=${OWNER}%3Ab`)), `预检 GET 用 head=${OWNER}:branch 过滤`);
  } finally { F.fetch = orig; }

  console.log("[selftest] mergePr 吃已合并");
  F.fetch = async () => ({ ok: false, status: 409, text: async () => "Pull request already merged" });
  try {
    const r = await mergePr(9);
    tt(r && r.__alreadyMerged === true, "已合并(409) → 幂等返回不抛");
  } catch (e) { tt(false, "mergePr 已合并不应抛: " + e.message); }
  finally { F.fetch = orig; }

  if (prev === undefined) delete process.env[KEY]; else process.env[KEY] = prev;
  console.log(`\n${bad === 0 ? "✅ github selftest PASS" : "❌ github selftest FAIL"}  通过 ${ok}，失败 ${bad}`);
  process.exit(bad === 0 ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--selftest")) selftest();
  else { console.log("用法：node .claude/skills/dev-autonomous/scripts/platforms/github.mjs --selftest"); process.exit(0); }
}
