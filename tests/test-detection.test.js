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
