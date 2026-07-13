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
// File persistence (job.state.json, project-metadata.json, job.progress.md)
// is HANDLED BY THE SUB-AGENTS, not by this script.
// Each phase agent writes state files to disk for cross-session recovery.
// This script only orchestrates phases in memory.
//
// Key files (written by sub-agents):
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

const MODE = args.mode || 'normal'
const REQUIREMENTS = args.requirements || ''
const PROJECT_NAME = args.projectName || 'unnamed-project'

// ── Phase Result Schema ──────────────────────────────────

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
    // recovery field — returned by Phase 0 when existing state is found
    recovery: {
      type: 'object',
      properties: {
        found: { type: 'boolean' },
        last_phase: { type: 'string' },
        phases_done: { type: 'array', items: { type: 'string' } },
        session_summary: { type: 'string' },
      },
    },
    // report field — returned by Phase 5 with final report text
    report: { type: 'string' },
  },
  required: ['status', 'summary'],
  additionalProperties: true,
}

// ── Helpers ──────────────────────────────────────────────

// Build a Phase context string shared with every agent prompt
function ctx(phase, extra = '') {
  const lines = [
    `Project: "${PROJECT_NAME}"`,
    `Mode: ${MODE}`,
    `Requirements: "${REQUIREMENTS}"`,
    `Phase: ${phase}`,
  ]
  if (extra) lines.push('', extra)
  return lines.join('\n')
}

// ── Phase Tracking (in-memory only — agents persist to disk) ──

const phasesDone = new Set()

function isDone(phase) {
  return phasesDone.has(phase)
}

// ═══════════════════════════════════════════════════════════
//  Phase 0 — init-project: recovery check + project scaffold
// ═══════════════════════════════════════════════════════════
//  Detects existing state first (cross-session recovery).
//  Then scaffolds a fresh project or recovers.

phase('Scaffold')
if (!isDone('init')) {
  log(`Phase 0: init-project — checking state & scaffolding`)

  let result = await agent(
    ctx('init-project', `=== ACT AS RECOVERY CHECKER + INIT-PROJECT ===

You have TWO possible entry points. Determine which one applies.

--- ENTRY A: RECOVERY (if job.state.json exists) ---

Check if the file ".agents/job.state.json" exists in the current directory.
  • If YES: Read and parse it. Return IMMEDIATELY with:
    { status: "DONE", summary: "Recovered from job.state.json",
      recovery: { found: true, last_phase: "<last_phase value>", phases_done: [<all phases with DONE status>], session_summary: "<checkpoint.session_summary>" } }
    DO NOT re-scaffold anything.

--- ENTRY B: FRESH PROJECT (if job.state.json does NOT exist) ---

If the state file does NOT exist, start a fresh project:

Step 1 — Write project-metadata.json
Write this file to disk BEFORE generating any project files:
{
  "project": {
    "name": "${PROJECT_NAME}",
    "description": "<one-line summary of requirements>",
    "type": "<api-server | cli-tool | library | web-app | desktop-app | mobile-app | other>",
    "language": "<inferred language>",
    "framework": "<inferred framework>",
    "package_manager": "<pip | cargo | npm | go-mod | maven | ...>",
    "database": "<inferred db or null>",
    "has_frontend": <true | false>,
    "frontend_framework": "<inferred or null>",
    "deployment": { "type": "<local | docker | serverless | cloud-vm>", "ci_cd": "<github-actions | gitlab-ci | manual | none>", "docker": <true | false> },
    "testing": { "framework": "<inferred>", "types": ["unit", "integration"] },
    "license": "MIT",
    "features": ["<feature 1>", "<feature 2>"]
  },
  "progress_file": ".agents/job.state.json",
  "blueprint_file": "CONTEXT.md"
}

Step 2 — Generate project file tree
Use the init-project skill conventions:
  a) Universal structure: docs/, memory/, release/, .gitignore, README.md, LICENSE
  b) Type-specific structure based on language/framework
  c) .claude/settings.json with basic permissions
  d) Runnable entry files with config + logger + lifecycle tracker
  e) CI/CD config if deployment type supports it

Step 3 — Write .agents/job.state.json
Create the .agents/ directory and write job.state.json:
{
  "project": "${PROJECT_NAME}",
  "job_version": "2.0",
  "mode": "${MODE}",
  "phases": { "init": { "status": "DONE" }, "architect": { "status": "TODO" }, "development": { "status": "TODO" }, "finalize": { "status": "TODO" }, "deploy": { "status": "TODO" }, "report": { "status": "TODO" } },
  "checkpoint": { "last_phase": "init", "next_action": "start architect phase", "session_summary": "Project scaffolded" }
}

Step 4 — Write .agents/job.progress.md
Create an append-only progress log with the initial entry.

IMPORTANT: project-metadata.json and job.state.json are REQUIRED for subsequent phases.
Write them to disk as actual files.`),
    { schema: PHASE_RESULT, label: 'init-project', phase: 'Scaffold' }
  )

  // Handle recovery: skip completed phases
  if (result?.recovery?.found && Array.isArray(result.recovery.phases_done)) {
    result.recovery.phases_done.forEach(p => {
      if (p) phasesDone.add(p)
    })
    log(`Recovered from state — phases done: ${[...phasesDone].filter(Boolean).join(', ') || 'none'}`)
    log(`Current phase: ${result.recovery.last_phase || 'unknown'}`)
  } else if (result?.status === 'BLOCKED') {
    // Retry once
    log('Phase 0 failed, retrying once...')
    result = await agent(
      `Retry: init-project scaffolding. Requirements: "${REQUIREMENTS}". Write project-metadata.json first. Previous attempt failed.`,
      { schema: PHASE_RESULT, label: 'init-project-retry', phase: 'Scaffold' }
    )
  }

  if (!result || result.status === 'BLOCKED') {
    throw new Error('Phase 0 (init-project) failed after 2 attempts. Cannot continue.')
  }

  // Mark init as done (if not already recovered)
  if (!result.recovery?.found) {
    phasesDone.add('init')
    log('Phase 0 complete: project scaffolded')
  }
}

// ═══════════════════════════════════════════════════════════
//  Phase 1 — engineer-architect: 架构蓝图
// ═══════════════════════════════════════════════════════════
//  Input:  project-metadata.json (on disk, from Phase 0)
//  Output: CONTEXT.md (blueprint) + updated project-metadata.json + [frontend-spec.json]

phase('Architect')
if (!isDone('architect')) {
  log('Phase 1: engineer-architect — generating blueprint')

  let result = await agent(
    ctx('engineer-architect', `=== GENERATE PROJECT BLUEPRINT ===

Read "project-metadata.json" from disk for technical context.
Read the existing project file tree.

Generate a complete CONTEXT.md blueprint:
1. System overview, tech stack, architectural red lines
2. Domain glossary (core terms with English names)
3. Core data models (entities, fields, indexes)
4. API contracts (routes, requests, responses, errors)
5. Milestone plan (dependency-ordered, each with acceptance criteria)
6. Testing strategy (framework, types, coverage targets)
7. Deployment plan

Read the project-metadata.json has_frontend field. If true, also generate:
- Frontend Design System section in CONTEXT.md
- frontend-spec.json with design tokens

AFTER generating CONTEXT.md, UPDATE project-metadata.json:
- Add "architect" section with milestones list, glossary terms, and frontend direction
- Set blueprint_commit to the git hash of the CONTEXT.md commit

UPDATE .agents/job.state.json:
- Set architect phase status to "DONE"
- Update checkpoint.last_phase to "architect"
- Update checkpoint.next_action to "start development phase"

APPEND to .agents/job.progress.md with the architect completion summary.

Return structured result with progress details.`),
    { schema: PHASE_RESULT, label: 'engineer-architect', phase: 'Architect' }
  )

  if (result?.status === 'BLOCKED') {
    log('Phase 1 failed, retrying once...')
    result = await agent(
      `Retry: architect blueprint. Requirements: "${REQUIREMENTS}". If still blocked, generate a skeleton CONTEXT.md with minimal structure and mark degraded.`,
      { schema: PHASE_RESULT, label: 'architect-retry', phase: 'Architect' }
    )
  }

  if (!result || result.status === 'BLOCKED') {
    // Degrade: generate skeleton blueprint
    await agent(
      `Generate a minimal skeleton CONTEXT.md and update job.state.json with architect as DONE_WITH_CONCERNS. This is a degraded fallback.`,
      { schema: PHASE_RESULT, label: 'architect-degrade', phase: 'Architect' }
    )
    log('Phase 1 degraded: skeleton blueprint generated')
  } else {
    log('Phase 1 complete: blueprint generated')
  }

  phasesDone.add('architect')
}

// ═══════════════════════════════════════════════════════════
//  Phase 2 — engineer-orchestrator: 多功能编排开发
//  Input:  CONTEXT.md + project-metadata.json (on disk)
//  Output: .agents/progress.json + completed code

phase('Develop')
if (!isDone('development')) {
  log('Phase 2: engineer-orchestrator — multi-feature development')

  const result = await agent(
    ctx('engineer-orchestrator', `=== ORCHESTRATE AND EXECUTE MULTI-FEATURE DEVELOPMENT ===

Read CONTEXT.md for the milestone DAG and technical specifications.
Read project-metadata.json for the milestone list, glossary, and frontend direction.
Read frontend-spec.json if it exists (may contain design tokens).

Execute the orchestrator skill:
1. Parse milestone dependency DAG from CONTEXT.md
2. Create progress tracker at .agents/progress.json
3. Execute milestones IN DEPENDENCY ORDER:
   - For each milestone, call engineer-workflow (sub-agent via Agent tool)
   - Run code generation, test generation, and acceptance
   - After each milestone, run cross-feature integration check
   - For frontend milestones: check design token compliance
   - Auto-recover: retry 1x then degrade scope then skip (mode-dependent)
4. Update CONTEXT.md after each milestone
5. Update project-metadata.json milestones status
6. Write .agents/job.state.json development section after each milestone
7. Append to .agents/job.progress.md after each milestone
8. Commit after each milestone

Return consolidated results with status per milestone.`),
    { schema: PHASE_RESULT, label: 'engineer-orchestrator', phase: 'Develop' }
  )

  if (!result || result.status === 'BLOCKED') {
    log('Phase 2 partially completed — recording what was done')
  } else {
    log('Phase 2 complete: development finished')
  }

  phasesDone.add('development')
}

// ═══════════════════════════════════════════════════════════
//  Phase 3 — Integration: 集成测试 (non-blocking)

phase('Integrate')
if (!isDone('finalize')) {
  log('Phase 3: integration testing')

  const result = await agent(
    ctx('integration', `=== RUN INTEGRATION TESTS ===

Read project-metadata.json for project type and testing config.

1. Build/compile check — run the project build command
2. Run ALL tests — run the project test command
3. If server/web app: run production readiness checklist
4. Document ALL failures
5. DO NOT block on failures — record and continue

UPDATE job.state.json finalize phase status.
APPEND to job.progress.md.

Return structured results with pass/fail per check, and any issues.`),
    { schema: PHASE_RESULT, label: 'integration', phase: 'Integrate' }
  )

  log(`Integration: ${result?.summary || 'completed with concerns'}`)
  phasesDone.add('finalize')
}

// ═══════════════════════════════════════════════════════════
//  Phase 4 — Deploy: 部署配置 (non-blocking)

phase('Deploy')
if (!isDone('deploy')) {
  log('Phase 4: deployment configuration')

  const result = await agent(
    ctx('deploy', `=== GENERATE DEPLOYMENT CONFIG ===

Read CONTEXT.md "Deployment Plan" section.
Read project-metadata.json for deployment type.

1. Docker — if applicable: generate Dockerfile + .dockerignore
2. docker-compose — if multiple services
3. CI/CD — if applicable: generate .github/workflows/deploy.yml
4. Environment — generate .env.example with all required env vars

If blueprint says "local only": skip generation, report "deploy not needed".

UPDATE job.state.json deploy phase status.
APPEND to job.progress.md.`),
    { schema: PHASE_RESULT, label: 'deploy-config', phase: 'Deploy' }
  )

  log(`Deploy: ${result?.summary || 'skipped or completed'}`)
  phasesDone.add('deploy')
}

// ═══════════════════════════════════════════════════════════
//  Phase 5 — Report: 最终报告

phase('Report')
if (!isDone('report')) {
  log('Phase 5: generating final report')

  const result = await agent(
    ctx('report', `=== GENERATE FINAL REPORT ===

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

Return the report text in the "report" field of the result.`),
    { schema: PHASE_RESULT, label: 'final-report', phase: 'Report' }
  )

  log(`Final report: ${result?.summary || 'generated'}`)
  phasesDone.add('report')

  // If report text was returned, show it
  if (result?.report) {
    log('--- FINAL REPORT ---')
    log(result.report)
  }
}

// ═══════════════════════════════════════════════════════════
//  Completion

log('All 6 phases completed. Project build finished.')
log(`Mode: ${MODE}`)
log(`Phases completed: ${[...phasesDone].filter(Boolean).join(', ')}`)
