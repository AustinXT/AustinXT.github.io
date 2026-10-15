#!/usr/bin/env node
// 拉 issue 入队 .ai/queue.json（去重：已在 queue 的 issue 不重复加）。平台由 platform.mjs 选择（cnb/github/gitcode）。
// 零依赖。用法：
//   node .claude/skills/dev-autonomous/scripts/pull-issues.mjs [--label bug] [--state open] [--limit 50] [--dry-run]
//   node .claude/skills/dev-autonomous/scripts/pull-issues.mjs -h
import { readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import * as P from "./platform.mjs";
import { autoLoadEnv } from "./platforms/common.mjs";
// 尽早灌全局+项目 env（standalone 运行也能拿到 AI_DEV_* / token）
autoLoadEnv();

const here = dirname(fileURLToPath(import.meta.url));
import { resolveRepo } from '../../pr-ready/scripts/review-runtime.mjs';
const root = resolveRepo();
const AI_DIR = process.env.AI_DEV_DIR || resolve(root, ".ai");
const QUEUE = resolve(AI_DIR, "queue.json");
const now = () => new Date().toISOString();

function parseArgs(argv) {
  const o = { labels: [], state: "open", limit: 50, dryRun: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--repo") i++;
    else if (a === "-h" || a === "--help") o.help = true;
    else if (a === "--label") o.labels.push(argv[++i]);
    else if (a === "--state") o.state = argv[++i];
    else if (a === "--limit") o.limit = parseInt(argv[++i], 10) || 50;
    else if (a === "--dry-run") o.dryRun = true;
    else if (a.startsWith("--")) { console.error(`未知参数：${a}`); o.help = true; }
  }
  return o;
}
function loadQueue() {
  try { return JSON.parse(readFileSync(QUEUE, "utf8")); }
  catch { return { version: 1, generatedAt: now(), repo: P.REPO, issues: [] }; }
}
function saveQueue(q) {
  mkdirSync(AI_DIR, { recursive: true });
  const tmp = QUEUE + ".tmp";
  writeFileSync(tmp, JSON.stringify(q, null, 2));
  renameSync(tmp, QUEUE);
}
function printHelp() {
  console.log(`拉 CNB issue 入队 .ai/queue.json（去重）

用法：node .claude/skills/dev-autonomous/scripts/pull-issues.mjs [options]
选项：
  --label <name>   只拉带该 label 的 issue（可多次）
  --state <s>      issue 状态（默认 open）
  --limit <n>      本次最多新增 n 条（默认 50）
  --dry-run        只打印将入队的 issue，不写盘
  -h, --help
环境：AI_DEV_PLATFORM=cnb|github|gitcode（默认探测 origin）
  平台 token：CNB_API_TOKEN | GITHUB_TOKEN | GITCODE_TOKEN（必）
  平台 repo：CNB_ISSUE_REPO | GITHUB_REPO | GITCODE_REPO（默认从 origin 解析）`);
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help) { printHelp(); process.exit(0); }

  console.log(`[pull-issues] 平台=${P.PLATFORM} 拉 ${opt.state} issue${opt.labels.length ? " label=" + opt.labels.join(",") : ""} from ${P.REPO}`);
  const issues = await P.listAllIssues({ state: opt.state, labels: opt.labels.length ? opt.labels : undefined });
  const q = loadQueue();
  const known = new Set(q.issues.map((x) => x.issue_number));
  const adding = [];
  for (const it of issues) {
    if (known.has(it.number)) continue; // 去重：任意状态的都不重复入队
    if (adding.length >= opt.limit) break;
    adding.push({ issue_number: it.number, title: it.title, url: it.url, labels: it.labels, body: it.body,
                  state: "queued", attempts: 0, reviews: [], created_at: now(), updated_at: now() });
    console.log(`  ✓ #${it.number} ${it.title}`);
  }
  console.log(`新增 ${adding.length} 条，已存在跳过 ${issues.length - adding.length} 条`);
  if (opt.dryRun) { console.log("（--dry-run：未写盘）"); process.exit(0); }
  if (adding.length) { q.issues.push(...adding); q.generatedAt = now(); saveQueue(q); }
  console.log(`✅ 共 ${q.issues.length} 条 → ${QUEUE}`);
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error("✗ " + e.message); process.exit(1); });
}
