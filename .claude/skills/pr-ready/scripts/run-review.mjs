#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Worker } from 'node:worker_threads';
import { resolveRepo, resolveBase, loadConfig, snapshot, releaseDecision, redact, prepareModuleSession, assertModuleSessionCurrent, generatedReceipts, generatedFingerprint, REVIEWER_IDS } from './review-runtime.mjs';
import { freezeModulePlan, aggregateModuleReviews } from './review-module-contract.mjs';
const argv = process.argv.slice(2);
function value(flag) { const i = argv.indexOf(flag); return i < 0 ? undefined : argv[i + 1]; }
const moduleMode = argv.some(arg => arg.startsWith('--module-'));
function moduleOptions() {
  const allowed = new Set(['--repo', '--base', '--prompt', '--verify-evidence', '--module-assignment', '--module-plan', '--module-honesty', '--module-binary-evidence-index', '--module-binary-evidence-index-sha', '--reviewer']);
  const options = new Map();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i], argument = argv[i + 1];
    if (!allowed.has(flag)) throw new Error(`module mode 未知参数：${flag}`);
    if (options.has(flag)) throw new Error(`module mode 重复参数：${flag}`);
    if (typeof argument !== 'string' || !argument.length || argument.startsWith('--')) throw new Error(`module mode 参数缺少值：${flag}`);
    options.set(flag, argument);
  }
  if (options.has('--reviewer')) throw new Error('module mode 不允许 --reviewer');
  if (options.has('--module-assignment') === options.has('--module-plan')) throw new Error('module mode 必须指定 --module-assignment 或 --module-plan，且仅指定一个');
  if (!options.has('--prompt')) throw new Error('module mode 必须指定 --prompt');
  if (!['ok', 'ok-or-weak'].includes(options.get('--module-honesty'))) throw new Error('module mode 必须指定 --module-honesty ok|ok-or-weak');
  const hasBinaryIndex = options.has('--module-binary-evidence-index');
  if (hasBinaryIndex !== options.has('--module-binary-evidence-index-sha')) throw new Error('module mode binary evidence index 与 Root SHA 必须同时提供');
  if (hasBinaryIndex && (options.get('--module-binary-evidence-index-sha').length !== 64 || !/^[0-9a-f]{64}$/.test(options.get('--module-binary-evidence-index-sha')))) throw new Error('module mode binary evidence index SHA 必须是 64 位小写 hex');
  return options;
}
function runModuleWorker({id, moduleId, repo, base, session}) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./review-worker.mjs', import.meta.url), {workerData: {mode: 'module', id, moduleId, repo, base, session}});
    let received = false, result, failure;
    worker.on('message', value => {
      if (received) failure = new Error('module review worker 返回多个结果');
      else { received = true; result = value; }
    });
    worker.once('error', error => { failure = error; });
    worker.once('exit', code => {
      if (failure) reject(failure);
      else if (code !== 0 || !received) reject(new Error(`module review worker 提前退出 code=${code}`));
      else resolve(result);
    });
  });
}
try {
  if (moduleMode) {
    try {
      const options = moduleOptions();
      const repo = resolveRepo(), base = resolveBase(repo, options.get('--base'));
      const session = prepareModuleSession({
        repo, base,
        assignmentPath: options.get('--module-assignment'),
        planPath: options.get('--module-plan'),
        promptPath: options.get('--prompt'),
        evidencePath: options.get('--verify-evidence'),
        honestyPolicy: options.get('--module-honesty'),
        binaryEvidenceIndexPath: options.get('--module-binary-evidence-index'),
        binaryEvidenceIndexSha256: options.get('--module-binary-evidence-index-sha'),
      });
      const moduleIds = freezeModulePlan(session.input).moduleIds;
      const bundles = [];
      const runStage = async (moduleId, ids) => {
        assertModuleSessionCurrent({repo, base, session});
        const results = await Promise.allSettled(ids.map(id => runModuleWorker({id, moduleId, repo, base, session})));
        assertModuleSessionCurrent({repo, base, session});
        const failure = results.find(result => result.status === 'rejected');
        if (failure) throw failure.reason;
        return results.map(result => result.value);
      };
      for (const moduleId of moduleIds) {
        bundles.push({moduleId, reviews: await runStage(moduleId, REVIEWER_IDS)});
      }
      const finalSnapshot = assertModuleSessionCurrent({repo, base, session});
      const evaluation = aggregateModuleReviews(session.input, bundles, finalSnapshot);
      assertModuleSessionCurrent({repo, base, session});
      console.log(JSON.stringify({mode: 'module', ...evaluation, bundles}, null, 2));
      process.exitCode = evaluation.pass ? 0 : 1;
    } catch (error) { console.error(redact(error.message)); process.exitCode = 1; }
  } else {
  const repo = resolveRepo(), base = resolveBase(repo, value('--base'));
  const promptPath = value('--prompt');
  if (!promptPath) throw new Error('用法：node run-review.mjs --repo <仓库> --base <ref> --prompt <批准外发的需求/非目标/上下文文件> [--verify-evidence <JSON 文件>] [--reviewer codex|glm]');
  const prompt = readFileSync(promptPath, 'utf8'), config = loadConfig(repo);
  const evidencePath = value('--verify-evidence');
  const verifyEvidence = evidencePath ? JSON.parse(readFileSync(evidencePath, 'utf8')) : undefined;
  if (evidencePath && (!verifyEvidence || typeof verifyEvidence !== 'object' || Array.isArray(verifyEvidence))) throw new Error('验证证据必须是 JSON 对象');
  const before = snapshot(repo, base);
  if (!before.names.length) throw new Error('无改动可审');
  // Registered generated-artifact checks run once here; both lineages receive the same frozen receipt.
  const generated = generatedReceipts(repo, base, before);
  const id = value('--reviewer');
  const run = async ids => Promise.all(ids.map(async id => {
    try {
      return await new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./review-worker.mjs', import.meta.url), {workerData: {id, repo, base, prompt, verifyEvidence, generated, config}});
        let received = false;
        worker.once('message', result => { received = true; resolve(result); });
        worker.once('error', reject);
        worker.once('exit', code => { if (!received) reject(new Error(`review worker 提前退出 code=${code}`)); });
      });
    } catch (error) {
      const reviewer = config.reviewers.find(x => x.id === id);
      return {__parseError: true, reason: redact(error.message), _review: {id, harness: reviewer?.harness, model: reviewer?.model, lineage: reviewer?.lineage, snapshot: before.hash}};
    }
  }));
  // Codex and GLM review the same frozen snapshot in parallel; a single --reviewer run is diagnostic only.
  const reviews = await run(id ? [id] : REVIEWER_IDS);
  let {complete, pass} = releaseDecision(reviews, before.hash, snapshot(repo, base).hash);
  // Release only while the receipt still vouches for the exact bytes on disk.
  if (generated.omitted.length) {
    let same = false;
    try { same = generatedFingerprint(repo, before) === generated.fingerprint; } catch { same = false; }
    if (!same) { complete = false; pass = false; }
  }
  console.log(JSON.stringify({complete, pass, reviews}, null, 2));
  process.exitCode = pass ? 0 : 1;
  }
} catch (e) { console.error(e.message); process.exitCode = 1; }
