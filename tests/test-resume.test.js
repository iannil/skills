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

test('handoff-protocol.md documents every handoff kind', () => {
  const md = fs.readFileSync(path.join(__dirname, '..', 'skills', 'engineer-next', 'references', 'handoff-protocol.md'), 'utf8')
  for (const h of ['reinvoke-job-workflow', 'route-orchestrator', 'route-architect', 'route-architect-reverse', 'route-requirements', 'report-complete', 'report-blocked']) {
    assert.ok(md.includes(h), `handoff-protocol.md covers ${h}`)
  }
  assert.ok(md.includes('reconstructed_args') || md.includes('重建参数') || md.includes('参数重建'), 'documents arg reconstruction')
})

test('SKILL.md frontmatter is valid', () => {
  const md = fs.readFileSync(path.join(__dirname, '..', 'skills', 'engineer-next', 'SKILL.md'), 'utf8')
  const fm = md.match(/^---\n([\s\S]*?)\n---/)
  assert.ok(fm, 'has frontmatter')
  assert.ok(/^name:\s*engineer-next/m.test(fm[1]), 'name: engineer-next')
  assert.ok(/compatibility:.*(?:bash|agent)/.test(fm[1]), 'compatibility includes bash or agent')
})

test('SKILL.md has decision table, modes, triggers, references', () => {
  const md = fs.readFileSync(path.join(__dirname, '..', 'skills', 'engineer-next', 'SKILL.md'), 'utf8')
  assert.ok(md.includes('## ⚙️ 模式选择'), 'mode selection section')
  for (const k of ['1a', '1b', '1c', '1d', '1e', '2', '3', '4', '5', '6a', '6b', '7']) {
    assert.ok(md.includes(k), `decision table covers scenario ${k}`)
  }
  for (const k of ['job.state.json', 'progress.json', 'CONTEXT.md', 'REQUIREMENTS.md']) {
    assert.ok(md.includes(k), `references ${k}`)
  }
  assert.ok(/继续|接着|next|continue|resume/i.test(md), 'has resume trigger phrases')
  assert.ok(md.includes('resume-logic.js'), 'references resume-logic.js')
  assert.ok(md.includes('detect-resume.js'), 'references detect-resume.js')
  assert.ok(md.includes('handoff-protocol.md'), 'references handoff-protocol.md')
})

test('README registers engineer-next in list + decision table + tree', () => {
  const en = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8')
  assert.ok(/`engineer-next`/.test(en), 'README skill list mentions engineer-next')
  assert.ok(/继续|continue|resume/i.test(en) && /engineer-next/.test(en), 'README decision table references engineer-next for resume')
  assert.ok(en.includes('engineer-next/'), 'README file tree has engineer-next/')
})

test('README.zh-CN registers engineer-next', () => {
  const zh = fs.readFileSync(path.join(__dirname, '..', 'README.zh-CN.md'), 'utf8')
  assert.ok(/`engineer-next`/.test(zh), 'README.zh-CN mentions engineer-next')
  assert.ok(zh.includes('engineer-next/'), 'README.zh-CN file tree has engineer-next/')
})
