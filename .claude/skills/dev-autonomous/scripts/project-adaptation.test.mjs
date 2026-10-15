import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {PROJECT_CONFIG, resolveBase, git, childEnv, resolveRepo} from '../../pr-ready/scripts/review-runtime.mjs';
import {resolveTestCommands} from './run-loop.mjs';
import {REDLINE} from './gate.mjs';

const temp = mkdtempSync(join(tmpdir(), 'project-adaptation-'));
const oldBase = process.env.AI_DEV_BASE;
try {
  delete process.env.AI_DEV_BASE;
  git(temp, ['init', '-q']);
  writeFileSync(join(temp, 'fixture.txt'), 'fixture');
  git(temp, ['add', '.']);
  git(temp, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture']);
  git(temp, ['update-ref', 'refs/remotes/origin/dev', 'HEAD']);
  git(temp, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
  git(temp, ['symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main']);
  assert.equal(resolveBase(temp), 'origin/dev', 'remote default main must not select the target branch');
  assert.equal(resolveBase(temp, 'main'), 'origin/main', 'explicit target remains supported');
  process.env.AI_DEV_BASE='main';
  assert.equal(resolveBase(temp), 'origin/main', 'explicit environment override remains supported');
  delete process.env.AI_DEV_BASE;
  assert.throws(() => resolveBase(temp, 'missing'));
  assert.deepEqual(resolveTestCommands(''), PROJECT_CONFIG.testCommands);
  assert.deepEqual(resolveTestCommands('node check.mjs; node verify.mjs'), ['node check.mjs','node verify.mjs']);
  assert.throws(() => resolveTestCommands(' ; '), /为空/);
  assert.ok(PROJECT_CONFIG.testCommands.length >= 3, 'full project verification is mandatory');
  for (const p of ['.cnb.yml','src/core/hi.md','vault/raw/example.md','notes/example.md','resources/example.md','.42cog/intent.md','specs/README.md']) {
    assert.ok(REDLINE.some(re => re.test(p)), p);
  }
  assert.ok(!REDLINE.some(re => re.test('src/core/lib.rs')));
  assert.equal(childEnv({PATH:'/bin',AI_DEV_AUTHORIZED_PROJECT:PROJECT_CONFIG.name}).AI_DEV_AUTHORIZED_PROJECT, undefined);
  const env = {...process.env, AI_DEV_NO_AUTOENV:'1'};
  for (const key of ['AI_DEV_AUTHORIZED_PROJECT','AI_DEV_BASE','AI_DEV_REPO_ROOT','CNB_API_TOKEN','GITHUB_TOKEN','GITCODE_TOKEN']) delete env[key];
  const repo = resolveRepo([]), script = join(dirname(fileURLToPath(import.meta.url)), 'run-loop.mjs');
  const head = git(repo,['rev-parse','HEAD']);
  const aiExisted = existsSync(join(repo,'.ai'));
  for (const flag of [undefined, 'different-project']) {
    if (flag) env.AI_DEV_AUTHORIZED_PROJECT=flag; else delete env.AI_DEV_AUTHORIZED_PROJECT;
    const r = spawnSync(process.execPath,[script],{cwd:repo,env,encoding:'utf8',timeout:5000});
    assert.equal(r.status,1);
    assert.match(r.stderr,/未启用完整批量执行/);
    assert.ok(!r.stdout.includes('启动预检'), 'guard runs before token, harness and worktree operations');
  }
  assert.equal(git(repo,['rev-parse','HEAD']),head);
  assert.equal(existsSync(join(repo,'.ai')),aiExisted);
  console.log('PASS project branch resolution, full verification, protected paths, authorization isolation and no-side-effect startup');
} finally {
  if(oldBase===undefined)delete process.env.AI_DEV_BASE;else process.env.AI_DEV_BASE=oldBase;
  rmSync(temp,{recursive:true,force:true});
}
