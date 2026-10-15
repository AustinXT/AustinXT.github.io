#!/usr/bin/env node
// dev-autonomous 平台适配器共享层：parseEnvText / loadToken / normalizeIssue / createCall。
// 三平台（cnb / github / gitcode）的 call() 都由 createCall 工厂生成，参数化 URL 拼接与认证头。
// token 只进认证头，绝不写入日志/返回值。零依赖：仅 Node 18+ 内置 fs/fetch。
//
// 自检：node .claude/skills/dev-autonomous/scripts/platforms/common.mjs --selftest
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
// 项目根从 --repo 或 Git cwd 确定；全局技能目录不代表项目根。
import { resolveRepo, git } from '../../../pr-ready/scripts/review-runtime.mjs';
export const ROOT = resolveRepo();
export function remoteRepo() {
  const url = git(ROOT, ['remote', 'get-url', 'origin']);
  const path = url.replace(/^[^@]+@[^:]+:/, '').replace(/^https?:\/\/[^/]+\//, '').replace(/\.git$/, '').replace(/\/$/, '');
  if (!path.includes('/') || path.includes('://')) throw new Error('无法解析 origin 仓库，显式设置平台 REPO');
  return path;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 可替换的 fetch（selftest 注入假 fetch；各平台 import 同一 F，改 F.fetch 即全局生效）
export const F = { fetch: (...a) => globalThis.fetch(...a) };

// ---------- 零依赖 .env 解析（脚本运行时读取；调用方不读 .env 内容）----------
export function parseEnvText(text) {
  const out = {};
  for (const line of String(text).split(/\r?\n/)) {
    const s = line.trim().replace(/^export\s+/, ""); // 剥 shell 风格 `export ` 前缀，否则 key 变成 "export FOO" 静默失效
    if (!s || s.startsWith("#")) continue;
    const eq = s.indexOf("=");
    if (eq < 0) continue;
    const k = s.slice(0, eq).trim();
    let v = s.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}
function parseEnvFile(p) {
  try { return parseEnvText(readFileSync(p, "utf8")); } catch { return {}; }
}

// 按 keyName 取 token：仅宿主环境变量；不读取项目 .env*，找不到返 null。
export function loadToken({ keyName, root = ROOT }) {
  return process.env[keyName] || null;
}

// 全局 env 文件路径：默认 ~/.config/dev-autonomous/env（可用 AI_DEV_CONFIG 覆盖路径）。
// dev-autonomous 是全局 skill——此文件让 AI_DEV_* / token「设一次、跨项目/跨启动方式(shell/launchd/cron)通用」。
export function globalEnvPath() {
  return process.env.AI_DEV_CONFIG || resolve(homedir(), ".config/dev-autonomous/env");
}

// 把宿主全局配置的变量灌进 process.env（已设的不覆盖 → shell export 优先级最高）。
// 在各入口（run-loop / pull-issues）模块顶部、读 env 的常量之前调用，使 AI_DEV_SUB_* 等全局生效。
// 项目根由 Git cwd/--repo 独立确定；配置文件是宿主所有，不归子进程读取。
export function loadEnvIntoProcess({ root = process.cwd(), override = false } = {}) {
  const files = [globalEnvPath()]; // 不读取项目 .env*，凭证只由宿主配置注入。
  const loaded = [];
  for (const f of files) {
    const env = parseEnvFile(f);
    if (Object.keys(env).length) loaded.push(f);
    for (const [k, v] of Object.entries(env)) {
      if (override || process.env[k] === undefined) process.env[k] = v; // override=true 强制覆盖（--watch 每周期重载，让运行中编辑的 env 即时生效）
    }
  }
  return loaded;
}

// 各入口 / 被 import 的模块顶部调用：尽早点载入全局+项目 env（selftest 跳过；AI_DEV_NO_AUTOENV=1 禁用）。
// 必须放在模块顶部、读 env 的常量之前——确保 ESM import 期冻结的 PLATFORM/SUB_MODEL/CLAUDE_BIN 等也能拿到全局值
// （import 先于模块 body 执行；若只在 run-loop body 调，platform.mjs/review-sub.mjs 的 import 期常量会先冻结成默认值）。
export function autoLoadEnv() {
  if (process.argv.includes("--selftest") || process.env.AI_DEV_NO_AUTOENV === "1") return;
  try { loadEnvIntoProcess(); } catch { /* env 加载失败不阻断主流程 */ }
}

// 脱敏：把文本里疑似密钥的串掩掉，防 key 经 stderr/raw 落盘 queue.json 或进日志。
export function redactSecrets(text) {
  return String(text || "")
    .replace(/sk-[A-Za-z0-9_\-]{16,}/g, "sk-<redacted>")
    .replace(/(AI_DEV_SUB_AUTH_TOKEN\s*[=:]\s*)[^\s"&']+/gi, "$1<redacted>");
}

// ---------- issue 规范化（兼容三平台：labels 字符串或 {name}；url 多字段回退；number/id/iid）----------
function normLabel(l) { return typeof l === "string" ? l : (l?.name ? String(l.name) : (l != null ? String(l) : "")); }
export function normalizeIssue(it) {
  return {
    number: it.number ?? it.id ?? it.iid,
    title: it.title ?? "",
    url: it.html_url || it.web_url || it.url || "",
    state: it.state ?? "open",
    labels: Array.isArray(it.labels) ? it.labels.map(normLabel).filter(Boolean) : [],
    body: it.body ?? "",
  };
}

// ---------- createCall 工厂：生成带超时 + 指数退避重试的 call(method, seg, body) ----------
// opts: { urlFor(seg)->完整 url, authHeaders(token)->headers, keyName, root?, label }
//   非 2xx → 抛 Error 带 .payload(解析后 JSON) / .status；429|>=500|Abort|TypeError 可重试。
//   204/非 JSON → 返回 null。
export function createCall({ urlFor, authHeaders, keyName, root = ROOT, label }) {
  return async function call(method, seg, body, { maxAttempts = 4, timeoutMs = 60000 } = {}) {
    const token = loadToken({ keyName, root });
    if (!token) throw new Error(`缺少 ${keyName}（宿主环境变量）`);
    const url = urlFor(seg);
    const headers = authHeaders(token);
    const init = { method, headers };
    if (body !== undefined) { headers["Content-Type"] = "application/json"; init.body = JSON.stringify(body); }
    let lastErr;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), timeoutMs);
      try {
        const res = await F.fetch(url, { ...init, signal: ctl.signal });
        const text = await res.text();
        let json = null;
        try { json = JSON.parse(text); } catch { /* 非 JSON（如 204 No Content） */ }
        if (res.status === 429 || res.status >= 500) {
          const re = new Error(`${label} ${method} ${seg} → HTTP ${res.status}（可重试）`);
          re.retryable = true; re.status = res.status; re.payload = json; throw re; // 抛 Error（非裸对象）：保留 status/payload 供下游诊断，避免重试耗尽变 [object Object]
        }
        if (!res.ok) {
          const e = new Error(`${label} ${method} ${seg} → HTTP ${res.status}: ${text.slice(0, 200)}`);
          e.payload = json; e.status = res.status; throw e;
        }
        return json;
      } catch (e) {
        lastErr = e;
        const retryable = e?.name === "AbortError" || e?.name === "TypeError" || e?.retryable === true;
        const last = attempt === maxAttempts - 1;
        if (!retryable || last) {
          if (e?.name === "AbortError") throw new Error(`${label} ${method} 请求超时（>${timeoutMs / 1000}s）`);
          throw e instanceof Error ? e : new Error(String(e?.message || e));
        }
        await sleep((2 ** attempt) * 500 + 200);
      } finally { clearTimeout(timer); }
    }
    throw lastErr;
  };
}

// ---------- 离线自检 ----------
async function selftest() {
  let ok = 0, bad = 0;
  const tt = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); c ? ok++ : bad++; };
  const K1 = "_CMMN_TOK_A", K2 = "_CMMN_TOK_B", K3 = "_CMMN_TOK_C", K4 = "_CMMN_TOK_D";
  const cleanup = () => { for (const k of [K1, K2, K3, K4]) delete process.env[k]; };

  console.log("[selftest] parseEnvText");
  const env = parseEnvText('# 注释\nTOK="tok-abc"\nX=y\n');
  tt(env.TOK === "tok-abc" && env.X === "y", "解析带引号/注释");
  tt(Object.keys(parseEnvText("A=1\n\n# c\nB=2")).length === 2, "跳过空行/注释");
  const ex = parseEnvText("export FOO=bar\nexport BAZ=\"qux\"\nPLAIN=z");
  tt(ex.FOO === "bar" && ex.BAZ === "qux" && ex.PLAIN === "z" && !("export FOO" in ex), "剥 export 前缀（shell 风格 env 文件不静默失效）");

  console.log("[selftest] redactSecrets");
  tt(/sk-<redacted>/.test(redactSecrets("err: invalid sk-abcdef0123456789abcd")) && !/abcdef0123456789/.test(redactSecrets("err: invalid sk-abcdef0123456789abcd")), "掩掉 sk- 长 key");
  tt(/AI_DEV_SUB_AUTH_TOKEN=<redacted>/.test(redactSecrets("AI_DEV_SUB_AUTH_TOKEN=sk-xxx")) && !/sk-xxx/.test(redactSecrets("AI_DEV_SUB_AUTH_TOKEN=sk-xxx")), "掩掉 AI_DEV_SUB_AUTH_TOKEN=值");

  console.log("[selftest] normalizeIssue（三平台字段兼容）");
  const n1 = normalizeIssue({ number: 7, title: "T", html_url: "u", labels: [{ name: "bug" }, "feat"] });
  tt(n1.number === 7 && n1.labels[0] === "bug" && n1.labels[1] === "feat" && n1.url === "u", "labels 对象+字符串 / url=html_url");
  const n2 = normalizeIssue({ id: 8, title: "X", web_url: "w" });
  tt(n2.number === 8 && n2.url === "w", "number 回退 id / url 回退 web_url");

  console.log("[selftest] loadToken（env 优先，绝不打印值）");
  process.env[K1] = "fake-tok";
  tt(loadToken({ keyName: K1 }) === "fake-tok", "env 命中");
  tt(loadToken({ keyName: "_NO_SUCH_KEY_9999" }) === null, "缺失 → null");
  delete process.env[K1];

  console.log("[selftest] globalEnvPath / loadEnvIntoProcess（全局 env 文件）");
  tt(/\.config[\/\\]dev-autonomous[\/\\]env$/.test(globalEnvPath()), "globalEnvPath 默认指向 ~/.config/dev-autonomous/env");
  const origCfg = process.env.AI_DEV_CONFIG;
  const tmpRoot = resolve(tmpdir(), "cmmn-env-" + process.pid);
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* ignore */ }
  mkdirSync(tmpRoot, { recursive: true });
  const gFile = resolve(tmpRoot, "global.env");
  writeFileSync(gFile, "GLOB_ONLY=gv\nSHARED=from-global\n");
  process.env.AI_DEV_CONFIG = gFile;
  process.env.SHARED = "from-shell";
  const loaded = loadEnvIntoProcess({ root: tmpRoot });
  tt(process.env.GLOB_ONLY === "gv", "全局文件变量灌进 process.env");
  tt(process.env.SHARED === "from-shell", "shell 已设优先（不被全局覆盖）");
  tt(Array.isArray(loaded) && loaded.includes(gFile), "返回已加载文件列表");
  delete process.env.GLOB_ONLY; delete process.env.SHARED;
  if (origCfg === undefined) delete process.env.AI_DEV_CONFIG; else process.env.AI_DEV_CONFIG = origCfg;
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* ignore */ }

  console.log("[selftest] createCall（注入假 fetch，不打印 token）");
  let cap = null;
  const orig = F.fetch;
  F.fetch = async (url, init) => {
    cap = { url, method: init.method, authFmt: /^Bearer\s+\S+$/.test(init.headers?.Authorization || ""), hasBody: "body" in init, body: init.body, ct: init.headers?.["Content-Type"] };
    return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) };
  };
  const mkCall = (k) => createCall({ urlFor: (seg) => `https://api.example.com/${seg}`, authHeaders: (t) => ({ Authorization: `Bearer ${t}`, Accept: "application/json" }), keyName: k, label: "EX" });
  try {
    process.env[K2] = "tok-xyz";
    await mkCall(K2)("GET", "foo/42");
    tt(cap.url === "https://api.example.com/foo/42", "urlFor 拼接");
    tt(cap.method === "GET" && cap.authFmt && !cap.hasBody, "GET + Bearer 头、无 body");
    await mkCall(K2)("POST", "bar", { x: 1 });
    tt(cap.method === "POST" && cap.ct === "application/json" && JSON.parse(cap.body).x === 1, "POST body 透传 + Content-Type");
  } finally { cleanup(); }

  console.log("[selftest] createCall 429 退避重试");
  let tries = 0;
  F.fetch = async () => { tries++; if (tries === 1) return { ok: false, status: 429, text: async () => "rate" }; return { ok: true, status: 200, text: async () => "{}" }; };
  process.env[K3] = "t";
  try {
    await mkCall(K3)("GET", "z");
    tt(tries === 2, `429 后重试一次（共 ${tries} 次）`);
  } finally { cleanup(); }

  console.log("[selftest] createCall 非 2xx 抛带 status/payload");
  F.fetch = async () => ({ ok: false, status: 422, text: async () => JSON.stringify({ message: "already" }) });
  process.env[K4] = "t";
  try {
    const e2 = await mkCall(K4)("POST", "pulls", { a: 1 }).catch((e) => e);
    tt(e2 instanceof Error && e2.status === 422 && e2.payload?.message === "already", "非 2xx → Error 带 status/payload");
  } finally { cleanup(); F.fetch = orig; }

  console.log("[selftest] createCall 5xx 重试耗尽 → Error 带 status/payload（非裸对象/[object Object]）");
  const K5 = "_CMMN_TOK_E";
  F.fetch = async () => ({ ok: false, status: 503, text: async () => JSON.stringify({ message: "down" }) });
  process.env[K5] = "t";
  try {
    const e3 = await mkCall(K5)("GET", "z", undefined, { maxAttempts: 2 }).catch((e) => e);
    tt(e3 instanceof Error && e3.status === 503 && e3.payload?.message === "down", "5xx 耗尽 → Error 带 status/payload");
    tt(/HTTP 503/.test(e3.message) && !/\[object Object\]/.test(e3.message), "message 可读（含 'HTTP 503'，非 [object Object]）");
  } finally { delete process.env[K5]; F.fetch = orig; }

  console.log(`\n${bad === 0 ? "✅ common selftest PASS" : "❌ common selftest FAIL"}  通过 ${ok}，失败 ${bad}`);
  process.exit(bad === 0 ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--selftest")) selftest();
  else { console.log("用法：node .claude/skills/dev-autonomous/scripts/platforms/common.mjs --selftest"); process.exit(0); }
}
