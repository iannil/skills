const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Execute the actual workflow phase with an isolated Agent adapter: no model calls,
// shell commands, project writes or replacement implementation of the gate.
const source = fs.readFileSync(path.join(__dirname, '../skills/engineer-job/run.wf.js'), 'utf8');
const start = source.indexOf("phase('Run Gate')");
const end = source.indexOf("phase('Integrate')", start);
assert.ok(start >= 0 && end > start, 'workflow phase boundaries exist');
const phaseSource = source.slice(start, end);

async function runGate(results) {
  const calls = [];
  let reads = 0;
  const context = vm.createContext({
    phase() {}, log() {}, isDone() { return false; }, stop_at_poc: false,
    MODE: 'auto', RUN_GATE_SCHEMA: {}, PHASE_RESULT: {},
    phasesDone: new Set(), runGateResult: null,
    ctx(_phase, prompt) { return prompt; },
    async agent(prompt, options) {
      calls.push({ prompt, label: options.label });
      if (options.label === 'run-gate') {
        return results[Math.min(reads++, results.length - 1)];
      }
      return { status: 'DONE' };
    },
  });
  await vm.runInContext(`(async () => { ${phaseSource} })()`, context);
  return { result: JSON.parse(JSON.stringify(context.runGateResult)), calls };
}

test('explicit satisfied project policy passes without a numerical coverage metric', async () => {
  const { result, calls } = await runGate([{
    build_ok: true, test_ok: true, coverage_ok: true,
    coverage_reason: 'No numerical threshold; required behavior checks passed.',
  }]);
  assert.equal(result.status, 'PASS');
  assert.equal(result.attempts, 1);
  assert.equal(calls.filter(c => c.label === 'run-gate-fix').length, 0);
});

for (const [label, value] of [['failed', false], ['missing', undefined], ['invalid string', 'true']]) {
  test(`${label} policy result cannot pass despite successful build and tests`, async () => {
    const { result } = await runGate([{
      build_ok: true, test_ok: true, coverage_ok: value,
      coverage_reason: 'Required evidence is unavailable.',
    }]);
    assert.equal(result.status, 'DOES_NOT_RUN');
    assert.equal(result.attempts, 2);
    assert.equal(result.last_error, 'Required evidence is unavailable.');
  });
}

test('a failed build cannot be concealed by satisfied coverage', async () => {
  const { result } = await runGate([{
    build_ok: false, test_ok: true, coverage_ok: true, output: 'compile error',
  }]);
  assert.equal(result.status, 'DOES_NOT_RUN');
  assert.equal(result.last_error, 'compile error');
});

test('a repaired gate persists success only after the successful rerun', async () => {
  const { result, calls } = await runGate([
    { build_ok: true, test_ok: true, coverage_ok: false, coverage_reason: 'Required branch missed.' },
    { build_ok: true, test_ok: true, coverage_ok: true, coverage_reason: 'Project threshold met.' },
  ]);
  assert.equal(result.status, 'PASS');
  assert.equal(result.attempts, 2);
  assert.deepEqual(calls.map(c => c.label), ['run-gate', 'run-gate-fix', 'run-gate', 'persist-run-gate']);
  assert.match(calls.at(-1).prompt, /"status":"PASS"/);
});
