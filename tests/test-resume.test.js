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
