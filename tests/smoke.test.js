'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'bin', 'iannil-skills.js');

function runCli(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: 'utf8'
  });
}

test('list includes both skills', () => {
  const result = runCli(['list']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /init-project/);
  assert.match(result.stdout, /product-analysis-framework/);
});

test('install dry-run selects all skills by default', () => {
  const result = runCli(['install', '--dry-run']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Selected skills: init-project, product-analysis-framework/);
  assert.match(result.stdout, /--skill \*/);
});

test('install all dry-run selects both skills', () => {
  const result = runCli(['install', 'all', '--dry-run']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Selected skills: init-project, product-analysis-framework/);
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
