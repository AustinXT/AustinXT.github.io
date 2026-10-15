#!/usr/bin/env node
// Offline tests for large modified text files sent as wide-context diffs. No model is called.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {loadConfig,git,snapshot,sourceEvidence,runReview,LARGE_MODIFIED_BYTES,LARGE_MODIFIED_CONTEXT,GENERATED_REGISTRY} from './review-runtime.mjs';

const root = mkdtempSync(join(tmpdir(), 'large-modified-test-'));
const mixed = mkdtempSync(join(tmpdir(), 'large-modified-mixed-'));
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS ' + name); }
const approve = {verdict: 'approve', summary: 'ok', issues: []};
const big = tag => Array.from({length: 1200}, (_, n) => `line ${String(n).padStart(4, '0')} ${tag} ${'x'.repeat(30)}`).join('\n') + '\n';
const seen = [];
function execute(bin, args, o) {
  seen.push(o.input);
  if (bin.includes('codex')) writeFileSync(args[args.indexOf('-o') + 1], JSON.stringify(approve));
  return {status: 0, stderr: '', stdout: JSON.stringify({type: 'text', part: {text: JSON.stringify(approve)}})};
}
try {
  spawnSync('git', ['init', '-q', root]);
  writeFileSync(join(root, '.gitignore'), '.agents/notes/\n');
  writeFileSync(join(root, 'large.txt'), big('base'));
  writeFileSync(join(root, 'small.txt'), 'small\nFAR_AWAY_SMALL\nend\n');
  writeFileSync(join(root, 'rewrite.txt'), big('old'));
  writeFileSync(join(root, 'nonl.txt'), big('nonl').slice(0, -1));
  writeFileSync(join(root, 'crlf.txt'), big('crlf').replaceAll('\n', '\r\n'));
  writeFileSync(join(root, 'nodiff.txt'), big('nodiff'));
  writeFileSync(join(root, 'conv.txt'), big('conv'));
  writeFileSync(join(root, 'filt.txt'), big('filt'));
  writeFileSync(join(root, 'bin.txt'), Buffer.concat([Buffer.from(big('bin')), Buffer.from([0, 1, 2])]));
  writeFileSync(join(root, '.gitattributes'), 'nodiff.txt -diff\nconv.txt text eol=crlf\nfilt.txt filter=upper\n');
  git(root, ['config', 'filter.upper.clean', 'tr a-z A-Z']);
  git(root, ['config', 'filter.upper.smudge', 'cat']);
  git(root, ['add', '-A']);
  git(root, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture']);
  git(root, ['update-ref', 'refs/remotes/origin/dev', 'HEAD']);
  const base = 'origin/dev', config = loadConfig(root), prompt = 'fixture';
  const reset = () => { git(root, ['checkout', '-q', '--', '.']); git(root, ['clean', '-qfd', '-e', '.agents']); };
  assert.ok(Buffer.byteLength(big('base')) > LARGE_MODIFIED_BYTES);

  test('大文件只改一行时发宽上下文 diff，不发全文', () => {
    reset();
    const lines = big('base').split('\n'); lines[600] = 'CHANGED_LINE_MARKER'; const body = lines.join('\n');
    writeFileSync(join(root, 'large.txt'), body);
    const s = snapshot(root, base), stats = {};
    const evidence = sourceEvidence(root, s.names, 3145728, s.baseSha, s.diff, stats);
    assert.equal(stats.wide, 1);
    assert.ok(evidence.includes('"large.txt" MODIFIED LARGE TEXT'));
    assert.ok(evidence.includes(`full-file-sha256=${createHash('sha256').update(body).digest('hex')}`));
    assert.ok(evidence.includes('CHANGED_LINE_MARKER'));
    assert.match(evidence, /\n@@ -\d+,\d+ \+\d+,\d+ @@ line \d{4} base/, 'hunk 头带函数上下文后缀时仍精确重建');
    assert.ok(evidence.includes(`line ${String(600 - LARGE_MODIFIED_CONTEXT).padStart(4, '0')} base`), '上下文覆盖到 30 行');
    assert.ok(!evidence.includes('line 0010 base') && !evidence.includes('line 1100 base'), '远离改动的内容不发送');
    seen.length = 0;
    const review = runReview({id: 'glm', repo: root, base, prompt, config, execute});
    assert.equal(review._review.evidenceProfile, 'full-diff-added-sources-wide-context-large-modified-v1');
  });
  test('小文件仍发全文', () => {
    reset(); writeFileSync(join(root, 'small.txt'), 'small changed\nFAR_AWAY_SMALL\nend\n');
    const s = snapshot(root, base), stats = {};
    const evidence = sourceEvidence(root, s.names, 3145728, s.baseSha, s.diff, stats);
    assert.ok(evidence.includes('\nFILE "small.txt"\nsmall changed\nFAR_AWAY_SMALL')); assert.equal(stats.wide, undefined);
    const review = runReview({id: 'glm', repo: root, base, prompt, config, execute});
    assert.equal(review._review.evidenceProfile, 'full-diff-added-sources-v1');
  });
  test('宽 diff 不比全文小时发全文', () => {
    reset(); writeFileSync(join(root, 'rewrite.txt'), big('new'));
    const s = snapshot(root, base), stats = {};
    const evidence = sourceEvidence(root, s.names, 3145728, s.baseSha, s.diff, stats);
    assert.equal(stats.wide, undefined); assert.ok(evidence.includes('\nFILE "rewrite.txt"\nline 0000 new'));
  });
  test('新增的大文件仍走新增规则', () => {
    reset(); writeFileSync(join(root, 'added.txt'), big('added')); git(root, ['add', 'added.txt']);
    const s = snapshot(root, base), stats = {};
    const evidence = sourceEvidence(root, s.names, 3145728, s.baseSha, s.diff, stats);
    assert.equal(stats.wide, undefined); assert.ok(evidence.includes('"added.txt" FULL ADDED SOURCE IN DIFF'));
    git(root, ['reset', '-q']);
  });
  test('只改模式的大文件给出模式变更且不发全文', () => {
    reset(); spawnSync('chmod', ['+x', join(root, 'large.txt')]);
    const s = snapshot(root, base), stats = {};
    const evidence = sourceEvidence(root, s.names, 3145728, s.baseSha, s.diff, stats);
    assert.equal(stats.wide, 1); assert.ok(evidence.includes('new mode 100755') && !evidence.includes('line 0600 base'));
    spawnSync('chmod', ['-x', join(root, 'large.txt')]);
  });
  const changeLine = (text, n, marker) => { const lines = text.split('\n'); lines[n] = marker; return lines.join('\n'); };
  const wideOf = path => { const s = snapshot(root, base), stats = {}; const evidence = sourceEvidence(root, s.names, 3145728, s.baseSha, s.diff, stats); return {evidence, stats, path}; };
  test('无结尾换行的两种方向都能精确重建并发宽 diff', () => {
    reset(); writeFileSync(join(root, 'nonl.txt'), changeLine(big('nonl').slice(0, -1), 1199, 'LAST_LINE_CHANGED'));
    let r = wideOf(); assert.equal(r.stats.wide, 1); assert.ok(r.evidence.includes('LAST_LINE_CHANGED') && r.evidence.includes('No newline at end of file'));
    reset(); writeFileSync(join(root, 'large.txt'), big('base').slice(0, -1));
    r = wideOf(); assert.equal(r.stats.wide, 1); assert.ok(r.evidence.includes('"large.txt" MODIFIED LARGE TEXT'));
    reset(); writeFileSync(join(root, 'nonl.txt'), big('nonl'));
    r = wideOf(); assert.equal(r.stats.wide, 1); assert.ok(r.evidence.includes('"nonl.txt" MODIFIED LARGE TEXT'));
  });
  test('远距离多个 hunk 按序重建，首尾大段未改内容不发送', () => {
    reset(); let body = changeLine(big('base'), 100, 'FIRST_HUNK'); body = changeLine(body, 1100, 'SECOND_HUNK');
    writeFileSync(join(root, 'large.txt'), body);
    const w = wideOf(); assert.equal(w.stats.wide, 1);
    assert.ok(w.evidence.includes('FIRST_HUNK') && w.evidence.includes('SECOND_HUNK') && !w.evidence.includes('line 0600 base'));
  });
  test('未转换的 CRLF 文件逐字节重建后发宽 diff', () => {
    reset(); writeFileSync(join(root, 'crlf.txt'), changeLine(big('crlf').replaceAll('\n', '\r\n'), 600, 'CRLF_MARKER\r'));
    const r = wideOf(); assert.equal(r.stats.wide, 1); assert.ok(r.evidence.includes('CRLF_MARKER\r\n'));
  });
  test('-diff 属性、换行转换、clean filter 与二进制 base 都回退全文', () => {
    for (const [path, body] of [
      ['nodiff.txt', changeLine(big('nodiff'), 600, 'NODIFF_MARKER')],
      ['conv.txt', changeLine(big('conv'), 600, 'CONV_MARKER').replaceAll('\n', '\r\n')],
      ['filt.txt', changeLine(big('filt'), 600, 'filt_marker')],
      ['bin.txt', big('bin')],
    ]) {
      reset(); writeFileSync(join(root, path), body);
      const r = wideOf();
      assert.equal(r.stats.wide, undefined, path);
      assert.ok(r.evidence.includes(`\nFILE ${JSON.stringify(path)}\n${body}\n`), path + ' 全文');
    }
  });
  test('回执与宽 diff 同时出现时两个标记按固定顺序追加', () => {
    spawnSync('git', ['init', '-q', mixed]);
    writeFileSync(join(mixed, '.gitignore'), '.agents/notes/\n');
    writeFileSync(join(mixed, 'gen.mjs'), "import {readFileSync} from 'node:fs';\nif(readFileSync('out.txt','utf8')!==readFileSync('in.txt','utf8').toUpperCase())process.exit(1);\nconsole.log('ok');\n");
    writeFileSync(join(mixed, 'in.txt'), 'abc\n'); writeFileSync(join(mixed, 'out.txt'), 'ABC\n');
    writeFileSync(join(mixed, 'large.txt'), big('base'));
    writeFileSync(join(mixed, GENERATED_REGISTRY), JSON.stringify({schema: 'pr-ready/generated-artifacts/v1', groups: [
      {name: 'upper', check: ['node', 'gen.mjs'], timeoutMs: 60000, paths: ['out.txt'], sources: ['gen.mjs']}]}, null, 2) + '\n');
    git(mixed, ['add', '-A']);
    git(mixed, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture']);
    git(mixed, ['update-ref', 'refs/remotes/origin/dev', 'HEAD']);
    writeFileSync(join(mixed, 'in.txt'), 'mixed\n'); writeFileSync(join(mixed, 'out.txt'), 'MIXED\n');
    writeFileSync(join(mixed, 'large.txt'), changeLine(big('base'), 600, 'MIXED_WIDE_MARKER'));
    seen.length = 0;
    const review = runReview({id: 'glm', repo: mixed, base, prompt, config: loadConfig(mixed), execute});
    assert.equal(review._review.evidenceProfile, 'full-diff-added-sources-generated-receipts-wide-context-large-modified-v1');
    assert.ok(seen[0].includes('"large.txt" MODIFIED LARGE TEXT') && seen[0].includes('MIXED_WIDE_MARKER'));
  });
  console.log(`PASS ${count} large-modified scenarios (offline)`);
} finally {
  rmSync(root, {recursive: true, force: true});
  rmSync(mixed, {recursive: true, force: true});
}
