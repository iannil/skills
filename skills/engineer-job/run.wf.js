export const meta = {
  name: 'engineer-job-run',
  description: 'AI Project Auto-Build Engine — 6-phase orchestration. Scaffolds, architects, develops, integrates, deploys, and reports.',
  phases: [
    { title: 'Scaffold', detail: 'init-project scaffolding + project-metadata.json' },
    { title: 'Architect', detail: 'engineer-architect blueprint design via metadata' },
    { title: 'Develop', detail: 'engineer-orchestrator multi-feature development' },
    { title: 'Integrate', detail: 'integration testing & production readiness' },
    { title: 'Deploy', detail: 'deployment configuration generation' },
    { title: 'Report', detail: 'final report generation' },
  ],
}

// ═══════════════════════════════════════════════════════════
//  Skill Protocol: Standard Inter-Skill Communication
// ═══════════════════════════════════════════════════════════
//
// This script implements the standardized skill protocol
// defined in references/skill-protocol.md.
//
// Key files:
//   .agents/job.state.json           — machine-readable project state
//   .agents/job.progress.md          — human-readable append-only log
//   project-metadata.json            — structured metadata bridging init→architect→orchestrator
//   CONTEXT.md                       — project blueprint (architect output)
//   frontend-spec.json               — frontend design tokens (if has_frontend)
//   .agents/progress.json            — orchestrator progress tracker
//
// Protocol flow:
//   init-project  ──►  project-metadata.json  ──►  engineer-architect
//   engineer-architect  ──►  CONTEXT.md  ──►  engineer-orchestrator
//   engineer-orchestrator  ──►  .agents/progress.json  ──►  engineer-workflow × N
//
// ═══════════════════════════════════════════════════════════

// ── Constants ─────────────────────────────────────────────

const STATE_PATH = '.agents/job.state.json'
const PROGRESS_PATH = '.agents/job.progress.md'
const METADATA_PATH = 'project-metadata.json'
const MODE = args.mode || 'normal'
const REQUIREMENTS = args.requirements || ''
const PROJECT_NAME = args.projectName || 'unnamed-project'

// ── File I/O Helpers ──────────────────────────────────────

function readJSON(path) {
  try {
    const raw = require('fs').readFileSync(path, 'utf-8')
    return JSON.parse(raw)
  } catch { return null }
}

function writeJSON(path, data) {
  require('fs').writeFileSync(path, JSON.stringify(data, null, 2))
}

function pathExists(path) {
  try { require('fs').accessSync(path); return true }
  catch { return false }
}

// ── State Management ──────────────────────────────────────

function readState() {
  return readJSON(STATE_PATH)
}

function writeState(state) {
  writeJSON(STATE_PATH, state)
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
    project: PROJECT_NAME,
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

// ── Project Metadata Helpers ──────────────────────────────
//
// project-metadata.json is the STANDARD handoff protocol
// between phases. Defined in references/skill-protocol.md.
// See also: references/project-metadata.schema.json

function initMetadata() {
  const existing = readJSON(METADATA_PATH)
  if (existing) return existing

  const metadata = {
    project: {
      name: PROJECT_NAME,
      description: REQUIREMENTS.slice(0, 120),
      type: 'other',
      language: '',
      framework: '',
      package_manager: '',
      database: null,
      has_frontend: false,
      frontend_framework: null,
      deployment: { type: 'local', ci_cd: 'manual', docker: false },
      testing: { framework: '', types: ['unit'] },
      license: 'MIT',
      features: [],
    },
    progress_file: STATE_PATH,
    blueprint_file: 'CONTEXT.md',
  }
  writeJSON(METADATA_PATH, metadata)
  return metadata
}

function getMetadata() {
  return readJSON(METADATA_PATH) || initMetadata()
}

function ensureMetadataAfterInit() {
  if (!readJSON(METADATA_PATH)) {
    initMetadata()
    log('Warning: init agent did not write project-metadata.json — backfilled minimal version')
    appendProgress('Warning: project-metadata.json backfilled (init agent skipped it)')
  } else {
    log('project-metadata.json found after Phase 0')
    appendProgress('project-metadata.json written with scaffold metadata')
  }
}

function metadataLog(meta) {
  const hasFE = meta.project.has_frontend
  appendProgress(`Project type: ${meta.project.type}, Language: ${meta.project.language}${hasFE ? `, Frontend: ${meta.project.frontend_framework || 'yes'}` : ''}`)
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
        tests_total: { type: 'number' },
        commit_hash: { type: 'string' },
        degraded: { type: 'boolean' },
      },
    },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['warning', 'error'] },
          description: { type: 'string' },
        },
      },
    },
  },
  required: ['status', 'summary'],
}

// ── Main Loop ────────────────────────────────────────────

const state = loadOrInitState()

// ═══════════════════════════════════════════════════════════
//  Phase 0 — init-project: 项目脚手架
// ═══════════════════════════════════════════════════════════
//  Output: project-metadata.json + file tree

phase('Scaffold')
if (!isDone(state, 'init')) {
  let result = await agent(
    `You are engineer-job Phase 0: init-project.

Requirements: "${REQUIREMENTS}"
Project name: "${PROJECT_NAME}"
Mode: ${MODE}

=== PRIMARY TASK: Scaffold the project from scratch ===

Step 1 — Write project-metadata.json
Before any file generation, write "project-metadata.json" with:
{
  "project": {
    "name": "${PROJECT_NAME}",
    "description": "<one-line summary of requirements>",
    "type": "<api-server | cli-tool | library | web-app | desktop-app | mobile-app | other>",
    "language": "<inferred programming language>",
    "framework": "<inferred web framework, if any>",
    "package_manager": "<inferred: pip | cargo | npm | go-mod | maven | ...>",
    "database": "<inferred database or null>",
    "has_frontend": <true | false>,
    "frontend_framework": "<inferred or null>",
    "deployment": {
      "type": "<local | docker | serverless | cloud-vm>",
      "ci_cd": "<github-actions | gitlab-ci | manual | none>",
      "docker": <true | false>
    },
    "testing": {
      "framework": "<inferred test framework>",
      "types": ["unit", "integration"]
    },
    "license": "MIT",
    "features": ["<core feature 1>", "<core feature 2>"]
  },
  "progress_file": ".agents/job.state.json",
  "blueprint_file": "CONTEXT.md"
}

Step 2 — Generate project file tree
Use the init-project skill:
1. Universal structure: docs/, memory/, release/, .gitignore, README.md, LICENSE, IMPLEMENTATION_PLAN.md
2. Type-specific structure based on language/framework (Go, Python, Rust, Node.js, Java templates)
3. .claude/settings.json with basic permissions
4. Runnable entry files with Hello World + config + logger + lifecycle tracker
5. CI/CD config (e.g., .github/workflows/) if deployment type supports it

IMPORTANT: Do NOT skip project-metadata.json. It is REQUIRED for Phase 1 (architect).`,
    { schema: PHASE_RESULT, label: 'init-project', phase: 'Scaffold' }
  )

  if (result?.status === 'BLOCKED') {
    log('Phase 0 failed, retrying once...')
    result = await agent(
      `Retry: init-project scaffolding. Requirements: "${REQUIREMENTS}". Write project-metadata.json first. Previous attempt failed.`,
      { schema: PHASE_RESULT, label: 'init-project-retry', phase: 'Scaffold' }
    )
  }

  if (!result || result.status === 'BLOCKED') {
    markPhase(state, 'init', 'BLOCKED', { summary: 'init-project failed after retry' })
    throw new Error('Phase 0 (init-project) failed after 2 attempts. Cannot continue.')
  }

  // Ensure project-metadata.json exists after Phase 0
  ensureMetadataAfterInit()

  markPhase(state, 'init', result.status, result)
  state.checkpoint.next_action = 'start architect phase'
  writeState(state)
}

// ═══════════════════════════════════════════════════════════
//  Phase 1 — engineer-architect: 架构蓝图
// ═══════════════════════════════════════════════════════════
//  Input:  project-metadata.json (from Phase 0)
//  Output: CONTEXT.md (blueprint) + updated project-metadata.json + [frontend-spec.json]

phase('Architect')
if (!isDone(state, 'architect')) {
  const meta = getMetadata()
  const language = meta.project.language || 'unknown'
  const projectType = meta.project.type || 'unknown'
  const db = meta.project.database || 'not specified'
  const hasFrontend = meta.project.has_frontend === true
  const feFramework = meta.project.frontend_framework || 'react'
  const frontendNote = hasFrontend
    ? `Has frontend: true, Framework: ${feFramework}`
    : 'Has frontend: false (no frontend code needed)'

  let result = await agent(
    `You are engineer-job Phase 1: engineer-architect.

Requirements: "${REQUIREMENTS}"
Project name: "${PROJECT_NAME}"
Scaffold details — Language: ${language}, Type: ${projectType}, Database: ${db}
${frontendNote}
Mode: ${MODE}

=== TASK: Generate project blueprint ===

Read the project from the current directory (already scaffolded).
Read "project-metadata.json" for technical context.

Execute the architect skill:
1. Scan the existing scaffold structure
2. Converge requirements: domain glossary, tech stack decisions
3. Design data models, API contracts, milestones
4. Generate COMPLETE CONTEXT.md with all sections:
   - System overview, tech stack, architectural red lines
   - Domain glossary (core terms with English names)
   - Core data models (entities, fields, indexes)
   - API contracts (routes, requests, responses, errors)
   - Milestone plan (dependency-ordered, each with acceptance criteria)
   - Testing strategy (framework, types, coverage targets)
   - Documentation conventions
   - Database migration strategy
   - Deployment plan
   - Frontend design system IF has_frontend${hasFrontend ? ' (REQUIRED)' : ''}
5. Create ADRs for key decisions in docs/adr/
6. Commit the blueprint

${hasFrontend ? `=== FRONTEND: Generate Design System Spec ===

Since has_frontend=true, you MUST ALSO:

a) In CONTEXT.md, add a "Frontend Design System" section with:
   - Component architecture and directory structure
   - Styling approach (Tailwind / CSS Modules / styled-components)
   - Design tokens expressed as CSS variables (colors, typography, spacing)
   - API call pattern (React Query / SWR / fetch)
   - Page routes table with MVP markers
   - Component tree brief descriptions
   - Design principles (data-first, clear intent, restrained decoration)

b) Write "frontend-spec.json" with machine-readable design tokens:
{
  "framework": "${feFramework}",
  "styling": "tailwind-css",
  "has_typescript": true,
  "design_tokens": {
    "colors": { "primary": "#...", "secondary": "#...", "background": "#..." },
    "typography": { "heading": "Inter", "body": "Inter" },
    "spacing": { "sm": "8px", "md": "16px", "lg": "24px" }
  },
  "component_tree": [
    { "path": "components/ui/Button", "description": "..." }
  ],
  "pages": [
    { "route": "/", "component": "HomePage", "is_mvp": true }
  ],
  "api_pattern": { "client": "react-query", "base_url": "/api/v1" },
  "routing": "react-router-dom v6"
}

c) Add frontend milestones with type "frontend" after all backend milestones
d) Set project-metadata.json architect.frontend_direction.design_defined = true

See references/frontend-spec-guide.md for detailed spec format.` : `(No frontend needed — skip frontend design system section in CONTEXT.md)`
}

AFTER generating CONTEXT.md, UPDATE project-metadata.json:
- Add "architect" section with milestones list, glossary terms, and frontend direction
- Set blueprint_commit to the git hash of the CONTEXT.md commit

IMPORTANT: Each milestone must have a unique ID (M1, M2, M3...) and list dependencies clearly.`,
    { schema: PHASE_RESULT, label: 'engineer-architect', phase: 'Architect' }
  )

  if (result?.status === 'BLOCKED') {
    log('Phase 1 failed, retrying once...')
    result = await agent(
      `Retry: architect blueprint generation. Requirements: "${REQUIREMENTS}". If still blocked, generate a skeleton CONTEXT.md with minimal structure and mark as degraded.`,
      { schema: PHASE_RESULT, label: 'architect-retry', phase: 'Architect' }
    )
  }

  if (!result || result.status === 'BLOCKED') {
    log('Phase 1 degraded: generating skeleton blueprint')
    markPhase(state, 'architect', 'DONE_WITH_CONCERNS', {
      summary: 'Architect degraded — skeleton CONTEXT.md generated',
      changes: { files_created: 1, degraded: true },
    })
  } else {
    markPhase(state, 'architect', result.status, result)
  }

  state.checkpoint.next_action = 'start development phase'
  writeState(state)
}

// ═══════════════════════════════════════════════════════════
//  Phase 2 — engineer-orchestrator: 多功能编排开发
// ═══════════════════════════════════════════════════════════
//  Input:  CONTEXT.md + project-metadata.json
//  Output: .agents/progress.json + completed code

phase('Develop')
if (!isDone(state, 'development')) {
  const meta = getMetadata()
  const milestoneCount = meta.architect?.milestones?.length || 'multiple'

  const result = await agent(
    `You are engineer-job Phase 2: engineer-orchestrator.

Requirements: "${REQUIREMENTS}"
Project: "${PROJECT_NAME}"
Blueprint: CONTEXT.md (should exist from Phase 1)
Milestones to implement: ${milestoneCount}
Mode: ${MODE}

=== TASK: Orchestrate and execute multi-feature development ===

Read CONTEXT.md for the milestone DAG and technical specifications.
Read project-metadata.json for the milestone list, glossary, and frontend direction.
Read frontend-spec.json if it exists (may contain design tokens for frontend milestones).

Execute the orchestrator skill:
1. Parse milestone dependency DAG from CONTEXT.md
2. Create progress tracker at .agents/progress.json
3. Execute milestones IN DEPENDENCY ORDER:
   - For each milestone, call engineer-workflow (sub-agent)
   - Run code generation, test generation, and acceptance
   - After each milestone, run cross-feature integration check
   - Check: API compatibility, data model compatibility, terminology consistency
   - For frontend milestones: check design token compliance (colors, spacing)
   - Auto-recover: retry 1x then degrade scope then skip (mode-dependent)
4. Update CONTEXT.md after each milestone
5. Update project-metadata.json milestones status
6. Commit after each milestone

Return consolidated results with status per milestone.`,
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

// ═══════════════════════════════════════════════════════════
//  Phase 3 — Integration: 集成测试
// ═══════════════════════════════════════════════════════════
//  Non-blocking: records failures but allows continuation

phase('Integrate')
if (!isDone(state, 'finalize')) {
  const meta = getMetadata()
  const isServer = meta.project.type === 'api-server' || meta.project.type === 'web-app'

  const result = await agent(
    `You are engineer-job Phase 3: integration.

Project: "${PROJECT_NAME}"
Is server/web app: ${isServer}
Mode: ${MODE}

=== TASK: Run integration tests and production readiness check ===

1. Build/compile check — run the project build command
2. Run ALL tests — run the project test command
3. If server/web app: run production readiness checklist
   - Check: env vars documented, error handling consistent, logging configured
   - Read init-project/references/production-readiness.md if it exists
4. Document ALL failures
5. DO NOT block on failures — record and continue

Return structured results with pass/fail per check, and a list of any issues found.`,
    { schema: PHASE_RESULT, label: 'integration', phase: 'Integrate' }
  )

  markPhase(state, 'finalize', result?.status || 'DONE_WITH_CONCERNS', result || { summary: 'Integration skipped' })
  state.checkpoint.next_action = 'start deploy phase'
  writeState(state)
}

// ═══════════════════════════════════════════════════════════
//  Phase 4 — Deploy: 部署配置
// ═══════════════════════════════════════════════════════════
//  Non-blocking: generates config or records skip

phase('Deploy')
if (!isDone(state, 'deploy')) {
  const meta = getMetadata()
  const deployType = meta.project.deployment?.type || 'local'

  const result = await agent(
    `You are engineer-job Phase 4: deploy.

Project: "${PROJECT_NAME}"
Deployment type from metadata: ${deployType}
Mode: ${MODE}

=== TASK: Generate deployment configuration ===

Read CONTEXT.md "Deployment Plan" section for requirements.

1. Docker — if applicable: generate Dockerfile + .dockerignore
2. docker-compose — if multiple services: generate docker-compose.yml
3. CI/CD — if applicable: generate .github/workflows/deploy.yml
4. Environment — generate .env.example with all required env vars (no secrets)
5. Do NOT hardcode secrets — always use env var references like $VAR_NAME

If blueprint says "local only" or deploy type is "local": skip generation, report "deploy not needed".`,
    { schema: PHASE_RESULT, label: 'deploy-config', phase: 'Deploy' }
  )

  markPhase(state, 'deploy', result?.status || 'DONE_WITH_CONCERNS', result || { summary: 'Deploy config skipped' })
  state.checkpoint.next_action = 'start report phase'
  writeState(state)
}

// ═══════════════════════════════════════════════════════════
//  Phase 5 — Report: 最终报告
// ═══════════════════════════════════════════════════════════

phase('Report')
if (!isDone(state, 'report')) {
  const meta = getMetadata()
  const milestones = meta.architect?.milestones || []

  const result = await agent(
    `You are engineer-job Phase 5: reporting.

Project: "${PROJECT_NAME}"
Total milestones defined: ${milestones.length}
Mode: ${MODE}

=== TASK: Generate final project completion report ===

Read .agents/job.state.json for full phase status.
Read project-metadata.json for milestone definitions.
Read .agents/progress.json for feature-level results (if exists).

Generate a comprehensive markdown report covering:

1. OVERALL STATUS — summary per phase
2. MILESTONE TABLE — id, name, status, degraded?, rebuild count, tests
3. FILE CHANGES — total files created/modified
4. TEST RESULTS — total tests, passed, failed
5. DEPLOYMENT — what was generated
6. GLOSSARY AUDIT — total terms, any consistency issues
7. KNOWN ISSUES — skipped features, unresolved integration problems
8. DEGRADATION LOG — any milestones that were degraded/skipped
9. NEXT STEPS — recommended follow-up work

Output the report as markdown.`,
    { schema: PHASE_RESULT, label: 'final-report', phase: 'Report' }
  )

  markPhase(state, 'report', result?.status || 'DONE', result || { summary: 'Report generated' })
  state.checkpoint.next_action = 'all phases complete'
  writeState(state)
}

log('All 6 phases completed. Project build finished.')
log(`State file: ${STATE_PATH}`)
log(`Progress log: ${PROGRESS_PATH}`)
log(`Metadata file: ${METADATA_PATH}`)
