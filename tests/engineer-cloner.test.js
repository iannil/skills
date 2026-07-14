'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const skillDir = path.join(root, 'skills', 'engineer-cloner');
const refDir = path.join(skillDir, 'references');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

test('SKILL.md exists with correct frontmatter', () => {
  const p = path.join(skillDir, 'SKILL.md');
  assert.equal(fs.existsSync(p), true, 'Missing engineer-cloner/SKILL.md');
  const body = read(p);
  assert.match(body, /^name:\s*engineer-cloner\s*$/m, 'frontmatter name must be engineer-cloner');
  assert.match(body, /^compatibility:\s*"agent, bash, write, edit, read"\s*$/m, 'compatibility line mismatch');
});

test('SKILL.md covers all seven phases', () => {
  const body = read(path.join(skillDir, 'SKILL.md'));
  const phases = [
    '授权与范围',
    '侦察',
    '登录全站遍历',
    '契约与数据模型提取',
    '设计语言提取',
    '三文档合成',
    '交棒',
  ];
  for (const phase of phases) {
    assert.ok(body.includes(phase), `SKILL.md missing phase: ${phase}`);
  }
});

test('SKILL.md states the three fidelity tiers', () => {
  const body = read(path.join(skillDir, 'SKILL.md'));
  for (const label of ['可观测精确', '推断', '不可观测']) {
    assert.ok(body.includes(label), `SKILL.md missing fidelity tier: ${label}`);
  }
});

test('SKILL.md names runtime artifacts and handoff', () => {
  const body = read(path.join(skillDir, 'SKILL.md'));
  for (const artifact of [
    '.agents/clone.ledger.json',
    'REQUIREMENTS.md',
    'CONTEXT.md',
    'FRONTEND-DESIGN.md',
    'CLONE-FIDELITY.md',
  ]) {
    assert.ok(body.includes(artifact), `SKILL.md missing artifact: ${artifact}`);
  }
  assert.ok(body.includes('engineer-job'), 'SKILL.md must reference engineer-job handoff');
  assert.ok(body.includes('agent-browser'), 'SKILL.md must reference agent-browser');
});

test('reference files exist', () => {
  for (const f of [
    'coverage-ledger.schema.json',
    'observation-playbook.md',
    'contract-extraction.md',
    'fidelity-report-template.md',
  ]) {
    assert.equal(fs.existsSync(path.join(refDir, f)), true, `Missing reference: ${f}`);
  }
});

test('coverage-ledger schema is valid JSON draft-07', () => {
  const schema = JSON.parse(read(path.join(refDir, 'coverage-ledger.schema.json')));
  assert.match(schema.$schema, /draft-07/, 'schema must declare draft-07');
  assert.ok(typeof schema.type === 'string', 'schema needs a top-level type');
});

test('fidelity template uses the three tiers', () => {
  const body = read(path.join(refDir, 'fidelity-report-template.md'));
  for (const label of ['可观测精确', '推断', '不可观测']) {
    assert.ok(body.includes(label), `fidelity template missing tier: ${label}`);
  }
});

test('both READMEs register engineer-cloner', () => {
  assert.ok(read(path.join(root, 'README.md')).includes('engineer-cloner'), 'README.md missing engineer-cloner');
  assert.ok(read(path.join(root, 'README.zh-CN.md')).includes('engineer-cloner'), 'README.zh-CN.md missing engineer-cloner');
});
