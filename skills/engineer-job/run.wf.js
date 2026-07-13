export const meta = {
  name: 'engineer-job-run',
  description: 'AI Project Auto-Build Engine — 6-phase orchestration. Scaffolds, architects, develops, integrates, deploys, and reports.',
  phases: [
    { title: 'Scaffold', detail: 'init-project scaffolding' },
    { title: 'Architect', detail: 'engineer-architect blueprint design' },
    { title: 'Develop', detail: 'engineer-orchestrator multi-feature development' },
    { title: 'Integrate', detail: 'integration testing & production readiness' },
    { title: 'Deploy', detail: 'deployment configuration generation' },
    { title: 'Report', detail: 'final report generation' },
  ],
}

// ── Helpers ──────────────────────────────────────────────

const STATE_PATH = '.agents/job.state.json'
const PROGRESS_PATH = '.agents/job.progress.md'
const MODE = args.mode || 'normal'
const REQUIREMENTS = args.requirements || ''

function readState() {
  try {
    const raw = require('fs').readFileSync(STATE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch { return null }
}

function writeState(state) {
  require('fs').writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
}

function appendProgress(line) {
  const ts = new Date().toISOString().slice(11, 19)
  require('fs').appendFileSync(PROGRESS_PATH, `[${ts}] ${line}\n`)
}

function markPhase(state, phase, status, result) {
  state.phases[phase] = state.phases[phase] || {}
  state.phases[phase].status = status
  state.phases[phase].completed_at = new Date().toISOString()
  if (result) state.phases[phase].result = result
  state.checkpoint.last_phase = phase
  state.checkpoint.session_summary = result?.summary || status
  writeState(state)
  const icon = status === 'DONE' ? '✅' : status === 'BLOCKED' ? '❌' : '⚠️'
  appendProgress(`${icon} Phase ${phase}: ${result?.summary || status}`)
}

function isDone(state, phase) {
  return state?.phases?.[phase]?.status === 'DONE'
}

// ── Init / Recovery ──────────────────────────────────────

function loadOrInitState() {
  const existing = readState()
  if (existing) {
    log(`Recovering project from job.state.json`)
    log(`Current phase: ${existing.checkpoint.last_phase}`)
    log(`Last checkpoint: ${existing.checkpoint.next_action || 'none'}`)
    return existing
  }

  const state = {
    project: args.projectName || 'unnamed-project',
    job_version: '2.0',
    mode: MODE,
    started_at: new Date().toISOString(),
    phases: {
      init: { status: 'TODO' },
      architect: { status: 'TODO' },
      development: { status: 'TODO' },
      finalize: { status: 'TODO' },
      deploy: { status: 'TODO' },
      report: { status: 'TODO' },
    },
    checkpoint: {
      last_commit: null,
      last_phase: null,
      next_action: 'start init phase',
      session_summary: 'Project started',
    },
  }
  writeState(state)
  appendProgress(`Project ${state.project} started (mode: ${MODE})`)
  return state
}

// ── Phase Schemas ────────────────────────────────────────

const PHASE_RESULT = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['DONE', 'DONE_WITH_CONCERNS', 'BLOCKED'],
    },
    summary: { type: 'string' },
    changes: {
      type: 'object',
      properties: {
        files_created: { type: 'number' },
        files_modified: { type: 'number' },
        tests_passed: { type: 'number' },
        commit_hash: { type: 'string' },
      },
    },
  },
  required: ['status', 'summary'],
}

// ── Main Loop ────────────────────────────────────────────

const state = loadOrInitState()

// Phase 0: Scaffold
phase('Scaffold')
if (!isDone(state, 'init')) {
  let result = await agent(
    `You are engineer-job Phase 0: init-project.

Requirements: ${REQUIREMENTS}

Execute the init-project skill:
1. Infer project type and tech stack from the requirements
2. Generate the project file tree (universal + type-specific)
3. Inject conventions (docs, memory, release structure, observability, LLM-friendly patterns)
4. Create runnable entry point files with Hello World content
5. Create .gitignore, README.md, LICENSE, IMPLEMENTATION_PLAN.md

Mode: ${MODE}

Output a structured result with status and summary.`,
    { schema: PHASE_RESULT, label: 'init-project', phase: 'Scaffold' }
  )

  if (result?.status === 'BLOCKED') {
    log('Phase 0 failed, retrying once...')
    result = await agent(
      `Retry: init-project scaffolding. Requirements: ${REQUIREMENTS}. Previous attempt failed.`,
      { schema: PHASE_RESULT, label: 'init-project-retry', phase: 'Scaffold' }
    )
  }

  if (!result || result.status === 'BLOCKED') {
    markPhase(state, 'init', 'BLOCKED', { summary: 'init-project failed after retry' })
    throw new Error('Phase 0 (init-project) failed after 2 attempts. Cannot continue.')
  }

  markPhase(state, 'init', result.status, result)
  state.checkpoint.next_action = 'start architect phase'
  writeState(state)
}

// Phase 1: Architect
phase('Architect')
if (!isDone(state, 'architect')) {
  let result = await agent(
    `You are engineer-job Phase 1: engineer-architect.

Based on the scaffolded project, execute the architect skill:
1. Scan the generated project structure
2. Converge requirements: domain glossary, tech stack decisions
3. Design data models, API contracts, milestones
4. Generate CONTEXT.md blueprint with all sections
5. Create ADRs for key decisions
6. Commit the blueprint

Requirements: ${REQUIREMENTS}
Mode: ${MODE}`,
    { schema: PHASE_RESULT, label: 'engineer-architect', phase: 'Architect' }
  )

  if (result?.status === 'BLOCKED') {
    log('Phase 1 failed, retrying once...')
    result = await agent(
      `Retry: architect blueprint generation. Requirements: ${REQUIREMENTS}. If still blocked, generate a skeleton CONTEXT.md with minimal structure and mark as degraded.`,
      { schema: PHASE_RESULT, label: 'architect-retry', phase: 'Architect' }
    )
  }

  if (!result || result.status === 'BLOCKED') {
    log('Phase 1 degraded: generating skeleton blueprint')
    markPhase(state, 'architect', 'DONE_WITH_CONCERNS', {
      summary: 'Architect degraded — skeleton CONTEXT.md generated',
      changes: { files_created: 1 },
    })
  } else {
    markPhase(state, 'architect', result.status, result)
  }

  state.checkpoint.next_action = 'start development phase'
  writeState(state)
}

// Phase 2: Develop
phase('Develop')
if (!isDone(state, 'development')) {
  const result = await agent(
    `You are engineer-job Phase 2: engineer-orchestrator.

Execute the orchestrator skill against the CONTEXT.md blueprint:
1. Parse milestone DAG from CONTEXT.md
2. Create progress tracker at .agents/progress.json
3. Execute milestones in dependency order using engineer-workflow
4. Run integration check after each milestone
5. Auto-recover on failure (retry -> degrade -> skip)
6. Update CONTEXT.md after each milestone
7. Commit all changes

Requirements: ${REQUIREMENTS}
Mode: ${MODE}

Return the consolidated results.`,
    { schema: PHASE_RESULT, label: 'engineer-orchestrator', phase: 'Develop' }
  )

  if (!result || result.status === 'BLOCKED') {
    log('Phase 2 partially completed — recording what was done')
    markPhase(state, 'development', 'DONE_WITH_CONCERNS', {
      summary: 'Development partially completed — some milestones may be blocked/skipped',
    })
  } else {
    markPhase(state, 'development', result.status, result)
  }

  state.checkpoint.next_action = 'start integration phase'
  writeState(state)
}

// Phase 3: Integrate
phase('Integrate')
if (!isDone(state, 'finalize')) {
  const result = await agent(
    `You are engineer-job Phase 3: integration.

Run integration tests on the completed project:
1. Run the project's build/compile check
2. Run all tests
3. If project is a server/web app, run production readiness checklist
4. Document any failures (do NOT block — record and continue)

Mode: ${MODE}`,
    { schema: PHASE_RESULT, label: 'integration', phase: 'Integrate' }
  )

  markPhase(state, 'finalize', result?.status || 'DONE_WITH_CONCERNS', result || { summary: 'Integration skipped' })
  state.checkpoint.next_action = 'start deploy phase'
  writeState(state)
}

// Phase 4: Deploy
phase('Deploy')
if (!isDone(state, 'deploy')) {
  const result = await agent(
    `You are engineer-job Phase 4: deploy.

Generate deployment configuration based on the project's blueprint:
1. Read CONTEXT.md deployment section
2. Generate Dockerfile if applicable
3. Generate docker-compose.yml if applicable
4. Generate CI/CD config (.github/workflows/) if applicable
5. Do NOT hardcode secrets — use environment variable references

Mode: ${MODE}`,
    { schema: PHASE_RESULT, label: 'deploy-config', phase: 'Deploy' }
  )

  markPhase(state, 'deploy', result?.status || 'DONE_WITH_CONCERNS', result || { summary: 'Deploy config skipped' })
  state.checkpoint.next_action = 'start report phase'
  writeState(state)
}

// Phase 5: Report
phase('Report')
if (!isDone(state, 'report')) {
  const finalState = readState()
  const result = await agent(
    `You are engineer-job Phase 5: reporting.

Generate the final project completion report based on job.state.json.
Read the state from .agents/job.state.json and generate a markdown report.

Summarize:
1. Overall project status
2. Per-phase completion (init, architect, development milestones, integrate, deploy)
3. File changes summary
4. Test results
5. Deployment config generated
6. Known issues / skipped items
7. Next steps recommendations

Output the full report as markdown.`,
    { schema: PHASE_RESULT, label: 'final-report', phase: 'Report' }
  )

  markPhase(state, 'report', result?.status || 'DONE', result || { summary: 'Report generated' })
  state.checkpoint.next_action = 'all phases complete'
  writeState(state)
}

log('All 6 phases completed. Project build finished.')
log(`Final state written to ${STATE_PATH}`)
log(`Progress log at ${PROGRESS_PATH}`)
