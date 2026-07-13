import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const { detectComplexity } = require('../skills/engineer-job/references/detection-logic.js')

const cases = JSON.parse(readFileSync(new URL('../skills/engineer-job/evals/complexity-cases.json', import.meta.url), 'utf8'))

for (const c of cases) {
  test(`detect: ${c.label}`, () => {
    const r = detectComplexity(c.requirements)
    assert.equal(r.has_frontend, c.expected.has_frontend, `has_frontend for "${c.label}"`)
    assert.equal(r.skip_requirements, c.expected.skip_requirements, `skip_requirements for "${c.label}"`)
    assert.equal(r.skip_frontend, c.expected.skip_frontend, `skip_frontend for "${c.label}"`)
  })
}
