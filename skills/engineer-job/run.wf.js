export const meta = {
  name: 'engineer-job-run',
  description: 'AI Project Auto-Build Engine — 8-phase orchestration. Scaffolds, analyzes requirements, architects, designs frontend, develops, integrates, deploys, and reports.',
  phases: [
    { title: 'Scaffold', detail: 'init-project scaffolding + project-metadata.json' },
    { title: 'Requirements', detail: 'engineer-requirements deep requirement decomposition' },
    { title: 'Architect', detail: 'engineer-architect blueprint design with architecture patterns' },
    { title: 'Frontend', detail: 'engineer-frontend-architect frontend design' },
    { title: 'Develop', detail: 'engineer-orchestrator multi-feature development' },
    { title: 'Integrate', detail: 'integration testing & production readiness' },
    { title: 'Deploy', detail: 'deployment configuration generation' },
    { title: 'Report', detail: 'final report generation' },
  ],
}

// ═══════════════════════════════════════════════════════════
//  Pure helpers — mirrored from references/detection-logic.js — keep in sync
//  (Workflow 沙箱禁止 require/import；此处内联。单测守护单一真源。)
// ═══════════════════════════════════════════════════════════

const FRONTEND_SIGNALS = [
  '前端', '界面', '页面', 'ui', 'web app', 'web-app', '小程序', '移动端',
  'dashboard', '仪表盘', '后台管理', '管理后台', 'react', 'vue', 'next.js',
  'nextjs', 'frontend', '网页', '网站',
]
const NO_FRONTEND_SIGNALS = [
  'cli', '命令行', 'library', '库', 'sdk', '脚本', '纯后端', 'api only',
  '纯 api', 'backend only', 'fastapi', 'flask', 'django', 'express', 'spring',
  'gin', 'echo', 'actix', 'rest api', 'api 服务', 'api-server', 'api server',
  '后端接口',
]
const COMPLEX_SIGNALS = [
  '多端', '多模块', '多个角色', '审批', '工作流', 'saas', '多租户',
  '事件驱动', 'bff', '微服务', '跨模块', '多机构', '分销', '权限体系',
]
const SIMPLE_SIGNALS = [
  'crud', '简单', '单个', '工具', '计算器', 'todo', '待办', '脚本',
  '小工具', '单功能', 'single', 'simple', 'library', '库',
]

function detectComplexity(req) {
  const text = String(req || '').toLowerCase()
  const hit = (arr) => arr.some((k) => text.includes(k))
  let has_frontend, fe_reason
  if (hit(NO_FRONTEND_SIGNALS)) { has_frontend = false; fe_reason = '命中无前端信号词' }
  else if (hit(FRONTEND_SIGNALS)) { has_frontend = true; fe_reason = '命中前端信号词' }
  else { has_frontend = true; fe_reason = '无明确信号，保守按含前端处理' }
  let skip_requirements, req_reason
  if (hit(COMPLEX_SIGNALS)) { skip_requirements = false; req_reason = '命中复杂信号词，保留需求分析' }
  else if (hit(SIMPLE_SIGNALS)) { skip_requirements = true; req_reason = '命中简单信号词，跳过需求分析' }
  else { skip_requirements = false; req_reason = '无明确信号，保留需求分析（安全默认）' }
  const skip_frontend = !has_frontend
  let detected_complexity
  if (hit(COMPLEX_SIGNALS)) detected_complexity = 'complex'
  else if (hit(SIMPLE_SIGNALS)) detected_complexity = 'simple'
  else detected_complexity = 'moderate'
  return { detected_complexity, has_frontend, skip_requirements, skip_frontend, complexity_reasoning: `${fe_reason}; ${req_reason}` }
}

function topoSort(milestones) {
  const ids = milestones.map((m) => m.id)
  const idSet = new Set(ids)
  for (const m of milestones) {
    for (const d of m.deps || []) {
      if (!idSet.has(d)) throw new Error(`milestone ${m.id} depends on unknown ${d}`)
    }
  }
  const indeg = {}; const adj = {}
  ids.forEach((id) => { indeg[id] = 0; adj[id] = [] })
  for (const m of milestones) {
    for (const d of m.deps || []) { adj[d].push(m.id); indeg[m.id]++ }
  }
  const queue = ids.filter((id) => indeg[id] === 0)
  const order = []
  while (queue.length) {
    const id = queue.shift(); order.push(id)
    for (const next of adj[id]) { indeg[next]--; if (indeg[next] === 0) queue.push(next) }
  }
  if (order.length !== ids.length) throw new Error('cycle detected in milestone dependency graph')
  return order
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
//   REQUIREMENTS.md                  — requirements analysis (requirements phase)
//   FRONTEND-DESIGN.md               — frontend architecture design (frontend phase)
//   frontend-spec.json               — frontend design tokens (if has_frontend)
//   .agents/progress.json            — orchestrator progress tracker
//
// Protocol flow:
//   init-project  ──►  project-metadata.json  ──►  engineer-requirements
//   engineer-requirements  ──►  REQUIREMENTS.md  ──►  engineer-architect
//   engineer-architect  ──►  CONTEXT.md  ──►  engineer-frontend-architect
//   engineer-frontend-architect  ──►  FRONTEND-DESIGN.md  ──►  engineer-orchestrator
//   engineer-orchestrator  ──►  .agents/progress.json  ──►  engineer-workflow × N
//
// ═══════════════════════════════════════════════════════════

// ── Complexity Detection (Component 2) ───────────────────
// 启发式检测；显式 args.skip_* 永远优先。

const detected = detectComplexity(REQUIREMENTS)
const skip_requirements = args.skip_requirements != null ? !!args.skip_requirements : detected.skip_requirements
const skip_frontend = args.skip_frontend != null ? !!args.skip_frontend : detected.skip_frontend
const isSimpleProject = skip_requirements || skip_frontend

log(`Complexity: ${detected.detected_complexity} | has_frontend=${detected.has_frontend} | skip_requirements=${skip_requirements} | skip_frontend=${skip_frontend} (${detected.complexity_reasoning})`)

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
    // report field — returned by Phase 7 with final report text
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
    "detected_complexity": "${detected.detected_complexity}",
    "has_frontend": ${detected.has_frontend},
    "skip_requirements": ${skip_requirements},
    "skip_frontend": ${skip_frontend},
    "complexity_reasoning": "${detected.complexity_reasoning}",
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
  "phases": { "init": { "status": "DONE" }, "requirements": { "status": "TODO" }, "architect": { "status": "TODO" }, "frontend": { "status": "TODO" }, "development": { "status": "TODO" }, "finalize": { "status": "TODO" }, "deploy": { "status": "TODO" }, "report": { "status": "TODO" } },
  "checkpoint": { "last_phase": "init", "next_action": "start requirements phase", "session_summary": "Project scaffolded" }
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
//  Phase 1 — engineer-requirements: 需求深度拆解
//  Input:  project-metadata.json (on disk, from Phase 0)
//  Output: REQUIREMENTS.md (需求分析文档)
// ═══════════════════════════════════════════════════════════

phase('Requirements')
if (!isDone('requirements') && !skip_requirements) {
  log('Phase 1: engineer-requirements — deep requirement decomposition')

  let result = await agent(
    ctx('engineer-requirements', `=== DEEP REQUIREMENT DECOMPOSITION ===

Read "project-metadata.json" from disk for project context.

Execute the engineer-requirements process:
1. Identify all user roles and their core journeys
2. Run event storming — identify key business events
3. Decompose into bounded contexts / modules
4. Build full feature inventory with CRUD matrix
5. Create feature dependency DAG
6. Define state machines for key business objects
7. Write acceptance criteria for each feature

Output: Write REQUIREMENTS.md to project root with ALL sections filled.
Update .agents/job.state.json requirements phase to DONE.
Append to .agents/job.progress.md.

Return structured result with summary.`),
    { schema: PHASE_RESULT, label: 'engineer-requirements', phase: 'Requirements' }
  )

  if (result?.status === 'BLOCKED') {
    log('Phase 1 failed, retrying once...')
    result = await agent(
      `Retry: requirements decomposition. Requirements: "${REQUIREMENTS}". Generate a minimal REQUIREMENTS.md with at least role definitions and feature list.`,
      { schema: PHASE_RESULT, label: 'requirements-retry', phase: 'Requirements' }
    )
  }

  if (!result || result.status === 'BLOCKED') {
    // Degrade: generate minimal requirements
    await agent(
      `Generate a minimal REQUIREMENTS.md with role definitions and basic feature list extracted from: "${REQUIREMENTS}". Update job.state.json requirements as DONE_WITH_CONCERNS.`,
      { schema: PHASE_RESULT, label: 'requirements-degrade', phase: 'Requirements' }
    )
    log('Phase 1 degraded: minimal requirements generated')
  } else {
    log('Phase 1 complete: REQUIREMENTS.md generated')
  }

  phasesDone.add('requirements')
} else if (skip_requirements) {
  log('Phase 1 skipped (simple project)')
}

// ═══════════════════════════════════════════════════════════
//  Phase 2 — engineer-architect: 架构蓝图（改进版）
//  Input:  project-metadata.json + REQUIREMENTS.md (on disk)
//  Output: CONTEXT.md (含架构模式 + 部署架构)
// ═══════════════════════════════════════════════════════════

phase('Architect')
if (!isDone('architect')) {
  log('Phase 2: engineer-architect — generating blueprint')

  let result = await agent(
    ctx('engineer-architect', `=== GENERATE PROJECT BLUEPRINT ===

Read "project-metadata.json" from disk for technical context.
Read "REQUIREMENTS.md" from disk if it exists (for feature definitions, state machines, role journeys).
Read the existing project file tree.

Generate a complete CONTEXT.md blueprint:
1. System overview, tech stack, architectural red lines
2. Architecture pattern decisions (BFF / Event-Driven / CQRS / Multi-Tenancy / DDD)
   — Reference enterprise-architecture-patterns.md for pattern details
3. Deployment architecture topology diagram
4. Domain glossary (core terms with English names)
5. Core data models (entities, fields, indexes)
6. API contracts (routes, requests, responses, errors)
7. Milestone plan (dependency-ordered, backend and frontend milestones CAN be parallel)
8. Testing strategy, docs convention, deployment plan

Read project-metadata.json has_frontend field. If true, also generate:
- Frontend Design Direction section in CONTEXT.md
- frontend-spec.json with basic design tokens

AFTER generating CONTEXT.md, UPDATE project-metadata.json with architect results.
UPDATE .agents/job.state.json architect phase to "DONE".
APPEND to .agents/job.progress.md.`),
    { schema: PHASE_RESULT, label: 'engineer-architect', phase: 'Architect' }
  )

  if (result?.status === 'BLOCKED') {
    log('Phase 2 failed, retrying once...')
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
    log('Phase 2 degraded: skeleton blueprint generated')
  } else {
    log('Phase 2 complete: blueprint generated')
  }

  phasesDone.add('architect')
}

// ═══════════════════════════════════════════════════════════
//  Phase 3 — engineer-frontend-architect: 前端详细设计
//  Input:  CONTEXT.md (on disk, from Phase 2)
//  Output: FRONTEND-DESIGN.md (前端设计文档)
// ═══════════════════════════════════════════════════════════

phase('Frontend')
// Phase 3 runs by default for non-simple projects.
// The sub-agent reads CONTEXT.md and detects has_frontend on its own.
// If no frontend, it generates a minimal FRONTEND-DESIGN.md noting no frontend needed.
// Skip via isSimpleProject (passed through args) or explicit args.skip_frontend.

if (!isDone('frontend') && !skip_frontend) {
  log('Phase 3: engineer-frontend-architect — frontend design')

  let result = await agent(
    ctx('engineer-frontend-architect', `=== FRONTEND ARCHITECTURE DESIGN ===

Read "CONTEXT.md" from disk for system architecture, tech stack, and frontend direction.
Read "REQUIREMENTS.md" from disk if it exists (for user roles and journeys).

Execute the engineer-frontend-architect process:
1. Portal scope analysis — identify all frontend portals, their tech stacks, devices, users
2. Design token system — shared tokens + portal-specific tokens (colors, fonts, spacing)
3. Page tree & routes — complete page tree per portal with route paths
4. Component hierarchy — UI components → feature components → page components
5. State architecture — global vs local vs server state boundaries
6. UI state machines — loading, empty, error, edge cases for every core page
7. API interaction patterns — data fetching strategy per page
8. Page-level design summary — one-liner per core page

Output: Write FRONTEND-DESIGN.md to project root with ALL sections filled.
Update .agents/job.state.json frontend phase to DONE.
Append to .agents/job.progress.md.

Return structured result.`),
    { schema: PHASE_RESULT, label: 'engineer-frontend-architect', phase: 'Frontend' }
  )

  if (result?.status === 'BLOCKED') {
    log('Phase 3 failed, retrying once...')
    result = await agent(
      `Retry: frontend design. Generate at minimum a FRONTEND-DESIGN.md with portal scope, page tree, and design token system.`,
      { schema: PHASE_RESULT, label: 'frontend-retry', phase: 'Frontend' }
    )
  }

  if (!result || result.status === 'BLOCKED') {
    await agent(
      `Generate minimal FRONTEND-DESIGN.md with portal definitions and page tree. Mark as degraded.`,
      { schema: PHASE_RESULT, label: 'frontend-degrade', phase: 'Frontend' }
    )
    log('Phase 3 degraded: minimal frontend design generated')
  } else {
    log('Phase 3 complete: FRONTEND-DESIGN.md generated')
  }

  phasesDone.add('frontend')
} else {
  log('Phase 3 skipped (no frontend or simple project)')
}

// ═══════════════════════════════════════════════════════════
//  Phase 4 — engineer-orchestrator: 多功能编排开发（增强版）
//  Input:  CONTEXT.md + FRONTEND-DESIGN.md + project-metadata.json (on disk)
//  Output: .agents/progress.json + completed code

phase('Develop')
if (!isDone('development')) {
  log('Phase 4: engineer-orchestrator — multi-feature development')

  const result = await agent(
    ctx('engineer-orchestrator', `=== ORCHESTRATE AND EXECUTE MULTI-FEATURE DEVELOPMENT ===

Read CONTEXT.md for the milestone DAG and technical specifications.
Read project-metadata.json for the milestone list, glossary, and frontend direction.
Read frontend-spec.json if it exists (may contain design tokens).
Read FRONTEND-DESIGN.md if it exists (for frontend milestone definitions, components, state machines).

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
    log('Phase 4 partially completed — recording what was done')
  } else {
    log('Phase 4 complete: development finished')
  }

  phasesDone.add('development')
}

// ═══════════════════════════════════════════════════════════
//  Phase 5 — Integration: 集成测试 (non-blocking)

phase('Integrate')
if (!isDone('finalize')) {
  log('Phase 5: integration testing')

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
//  Phase 6 — Deploy: 部署配置 (non-blocking)

phase('Deploy')
if (!isDone('deploy')) {
  log('Phase 6: deployment configuration')

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
//  Phase 7 — Report: 最终报告

phase('Report')
if (!isDone('report')) {
  log('Phase 7: generating final report')

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

log(`All ${isSimpleProject ? '6' : '8'} phases completed. Project build finished.`)
log(`Mode: ${MODE}`)
log(`Phases completed: ${[...phasesDone].filter(Boolean).join(', ')}`)
