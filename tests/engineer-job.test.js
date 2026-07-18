const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SKILL_DIR = path.join(__dirname, '..', 'skills');

function findSkillFiles() {
  const skills = [];
  const entries = fs.readdirSync(SKILL_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillFile = path.join(SKILL_DIR, entry.name, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        skills.push({ name: entry.name, path: skillFile });
      }
    }
  }
  return skills;
}

function readFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) frontmatter[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '');
  }
  return { frontmatter, content };
}

describe('skills', () => {
  const skills = findSkillFiles();

  describe('all skills', () => {
    for (const skill of skills) {
      it(`${skill.name} has valid SKILL.md with frontmatter`, () => {
        const parsed = readFrontmatter(skill.path);
        assert.ok(parsed, `${skill.name}/SKILL.md has no valid frontmatter`);
        assert.ok(parsed.frontmatter.name, `${skill.name} has no name`);
        assert.ok(parsed.frontmatter.description, `${skill.name} has no description`);
        assert.ok(parsed.frontmatter.compatibility, `${skill.name} has no compatibility`);
      });

      it(`${skill.name} has compatibility listed`, () => {
        const parsed = readFrontmatter(skill.path);
        const compat = parsed.frontmatter.compatibility;
        assert.ok(compat, `${skill.name} must define compatibility`);
        // Engineer skills should include bash or agent. RC/philosophy skills use read-only tools.
        if (skill.name.startsWith('engineer-') || skill.name.startsWith('init-')) {
          assert.ok(compat.includes('bash') || compat.includes('agent'),
            `${skill.name} compatibility should include 'bash' or 'agent'`);
        }
      });
    }
  });

  describe('engineer-job', () => {
    const skillFile = path.join(SKILL_DIR, 'engineer-job', 'SKILL.md');

    it('exists', () => {
      assert.ok(fs.existsSync(skillFile), 'engineer-job/SKILL.md should exist');
    });

    it('has mode selection section', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('## ⚙️ 模式选择'), 'should have mode selection section');
      assert.ok(content.includes('normal'), 'should mention normal mode');
      assert.ok(content.includes('auto'), 'should mention auto mode');
      assert.ok(content.includes('silent'), 'should mention silent mode');
    });

    it('has 6-phase orchestration flow', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('Phase 0') || content.includes('init'), 'should mention phase 0 (init)');
      assert.ok(content.includes('Phase 1') || content.includes('architect'), 'should mention phase 1');
      assert.ok(content.includes('Phase 2') || content.includes('orchestrat'), 'should mention phase 2');
    });

    it('has subagent dispatch pattern', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('子代理') || content.includes('subagent') || content.includes('Agent'),
        'should mention subagent dispatch');
    });

    it('has cross-session recovery flow', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('恢复') || content.includes('recovery'),
        'should mention recovery flow');
    });

    it('has self-healing section', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('自愈') || content.includes('self-heal'),
        'should mention self-healing');
    });

    it('has job.state.json schema', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('job.state.json'), 'should document job.state.json schema');
    });

    it('has trigger conditions for project building', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('TRIGGERS'), 'should have TRIGGERS in frontmatter');
      assert.ok(content.includes('帮我从零') || content.includes('from scratch'),
        'should list project-building trigger phrases');
    });
  });

  describe('mode support across skills', () => {
    const skillsThatNeedMode = [
      'init-project', 'engineer-architect', 'engineer-orchestrator',
      'engineer-workflow', 'engineer-inspector', 'engineer-qa',
    ];

    for (const skillName of skillsThatNeedMode) {
      it(`${skillName} has mode selection section`, () => {
        const skillFile = path.join(SKILL_DIR, skillName, 'SKILL.md');
        if (!fs.existsSync(skillFile)) return; // skip if skill not installed

        const content = fs.readFileSync(skillFile, 'utf-8');
        assert.ok(content.includes('## ⚙️ 模式选择'),
          `${skillName} should have '## ⚙️ 模式选择' section`);
        assert.ok(content.includes('auto'), `${skillName} mode section should mention auto`);
        assert.ok(content.includes('silent'), `${skillName} mode section should mention silent`);
      });
    }
  });

  describe('engineer-qa', () => {
    const skillFile = path.join(SKILL_DIR, 'engineer-qa', 'SKILL.md');

    it('exists with valid frontmatter', () => {
      assert.ok(fs.existsSync(skillFile), 'engineer-qa/SKILL.md should exist');
      const parsed = readFrontmatter(skillFile);
      assert.ok(parsed.frontmatter.name === 'engineer-qa', 'name must be engineer-qa');
      assert.ok(/bash|agent/.test(parsed.frontmatter.compatibility), 'compat needs bash/agent');
    });

    it('has mode selection section', () => {
      const c = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(c.includes('## ⚙️ 模式选择'), 'should have mode section');
      assert.ok(c.includes('normal') && c.includes('auto') && c.includes('silent'));
    });

    it('defines the four-stage QA lifecycle', () => {
      const c = fs.readFileSync(skillFile, 'utf-8');
      for (const stage of ['静态盘点', '单元层', '集成层', 'E2E']) {
        assert.ok(c.includes(stage), `should describe stage ${stage}`);
      }
    });

    it('enforces 90% diff branch coverage + global ratchet', () => {
      const c = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(c.includes('90'), 'should state the 90% bar');
      assert.ok(c.includes('分支覆盖'), 'should require branch coverage');
      assert.ok(c.includes('qa-baseline.json'), 'should use the ratchet baseline file');
    });

    it('uses agent-browser for E2E with non-UI degradation', () => {
      const c = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(c.includes('agent-browser'), 'should drive E2E via agent-browser');
      assert.ok(c.includes('降级') || c.includes('跳过'), 'should degrade for non-UI');
    });

    it('uses the three-state verdict', () => {
      const c = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(c.includes('PASS') && c.includes('NEEDS_FIX') && c.includes('REBUILD'));
    });

    it('ships reference files', () => {
      const ref = path.join(SKILL_DIR, 'engineer-qa', 'references');
      for (const f of ['coverage-tools.md', 'e2e-playbook.md', 'qa-report-template.md']) {
        assert.ok(fs.existsSync(path.join(ref, f)), `missing references/${f}`);
      }
      const cov = fs.readFileSync(path.join(ref, 'coverage-tools.md'), 'utf-8');
      assert.ok(cov.includes('--cov-branch') || cov.includes('branch'),
        'coverage-tools must document branch coverage');
      const e2e = fs.readFileSync(path.join(ref, 'e2e-playbook.md'), 'utf-8');
      assert.ok(e2e.includes('agent-browser'), 'e2e-playbook must reference agent-browser');
    });
  });

  describe('engineer-orchestrator persistence', () => {
    const skillFile = path.join(SKILL_DIR, 'engineer-orchestrator', 'SKILL.md');

    it('has job.state.json persistence section', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('job.state.json'),
        'engineer-orchestrator should document job.state.json');
    });

    it('has cross-session recovery flow', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('恢复流程') || content.includes('recovery'),
        'engineer-orchestrator should document recovery flow');
    });
  });

  describe('engineer-job run.wf.js workflow script', () => {
    const wfFile = path.join(SKILL_DIR, 'engineer-job', 'run.wf.js');

    it('exists', () => {
      assert.ok(fs.existsSync(wfFile), 'engineer-job/run.wf.js should exist');
    });

    it('has no require("fs") calls', () => {
      const content = fs.readFileSync(wfFile, 'utf-8');
      // File I/O is delegated to sub-agents, not done in the workflow script
      assert.ok(!content.includes("require('fs')"), 'run.wf.js must not use require("fs")');
      assert.ok(!content.includes('require("fs")'), 'run.wf.js must not use require("fs")');
    });

    it('has no argless new Date() calls', () => {
      const content = fs.readFileSync(wfFile, 'utf-8');
      // new Date() without args throws in workflow scripts; use args.startedAt or counters instead
      // Allow new Date(someArg) but not bare new Date() — check via regex
      const matches = content.match(/new Date\(\)/g);
      assert.ok(!matches, 'run.wf.js must not call new Date() without arguments');
    });

    it('contains the meta export block with 6 phases', () => {
      const content = fs.readFileSync(wfFile, 'utf-8');
      assert.ok(content.includes('export const meta = {'), 'should export meta');
      assert.ok(content.includes("name: 'engineer-job-run'"), 'should have correct name');
      assert.ok(content.includes("'Scaffold'"), 'should have Scaffold phase');
      assert.ok(content.includes("'Architect'"), 'should have Architect phase');
      assert.ok(content.includes("'Develop'"), 'should have Develop phase');
      assert.ok(content.includes("'Integrate'"), 'should have Integrate phase');
      assert.ok(content.includes("'Deploy'"), 'should have Deploy phase');
      assert.ok(content.includes("'Report'"), 'should have Report phase');
    });

    it('has a POC phase with skip/stop switches wired to engineer-poc', () => {
      const content = fs.readFileSync(wfFile, 'utf-8');
      assert.ok(content.includes("'POC'"), 'meta should include the POC phase');
      assert.ok(content.includes('skip_poc'), 'should support args.skip_poc');
      assert.ok(content.includes('stop_at_poc'), 'should support args.stop_at_poc');
      assert.ok(content.includes('engineer-poc'), 'should dispatch the engineer-poc agent');
      assert.ok(content.includes('POC-MANIFEST.md'), 'orchestrate should be POC-aware via POC-MANIFEST.md');
    });

    it('uses agent() and phase() workflow APIs', () => {
      const content = fs.readFileSync(wfFile, 'utf-8');
      assert.ok(content.includes('agent('), 'should use agent() API');
      assert.ok(content.includes('phase('), 'should use phase() API');
      assert.ok(content.includes('log('), 'should use log() API');
    });

    it('has PHASE_RESULT schema for structured returns', () => {
      const content = fs.readFileSync(wfFile, 'utf-8');
      assert.ok(content.includes('PHASE_RESULT'), 'should define PHASE_RESULT');
      assert.ok(content.includes("'DONE'"), 'schema should have DONE status');
      assert.ok(content.includes("'BLOCKED'"), 'schema should have BLOCKED status');
    });

    it('has recovery mechanism', () => {
      const content = fs.readFileSync(wfFile, 'utf-8');
      assert.ok(content.includes('recovery') || content.includes('Recover'),
        'should handle cross-session recovery');
    });
  });

  describe('engineer-workflow self-healing', () => {
    const skillFile = path.join(SKILL_DIR, 'engineer-workflow', 'SKILL.md');

    it('has self-healing section', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('自愈') || content.includes('self-heal'),
        'engineer-workflow should have self-healing section');
    });

    it('has degraded strategy', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('降级') || content.includes('degrad'),
        'engineer-workflow should document degradation strategies');
    });

    it('has rebuild threshold table', () => {
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert.ok(content.includes('重建') && content.includes('阈值'),
        'engineer-workflow should have rebuild threshold table');
    });
  });

  describe('engineer-qa pipeline hooks', () => {
    const read = (s) => fs.readFileSync(path.join(SKILL_DIR, s, 'SKILL.md'), 'utf-8');

    it('engineer-workflow step 7 delegates to engineer-qa', () => {
      assert.ok(read('engineer-workflow').includes('engineer-qa'),
        'workflow acceptance should delegate to engineer-qa');
    });
  });
});
