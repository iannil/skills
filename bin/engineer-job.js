#!/usr/bin/env node

/**
 * engineer-job CLI — State dashboard for the AI Project Auto-Build Engine.
 *
 * Commands:
 *   status   — Show current project state from .agents/job.state.json
 *   history  — Show progress timeline from .agents/job.progress.md (last 20)
 *   report   — Re-generate final report from state files
 *
 * Zero external dependencies — uses only Node.js built-ins.
 */

const fs = require('fs')
const path = require('path')

const STATE_FILE = path.resolve('.agents/job.state.json')
const PROGRESS_FILE = path.resolve('.agents/job.progress.md')

const command = process.argv[2]

// ── Helpers ──────────────────────────────────────────────

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

// ── status command ───────────────────────────────────────

function showStatus() {
  const state = readJSON(STATE_FILE)
  if (!state) {
    console.log('No job.state.json found. No active project.')
    console.log('Start a project via the Workflow tool:')
    console.log('  Workflow({ script: "skills/engineer-job/run.wf.js", args: { requirements, mode } })')
    return
  }

  const phases = state.phases || {}
  const dev = phases.development || {}
  const features = dev.features || {}
  const doneCount = Object.values(features).filter(f => f.status === 'DONE').length
  const totalCount = Object.keys(features).length

  const phaseLabels = {
    init: 'Init',
    architect: 'Architect',
    development: 'Develop',
    finalize: 'Integrate',
    deploy: 'Deploy',
    report: 'Report',
  }

  const phaseLine = Object.entries(phaseLabels).map(([key, label]) => {
    const p = phases[key]
    if (!p || p.status === 'TODO') return `○ ${label}`
    if (p.status === 'IN_PROGRESS') return `◷ ${label}`
    if (p.status === 'DONE' || p.status === 'DONE_WITH_CONCERNS') return `✅ ${label}`
    if (p.status === 'BLOCKED') return `❌ ${label}`
    if (p.status === 'SKIPPED') return `⏭ ${label}`
    return `○ ${label}`
  }).join('  ')

  let currentPhase = 'report'
  for (const key of ['init', 'architect', 'development', 'finalize', 'deploy', 'report']) {
    const p = phases[key]
    if (!p || p.status === 'TODO' || p.status === 'IN_PROGRESS') { currentPhase = key; break }
  }
  const phaseLabel = currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)

  let milestoneLine = ''
  if (totalCount > 0) {
    const barLen = 20
    const filled = Math.round((doneCount / totalCount) * barLen)
    const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled)
    milestoneLine = `\n  Milestones: ${bar} ${doneCount}/${totalCount}`
  }

  const lastCommit = state.checkpoint?.last_commit
    ? state.checkpoint.last_commit.slice(0, 7)
    : '—'
  const lastSummary = state.checkpoint?.session_summary || ''
  const lastLine = `${lastCommit} "${lastSummary}"`.slice(0, 49)

  console.log(`
  Project:  ${state.project || 'unnamed'}
  Phase:    ${phaseLabel}
  Mode:     ${state.mode || 'normal'}
  Status:   ${phaseLine}${milestoneLine}
  Last:     ${lastLine}
  Next:     ${state.checkpoint?.next_action || '—'}
`)
}

// ── history command ──────────────────────────────────────

function showHistory() {
  try {
    const content = fs.readFileSync(PROGRESS_FILE, 'utf-8')
    const lines = content.trim().split('\n')
    const entries = lines.filter(l => l.startsWith('['))
    const last20 = entries.slice(-20)
    console.log(last20.join('\n') || '(no progress entries yet)')
  } catch {
    console.log('No job.progress.md found.')
  }
}

// ── report command ───────────────────────────────────────

function showReport() {
  const state = readJSON(STATE_FILE)
  if (!state) {
    console.log('No job.state.json found.')
    return
  }

  const phases = state.phases || {}
  const dev = phases.development || {}
  const features = dev.features || {}

  console.log(`# Project Report: ${state.project}

**Started**: ${state.started_at ? new Date(state.started_at).toLocaleString() : 'unknown'}
**Mode**: ${state.mode || 'normal'}
**Status**: ${state.checkpoint?.next_action || 'completed'}

## Phase Summary

| Phase | Status | Details |
|:----:|:------:|---------|`)

  const phaseRows = [
    ['init', 'Init'],
    ['architect', 'Architect'],
    ['development', 'Development'],
    ['finalize', 'Integration'],
    ['deploy', 'Deploy'],
    ['report', 'Report'],
  ]
  for (const [key, label] of phaseRows) {
    const p = phases[key]
    const status = p?.status || 'TODO'
    const icon = status === 'DONE' ? '✅' : status === 'DONE_WITH_CONCERNS' ? '⚠️' : status === 'BLOCKED' ? '❌' : status === 'SKIPPED' ? '⏭' : '○'
    const details = p?.result?.summary || status
    console.log(`| ${icon} ${label} | ${status} | ${details} |`)
  }

  if (Object.keys(features).length > 0) {
    console.log(`
## Milestone Details

| # | Milestone | Status | Changes |
|:-:|-----------|:------:|---------|`)
    for (const [id, f] of Object.entries(features)) {
      const icon = f.status === 'DONE' ? '✅' : f.status === 'IN_PROGRESS' ? '◷' : f.status === 'BLOCKED' ? '❌' : '○'
      const changed = f.commits ? `commits ${f.commits}` : f.degraded ? 'degraded' : '—'
      console.log(`| ${id} | ${f.name || id} | ${icon} ${f.status} | ${changed} |`)
    }
  }

  console.log(`
**Next action**: ${state.checkpoint?.next_action || 'None'}`)
}

// ── Main ─────────────────────────────────────────────────

switch (command) {
  case 'status':
    showStatus()
    break
  case 'history':
    showHistory()
    break
  case 'report':
    showReport()
    break
  default:
    console.log(`Usage: node bin/engineer-job.js <command>

Commands:
  status     Show current project state
  history    Show progress timeline (last 20 entries)
  report     Generate final report from state

Example:
  node bin/engineer-job.js status`)
    break
}
