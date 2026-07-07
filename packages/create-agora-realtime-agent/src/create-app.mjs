import { spawnSync } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access, cp, mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_TARGET_DIR = 'agora-voice-agent';
const IGNORED_TEMPLATE_ENTRIES = new Set(['node_modules', '.next', 'package-lock.json', '.DS_Store']);

export function parseCreateArgs(args) {
  const options = {
    targetDir: DEFAULT_TARGET_DIR,
    install: true,
    force: false,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--no-install') {
      options.install = false;
      continue;
    }
    if (arg === '--install') {
      options.install = true;
      continue;
    }
    if (arg === '--force' || arg === '-f') {
      options.force = true;
      continue;
    }
    if (arg === '--yes' || arg === '-y') {
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    options.targetDir = arg;
  }

  return options;
}

export function toPackageName(input) {
  const normalized = String(input || DEFAULT_TARGET_DIR).replaceAll('\\\\', '/').replace(/\/+$/u, '');
  const candidate = normalized.startsWith('@') ? normalized : path.posix.basename(normalized) || DEFAULT_TARGET_DIR;

  if (candidate.startsWith('@')) {
    const [scope, name] = candidate.split('/');
    return `${sanitizePackagePart(scope, { scoped: true })}/${sanitizePackagePart(name)}`;
  }

  return sanitizePackagePart(candidate);
}

function sanitizePackagePart(part, { scoped = false } = {}) {
  const prefix = scoped ? '@' : '';
  const value = String(part || '')
    .replace(/^@/u, '')
    .toLowerCase()
    .replace(/[\s_]+/gu, '-')
    .replace(/[^a-z0-9._-]+/gu, '-')
    .replace(/[-.]{2,}/gu, '-')
    .replace(/^[-.]+|[-.]+$/gu, '');

  return `${prefix}${value || DEFAULT_TARGET_DIR}`;
}

export async function scaffoldProject({
  cwd = process.cwd(),
  targetDir = DEFAULT_TARGET_DIR,
  templateDir,
  install = true,
  force = false,
  packageManager = 'npm',
  stdio = 'inherit',
} = {}) {
  if (!templateDir) {
    throw new Error('templateDir is required');
  }

  const targetPath = path.resolve(cwd, targetDir);
  const relativeTargetDir = path.isAbsolute(targetDir) ? targetPath : path.relative(cwd, targetPath) || '.';
  const projectName = toPackageName(targetDir);

  await assertTemplateExists(templateDir);
  await prepareTargetDirectory(targetPath, { force });
  await copyTemplate(templateDir, targetPath);
  await renameTemplateDotfiles(targetPath);
  await updatePackageName(path.join(targetPath, 'package.json'), projectName);

  let didInstall = false;
  if (install) {
    runInstall({ packageManager, cwd: targetPath, stdio });
    didInstall = true;
  }

  return {
    didInstall,
    projectName,
    relativeTargetDir,
    targetDir: targetPath,
  };
}

async function assertTemplateExists(templateDir) {
  try {
    await access(templateDir, fsConstants.R_OK);
  } catch {
    throw new Error(`Template directory not found: ${templateDir}`);
  }
}

async function prepareTargetDirectory(targetPath, { force }) {
  await mkdir(targetPath, { recursive: true });
  const entries = await readdir(targetPath);
  if (entries.length > 0 && !force) {
    throw new Error(`Target directory is not empty: ${targetPath}. Use --force to overwrite.`);
  }
}

async function copyTemplate(templateDir, targetPath) {
  const entries = await readdir(templateDir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_TEMPLATE_ENTRIES.has(entry.name)) {
      continue;
    }
    await cp(path.join(templateDir, entry.name), path.join(targetPath, entry.name), {
      force: true,
      recursive: true,
    });
  }
}

async function renameTemplateDotfiles(targetPath) {
  const gitignorePath = path.join(targetPath, '_gitignore');
  if (await exists(gitignorePath)) {
    await rename(gitignorePath, path.join(targetPath, '.gitignore'));
  }
}

async function updatePackageName(packageJsonPath, projectName) {
  if (!(await exists(packageJsonPath))) {
    return;
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  packageJson.name = projectName;
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function runInstall({ packageManager, cwd, stdio }) {
  const result = spawnSync(packageManager, ['install'], { cwd, stdio });
  if (result.status !== 0) {
    throw new Error(`${packageManager} install failed with exit code ${result.status ?? 'unknown'}`);
  }
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}
