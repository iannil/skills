#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageRoot = path.resolve(__dirname, '..');
const skillsRoot = path.join(packageRoot, 'skills');

function usage() {
  return [
    'Usage:',
    '  iannil-skills list',
    '  iannil-skills install [all|skill-name] [--dry-run]',
    '',
    'Examples:',
    '  iannil-skills install',
    '  iannil-skills install all',
    '  iannil-skills install init-project',
    '  iannil-skills install product-analysis-framework --dry-run'
  ].join('\n');
}

function readSkillDescription(skillDir) {
  const skillPath = path.join(skillsRoot, skillDir, 'SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');
  const match = content.match(/^description:\s*(?:>\s*|\|-\s*)?\n?([\s\S]*?)\n(?:compatibility:|---)/m);
  if (!match) {
    return '';
  }
  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 180);
}

function discoverSkills() {
  if (!fs.existsSync(skillsRoot)) {
    throw new Error(`Package integrity error: missing skills directory at ${skillsRoot}`);
  }

  const names = fs.readdirSync(skillsRoot)
    .filter((entry) => {
      const fullPath = path.join(skillsRoot, entry);
      return fs.statSync(fullPath).isDirectory();
    })
    .sort();

  for (const name of names) {
    const skillPath = path.join(skillsRoot, name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Package integrity error: missing ${skillPath}`);
    }
  }

  return names;
}

function resolveInstallSelection(args, skillNames) {
  const dryRun = args.includes('--dry-run');
  const positional = args.filter((arg) => arg !== '--dry-run');
  const requested = positional[0] || 'all';

  if (requested === 'all') {
    return {
      dryRun,
      requested,
      installerSkill: '*',
      selectedSkills: skillNames
    };
  }

  if (!skillNames.includes(requested)) {
    throw new Error(`Unknown skill "${requested}". Valid skills: ${skillNames.join(', ')}`);
  }

  return {
    dryRun,
    requested,
    installerSkill: requested,
    selectedSkills: [requested]
  };
}

function printList(skillNames) {
  for (const name of skillNames) {
    const description = readSkillDescription(name);
    console.log(`${name}${description ? ` - ${description}` : ''}`);
  }
}

function install(selection) {
  const command = ['npx', 'skills', 'add', packageRoot, '--skill', selection.installerSkill];
  if (selection.dryRun) {
    console.log(`Selected skills: ${selection.selectedSkills.join(', ')}`);
    console.log(`Would run: ${command.join(' ')}`);
    return 0;
  }

  console.log(`Installing skills: ${selection.selectedSkills.join(', ')}`);
  console.log(`Running: ${command.join(' ')}`);

  const result = spawnSync(command[0], command.slice(1), {
    stdio: 'inherit',
    cwd: packageRoot
  });

  if (result.error) {
    console.error(`Failed to run installer: ${result.error.message}`);
    return 1;
  }

  return result.status === null ? 1 : result.status;
}

function main(argv) {
  const [command, ...args] = argv;
  const skillNames = discoverSkills();

  if (!command || command === '--help' || command === '-h') {
    console.log(usage());
    return 0;
  }

  if (command === 'list') {
    printList(skillNames);
    return 0;
  }

  if (command === 'install') {
    const selection = resolveInstallSelection(args, skillNames);
    return install(selection);
  }

  console.error(`Unknown command "${command}".`);
  console.error(usage());
  return 1;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  discoverSkills,
  resolveInstallSelection,
  usage
};
