#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { parseCreateArgs, scaffoldProject } from '../src/create-app.mjs';

const templateDir = fileURLToPath(new URL('../template', import.meta.url));

function printHelp() {
  console.log(`Create an Agora + Vercel realtime voice agent app.

Usage:
  npm create agora-realtime-agent@latest [project-name] [options]
  npm init agora-realtime-agent@latest [project-name] [options]
  npx create-agora-realtime-agent@latest [project-name] [options]

Options:
  --no-install   Copy the template without running npm install
  --install      Run npm install after scaffolding (default)
  -f, --force    Allow writing into a non-empty target directory
  -h, --help     Show this help
`);
}

function printSuccess(result) {
  const displayDir = result.relativeTargetDir === '' ? '.' : result.relativeTargetDir;
  console.log(`\nCreated Agora voice agent app in ${displayDir}\n`);

  if (displayDir !== '.') {
    console.log(`Next steps:\n  cd ${shellQuote(displayDir)}`);
  } else {
    console.log('Next steps:');
  }

  if (!result.didInstall) {
    console.log('  npm install');
  }

  console.log('  cp .env.example .env.local');
  console.log('  # Fill AGORA_APP_ID, AGORA_APP_CERTIFICATE, and AGORA_CONVOAI_PIPELINE_ID');
  console.log('  npm run dev\n');
}

function shellQuote(value) {
  return /^[a-zA-Z0-9_./-]+$/.test(value) ? value : JSON.stringify(value);
}

try {
  const options = parseCreateArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const result = await scaffoldProject({
    ...options,
    cwd: process.cwd(),
    packageManager: 'npm',
    templateDir,
  });
  printSuccess(result);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\ncreate-agora-realtime-agent failed: ${message}\n`);
  console.error('Run `npm create agora-realtime-agent@latest -- --help` for usage.');
  process.exit(1);
}
