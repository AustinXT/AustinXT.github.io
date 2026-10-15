#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync,statSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {loadConfig,git,resolveRepo,resolveBase,protectedPath,redact,childEnv,snapshot,sourceEvidence,parseOutput,validateVerdict,buildInvocation,runReview,identitiesValid,releaseDecision,REVIEWER_IDS} from './review-runtime.mjs';

const root=mkdtempSync(join(tmpdir(),'review-test-'));
let count=0;
function test(name,fn) {fn();count++;console.log('PASS '+name);}
const approve={verdict:'approve',summary:'ok',issues:[]};
const issue={severity:'major',priority:1,file:'a.mjs',line:1,problem:'bug',suggestion:'fix'};
const previousKey=process.env.AI_REVIEW_FIXTURE_API_KEY;
process.env.AI_REVIEW_FIXTURE_API_KEY='sk-fake-not-a-real-credential';
try {
  spawnSync('git',['init','-q',root]);
  writeFileSync(join(root,'.gitignore'),'.agents/notes/\n');
  writeFileSync(join(root,'a.mjs'),'export const a=1;\n');
  mkdirSync(join(root,'state'));
  const originalBoard='# 状态板\n\n> ## 旧记录\n> OLD_BOARD_HISTORY\n\n> ## 当前记录\n> earlier current detail\n> related unchanged line\n\n> ## 另一旧记录\n> OTHER_BOARD_HISTORY\n';
  const originalChangelog='# 变更档\n\n## 旧变更\nOLD_CHANGE_HISTORY\n\n## 当前变更\nearlier change detail\nrelated rationale\n\n## 另一旧变更\nOTHER_CHANGE_HISTORY\n';
  writeFileSync(join(root,'state/board.md'),originalBoard);
  writeFileSync(join(root,'state/changelog.md'),originalChangelog);
  git(root,['add','.']);
  git(root,['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']);
  git(root,['update-ref','refs/remotes/origin/dev','HEAD']);
  git(root,['symbolic-ref','refs/remotes/origin/HEAD','refs/remotes/origin/dev']);
  writeFileSync(join(root,'a.mjs'),'export const a=2;\n');
  const config=loadConfig(root),base='origin/dev';
  test('全局 Codex/GLM 双谱系标识',()=>{
    assert.deepEqual(REVIEWER_IDS,['codex','glm']);
    assert.deepEqual(config.reviewers.map(x=>x.id),REVIEWER_IDS);
    assert.equal(config.reviewers[0].model,'gpt-6.1-sol');
    assert.equal(config.reviewers[0].reasoning,'high');
    assert.equal(config.reviewers[0].serviceTier,'fast');
    assert.equal(config.reviewers[0].fastMode,true);
    assert.equal(config.reviewers[1].model,'zhipuai-coding-plan/glm-5.3[1m]');
  });
  test('旧三谱系或 Claude Harness 配置被拒绝',()=>{
    const dir=mkdtempSync(join(tmpdir(),'review-config-'));
    const write=reviewers=>{const p=join(dir,'c.json');writeFileSync(p,JSON.stringify({...config,reviewers}));return p;};
    const prev=process.env.AI_REVIEW_CONFIG;
    try {
      process.env.AI_REVIEW_CONFIG=write([...config.reviewers,{id:'deepseek',harness:'claude',model:'deepseek-flash[1m]',lineage:'deepseek'}]);
      assert.throws(()=>loadConfig(root),/两个 reviewer/);
      process.env.AI_REVIEW_CONFIG=write([config.reviewers[0],{...config.reviewers[1],harness:'claude'}]);
      assert.throws(()=>loadConfig(root),/非法 reviewer/);
      process.env.AI_REVIEW_CONFIG=write([config.reviewers[0],{...config.reviewers[1],lineage:'openai'}]);
      assert.throws(()=>loadConfig(root),/不同谱系/);
    } finally {
      if(prev===undefined)delete process.env.AI_REVIEW_CONFIG;else process.env.AI_REVIEW_CONFIG=prev;
      rmSync(dir,{recursive:true,force:true});
    }
  });
  test('项目根与显式 repo 不依赖技能目录',()=>assert.equal(resolveRepo(['--repo',root]),realpathSync(root)));
  test('基线支持 origin/HEAD 和显式分支',()=>{assert.equal(resolveBase(root),'origin/dev');assert.equal(resolveBase(root,'dev'),'origin/dev');});
  test('未确定基线不静默选 main',()=>assert.throws(()=>resolveBase(root,'missing')));
  test('状态账本只附相关完整条目，代码全文与快照仍完整',()=>{
    const previous=snapshot(root,base).hash;
    writeFileSync(join(root,'state/board.md'),originalBoard.replace('earlier current detail','CURRENT_BOARD_CHANGE'));
    writeFileSync(join(root,'state/changelog.md'),originalChangelog.replace('earlier change detail','CURRENT_CHANGE_DETAIL'));
    const s=snapshot(root,base);
    const evidence=sourceEvidence(root,s.names,2000000,s.baseSha);
    assert.ok(evidence.includes('CURRENT_BOARD_CHANGE')&&evidence.includes('related unchanged line'));
    assert.ok(evidence.includes('CURRENT_CHANGE_DETAIL')&&evidence.includes('related rationale'));
    assert.ok(!evidence.includes('OLD_BOARD_HISTORY')&&!evidence.includes('OTHER_BOARD_HISTORY'));
    assert.ok(!evidence.includes('OLD_CHANGE_HISTORY')&&!evidence.includes('OTHER_CHANGE_HISTORY'));
    assert.match(evidence,/full-file-sha256=[0-9a-f]{64}; total-lines=/);
    assert.ok(evidence.includes('6: > ## 当前记录'));
    assert.ok(evidence.includes('export const a=2;'));
    assert.ok(s.diff.includes('-earlier change detail')&&s.diff.includes('+CURRENT_CHANGE_DETAIL'));
    assert.notEqual(s.hash,previous);
    writeFileSync(join(root,'state/board.md'),originalBoard);
    writeFileSync(join(root,'state/changelog.md'),originalChangelog);
  });
  test('新增条目及删除文本都有完整证据',()=>{
    const added='> ## 新增记录\n> NEW_ENTRY_ONE\n> NEW_ENTRY_TWO\n\n';
    writeFileSync(join(root,'state/board.md'),originalBoard.replace('> ## 当前记录',added+'> ## 当前记录'));
    let s=snapshot(root,base),e=sourceEvidence(root,s.names,2000000,s.baseSha);
    assert.ok(e.includes('NEW_ENTRY_ONE')&&e.includes('NEW_ENTRY_TWO'));
    assert.ok(!e.includes('OLD_BOARD_HISTORY'));
    writeFileSync(join(root,'state/board.md'),originalBoard.replace('> OLD_BOARD_HISTORY\n',''));
    s=snapshot(root,base);e=sourceEvidence(root,s.names,2000000,s.baseSha);
    assert.ok(s.diff.includes('-> OLD_BOARD_HISTORY'));
    assert.ok(e.includes('> ## 旧记录'));
    writeFileSync(join(root,'state/board.md'),originalBoard);
  });
  test('密钥路径元数据拦截',()=>{
    for(const p of ['.env','x/.env.local','secrets/x','nested/secrets/x','x.pem','x.key'])assert.equal(protectedPath(p),true);
    assert.equal(protectedPath('a.mjs'),false);
  });
  test('新增代码全文只发一次且逐字节核对；修改代码仍附源码',()=>{
    const path='added-source.mjs',body='// complete source\nexport const added = "原文";\n';
    writeFileSync(join(root,path),body);git(root,['add',path]);
    const s=snapshot(root,base),e=sourceEvidence(root,s.names,2000000,s.baseSha,s.diff);
    assert.ok(s.diff.includes('+// complete source')&&s.diff.includes('+export const added = "原文";'));
    assert.ok(e.includes('FULL ADDED SOURCE IN DIFF'));
    assert.ok(!e.includes('export const added'));
    assert.ok(e.includes('export const a=2;'));
    assert.match(e,/full-file-sha256=[0-9a-f]{64}; total-lines=2/);
    assert.ok(sourceEvidence(root,[path],2000000,s.baseSha).includes(body));
    assert.ok(sourceEvidence(root,[path],2000000,s.baseSha,'different diff').includes(body));
    git(root,['reset','-q','--',path]);rmSync(join(root,path));
  });
  test('无法精确重建的新增原文不会省略',()=>{
    const path='added-trailing.mjs',body='export const spaces=1;   \n';
    writeFileSync(join(root,path),body);git(root,['add',path]);
    const s=snapshot(root,base),e=sourceEvidence(root,[path],2000000,s.baseSha,s.diff);
    assert.ok(e.includes(body));assert.ok(!e.includes('FULL ADDED SOURCE IN DIFF'));
    git(root,['reset','-q','--',path]);rmSync(join(root,path));
  });
  test('平台凭证不传给子进程',()=>{
    const env=childEnv({CNB_API_TOKEN:'token',GITHUB_TOKEN:'token',GH_TOKEN:'token',GITCODE_TOKEN:'token',AI_REVIEW_DEEPSEEK_API_KEY:'legacy',CLAUDECODE:'1',CLAUDE_CODE_SESSION_ID:'parent',PATH:'/bin'});
    assert.deepEqual(env,{PATH:'/bin'});
  });
  test('任意已配置凭证与 sk 字符串脱敏',()=>{
    assert.equal(redact('secret012345 sk-longtoken0123456789',{GITHUB_TOKEN:'secret012345'}),'<redacted> <redacted>');
  });
  test('双 Harness 独立输出解析',()=>{
    assert.equal(parseOutput('opencode',JSON.stringify({type:'text',part:{text:'O'}})+'\n'+JSON.stringify({type:'text',part:{text:'K'}})),'OK');
    assert.equal(parseOutput('codex','OK'),'OK');
    assert.throws(()=>parseOutput('opencode',JSON.stringify({type:'error'})));
  });
  test('规范化结果不把异常/无 verdict 判通过',()=>{
    assert.throws(()=>validateVerdict('not json'));
    assert.throws(()=>validateVerdict(JSON.stringify({verdict:'approve'})));
    assert.throws(()=>validateVerdict(JSON.stringify({...approve,verdict:'request_changes'})));
    assert.equal(validateVerdict(JSON.stringify({...approve,issues:[issue]})).verdict,'request_changes');
    assert.throws(()=>validateVerdict(JSON.stringify(approve),true));
  });
  const temp=join(root,'.agents/notes');
  // runReview 创建其自身目录；这里临时配置不进入真实项目。
  const scratch=mkdtempSync(join(tmpdir(),'review-args-'));
  try {
    test('Codex readonly、空工作目录、工具关闭、stdin，不绕过沙盒',()=>{
      const v=buildInvocation(config.reviewers[0],{repo:root,temp:scratch});
      assert.equal(v.args[v.args.indexOf('-m')+1],'gpt-6.1-sol');
      const overrides=v.args.flatMap((arg,i)=>arg==='-c'?[v.args[i+1]]:[]);
      assert.deepEqual(overrides,['model_reasoning_effort=high','service_tier=fast']);
      const disabled=v.args.flatMap((arg,i)=>arg==='--disable'?[v.args[i+1]]:[]);
      for(const feature of ['shell_tool','apps','plugins','browser_use','computer_use','hooks']) assert.ok(disabled.includes(feature),feature);
      assert.ok(!disabled.includes('fast_mode'),'Codex 评审启用 fast');
      assert.equal(v.args[v.args.indexOf('-C')+1],scratch,'Codex 不以真实仓库为工作目录');assert.ok(v.args.includes('--ignore-user-config'),'用户配置中的 MCP 可绕过 shell 开关');assert.ok(!v.args.includes(root));
      assert.equal(v.args.at(-1),'-');assert.ok(v.args.includes('read-only'));assert.ok(v.args.includes('--ephemeral'));
      assert.ok(!v.args.includes('resume'));assert.ok(!v.args.includes('--dangerously-bypass-approvals-and-sandbox'));
    });
    test('Codex 自定义配置未指定档位时继承用户配置',()=>{
      const v=buildInvocation({...config.reviewers[0],reasoning:'medium',serviceTier:undefined},{repo:root,temp:scratch});
      assert.ok(v.args.includes('model_reasoning_effort=medium'));
      assert.ok(!v.args.some(arg=>arg.startsWith('service_tier=')));
    });
    test('GLM/OpenCode 全工具禁用且不续会话',()=>{
      const parentEnv={PATH:'/bin',OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX:'8192'};
      const v=buildInvocation(config.reviewers[1],{repo:root,temp:scratch,env:parentEnv});
      assert.equal(JSON.parse(v.env.OPENCODE_CONFIG_CONTENT).agent['lineage-review'].permission['*'],'deny');
      assert.ok(v.args.includes('--standalone'));assert.ok(!v.args.includes('--pure'));assert.ok(!v.args.includes('--auto'));assert.ok(!v.args.includes('--continue'));
      assert.equal(v.args[v.args.indexOf('--model')+1],'zhipuai-coding-plan/glm-5.3#high');
      assert.deepEqual(JSON.parse(v.env.OPENCODE_CONFIG_CONTENT).provider['zhipuai-coding-plan'].models['glm-5.3'].limit,{context:1000000,output:131072});
      assert.equal(v.env.OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX,'131072');
      assert.equal(parentEnv.OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX,'8192');
      assert.ok(!v.args.includes('--variant'));assert.ok(!v.args.includes('--dir'));
      assert.deepEqual(JSON.parse(v.env.OPENCODE_CONFIG_CONTENT).provider['zhipuai-coding-plan'].models['glm-5.3'].variants.high, {reasoningEffort:'high'});
    });
    test('显式其它GLM保留模型和已有输出配置',()=>{
      const v=buildInvocation({...config.reviewers[1],model:'zhipuai-coding-plan/glm-4.6v',variant:undefined,contextWindow:undefined,maxOutputTokens:undefined},{repo:root,temp:scratch,env:{PATH:'/bin',OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX:'8192'}});
      assert.equal(v.args[v.args.indexOf('--model')+1],'zhipuai-coding-plan/glm-4.6v');
      assert.equal(JSON.parse(v.env.OPENCODE_CONFIG_CONTENT).provider,undefined);
      assert.equal(v.env.OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX,'8192');
    });
  } finally {rmSync(scratch,{recursive:true,force:true});}
  let calls=0,lastTemp;
  function execute(bin,args,o) {
    calls++;lastTemp=o.cwd;
    assert.ok(o.input.includes('$(touch SHOULD_NOT_EXIST)'));
    assert.ok(!args.join(' ').includes('SHOULD_NOT_EXIST'));
    if(bin.includes('codex'))writeFileSync(args[args.indexOf('-o')+1],JSON.stringify(approve));
    const stdout=JSON.stringify({type:'text',part:{text:JSON.stringify(approve)}});
    return {stdout,stderr:'',status:0};
  }
  const prompt='Need a=2; non-goal: refactor. $(touch SHOULD_NOT_EXIST)';
  const reviews=config.reviewers.map(x=>runReview({id:x.id,repo:root,base,prompt,config,execute}));
  test('两路成功、同快照、同上下文、临时目录清理',()=>{
    assert.equal(calls,2);assert.ok(identitiesValid(reviews,snapshot(root,base).hash));assert.ok(!existsSync(lastTemp));assert.ok(!existsSync(join(root,'SHOULD_NOT_EXIST')));
  });
  test('缺任一路、旧双结果、同谱系、异上下文均拒绝',()=>{
    const hash=snapshot(root,base).hash;
    assert.ok(!identitiesValid(reviews.slice(0,1),hash));
    assert.ok(!identitiesValid([reviews[0],{...reviews[1],_review:{...reviews[1]._review,lineage:'openai'}}],hash));
    assert.ok(!identitiesValid([reviews[0],{...reviews[1],_review:{...reviews[1]._review,contextDigest:'different'}}],hash));
    assert.ok(!identitiesValid([reviews[0],reviews[1],{...reviews[1],_review:{...reviews[1]._review,id:'deepseek',lineage:'deepseek'}}],hash));
  });
  test('放行只认入口快照：两路都审了入口后的新快照也不放行',()=>{
    const hash=snapshot(root,base).hash;
    assert.deepEqual(releaseDecision(reviews,hash,hash),{complete:true,pass:true});
    const drifted=reviews.map(x=>({...x,_review:{...x._review,snapshot:'after-entry'}}));
    assert.deepEqual(releaseDecision(drifted,hash,'after-entry'),{complete:false,pass:false});
    assert.deepEqual(releaseDecision(reviews,hash,'moved-at-end'),{complete:false,pass:false});
  });
  test('身份/快照验证拒绝代码变化',()=>{
    writeFileSync(join(root,'a.mjs'),'export const a=3;\n');assert.ok(!identitiesValid(reviews,snapshot(root,base).hash));
  });
  test('认证失败最多两次，不换模型',()=>{
    let n=0;const result=runReview({id:'glm',repo:root,base,prompt,config,execute:()=>{n++;return {status:1,stdout:'',stderr:'auth'};}});
    assert.equal(n,2);assert.ok(result.__parseError);assert.equal(result._review.id,'glm');
  });
  test('失败的 Harness stdout 保留且凭证脱敏',()=>{
    const key=process.env.AI_REVIEW_FIXTURE_API_KEY;
    const result=runReview({id:'glm',repo:root,base,prompt,config,execute:()=>({status:1,stderr:'',stdout:JSON.stringify({type:'error',message:`API fixture failure ${key}`})})});
    assert.ok(result.__parseError);assert.ok(!result.reason.includes(key));
    const stdout=readFileSync(join(result._review.artifactDir,'glm-2-stdout.txt'),'utf8');
    assert.ok(stdout.includes('<redacted>'));assert.ok(!stdout.includes(key));
  });
  test('Codex 重试不复用上一次遗留输出',()=>{
    let n=0;const result=runReview({id:'codex',repo:root,base,prompt,config,execute:(bin,args)=>{
      n++;const out=args[args.indexOf('-o')+1];
      if(n===1){writeFileSync(out,JSON.stringify(approve));return {status:1,stdout:'',stderr:'crash after write'};}
      return {status:0,stdout:'',stderr:''};
    }});
    assert.equal(n,2);assert.ok(result.__parseError,'第二次无输出必须失败，不能读到首次遗留的 approve');
  });
  test('超时结果不放行，合法负面不重复碰运气',()=>{
    let n=0;const failed=runReview({id:'glm',repo:root,base,prompt,config,execute:()=>{n++;return {status:null,error:{code:'ETIMEDOUT'},signal:'SIGTERM'};}});
    assert.ok(failed.__parseError);assert.equal(n,2);
    n=0;const negative=runReview({id:'glm',repo:root,base,prompt,config,execute:()=>{n++;return {status:0,stdout:JSON.stringify({type:'text',part:{text:JSON.stringify({...approve,verdict:'request_changes',issues:[issue]})}})};}});
    assert.equal(negative.verdict,'request_changes');assert.equal(n,1);
  });
  test('评审过程中快照改变立即失效，不重试洗绿',()=>{
    let n=0;const v=runReview({id:'glm',repo:root,base,prompt,config,execute:(...args)=>{n++;writeFileSync(join(root,'a.mjs'),'export const a=4;\n');return execute(...args);}});
    assert.ok(v.__parseError);assert.equal(n,1);
  });
  test('大输入不静默截断；未跟踪内容不伪造已审',()=>{
    assert.throws(()=>runReview({id:'glm',repo:root,base,prompt,config:{...config,maxInputBytes:10},execute}));
    let invoked=0;
    assert.throws(()=>runReview({id:'codex',repo:root,base,prompt,config:{...config,maxInputBytes:2000000,maxInputChars:10},execute:()=>{invoked++;}}),/字符数/);
    assert.equal(invoked,0);
    writeFileSync(join(root,'new.txt'),'untracked');assert.throws(()=>snapshot(root,base));
  });
  console.log(`PASS ${count} review-runtime scenarios (offline)`);
} finally {
  if(previousKey===undefined)delete process.env.AI_REVIEW_FIXTURE_API_KEY;else process.env.AI_REVIEW_FIXTURE_API_KEY=previousKey;
  rmSync(root,{recursive:true,force:true});
}
