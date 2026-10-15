import { parentPort, workerData } from 'node:worker_threads';
import { runReview, runModuleReview } from './review-runtime.mjs';

// One worker owns one independent Harness process and its bounded retries.
// The shared runtime owns evidence, identities, credentials and snapshot checks.
if (!Object.prototype.hasOwnProperty.call(workerData, 'mode')) {
parentPort.postMessage(runReview(workerData));
parentPort.close();
} else if (workerData.mode === 'module') {
  const expectedKeys = ['mode', 'id', 'moduleId', 'repo', 'base', 'session'];
  const keys = Reflect.ownKeys(workerData);
  if (keys.length !== expectedKeys.length || keys.some(key => typeof key !== 'string' || !expectedKeys.includes(key))) throw new Error('module review worker 字段必须恰为 mode/id/moduleId/repo/base/session');
  if (!workerData.session || typeof workerData.session !== 'object' || Array.isArray(workerData.session) || workerData.session.schema !== 'pr-ready/root-captured-stock-module-session/v1') throw new Error('module review worker 需要当前 stock-selection session');
  parentPort.postMessage(runModuleReview(workerData));
  parentPort.close();
} else {
  throw new Error('未知 review worker mode');
}
