const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../skills/fde-job/run.wf.js'), 'utf8').replace('export const meta', 'const meta');
const done = { status: 'DONE', summary: 'Verified required work.' };
const blocked = { status: 'BLOCKED', summary: 'Required error path fails.', issues: [{ severity: 'error', description: 'Missing error handling' }] };
const milestone = (id, deps = []) => ({ id, name: id, deps, description: `Full scope ${id}`, acceptance: 'Normal and error paths pass.' });
async function run(overrides = {}, args = {}) {
  const calls = [], logs = [], counts = {};
  const sandbox = {
    args: { requirements: 'CLI tool', mode: 'auto', ...args },
    phase() {}, log(s) { logs.push(s); },
    async agent(prompt, options) {
      const label = options.label;
      calls.push({ label, prompt });
      const i = counts[label] || 0; counts[label] = i + 1;
      if (Object.hasOwn(overrides, label)) {
        const value = overrides[label];
        return Array.isArray(value) ? value[Math.min(i, value.length - 1)] : value;
      }
      if (label === 'milestone-extract') return { milestones: [milestone('M1')] };
      if (label === 'run-gate' || label === 'run-gate-after-integration') return { build_ok: true, test_ok: true, coverage_ok: true, coverage_reason: 'Checks passed.' };
      return done;
    },
  };
  const result = await vm.runInNewContext(`(async () => { ${source}\nreturn { phases: [...phasesDone], milestones: developmentMilestoneState }; })()`, sandbox);
  return { ...JSON.parse(JSON.stringify(result)), calls, logs };
}

test('blocked implementation preserves full acceptance and independent work continues', async () => {
  const r = await run({ 'milestone-extract': { milestones: [milestone('M1'), milestone('M2', ['M1']), milestone('M3')] }, 'workflow-M1': blocked, 'workflow-M1-retry': blocked });
  const retry = r.calls.find(c => c.label === 'workflow-M1-retry');
  assert.match(retry.prompt, /Normal and error paths pass/);
  assert.doesNotMatch(retry.prompt, /ONLY the happy path|Skip edge cases|DEGRADED SCOPE/);
  assert.equal(r.milestones.M3.status, 'DONE');
  assert.notEqual(r.milestones.M1.status, 'DONE');
  assert.equal(r.calls.some(c => c.label === 'workflow-M2'), false);
  assert.equal(r.phases.includes('development'), false);
  assert.match(r.logs.at(-1), /INCOMPLETE/);
});

for (const inspection of [null, {}, { status: 'DONE', summary: '' }]) {
  test(`empty inspection cannot complete development: ${JSON.stringify(inspection)}`, async () => {
    const r = await run({ 'inspector-M1': inspection });
    assert.notEqual(r.milestones.M1.status, 'DONE');
    assert.equal(r.phases.includes('development'), false);
  });
}

test('a repair is reviewed again before milestone completion', async () => {
  const r = await run({ 'inspector-M1': blocked });
  assert.deepEqual(r.calls.filter(c => /M1/.test(c.label)).map(c => c.label), ['workflow-M1', 'inspector-M1', 'workflow-M1-fix', 'inspector-M1-recheck']);
  assert.match(r.calls.find(c => c.label === 'workflow-M1-fix').prompt, /Missing error handling/);
  assert.equal(r.milestones.M1.status, 'DONE');
});

test('failed repair review stays incomplete and does not loop', async () => {
  const r = await run({ 'inspector-M1': blocked, 'inspector-M1-recheck': blocked });
  assert.notEqual(r.milestones.M1.status, 'DONE');
  assert.equal(r.calls.filter(c => c.label === 'workflow-M1-fix').length, 1);
});

test('integration failure gets one targeted repair and fresh acceptance', async () => {
  const r = await run({ integration: blocked });
  assert.deepEqual(r.calls.filter(c => c.label.startsWith('integration')).map(c => c.label), ['integration', 'integration-fix', 'integration-recheck']);
  assert.match(r.calls.find(c => c.label === 'integration-fix').prompt, /Missing error handling/);
  assert.equal(r.phases.includes('finalize'), true);
});

for (const result of [null, blocked]) {
  test(`integration without passing recheck remains incomplete: ${JSON.stringify(result)}`, async () => {
    const r = await run({ integration: blocked, 'integration-recheck': result });
    assert.equal(r.phases.includes('finalize'), false);
    assert.match(r.logs.at(-1), /INCOMPLETE/);
    assert.match(r.calls.find(c => c.label === 'final-report').prompt, /INCOMPLETE/);
  });
}

test('design failure cannot be hidden by an unchecked fallback', async () => {
  const r = await run({ 'fde-architect': blocked, 'architect-retry': null });
  assert.equal(r.phases.includes('architect'), false);
  assert.equal(r.calls.some(c => c.label === 'milestone-extract'), false);
  assert.match(r.logs.at(-1), /INCOMPLETE/);
});

test('all required successful phases permit goal completion', async () => {
  const r = await run();
  assert.match(r.logs.at(-1), /Goal status: DONE/);
});

test('stale recovery flags are ignored and validated milestones are not reimplemented', async () => {
  const m = milestone('M1');
  const r = await run({
    'fde-init-project': { ...done, recovery: { found: true, phases_done: ['init', 'architect', 'development', 'finalize', 'report'] } },
    'recovery-validate': { ...done, recovery: { phases_done: ['init', 'architect'], milestones: { M1: { ...m, status: 'DONE', verified: true, summary: 'Current evidence matches.' } } } },
  });
  assert.equal(r.calls.some(c => c.label === 'workflow-M1'), false);
  assert.equal(r.calls.some(c => c.label === 'integration'), true);
  assert.equal(r.calls.some(c => c.label === 'final-report'), true);
});


test('blocked design stops dependent execution while still reporting incomplete', async () => {
  const r = await run({ 'fde-architect': blocked, 'architect-retry': blocked });
  for (const label of ['milestone-extract', 'run-gate', 'integration', 'deploy-config']) {
    assert.equal(r.calls.some(c => c.label === label), false, label);
  }
  assert.equal(r.calls.some(c => c.label === 'final-report'), true);
});

test('integration repair invalidates a stale gate PASS', async () => {
  const r = await run({ integration: blocked, 'run-gate-after-integration': null });
  assert.equal(r.phases.includes('run_gate'), false);
  assert.match(r.logs.at(-1), /INCOMPLETE/);
  assert.match(r.calls.find(c => c.label === 'persist-job-outcome').prompt, /DOES_NOT_RUN/);
});

test('stop_at_poc preserves the stop boundary during recovery', async () => {
  const r = await run({ 'fde-init-project': { ...done, recovery: { found: true, phases_done: ['development'] } } }, { requirements: 'web app', stop_at_poc: true });
  for (const label of ['milestone-extract', 'run-gate', 'integration', 'deploy-config']) assert.equal(r.calls.some(c => c.label === label), false);
  assert.doesNotMatch(r.logs.at(-1), /Goal status: DONE/);
});

test('invalid DAG stays incomplete without crashing or running out of order', async () => {
  const r = await run({ 'milestone-extract': { milestones: [milestone('M1', ['missing'])] } });
  assert.equal(r.calls.some(c => c.label === 'workflow-M1'), false);
  assert.equal(r.phases.includes('development'), false);
});

test('unverified saved milestone is implemented and reviewed', async () => {
  const r = await run({ 'fde-init-project': { ...done, recovery: { found: true } }, 'recovery-validate': { ...done, recovery: { phases_done: ['init', 'architect'], milestones: { M1: { ...milestone('M1'), status: 'DONE' } } } } });
  assert.equal(r.calls.some(c => c.label === 'workflow-M1'), true);
  assert.equal(r.calls.some(c => c.label === 'inspector-M1'), true);
});

test('stop_at_poc without an enabled POC cannot claim prototype completion', async () => {
  const r = await run({}, { stop_at_poc: true, skip_poc: true });
  assert.match(r.logs.at(-1), /Goal status: INCOMPLETE/);
  assert.match(r.logs.at(-1), /stop_at_poc requires/);
});

test('missing review after integration repair invalidates development', async () => {
  const r = await run({ integration: blocked, 'inspector-integration-fix': null });
  assert.equal(r.phases.includes('development'), false);
  assert.equal(r.phases.includes('finalize'), false);
  assert.match(r.logs.at(-1), /INCOMPLETE/);
});

test('null integration result is incomplete without speculative repair', async () => {
  const r = await run({ integration: null });
  assert.equal(r.phases.includes('finalize'), false);
  assert.equal(r.calls.some(c => c.label === 'integration-fix'), false);
});

test('nonblocking concerns require explicit required-complete evidence', async () => {
  const r = await run({ 'inspector-M1': { status: 'DONE_WITH_CONCERNS', summary: 'Required evidence unknown' }, 'workflow-M1-fix': null });
  assert.equal(r.phases.includes('development'), false);
});
