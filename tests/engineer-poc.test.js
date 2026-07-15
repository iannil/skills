const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SKILL_FILE = path.join(__dirname, '..', 'skills', 'engineer-poc', 'SKILL.md');
const REF_DIR = path.join(__dirname, '..', 'skills', 'engineer-poc', 'references');

function read(p) { return fs.readFileSync(p, 'utf-8'); }

describe('engineer-poc skill', () => {
  it('SKILL.md exists', () => {
    assert.ok(fs.existsSync(SKILL_FILE), 'engineer-poc/SKILL.md should exist');
  });

  it('has valid frontmatter with name/description/compatibility', () => {
    const content = read(SKILL_FILE);
    const m = content.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(m, 'should have frontmatter');
    assert.ok(/name:\s*engineer-poc/.test(m[1]), 'name should be engineer-poc');
    assert.ok(/description:/.test(m[1]), 'should have description');
    assert.ok(/compatibility:/.test(m[1]), 'should have compatibility');
    assert.ok(/agent/.test(m[1]) || /bash/.test(m[1]), 'compatibility should include agent or bash');
  });

  it('has mode selection section with all three modes', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('## ⚙️ 模式选择'), 'should have mode section');
    assert.ok(content.includes('normal'), 'mentions normal');
    assert.ok(content.includes('auto'), 'mentions auto');
    assert.ok(content.includes('silent'), 'mentions silent');
  });

  it('has core philosophy with four principles', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('## 🎯 核心理念'), 'should have philosophy section');
    assert.ok(content.includes('原则一'), 'principle 1');
    assert.ok(content.includes('原则二'), 'principle 2');
    assert.ok(content.includes('原则三'), 'principle 3');
    assert.ok(content.includes('原则四'), 'principle 4');
  });

  it('documents the three fidelity labels', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('真实交互'), 'has 真实交互 label');
    assert.ok(content.includes('mock 数据'), 'has mock 数据 label');
    assert.ok(content.includes('占位未实现'), 'has 占位未实现 label');
  });

  it('names the persistent artifacts', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('poc.ledger.json'), 'mentions ledger');
    assert.ok(content.includes('POC-MANIFEST.md'), 'mentions manifest');
    assert.ok(content.includes('POC-FIDELITY.md'), 'mentions fidelity report');
  });

  it('has loop-until-dry coverage mechanism and non-goals', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('loop-until-dry'), 'mentions loop-until-dry');
    assert.ok(content.includes('## 🚫 非目标'), 'has non-goals section');
  });

  it('has TRIGGERS and handoff to engineer-job', () => {
    const content = read(SKILL_FILE);
    assert.ok(content.includes('TRIGGERS'), 'has TRIGGERS in frontmatter/body');
    assert.ok(content.includes('engineer-job'), 'mentions engineer-job handoff');
  });
});

describe('engineer-poc references', () => {
  const files = ['pipeline.md', 'poc-ledger.schema.json', 'mock-layer-guide.md', 'poc-manifest-template.md', 'industry-patterns.md'];
  for (const f of files) {
    it(`reference ${f} exists`, () => {
      assert.ok(fs.existsSync(path.join(REF_DIR, f)), `references/${f} should exist`);
    });
  }

  it('poc-ledger.schema.json is valid JSON with node schema fields', () => {
    const schema = JSON.parse(read(path.join(REF_DIR, 'poc-ledger.schema.json')));
    assert.ok(schema.properties, 'schema has properties');
    assert.ok(schema.properties.nodes, 'schema has nodes property');
  });
});

describe('engineer-poc README registration', () => {
  const ROOT = path.join(__dirname, '..');
  for (const f of ['README.md', 'README.zh-CN.md']) {
    it(`${f} registers engineer-poc`, () => {
      const content = fs.readFileSync(path.join(ROOT, f), 'utf-8');
      assert.ok(content.includes('engineer-poc'), `${f} should mention engineer-poc`);
    });
  }
});
