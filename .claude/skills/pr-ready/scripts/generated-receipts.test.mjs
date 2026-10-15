#!/usr/bin/env node
// Offline tests for registered generated-artifact receipts. No model is called.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,existsSync,readFileSync,symlinkSync,chmodSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {loadConfig,git,snapshot,runReview,generatedReceipts,GENERATED_REGISTRY,GENERATED_EVIDENCE_PROFILE} from './review-runtime.mjs';

const root = mkdtempSync(join(tmpdir(), 'generated-receipts-test-'));
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS ' + name); }
const approve = {verdict: 'approve', summary: 'ok', issues: []};
const derived = text => text.split('').reverse().join('') + '\n';
const GENERATOR = `import {readFileSync,writeFileSync} from 'node:fs';
const want=readFileSync('in.txt','utf8').trimEnd().split('').reverse().join('')+'\\n';
if(process.argv[2]==='--write-stray')writeFileSync('stray.txt','x');
if(process.argv[2]==='--write-link'){try{writeFileSync('escape/pwned.txt','x')}catch{}}
if(process.argv[2]==='--read-key'){try{readFileSync('k/app.key');console.log('KEY=present')}catch{console.log('KEY=absent')}}
if(process.argv[2]==='--read-linked'){try{console.log('LINKED='+readFileSync('linked/data.txt','utf8').trim())}catch{console.log('LINKED=absent')}}
if(readFileSync('out.txt','utf8')!==want){console.error('generated drift');process.exit(1);}
console.log('generated outputs consistent at '+Date.now()+' '+Math.random());
`;
function registry(extra = {}) {
  return JSON.stringify({schema: 'pr-ready/generated-artifacts/v1', groups: [
    {name: 'reverse', check: ['node', 'gen.mjs'], timeoutMs: 60000, paths: ['out.txt'], sources: ['gen.mjs'], ...extra}]}, null, 2) + '\n';
}
function commit(message) {
  git(root, ['add', '-A']);
  git(root, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message]);
}
function reset(files) {
  git(root, ['checkout', '-q', '--', '.']);
  git(root, ['clean', '-qfd', '-e', '.agents']);
  for (const [path, body] of Object.entries(files)) writeFileSync(join(root, path), body);
}
let invoked = 0;
const seen = [];
function execute(bin, args, o) {
  invoked++; seen.push(o.input);
  if (bin.includes('codex')) writeFileSync(args[args.indexOf('-o') + 1], JSON.stringify(approve));
  return {status: 0, stderr: '', stdout: JSON.stringify({type: 'text', part: {text: JSON.stringify(approve)}})};
}
try {
  spawnSync('git', ['init', '-q', root]);
  writeFileSync(join(root, '.gitignore'), '.agents/notes/\n');
  writeFileSync(join(root, 'gen.mjs'), GENERATOR);
  writeFileSync(join(root, 'in.txt'), 'abc\n');
  writeFileSync(join(root, 'out.txt'), derived('abc'));
  writeFileSync(join(root, GENERATED_REGISTRY), registry());
  commit('fixture');
  git(root, ['update-ref', 'refs/remotes/origin/dev', 'HEAD']);
  const base = 'origin/dev', config = loadConfig(root), prompt = 'fixture';
  const changed = {'in.txt': 'UNIQUE_INPUT_MARKER\n', 'out.txt': derived('UNIQUE_INPUT_MARKER')};

  test('登记生成物只发复现回执，输入与登记文件照常送审', () => {
    reset(changed); invoked = 0; seen.length = 0;
    const full = snapshot(root, base);
    const review = runReview({id: 'glm', repo: root, base, prompt, config, execute});
    assert.equal(review.verdict, 'approve'); assert.equal(invoked, 1);
    const input = seen[0];
    assert.ok(input.includes('UNIQUE_INPUT_MARKER'), '输入文件 diff 仍在');
    assert.ok(!input.includes(derived('UNIQUE_INPUT_MARKER').trimEnd()), '生成物全文与 diff 被省略');
    assert.ok(input.includes('GENERATED ARTIFACT RECEIPTS') && input.includes('CHECK reverse argv=["node","gen.mjs"] sources=["gen.mjs"] exit=0'));
    assert.ok(input.includes('"schema": "pr-ready/generated-artifacts/v1"'), '登记全文随回执送审');
    assert.ok(input.includes('"out.txt" group=reverse base-mode=100644 head-mode=100644 base-blob=') && input.includes('numstat=+1/-1'));
    assert.ok(input.includes('generated outputs consistent'));
    assert.ok(input.includes('"gen.mjs" CHECK SOURCE') && input.includes("console.error('generated drift')"), '未改动的检查源码全文送审');
    assert.ok(input.includes('REVIEWER DUTY'), '评审义务写入回执');
    assert.equal(review._review.evidenceProfile, GENERATED_EVIDENCE_PROFILE);
    assert.equal(review._review.snapshot, full.hash, '快照仍绑定完整 diff');
  });
  test('复现检查失败在调用模型前拒绝，不降级为全文', () => {
    reset({...changed, 'out.txt': 'tampered\n'}); invoked = 0;
    assert.throws(() => runReview({id: 'codex', repo: root, base, prompt, config, execute}), /生成物复现检查失败/);
    assert.equal(invoked, 0);
  });
  test('检查源码登记为生成物、非规范或未跟踪被拒绝', () => {
    for (const [bad, pattern] of [
      [registry({paths: ['out.txt', 'gen.mjs']}), /不能登记为生成物/],
      [registry({sources: ['./gen.mjs']}), /规范路径/],
      [registry({sources: ['missing.mjs'], check: ['node', 'missing.mjs']}), /受跟踪/],
    ]) {
      reset({...changed, [GENERATED_REGISTRY]: bad}); invoked = 0;
      assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), pattern);
      assert.equal(invoked, 0);
    }
  });
  test('检查命令只接受白名单形式', () => {
    for (const check of [['node', './gen.mjs'], ['node', 'sub/../gen.mjs'], ['sh', '-c', 'node gen.mjs'], ['/bin/bash', 'gen.mjs'],
      ['node', '-e', 'process.exit(0)'], ['python3', '-c', 'pass'], ['npm', 'test'], ['env', 'node', 'gen.mjs'], ['./gen.mjs'],
      ['node', '--import', './x.mjs', 'gen.mjs'], ['node', '--import=./x.mjs', 'gen.mjs'], ['node', 'gen.mjs', '--eval=1'],
      ['node', 'gen.mjs', '-eCODE'], ['node', 'gen.mjs', 'in.txt'], ['python3', '-I', '-X', 'gen.mjs'], ['/usr/bin/node', 'gen.mjs']]) {
      reset({...changed, [GENERATED_REGISTRY]: registry({check})}); invoked = 0;
      assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), /不在允许形式/, JSON.stringify(check));
      assert.equal(invoked, 0);
    }
  });
  test('工作树中 symlink 或超限的登记文件/检查源码被拒绝', () => {
    const outside = mkdtempSync(join(tmpdir(), 'generated-outside-'));
    writeFileSync(join(outside, 'gen.mjs'), GENERATOR);
    for (const [path, pattern] of [['gen.mjs', /受跟踪/], [GENERATED_REGISTRY, /受 Git 跟踪/]]) {
      reset(changed); invoked = 0;
      if (path === GENERATED_REGISTRY) writeFileSync(join(outside, path), registry());
      rmSync(join(root, path)); symlinkSync(join(outside, path), join(root, path));
      assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), pattern, path);
      assert.equal(invoked, 0);
    }
    reset({...changed, 'gen.mjs': GENERATOR + '//' + 'x'.repeat(1000001) + '\n'}); invoked = 0;
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), /单文件上限/);
    assert.equal(invoked, 0);
    rmSync(outside, {recursive: true, force: true});
  });
  test('以 - 开头的源码路径不能冒充解释器选项', () => {
    reset({...changed, '--version': GENERATOR, [GENERATED_REGISTRY]: registry({check: ['node', '--version'], sources: ['--version']})});
    git(root, ['add', '--', '--version']); invoked = 0;
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), /规范路径/);
    assert.equal(invoked, 0);
    git(root, ['rm', '-q', '--cached', '--', '--version']); rmSync(join(root, '--version'));
  });
  test('每组独立副本：前一组改写后一组检查脚本无效', () => {
    const tamper = `import {writeFileSync} from 'node:fs';writeFileSync('gen.mjs','process.exit(0)\\n');console.log('a ok');\n`;
    const two = JSON.stringify({schema: 'pr-ready/generated-artifacts/v1', groups: [
      {name: 'tamper', check: ['node', 'tamper.mjs'], timeoutMs: 60000, paths: ['a.txt'], sources: ['tamper.mjs']},
      {name: 'reverse', check: ['node', 'gen.mjs'], timeoutMs: 60000, paths: ['out.txt'], sources: ['gen.mjs']}]}, null, 2) + '\n';
    reset({...changed, 'out.txt': 'tampered\n', 'a.txt': 'a\n', 'tamper.mjs': tamper, [GENERATED_REGISTRY]: two});
    git(root, ['add', 'a.txt', 'tamper.mjs']); invoked = 0;
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), /复现检查失败：reverse/);
    assert.equal(invoked, 0);
    git(root, ['rm', '-q', '--cached', 'a.txt', 'tamper.mjs']);
  });
  test('生成物被换成同名目录时拒绝，不连带排除目录内改动', () => {
    reset({'in.txt': 'abc\n'}); rmSync(join(root, 'out.txt'));
    mkdirSync(join(root, 'out.txt')); writeFileSync(join(root, 'out.txt/x.mjs'), 'export const hidden = 1;\n');
    git(root, ['add', '-A']); invoked = 0;
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), /祖先|不是普通文件/);
    assert.equal(invoked, 0);
    git(root, ['reset', '-q']); rmSync(join(root, 'out.txt'), {recursive: true, force: true});
  });
  test('副本不复制 symlink，检查无法经链接写回真实仓库', () => {
    const real = join(root, '.agents/notes/realdir'); mkdirSync(real, {recursive: true});
    reset({...changed, [GENERATED_REGISTRY]: registry({check: ['node', 'gen.mjs', '--write-link']})});
    symlinkSync(real, join(root, 'escape')); git(root, ['add', 'escape']); invoked = 0;
    const review = runReview({id: 'glm', repo: root, base, prompt, config, execute});
    assert.equal(review.verdict, 'approve'); assert.ok(!existsSync(join(real, 'pwned.txt')), '链接写入未落到真实仓库');
    git(root, ['rm', '-q', '--cached', 'escape']); rmSync(join(root, 'escape')); rmSync(real, {recursive: true, force: true});
  });
  test('symlink 祖先下的受跟踪文件不进入副本', () => {
    reset({...changed, [GENERATED_REGISTRY]: registry({check: ['node', 'gen.mjs', '--read-linked']})});
    writeFileSync(join(root, '.gitignore'), '.agents/notes/\nlinked\n'); git(root, ['add', '.gitignore']);
    mkdirSync(join(root, 'linked')); writeFileSync(join(root, 'linked/data.txt'), 'inside\n'); git(root, ['add', '-f', 'linked/data.txt']);
    const outside = mkdtempSync(join(tmpdir(), 'generated-linked-')); writeFileSync(join(outside, 'data.txt'), 'OUTSIDE_MARKER\n');
    rmSync(join(root, 'linked'), {recursive: true}); symlinkSync(outside, join(root, 'linked')); invoked = 0; seen.length = 0;
    const review = runReview({id: 'glm', repo: root, base, prompt, config, execute});
    assert.equal(review.verdict, 'approve');
    assert.ok(!seen[0].includes('OUTSIDE_MARKER') && seen[0].includes('LINKED=absent'), '仓外内容未经祖先链接进入副本');
    rmSync(join(root, 'linked')); git(root, ['reset', '-q']); rmSync(outside, {recursive: true, force: true});
  });
  test('只改执行权限时回执写明两侧模式', () => {
    reset(changed); chmodSync(join(root, 'out.txt'), 0o755); invoked = 0; seen.length = 0;
    runReview({id: 'glm', repo: root, base, prompt, config, execute});
    assert.ok(seen[0].includes('"out.txt" group=reverse base-mode=100644 head-mode=100755'));
    chmodSync(join(root, 'out.txt'), 0o644);
  });
  test('非严格 UTF-8 的检查源码被拒绝', () => {
    reset(changed); writeFileSync(join(root, 'gen.mjs'), Buffer.concat([Buffer.from(GENERATOR), Buffer.from([0x2f, 0x2f, 0xff, 0x0a])])); invoked = 0;
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), /严格 UTF-8/);
    assert.equal(invoked, 0);
  });
  test('assume-unchanged、filter 属性与冻结后字节漂移均被拒绝', () => {
    reset(changed); git(root, ['update-index', '--assume-unchanged', 'gen.mjs']); invoked = 0;
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), /索引标记/);
    git(root, ['update-index', '--no-assume-unchanged', 'gen.mjs']);
    reset(changed);
    const receipt = generatedReceipts(root, base, snapshot(root, base));
    git(root, ['update-index', '--assume-unchanged', 'gen.mjs']);
    writeFileSync(join(root, 'gen.mjs'), 'process.exit(0)\n');
    assert.equal(snapshot(root, base).hash, receipt.snapshotHash, 'git 快照看不到这处字节变化');
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute, generated: receipt}), /索引标记|字节变化/);
    git(root, ['update-index', '--no-assume-unchanged', 'gen.mjs']);
    reset({...changed, '.gitattributes': 'gen.mjs filter=hide\n'}); git(root, ['add', '.gitattributes']);
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), /filter 属性/);
    git(root, ['rm', '-q', '--cached', '.gitattributes']); rmSync(join(root, '.gitattributes'));
    assert.equal(invoked, 0);
  });
  test('未登记的受跟踪输入被隐藏修改或换行转换时拒绝', () => {
    reset({'in.txt': 'abc\n'}); git(root, ['update-index', '--assume-unchanged', 'in.txt']);
    writeFileSync(join(root, 'in.txt'), 'UNIQUE_INPUT_MARKER\n'); writeFileSync(join(root, 'out.txt'), derived('UNIQUE_INPUT_MARKER')); invoked = 0;
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), /索引标记/, '隐藏的输入修改不能让检查用评审看不到的字节通过');
    git(root, ['update-index', '--no-assume-unchanged', 'in.txt']);
    reset({...changed, '.gitattributes': 'in.txt text eol=lf\n', 'in.txt': 'UNIQUE_INPUT_MARKER\r\n'}); git(root, ['add', '.gitattributes']); invoked = 0;
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), /转换/);
    git(root, ['rm', '-q', '--cached', '.gitattributes']); rmSync(join(root, '.gitattributes'));
    assert.equal(invoked, 0);
  });
  test('合法形状但内容伪造的冻结回执被拒绝', () => {
    reset(changed); invoked = 0;
    const real = generatedReceipts(root, base, snapshot(root, base));
    const empty = {snapshotHash: real.snapshotHash, omitted: [], sources: [], diff: '', fingerprint: '', checks: [], stanza: ''};
    const forged = [empty, {...empty, diff: snapshot(root, base).diff}, {...real, checks: [real.checks[0].replace('exit=0', 'exit=0 ')]},
      {...real, stanza: real.stanza.replace('OMITTED', 'OMITTED\n  - "x"')}, {...real, fingerprint: '0'.repeat(64)}, {...real, sources: []}];
    for (const generated of forged) assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute, generated}), /不一致|形状非法/);
    assert.equal(invoked, 0);
    assert.equal(runReview({id: 'glm', repo: root, base, prompt, config, execute, generated: real}).verdict, 'approve');
  });
  test('形状非法的冻结回执与超出 Codex 硬上限的字符配置被拒绝', () => {
    reset(changed); invoked = 0;
    const receipt = generatedReceipts(root, base, snapshot(root, base));
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute, generated: {...receipt, omitted: 'out.txt'}}), /形状非法/);
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute, generated: {...receipt, extra: 1}}), /形状非法/);
    assert.equal(invoked, 0);
    const dir = mkdtempSync(join(tmpdir(), 'generated-config-')), file = join(dir, 'c.json');
    writeFileSync(file, JSON.stringify({...JSON.parse(readFileSync(new URL('../references/review.config.json', import.meta.url), 'utf8')), maxInputChars: 1048577}));
    const previous = process.env.AI_REVIEW_CONFIG; process.env.AI_REVIEW_CONFIG = file;
    try { assert.throws(() => loadConfig(root), /硬上限/); } finally { if (previous === undefined) delete process.env.AI_REVIEW_CONFIG; else process.env.AI_REVIEW_CONFIG = previous; rmSync(dir, {recursive: true, force: true}); }
  });
  test('检查期间与评审期间 git 看不到的字节漂移都使回执失效', () => {
    reset(changed); git(root, ['add', '-A']); invoked = 0;
    const before = snapshot(root, base);
    const sneaky = () => { git(root, ['update-index', '--assume-unchanged', 'out.txt']); writeFileSync(join(root, 'out.txt'), 'swapped\n'); return {status: 0, stdout: '', stderr: ''}; };
    assert.throws(() => generatedReceipts(root, base, before, sneaky), /检查期间变化|索引标记/);
    assert.equal(snapshot(root, base).hash, before.hash, 'git 快照确实看不到这处变化');
    git(root, ['update-index', '--no-assume-unchanged', 'out.txt']); git(root, ['reset', '-q']);
    reset(changed); git(root, ['add', '-A']); invoked = 0;
    const during = (...args) => { git(root, ['update-index', '--assume-unchanged', 'out.txt']); writeFileSync(join(root, 'out.txt'), 'swapped\n'); return execute(...args); };
    const result = runReview({id: 'glm', repo: root, base, prompt, config, execute: during});
    assert.ok(result.__parseError, '评审期间的隐藏漂移使结果作废'); assert.equal(invoked, 1);
    git(root, ['update-index', '--no-assume-unchanged', 'out.txt']); git(root, ['reset', '-q']);
  });
  test('改动过的登记文件不在 SOURCE 重复发送', () => {
    reset({...changed, [GENERATED_REGISTRY]: registry({timeoutMs: 61000})}); invoked = 0; seen.length = 0;
    runReview({id: 'glm', repo: root, base, prompt, config, execute});
    assert.ok(seen[0].includes('REGISTRY .pr-ready-generated.json') && !seen[0].includes('\nFILE ".pr-ready-generated.json"\n'));
  });
  test('登记文件重复键被拒绝', () => {
    const dup = registry().replace('"timeoutMs": 60000,', '"timeoutMs": 60000, "timeoutMs": 60000,');
    reset({...changed, [GENERATED_REGISTRY]: dup}); invoked = 0;
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}));
    assert.equal(invoked, 0);
  });
  test('改动过的检查源码只随回执发送一次', () => {
    reset({...changed, 'gen.mjs': GENERATOR + '// CHANGED_SOURCE_MARKER\n'}); invoked = 0; seen.length = 0;
    runReview({id: 'glm', repo: root, base, prompt, config, execute});
    const input = seen[0];
    assert.equal(input.split('"gen.mjs" CHECK SOURCE').length, 2);
    assert.ok(!input.includes('\nFILE "gen.mjs"\n'), 'SOURCE 不重复附全文');
  });
  test('被 gitignore 忽略或未跟踪的登记文件被拒绝', () => {
    reset(changed); git(root, ['rm', '-q', '--cached', GENERATED_REGISTRY]);
    writeFileSync(join(root, '.gitignore'), '.agents/notes/\n' + GENERATED_REGISTRY + '\n'); invoked = 0;
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}), /受 Git 跟踪/);
    assert.equal(invoked, 0);
    git(root, ['reset', '-q', 'HEAD', '--', GENERATED_REGISTRY]);
  });
  test('双路入口只跑一次检查，两路共用冻结回执', () => {
    reset(changed); git(root, ['add', '-A']);
    const dir = mkdtempSync(join(tmpdir(), 'generated-cli-')), log = join(dir, 'log'), harness = join(dir, 'h.mjs'), promptFile = join(dir, 'p.md');
    writeFileSync(promptFile, 'fixture\n'); writeFileSync(log, '');
    writeFileSync(harness, `#!/usr/bin/env node
import {appendFileSync,writeFileSync,readFileSync} from 'node:fs';
const args=process.argv.slice(2), id=args.includes('exec')?'codex':'glm', input=readFileSync(0,'utf8');
appendFileSync(process.env.LOG, JSON.stringify({id, receipt: input.slice(input.indexOf('CHECK reverse'), input.indexOf('OMITTED'))})+'\\n');
const text=JSON.stringify({verdict:'approve',summary:'ok',issues:[]});
if(id==='codex') writeFileSync(args[args.indexOf('-o')+1],text); else process.stdout.write(JSON.stringify({type:'text',part:{text}}));
`, {mode: 0o700});
    const cli = new URL('./run-review.mjs', import.meta.url).pathname;
    const env = {...process.env, CODEX_BIN: harness, OPENCODE_BIN: harness, LOG: log}; delete env.AI_REVIEW_CONFIG;
    const r = spawnSync(process.execPath, [cli, '--repo', root, '--base', base, '--prompt', promptFile], {encoding: 'utf8', timeout: 60000, env});
    const summary = JSON.parse(r.stdout), lines = readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse);
    rmSync(dir, {recursive: true, force: true});
    assert.equal(r.status, 0, r.stderr); assert.equal(summary.pass, true);
    assert.equal(new Set(summary.reviews.map(x => x._review.contextDigest)).size, 1, '时间戳输出不使两路材料分叉');
    assert.equal(lines.length, 2); assert.equal(lines[0].receipt, lines[1].receipt);
    assert.ok(summary.reviews.every(x => x._review.evidenceProfile === GENERATED_EVIDENCE_PROFILE));
    git(root, ['reset', '-q']);
  });
  test('冻结回执不属于当前快照时拒绝', () => {
    reset(changed); invoked = 0;
    const receipt = generatedReceipts(root, base, snapshot(root, base));
    writeFileSync(join(root, 'in.txt'), 'other\n');
    assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute, generated: receipt}), /不属于当前快照/);
    assert.equal(invoked, 0);
  });
  test('检查在隔离副本中运行，写入不影响真实仓库', () => {
    reset({...changed, [GENERATED_REGISTRY]: registry({check: ['node', 'gen.mjs', '--write-stray']})}); invoked = 0;
    const review = runReview({id: 'glm', repo: root, base, prompt, config, execute});
    assert.equal(review.verdict, 'approve'); assert.equal(invoked, 1);
    assert.ok(!existsSync(join(root, 'stray.txt')), '检查的写入只落在临时副本');
  });
  test('越界、受保护、自登记与未知字段被拒绝', () => {
    for (const bad of [registry({paths: ['../out.txt']}), registry({paths: ['secrets/out.txt']}), registry({paths: [GENERATED_REGISTRY]}),
      registry({extra: true}), JSON.stringify({schema: 'pr-ready/generated-artifacts/v1', groups: []}), registry({timeoutMs: 0})]) {
      reset({...changed, [GENERATED_REGISTRY]: bad}); invoked = 0;
      assert.throws(() => runReview({id: 'glm', repo: root, base, prompt, config, execute}));
      assert.equal(invoked, 0);
    }
  });
  test('未改动登记生成物时不跑检查、不省略', () => {
    reset({'in.txt': 'abc\n'}); writeFileSync(join(root, 'gen.mjs'), GENERATOR + '// touched\n');
    let checks = 0;
    const r = generatedReceipts(root, base, snapshot(root, base), () => { checks++; return {status: 0}; });
    assert.equal(checks, 0); assert.equal(r.omitted.length, 0); assert.equal(r.stanza, '');
  });
  test('没有登记文件时保持原选材', () => {
    reset(changed); git(root, ['rm', '-q', GENERATED_REGISTRY]); invoked = 0; seen.length = 0;
    const review = runReview({id: 'glm', repo: root, base, prompt, config, execute});
    assert.equal(review._review.evidenceProfile, 'full-diff-added-sources-v1');
    assert.ok(seen[0].includes(derived('UNIQUE_INPUT_MARKER').trimEnd()));
    git(root, ['reset', '-q', 'HEAD', '--', GENERATED_REGISTRY]);
  });
  test('基线为 symlink 的登记路径即使改成普通文件也被拒绝', () => {
    reset({'in.txt': 'abc\n'});
    symlinkSync('in.txt', join(root, 'link.txt'));
    writeFileSync(join(root, GENERATED_REGISTRY), registry({paths: ['out.txt', 'link.txt']}));
    git(root, ['add', '-A']); commit('symlink base'); git(root, ['update-ref', 'refs/remotes/origin/sym', 'HEAD']);
    rmSync(join(root, 'link.txt')); writeFileSync(join(root, 'link.txt'), 'regular now\n'); invoked = 0;
    assert.throws(() => runReview({id: 'glm', repo: root, base: 'origin/sym', prompt, config, execute}), /基线路径不是普通文件/);
    assert.equal(invoked, 0);
  });
  test('未改动的受跟踪密钥文件不被读取、不进入副本', () => {
    reset({'in.txt': 'abc\n'}); git(root, ['reset', '-q', '--hard', 'origin/dev']);
    mkdirSync(join(root, 'k'), {recursive: true}); writeFileSync(join(root, 'k/app.key'), 'NOT_A_REAL_SECRET\n');
    git(root, ['add', '-f', 'k/app.key']); commit('key base'); git(root, ['update-ref', 'refs/remotes/origin/keybase', 'HEAD']);
    for (const [path, body] of Object.entries({...changed, [GENERATED_REGISTRY]: registry({check: ['node', 'gen.mjs', '--read-key']})})) writeFileSync(join(root, path), body);
    invoked = 0; seen.length = 0;
    const review = runReview({id: 'glm', repo: root, base: 'origin/keybase', prompt, config, execute});
    assert.equal(review.verdict, 'approve'); assert.ok(seen[0].includes('KEY=absent') && !seen[0].includes('NOT_A_REAL_SECRET'));
  });
  console.log(`PASS ${count} generated-receipt scenarios (offline)`);
} finally {
  rmSync(root, {recursive: true, force: true});
}
