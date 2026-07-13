'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'bin', 'iannil-skills.js');

const EXPECTED_SKILLS = [
  'init-project',
  'product-analysis-framework',
  'rc-application-tool',
  'rc-philosophy-advisor',
  'rc-text-assistant',
  'rc-tutor'
];

function runCli(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: 'utf8'
  });
}

test('list includes all skills', () => {
  const result = runCli(['list']);

  assert.equal(result.status, 0);
  for (const name of EXPECTED_SKILLS) {
    assert.match(result.stdout, new RegExp(name));
  }
});

test('install dry-run selects all skills by default', () => {
  const result = runCli(['install', '--dry-run']);

  assert.equal(result.status, 0);
  for (const name of EXPECTED_SKILLS) {
    assert.match(result.stdout, new RegExp(name));
  }
  assert.match(result.stdout, /--skill \*/);
});

test('install all dry-run selects all skills', () => {
  const result = runCli(['install', 'all', '--dry-run']);

  assert.equal(result.status, 0);
  for (const name of EXPECTED_SKILLS) {
    assert.match(result.stdout, new RegExp(name));
  }
  assert.match(result.stdout, /--skill \*/);
});

test('install one skill dry-run selects only that skill', () => {
  const result = runCli(['install', 'init-project', '--dry-run']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Selected skills: init-project/);
  assert.doesNotMatch(result.stdout, /Selected skills: init-project, product-analysis-framework/);
  assert.match(result.stdout, /--skill init-project/);
});

test('unknown skill exits non-zero with valid choices', () => {
  const result = runCli(['install', 'missing-skill', '--dry-run']);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown skill "missing-skill"/);
  assert.match(result.stderr, /init-project/);
  assert.match(result.stderr, /product-analysis-framework/);
});

test('init-project reference file is packaged', () => {
  const reference = path.join(root, 'skills', 'init-project', 'references', 'conventions-guide.md');

  assert.equal(fs.existsSync(reference), true);
  assert.match(fs.readFileSync(reference, 'utf8'), /项目指南/);
});

test('each rc skill has a SKILL.md', () => {
  for (const name of EXPECTED_SKILLS) {
    if (!name.startsWith('rc-')) continue;
    const skillPath = path.join(root, 'skills', name, 'SKILL.md');
    assert.equal(fs.existsSync(skillPath), true, `Missing ${name}/SKILL.md`);
    assert.match(fs.readFileSync(skillPath, 'utf8'), /^name:\s*rc-/m, `${name}/SKILL.md missing name frontmatter`);
  }
});

test('each rc skill has evals.json', () => {
  for (const name of EXPECTED_SKILLS) {
    if (!name.startsWith('rc-')) continue;
    const evalsPath = path.join(root, 'skills', name, 'evals', 'evals.json');
    assert.equal(fs.existsSync(evalsPath), true, `Missing ${name}/evals/evals.json`);
    const evals = JSON.parse(fs.readFileSync(evalsPath, 'utf8'));
    assert.ok(Array.isArray(evals.evals), `${name} evals missing evals array`);
    assert.ok(evals.evals.length > 0, `${name} has no eval cases`);
  }
});
