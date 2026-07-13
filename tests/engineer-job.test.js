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
      'engineer-workflow', 'engineer-inspector',
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
});
