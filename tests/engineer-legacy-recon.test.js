'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const skillDir = path.join(root, 'skills', 'engineer-legacy-recon');
const refDir = path.join(skillDir, 'references');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

test('SKILL.md exists with correct frontmatter', () => {
  const p = path.join(skillDir, 'SKILL.md');
  assert.equal(fs.existsSync(p), true, 'Missing engineer-legacy-recon/SKILL.md');
  const body = read(p);
  assert.match(body, /^name:\s*engineer-legacy-recon\s*$/m, 'frontmatter name must be engineer-legacy-recon');
  assert.match(body, /^compatibility:\s*"bash, write, read, edit"\s*$/m, 'compatibility line mismatch');
});

test('SKILL.md covers all six phases', () => {
  const body = read(path.join(skillDir, 'SKILL.md'));
  const phases = [
    '材料归集与端界定',
    '导航树解析',
    '逐页要素提取',
    '实体与状态机推断',
    '设计与信息架构线索',
    '三文档合成',
    '交棒',
  ];
  for (const phase of phases) {
    assert.ok(body.includes(phase), `SKILL.md missing phase: ${phase}`);
  }
});

test('SKILL.md states the three confidence tiers', () => {
  const body = read(path.join(skillDir, 'SKILL.md'));
  for (const label of ['明示', '推断', '缺口']) {
    assert.ok(body.includes(label), `SKILL.md missing confidence tier: ${label}`);
  }
});

test('SKILL.md enforces the do-not-browse / no-agent-browser rule', () => {
  const body = read(path.join(skillDir, 'SKILL.md'));
  assert.ok(body.includes('agent-browser'), 'SKILL.md must reference agent-browser (to say it is NOT used)');
  assert.ok(body.includes('不联网') || body.includes('不用 agent-browser'), 'SKILL.md must state it does not browse live');
});

test('SKILL.md names runtime artifacts and handoff', () => {
  const body = read(path.join(skillDir, 'SKILL.md'));
  for (const artifact of [
    '.agents/recon.ledger.json',
    'REQUIREMENTS.md',
    'CONTEXT.md',
    'FRONTEND-DESIGN.md',
    'RECON-FIDELITY.md',
  ]) {
    assert.ok(body.includes(artifact), `SKILL.md missing artifact: ${artifact}`);
  }
  assert.ok(body.includes('engineer-job'), 'SKILL.md must reference engineer-job handoff');
});

test('reference files exist', () => {
  for (const f of [
    'recon-ledger.schema.json',
    'extraction-playbook.md',
    'fidelity-report-template.md',
  ]) {
    assert.equal(fs.existsSync(path.join(refDir, f)), true, `Missing reference: ${f}`);
  }
});

test('recon-ledger schema is valid JSON draft-07', () => {
  const schema = JSON.parse(read(path.join(refDir, 'recon-ledger.schema.json')));
  assert.match(schema.$schema, /draft-07/, 'schema must declare draft-07');
  assert.ok(typeof schema.type === 'string', 'schema needs a top-level type');
});

test('fidelity template uses the three tiers and a gap list', () => {
  const body = read(path.join(refDir, 'fidelity-report-template.md'));
  for (const label of ['明示', '推断', '缺口']) {
    assert.ok(body.includes(label), `fidelity template missing tier: ${label}`);
  }
  assert.ok(body.includes('缺口清单'), 'fidelity template must contain a gap list section');
});

test('both READMEs register engineer-legacy-recon', () => {
  assert.ok(read(path.join(root, 'README.md')).includes('engineer-legacy-recon'), 'README.md missing engineer-legacy-recon');
  assert.ok(read(path.join(root, 'README.zh-CN.md')).includes('engineer-legacy-recon'), 'README.zh-CN.md missing engineer-legacy-recon');
});
