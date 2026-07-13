const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { detectComplexity, topoSort } = require('../skills/engineer-job/references/detection-logic.js')

const cases = JSON.parse(readFileSync(path.join(__dirname, '..', 'skills', 'engineer-job', 'evals', 'complexity-cases.json'), 'utf8'))

for (const c of cases) {
  test(`detect: ${c.label}`, () => {
    const r = detectComplexity(c.requirements)
    assert.equal(r.has_frontend, c.expected.has_frontend, `has_frontend for "${c.label}"`)
    assert.equal(r.skip_requirements, c.expected.skip_requirements, `skip_requirements for "${c.label}"`)
    assert.equal(r.skip_frontend, c.expected.skip_frontend, `skip_frontend for "${c.label}"`)
  })
}

test('topoSort: linear chain', () => {
  const ms = [{ id: 'M1', deps: [] }, { id: 'M2', deps: ['M1'] }, { id: 'M3', deps: ['M2'] }]
  assert.deepEqual(topoSort(ms), ['M1', 'M2', 'M3'])
})

test('topoSort: diamond preserves endpoints', () => {
  const ms = [
    { id: 'M1', deps: [] },
    { id: 'M2', deps: ['M1'] },
    { id: 'M3', deps: ['M1'] },
    { id: 'M4', deps: ['M2', 'M3'] },
  ]
  const order = topoSort(ms)
  assert.equal(order[0], 'M1')
  assert.equal(order[order.length - 1], 'M4')
  assert.equal(order.length, 4)
})

test('topoSort: cycle throws', () => {
  const ms = [{ id: 'M1', deps: ['M2'] }, { id: 'M2', deps: ['M1'] }]
  assert.throws(() => topoSort(ms))
})

test('topoSort: unknown dep throws', () => {
  const ms = [{ id: 'M1', deps: ['M9'] }]
  assert.throws(() => topoSort(ms))
})

test('run.wf.js inlines pure functions (sync guard)', () => {
  const wf = readFileSync(path.join(__dirname, '..', 'skills', 'engineer-job', 'run.wf.js'), 'utf8')
  assert.ok(wf.includes('function detectComplexity'), 'run.wf.js 必须内联 detectComplexity')
  assert.ok(wf.includes('function topoSort'), 'run.wf.js 必须内联 topoSort')
  assert.ok(wf.includes('mirrored from references/detection-logic.js'), 'run.wf.js 必须标注镜像来源')
})

function extractSignalArray(src, name) {
  const m = src.match(new RegExp('const ' + name + ' = (\\[[\\s\\S]*?\\])'))
  if (!m) return null
  try { return eval(m[1]) } catch { return null }
}

test('run.wf.js keyword tables match detection-logic.js (sync guard)', () => {
  const dl = readFileSync(path.join(__dirname, '..', 'skills', 'engineer-job', 'references', 'detection-logic.js'), 'utf8')
  const wf = readFileSync(path.join(__dirname, '..', 'skills', 'engineer-job', 'run.wf.js'), 'utf8')
  for (const k of ['FRONTEND_SIGNALS', 'NO_FRONTEND_SIGNALS', 'COMPLEX_SIGNALS', 'SIMPLE_SIGNALS']) {
    const a = extractSignalArray(dl, k)
    const b = extractSignalArray(wf, k)
    assert.ok(Array.isArray(a) && Array.isArray(b), `${k}: could not extract array from both files`)
    assert.deepEqual(b, a, `${k}: run.wf.js table must match detection-logic.js`)
  }
})

test('run.wf.js defines its args-derived Constants (sync guard)', () => {
  // Catches accidental deletion of the Constants block (MODE/REQUIREMENTS/PROJECT_NAME),
  // which node --check (syntax-only) and the detection-logic tests cannot detect —
  // a missing const only surfaces as a runtime ReferenceError when the workflow executes.
  const wf = readFileSync(path.join(__dirname, '..', 'skills', 'engineer-job', 'run.wf.js'), 'utf8')
  assert.ok(/^const MODE = /m.test(wf), 'run.wf.js must define const MODE')
  assert.ok(/^const REQUIREMENTS = /m.test(wf), 'run.wf.js must define const REQUIREMENTS')
  assert.ok(/^const PROJECT_NAME = /m.test(wf), 'run.wf.js must define const PROJECT_NAME')
})

