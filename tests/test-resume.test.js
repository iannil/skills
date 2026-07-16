const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { detectResumePoint, assessCodeVolume } = require('../skills/engineer-next/references/resume-logic.js')

test('assessCodeVolume: near-empty (9 files)', () => {
  assert.equal(assessCodeVolume({ sourceFiles: 9, totalLoc: 400 }), 'near-empty')
})

test('assessCodeVolume: substantial by file count (10)', () => {
  assert.equal(assessCodeVolume({ sourceFiles: 10, totalLoc: 100 }), 'substantial')
})

test('assessCodeVolume: substantial by LOC (500)', () => {
  assert.equal(assessCodeVolume({ sourceFiles: 3, totalLoc: 500 }), 'substantial')
})

test('assessCodeVolume: just below LOC (499)', () => {
  assert.equal(assessCodeVolume({ sourceFiles: 3, totalLoc: 499 }), 'near-empty')
})

test('assessCodeVolume: null stats defaults to near-empty', () => {
  assert.equal(assessCodeVolume(null), 'near-empty')
})

// detectResumePoint — 用例驱动
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'skills', 'engineer-next', 'evals', 'resume-cases.json'), 'utf8'))
for (const c of cases) {
  test(`detectResumePoint: ${c.label}`, () => {
    const v = detectResumePoint(c.state)
    assert.equal(v.scenario, c.expected.scenario, `scenario for "${c.label}"`)
    assert.equal(v.target_skill, c.expected.target_skill, `target_skill for "${c.label}"`)
    assert.equal(v.handoff, c.expected.handoff, `handoff for "${c.label}"`)
  })
}

test('resume-logic.js exports both functions', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'skills', 'engineer-next', 'references', 'resume-logic.js'), 'utf8')
  assert.ok(src.includes('function detectResumePoint'), 'defines detectResumePoint')
  assert.ok(src.includes('function assessCodeVolume'), 'defines assessCodeVolume')
  assert.ok(/module\.exports\s*=\s*\{\s*detectResumePoint/.test(src), 'exports detectResumePoint')
  assert.ok(!src.includes('require('), 'resume-logic.js must be pure (no require)')
})

test('detect-resume.js CLI uses fs and has no argless new Date()', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'skills', 'engineer-next', 'references', 'detect-resume.js'), 'utf8')
  assert.ok(src.includes("require('node:fs')") || src.includes('require("node:fs")'), 'uses node:fs')
  assert.ok(!/new Date\(\)/.test(src), 'no argless new Date()')
  assert.ok(src.includes('detectResumePoint'), 'calls detectResumePoint')
})

test('detect-resume.js CLI smoke: empty dir -> scenario 7', () => {
  const { execSync } = require('node:child_process')
  const os = require('node:os')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'engineer-next-'))
  const cli = path.join(__dirname, '..', 'skills', 'engineer-next', 'references', 'detect-resume.js')
  const out = execSync(`node ${JSON.stringify(cli)} ${JSON.stringify(tmp)}`, { encoding: 'utf8' })
  const verdict = JSON.parse(out)
  assert.equal(verdict.scenario, '7', 'empty dir should be scenario 7')
  assert.equal(verdict.target_skill, 'engineer-job')
})
