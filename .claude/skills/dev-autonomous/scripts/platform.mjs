#!/usr/bin/env node
// dev-autonomous 平台选择层：调用方（pull-issues / run-loop）的唯一入口。
// 选择规则：AI_DEV_PLATFORM=cnb|github|gitcode（显式）> git remote get-url origin 的 host 探测 > 默认 cnb。
// 统一 re-export 当前平台适配器的接口（REPO / listAllIssues / getIssue / comment / closeIssue / createPr / mergePr / normalizeIssue）。
// 零依赖：仅 Node 18+ 内置 child_process。
//
// 用法：
//   node .claude/skills/dev-autonomous/scripts/platform.mjs --which      打印解析出的平台
//   node .claude/skills/dev-autonomous/scripts/platform.mjs --selftest   离线自检（注入 env/remote）
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import * as cnb from "./platforms/cnb.mjs";
import * as github from "./platforms/github.mjs";
import * as gitcode from "./platforms/gitcode.mjs";
import { loadToken, autoLoadEnv } from "./platforms/common.mjs"; // 供外层 preflight 本地校验 token

// 尽早灌全局+项目 env——必须在下方 PLATFORM 冻结之前（ESM import 时序：run-loop import 本模块时，
// 本模块 body 先于 run-loop body 执行；不在此加载，全局 AI_DEV_PLATFORM 会被 detectPlatform 错过 → 选错适配器）。
autoLoadEnv();

const here = dirname(fileURLToPath(import.meta.url));
import { resolveRepo } from '../../pr-ready/scripts/review-runtime.mjs';
const root = resolveRepo();

const ADAPTERS = { cnb, github, gitcode };

// 可测纯函数：env 优先 > remote host 探测 > 默认 cnb
export function detectPlatform(remoteUrl = "") {
  const ex = (process.env.AI_DEV_PLATFORM || "").toLowerCase();
  if (ADAPTERS[ex]) return ex;
  if (/cnb\.cool/i.test(remoteUrl)) return "cnb";
  if (/github\.com/i.test(remoteUrl)) return "github";
  if (/gitcode\.com/i.test(remoteUrl)) return "gitcode";
  return "cnb"; // 默认（本项目）
}

function readRemote() {
  try {
    return execSync("git remote get-url origin", { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch { return ""; }
}

export const PLATFORM = detectPlatform(readRemote());
const A = ADAPTERS[PLATFORM] || cnb;

// 统一 re-export 当前平台的接口（逐个 const，因为 export const 不支持对象解构）
export const REPO = A.REPO;
export const listAllIssues = A.listAllIssues;
export const getIssue = A.getIssue;
export const comment = A.comment;
export const closeIssue = A.closeIssue;
export const createPr = A.createPr;
export const mergePr = A.mergePr;
export const normalizeIssue = A.normalizeIssue;
export const TOKEN_KEY = A.TOKEN_KEY; // 当前平台要求的 token env 名（preflight 用）
export { loadToken }; // 本地查 token 是否存在（preflight 用，不联网）

// ---------- 离线自检 ----------
function selftest() {
  let ok = 0, bad = 0;
  const tt = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); c ? ok++ : bad++; };
  const prevP = process.env.AI_DEV_PLATFORM;

  console.log("[selftest] detectPlatform（env 优先 > host 探测 > 默认）");
  process.env.AI_DEV_PLATFORM = "github";
  tt(detectPlatform("https://cnb.cool/x/y.git") === "github", "AI_DEV_PLATFORM=github 优先于 remote 探测");
  process.env.AI_DEV_PLATFORM = "gitcode";
  tt(detectPlatform("") === "gitcode", "AI_DEV_PLATFORM=gitcode 生效（无 remote）");
  process.env.AI_DEV_PLATFORM = "CNB";
  tt(detectPlatform("") === "cnb", "env 大写 CNB 归一化匹配");
  delete process.env.AI_DEV_PLATFORM;
  tt(detectPlatform("git@cnb.cool:seeyeetech/torch-marking.git") === "cnb", "remote cnb.cool → cnb");
  tt(detectPlatform("git@github.com:seeyeetech/torch-marking.git") === "github", "remote github.com → github");
  tt(detectPlatform("https://gitcode.com/seeyeetech/torch-marking.git") === "gitcode", "remote gitcode.com → gitcode");
  tt(detectPlatform("") === "cnb", "无 env 无 remote → 默认 cnb");
  tt(detectPlatform("https://gitlab.com/x/y.git") === "cnb", "未知 host → 默认 cnb");

  console.log("[selftest] 三适配器接口齐全（契约一致）");
  for (const [name, ad] of Object.entries({ cnb, github, gitcode })) {
    tt(typeof ad.REPO === "string" && ad.REPO.includes("/")
      && typeof ad.createPr === "function" && typeof ad.mergePr === "function"
      && typeof ad.listAllIssues === "function" && typeof ad.comment === "function"
      && typeof ad.closeIssue === "function" && typeof ad.normalizeIssue === "function"
      && typeof ad.TOKEN_KEY === "string" && ad.TOKEN_KEY,
      `适配器 ${name} 接口齐全（REPO/TOKEN_KEY/createPr/mergePr/listAllIssues/comment/closeIssue/normalizeIssue）`);
  }

  console.log("[selftest] re-export 透传（PLATFORM 取自模块加载时的真实 env/remote）");
  tt(["cnb", "github", "gitcode"].includes(PLATFORM), `PLATFORM 合法（实得 ${PLATFORM}）`);
  tt(typeof REPO === "string" && REPO.includes("/"), "REPO 透传（owner/repo 形）");
  tt(typeof TOKEN_KEY === "string" && TOKEN_KEY, "TOKEN_KEY 透传（供 preflight 本地校验 token）");
  tt(typeof loadToken === "function", "loadToken 透传");
  tt(typeof createPr === "function" && typeof mergePr === "function" && typeof listAllIssues === "function", "createPr/mergePr/listAllIssues 为函数");

  if (prevP === undefined) delete process.env.AI_DEV_PLATFORM; else process.env.AI_DEV_PLATFORM = prevP;
  console.log(`\n${bad === 0 ? "✅ platform selftest PASS" : "❌ platform selftest FAIL"}  通过 ${ok}，失败 ${bad}`);
  process.exit(bad === 0 ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--selftest")) selftest();
  else if (process.argv.includes("--which")) { console.log(PLATFORM); process.exit(0); }
  else { console.log("用法：node .claude/skills/dev-autonomous/scripts/platform.mjs --selftest | --which"); process.exit(0); }
}
