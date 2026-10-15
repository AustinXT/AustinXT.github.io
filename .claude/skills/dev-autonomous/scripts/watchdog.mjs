#!/usr/bin/env node
// dev-autonomous 看门狗（macOS launchd）：把 run-loop --watch 装成 LaunchAgent。
//   - RunAtLoad：开机/登录自启；KeepAlive：进程退出/崩溃即重启（看门狗）；ThrottleStartInterval：防崩溃洪泛。
//   - token 不入 plist：run-loop/pull-issues 由宿主全局配置注入（root 来自 Git cwd/--repo）。
//   - 关键防坑：launchd PATH 极简，install 时把 node/三个 Harness/PATH 绝对路径烤进 plist。
// 零依赖 Node 18+ ESM。
//
// 用法：
//   node .claude/skills/dev-autonomous/scripts/watchdog.mjs install [--label bug] [--poll-interval 300] [--plist-label <name>]
//   node .claude/skills/dev-autonomous/scripts/watchdog.mjs uninstall
//   node .claude/skills/dev-autonomous/scripts/watchdog.mjs status
//   node .claude/skills/dev-autonomous/scripts/watchdog.mjs logs [-f]
//   node .claude/skills/dev-autonomous/scripts/watchdog.mjs restart
//   node .claude/skills/dev-autonomous/scripts/watchdog.mjs --selftest   （只测 plist 生成，不碰 launchctl）
import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, basename } from "node:path";
import * as os from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
import { resolveRepo } from '../../pr-ready/scripts/review-runtime.mjs';
const root = resolveRepo();
const LAUNCH_AGENTS = resolve(os.homedir(), "Library/LaunchAgents");
const LOG_DIR = resolve(root, ".ai/logs");

const ok = (m) => console.log("  ✓ " + m);
const info = (m) => console.log("  • " + m);
const fail = (m) => console.error("  ✗ " + m);

// ---------- plist label ----------
function defaultPlistLabel() {
  return `com.dev-autonomous.${basename(root).toLowerCase().replace(/[^a-z0-9.-]+/g, "-")}`;
}

// ---------- 绝对路径捕获（launchd PATH 极简，必须烤进 plist）----------
function resolveBin(cmd, envFallback) {
  if (envFallback) return envFallback;
  try { return execSync(`command -v ${cmd}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return null; }
}

// ---------- 透传 AI_DEV_* 环境变量（配置，非密钥）----------
function passthroughEnv() {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith("AI_DEV_") && k !== "AI_DEV_AUTHORIZED_PROJECT" && !/(TOKEN|AUTH|SECRET|PASSWORD|KEY)/i.test(k) && typeof v === "string") env[k] = v;
  }
  return env;
}

// ---------- 纯函数：生成 plist XML（可测，无副作用）----------
export function buildPlist({ label, nodeBin, runLoopPath, workDir, env, logOut, logErr, args, throttle = 10 }) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const envXml = Object.entries(env || {})
    .map(([k, v]) => `      <key>${esc(k)}</key>\n      <string>${esc(v)}</string>`)
    .join("\n");
  const argsXml = [nodeBin, runLoopPath, ...args].map((a) => `      <string>${esc(a)}</string>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${esc(label)}</string>
  <key>ProgramArguments</key>
  <array>
${argsXml}
  </array>
  <key>WorkingDirectory</key>
  <string>${esc(workDir)}</string>
  <key>EnvironmentVariables</key>
  <dict>
${envXml}
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleStartInterval</key>
  <integer>${Number(throttle) || 300}</integer>
  <key>StandardOutPath</key>
  <string>${esc(logOut)}</string>
  <key>StandardErrorPath</key>
  <string>${esc(logErr)}</string>
</dict>
</plist>
`;
}

// ---------- plist 路径 / launchctl target ----------
function plistPath(label) { return resolve(LAUNCH_AGENTS, `${label}.plist`); }
function domainTarget() { return `gui/${execSync("id -u", { encoding: "utf8" }).trim()}`; }
function sh(args, opts = {}) { return spawnSync("sh", ["-c", args], { encoding: "utf8", ...opts }); }

// ---------- 命令 ----------
function install(opt) {
  const label = opt.plistLabel || defaultPlistLabel();
  const nodeBin = process.execPath;
  const bins = Object.fromEntries(['codex', 'opencode', 'claude'].map(bin => [bin.toUpperCase()+'_BIN', resolveBin(bin, process.env[bin.toUpperCase()+'_BIN'])]).filter(([,v])=>v));
  const runLoopPath = resolve(here, "run-loop.mjs");
  if (!existsSync(runLoopPath)) { fail(`未找到 run-loop.mjs：${runLoopPath}`); process.exit(1); }
  mkdirSync(LOG_DIR, { recursive: true });
  const args = ["--watch"];
  if (opt.label) args.push("--label", opt.label);
  args.push("--poll-interval", String(opt.pollInterval || 300));
  const env = { PATH: process.env.PATH || "/usr/bin:/bin", HOME: os.homedir(), ...bins, ...passthroughEnv() };
  const xml = buildPlist({
    label, nodeBin, runLoopPath, workDir: root, env,
    logOut: resolve(LOG_DIR, "watchdog.out.log"), logErr: resolve(LOG_DIR, "watchdog.err.log"),
    args, throttle: 10,
  });
  // 幂等：先 bootout（忽略未装载错误）→ 写 plist → bootstrap
  sh(`launchctl bootout ${domainTarget()}/${label} 2>/dev/null; true`);
  mkdirSync(LAUNCH_AGENTS, { recursive: true });
  writeFileSync(plistPath(label), xml, "utf8");
  const r = sh(`launchctl bootstrap ${domainTarget()} ${plistPath(label)}`);
  if (r.status !== 0 && !/already|Error/i.test(r.stderr || "")) {
    // bootstrap 失败时回退到 legacy load
    const r2 = sh(`launchctl load -w ${plistPath(label)}`);
    if (r2.status !== 0) { fail(`launchctl 装载失败：${(r.stderr || r2.stderr || "").slice(0, 300)}`); process.exit(1); }
  }
  // 立即启动一次（不等 RunAtLoad 下次登录）
  sh(`launchctl kickoff ${domainTarget()}/${label} 2>/dev/null; true`);
  ok(`已安装看门狗：${label}`);
  info(`node=${nodeBin}`);
  for (const [name, bin] of Object.entries(bins)) info(`${name}=${bin}`);
  info(`plist=${plistPath(label)}`);
  info(`日志=${LOG_DIR}/watchdog.{out,err}.log`);
  info(`停止=watchdog.mjs uninstall（勿直接 kill：KeepAlive 会重启）`);
}

function uninstall(opt) {
  const label = opt.plistLabel || defaultPlistLabel();
  sh(`launchctl bootout ${domainTarget()}/${label} 2>/dev/null; true`);
  try { rmSync(plistPath(label), { force: true }); } catch { /* ignore */ }
  ok(`已卸载看门狗：${label}（若有 issue 正在跑，已被打断；reconcile 已落盘，下次再跑可续）`);
}

function status(opt) {
  const label = opt.plistLabel || defaultPlistLabel();
  const r = sh(`launchctl print ${domainTarget()}/${label} 2>&1`);
  if (r.status !== 0) { fail(`未找到 agent：${label}（先 install）`); process.exit(1); }
  const out = r.stdout || "";
  for (const line of out.split("\n")) {
    if (/\t(state|last exit code|pid|path)/i.test(line)) console.log("  " + line.trim());
  }
  info(`完整：launchctl print ${domainTarget()}/${label}`);
}

function logs(opt) {
  const f = resolve(LOG_DIR, "watchdog.out.log");
  if (!existsSync(f)) { fail(`无日志：${f}（先 install 并等待运行）`); process.exit(1); }
  const n = opt.follow ? [] : [];
  if (opt.follow) {
    spawnSync("tail", ["-f", f, resolve(LOG_DIR, "watchdog.err.log")], { stdio: "inherit" });
  } else {
    sh("tail -n 40 " + f, { stdio: ["ignore", "inherit", "inherit"] });
  }
}

function restart(opt) {
  const label = opt.plistLabel || defaultPlistLabel();
  sh(`launchctl kill SIGTERM ${domainTarget()}/${label} 2>/dev/null; true`);
  sh(`launchctl kickoff ${domainTarget()}/${label} 2>/dev/null; true`);
  ok(`已重启：${label}（KeepAlive 也会自动拉起）`);
}

// ---------- 参数 ----------
function parseArgs(argv) {
  const o = { cmd: null, label: null, pollInterval: 0, plistLabel: null, follow: false, selftest: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo') i++;
    else if (a === "-h" || a === "--help") o.help = true;
    else if (a === "--selftest") o.selftest = true;
    else if (a === "--label") o.label = argv[++i];
    else if (a === "--poll-interval") o.pollInterval = parseInt(argv[++i], 10) || 0;
    else if (a === "--plist-label") o.plistLabel = argv[++i];
    else if (a === "-f" || a === "--follow") o.follow = true;
    else if (!o.cmd && /^[a-z]+$/.test(a)) o.cmd = a;
    else { console.error(`未知参数：${a}`); o.help = true; }
  }
  return o;
}
function printHelp() {
  console.log(`dev-autonomous 看门狗（macOS launchd，把 run-loop --watch 装成 LaunchAgent）

用法：
  node .claude/skills/dev-autonomous/scripts/watchdog.mjs install [--label bug] [--poll-interval 300] [--plist-label <name>]
  node .claude/skills/dev-autonomous/scripts/watchdog.mjs uninstall [--plist-label <name>]
  node .claude/skills/dev-autonomous/scripts/watchdog.mjs status [--plist-label <name>]
  node .claude/skills/dev-autonomous/scripts/watchdog.mjs logs [-f]
  node .claude/skills/dev-autonomous/scripts/watchdog.mjs restart [--plist-label <name>]
  node .claude/skills/dev-autonomous/scripts/watchdog.mjs --selftest

特性：RunAtLoad（开机/登录自启）+ KeepAlive（崩了即重启）+ ThrottleStartInterval=10（崩溃 ~10s 恢复 + 防洪泛）。
停止整个 agent 必须 uninstall（直接 kill 会被 KeepAlive 重启）。
token 不入 plist：run-loop 由宿主全局配置注入。`);
}

// ---------- 离线自检（只测纯函数，不碰 launchctl/不写 ~/Library）----------
function selftest() {
  let ok = 0, bad = 0;
  const tt = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); c ? ok++ : bad++; };

  console.log("[selftest] buildPlist");
  const xml = buildPlist({
    label: "com.dev-autonomous.test", nodeBin: "/usr/local/bin/node", runLoopPath: "/repo/run-loop.mjs",
    workDir: "/repo", env: { PATH: "/usr/bin:/bin", HOME: "/root", CLAUDE_BIN: "/x/claude", AI_DEV_BASE: "main" },
    logOut: "/repo/.ai/logs/o.log", logErr: "/repo/.ai/logs/e.log", args: ["--watch", "--label", "bug", "--poll-interval", "300"], throttle: 10,
  });
  tt(xml.includes("<string>com.dev-autonomous.test</string>"), "含 Label");
  tt(xml.includes("/usr/local/bin/node</string>") && xml.includes("/repo/run-loop.mjs</string>"), "ProgramArguments 含 node + run-loop 绝对路径");
  tt(xml.includes("--watch</string>") && xml.includes("--label</string>") && xml.includes("bug</string>"), "args 含 --watch/--label");
  tt(xml.includes("<key>RunAtLoad</key>\n  <true/>"), "RunAtLoad=true（开机自启）");
  tt(xml.includes("<key>KeepAlive</key>\n  <true/>"), "KeepAlive=true（崩溃重启）");
  tt(xml.includes("<key>ThrottleStartInterval</key>\n  <integer>10</integer>"), "ThrottleStartInterval=10（崩溃 ~10s 内恢复 + 防洪泛）");
  tt(xml.includes("<key>CLAUDE_BIN</key>") && xml.includes("<key>AI_DEV_BASE</key>"), "env 含 CLAUDE_BIN + 透传 AI_DEV_*");
  tt(!xml.includes("CNB_API_TOKEN") && !xml.includes("GITHUB_TOKEN"), "token 不入 plist（密钥红线）");
  tt(/<string>bug &amp; x<\/string>/.test(buildPlist({ label: "l", nodeBin: "n", runLoopPath: "r", workDir: "w", env: {}, logOut: "o", logErr: "e", args: ["bug & x"] })), "XML 转义（& < >）");

  console.log("[selftest] defaultPlistLabel / passthroughEnv");
  tt(/^[a-z0-9.-]+$/.test(defaultPlistLabel()), `defaultPlistLabel 合法（${defaultPlistLabel()}）`);
  const env = passthroughEnv();
  tt(Object.keys(env).every((k) => k.startsWith("AI_DEV_")), "passthroughEnv 只收 AI_DEV_*");

  console.log(`\n${bad === 0 ? "✅ watchdog selftest PASS" : "❌ watchdog selftest FAIL"}  通过 ${ok}，失败 ${bad}`);
  process.exit(bad === 0 ? 0 : 1);
}

// ---------- 入口 ----------
const opt = parseArgs(process.argv.slice(2));
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (opt.help || !opt.cmd && !opt.selftest) { printHelp(); process.exit(opt.help ? 0 : 1); }
  if (opt.selftest) { selftest(); process.exit(0); }
  switch (opt.cmd) {
    case "install": install(opt); break;
    case "uninstall": uninstall(opt); break;
    case "status": status(opt); break;
    case "logs": logs(opt); break;
    case "restart": restart(opt); break;
    default: console.error(`未知命令：${opt.cmd}`); printHelp(); process.exit(1);
  }
}
