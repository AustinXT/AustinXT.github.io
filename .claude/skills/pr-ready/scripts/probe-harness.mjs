#!/usr/bin/env node
// 最小、无私密数据的连通性/模型标识探针；不构成正式代码评审。
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {loadConfig,buildInvocation,parseOutput,redact} from './review-runtime.mjs';
const id=process.argv[2], config=loadConfig(), reviewer=config.reviewers.find(x=>x.id===id);
if(!reviewer) throw new Error('用法：node probe-harness.mjs codex|glm');
const temp=mkdtempSync(join(tmpdir(),'pr-ready-probe-'));
try {
  spawnSync('git',['init','-q',temp]);
  const inv=buildInvocation(reviewer,{repo:temp,temp});
  const r=spawnSync(inv.bin,inv.args,{cwd:temp,env:inv.env,input:'Connectivity test only. Return exactly HARNESS_OK. Do not call tools.',encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
  let answer='';
  try { answer=reviewer.harness==='codex'?readFileSync(join(temp,'last.txt'),'utf8'):parseOutput(reviewer.harness,r.stdout); } catch { /* failure reported below */ }
  const ok=r.status===0&&!r.error&&!r.signal&&answer.trim()==='HARNESS_OK';
  console.log(JSON.stringify({id,model:reviewer.model,harness:reviewer.harness,ok,status:r.status,errorCode:r.error?.code,stderr:ok?undefined:redact(r.stderr).slice(-1200),response:ok?answer:redact(r.stdout).slice(-1200)}));
  process.exitCode=ok?0:1;
} finally {rmSync(temp,{recursive:true,force:true});}
