#!/usr/bin/env node
// gitcode.com 平台适配器：仅 dev-autonomous 自主开发流程使用。
// 认证读 GITCODE_TOKEN，端点 https://api.gitcode.com/api/v5/repos/$REPO/<seg>。
// gitcode GET pulls 不支持 head 过滤 + 无干净「已存在」错误码 → createPr 非 2xx 时遍历 open PR 按 source_branch 匹配。
// GITCODE_API 可覆盖；GITCODE_REPO 默认同 CNB 仓。call/重试/解析/normalizeIssue 由 common.mjs 共享。
//
// 自检：node .claude/skills/dev-autonomous/scripts/platforms/gitcode.mjs --selftest
import { pathToFileURL } from "node:url";
import { createCall, normalizeIssue, F , remoteRepo } from "./common.mjs";

const API = process.env.GITCODE_API || "https://api.gitcode.com/api/v5";
export const REPO = process.env.GITCODE_REPO || remoteRepo();
const KEY_NAME = "GITCODE_TOKEN";
export const TOKEN_KEY = KEY_NAME; // 供外层 preflight 本地校验 token 是否存在（不联网）

const call = createCall({
  urlFor: (seg) => `${API}/repos/${REPO}/${seg}`,
  authHeaders: (t) => ({ Authorization: `Bearer ${t}`, Accept: "application/json" }),
  keyName: KEY_NAME,
  label: "gitcode",
});

export { normalizeIssue };

// ---------- 导出接口 ----------
export async function getIssue(n) { return call("GET", `issues/${n}`); }

// gitcode 分页用 per_page（最大 100）
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

// createPr：gitcode 无干净「已存在」错误码 + GET pulls 不支持 head 过滤
//   → create 非 2xx（≈422/409）时遍历 open PR 按 source_branch（回退 head.ref/label）匹配已有 number
export async function createPr({ title, head, base = "dev", body }) {
  try { return await call("POST", "pulls", { title, base, head, body }); }
  catch (e) {
    if (e?.status !== 422 && e?.status !== 409) throw e; // 仅疑似「已存在」才兜底
    const list = await call("GET", `pulls?${new URLSearchParams({ state: "open", per_page: "100" })}`);
    const arr = Array.isArray(list) ? list : (list?.items || list?.data || []);
    const found = arr.find((it) => it.source_branch === head || it.head?.ref === head || it.head?.label === head);
    if (found?.number != null) return { number: found.number, __alreadyExists: true };
    throw e; // 遍历也没找到 → 重抛
  }
}

// mergePr：gitcode 用 merge_method；重复合并 / 竞态容错（消息含「已经合并」）
export async function mergePr(n, { merge_method = "merge", commit_title } = {}) {
  try { return await call("PUT", `pulls/${n}/merge`, { merge_method, commit_title }); }
  catch (e) {
    if (/已经合并|已合并|already|merged/i.test(e?.message || "")) return { __alreadyMerged: true };
    throw e;
  }
}

// ---------- 离线自检 ----------
async function selftest() {
  let ok = 0, bad = 0;
  const tt = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); c ? ok++ : bad++; };
  const KEY = KEY_NAME;
  const prev = process.env[KEY];
  process.env[KEY] = "fake-gc-tok";
  const orig = F.fetch;
  let cap = null;

  console.log("[selftest] call URL / Bearer（api/v5/repos/ 形状）");
  F.fetch = async (url, init) => {
    cap = { url, method: init.method, auth: init.headers?.Authorization, body: init.body };
    return { ok: true, status: 200, text: async () => "{}" };
  };
  try {
    await getIssue(42);
    tt(cap.url === `${API}/repos/${REPO}/issues/42`, "GET issues/42 URL（api/v5/repos/ 形状）");
    tt(/^Bearer\s+\S+$/.test(cap.auth || ""), "Bearer 头");

    await listIssues({ page: 1, per_page: 2 });
    tt(cap.url.includes("per_page=2") && !cap.url.includes("page_size"), "分页用 per_page（非 page_size）");

    await mergePr(9, { commit_title: "t" });
    tt(cap.url.endsWith("/pulls/9/merge") && cap.method === "PUT", "PUT pulls/9/merge");
    tt(JSON.parse(cap.body).merge_method === "merge", "merge 用 merge_method 字段");
  } finally { F.fetch = orig; }

  console.log("[selftest] createPr 422 → 遍历 open PR 按 source_branch 兜底");
  const calls = [];
  F.fetch = async (url, init) => {
    calls.push({ url, method: init.method });
    if (init.method === "POST") return { ok: false, status: 422, text: async () => JSON.stringify({ message: "error" }) };
    return { ok: true, status: 200, text: async () => JSON.stringify([{ number: 55, source_branch: "b" }, { number: 60, source_branch: "other" }]) };
  };
  try {
    const pr = await createPr({ title: "t", head: "b", base: "dev", body: "x" });
    tt(pr && pr.number === 55 && pr.__alreadyExists === true, "422 → 遍历取 source_branch=b 的已有 PR 号不抛");
    tt(calls.some((c) => c.method === "GET" && c.url.includes("state=open")), "兜底 GET pulls?state=open（不依赖 head 过滤）");
  } finally { F.fetch = orig; }

  console.log("[selftest] mergePr 吃已合并");
  F.fetch = async () => ({ ok: false, status: 409, text: async () => "Pull Request已经合并" });
  try {
    const r = await mergePr(9);
    tt(r && r.__alreadyMerged === true, "已合并 → 幂等返回不抛");
  } catch (e) { tt(false, "mergePr 已合并不应抛: " + e.message); }
  finally { F.fetch = orig; }

  if (prev === undefined) delete process.env[KEY]; else process.env[KEY] = prev;
  console.log(`\n${bad === 0 ? "✅ gitcode selftest PASS" : "❌ gitcode selftest FAIL"}  通过 ${ok}，失败 ${bad}`);
  process.exit(bad === 0 ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--selftest")) selftest();
  else { console.log("用法：node .claude/skills/dev-autonomous/scripts/platforms/gitcode.mjs --selftest"); process.exit(0); }
}
