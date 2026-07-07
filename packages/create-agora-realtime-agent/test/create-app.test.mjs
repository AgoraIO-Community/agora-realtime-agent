import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { parseCreateArgs, scaffoldProject, toPackageName } from '../src/create-app.mjs';

const packageTemplateDir = path.resolve(import.meta.dirname, '../template');

async function makeFixtureTemplate() {
  const root = await mkdtemp(path.join(tmpdir(), 'create-agora-template-'));
  await mkdir(path.join(root, 'app'), { recursive: true });
  await mkdir(path.join(root, 'nested'), { recursive: true });
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'agora-agent-pipeline-template', private: true, scripts: { dev: 'next dev' } }, null, 2),
  );
  await writeFile(path.join(root, 'README.md'), '# Agora Agent Pipeline Template\n');
  await writeFile(path.join(root, '_gitignore'), 'node_modules\n.next\n.env.local\n');
  await writeFile(path.join(root, '.env.example'), 'AGORA_APP_ID=\n');
  await writeFile(path.join(root, 'app/page.tsx'), 'export default function Page() { return null; }\n');
  return root;
}

test('parseCreateArgs accepts npm create target plus flags', () => {
  assert.deepEqual(parseCreateArgs(['my-agent', '--no-install', '--force']), {
    targetDir: 'my-agent',
    install: false,
    force: true,
    help: false,
  });
});

test('parseCreateArgs defaults to agora-voice-agent and install enabled', () => {
  assert.deepEqual(parseCreateArgs([]), {
    targetDir: 'agora-voice-agent',
    install: true,
    force: false,
    help: false,
  });
});

test('toPackageName normalizes scoped paths and unsafe characters', () => {
  assert.equal(toPackageName('/tmp/My Agora Agent!'), 'my-agora-agent');
  assert.equal(toPackageName('@example/My Agent'), '@example/my-agent');
});

test('scaffoldProject copies the template, renames _gitignore, and updates package name', async () => {
  const templateDir = await makeFixtureTemplate();
  const cwd = await mkdtemp(path.join(tmpdir(), 'create-agora-output-'));

  const result = await scaffoldProject({ cwd, targetDir: 'My Agent', templateDir, install: false, force: false });

  assert.equal(result.projectName, 'my-agent');
  assert.equal(result.didInstall, false);
  assert.equal(result.relativeTargetDir, 'My Agent');
  assert.equal(await readFile(path.join(result.targetDir, '.gitignore'), 'utf8'), 'node_modules\n.next\n.env.local\n');
  assert.equal(await readFile(path.join(result.targetDir, '.env.example'), 'utf8'), 'AGORA_APP_ID=\n');
  assert.match(await readFile(path.join(result.targetDir, 'app/page.tsx'), 'utf8'), /export default function Page/);

  const pkg = JSON.parse(await readFile(path.join(result.targetDir, 'package.json'), 'utf8'));
  assert.equal(pkg.name, 'my-agent');
});

test('scaffoldProject refuses to overwrite a non-empty directory unless forced', async () => {
  const templateDir = await makeFixtureTemplate();
  const cwd = await mkdtemp(path.join(tmpdir(), 'create-agora-output-'));
  await mkdir(path.join(cwd, 'existing'));
  await writeFile(path.join(cwd, 'existing', 'keep.txt'), 'do not overwrite');

  await assert.rejects(
    scaffoldProject({ cwd, targetDir: 'existing', templateDir, install: false, force: false }),
    /not empty/,
  );
});

test('scaffoldProject keeps absolute target paths readable in CLI output', async () => {
  const templateDir = await makeFixtureTemplate();
  const cwd = await mkdtemp(path.join(tmpdir(), 'create-agora-output-'));
  const absoluteTarget = path.join(await mkdtemp(path.join(tmpdir(), 'create-agora-absolute-')), 'generated');

  const result = await scaffoldProject({ cwd, targetDir: absoluteTarget, templateDir, install: false, force: false });

  assert.equal(result.relativeTargetDir, absoluteTarget);
});

test('packaged template declares runtime dependencies used by server routes', async () => {
  const pkg = JSON.parse(await readFile(path.join(packageTemplateDir, 'package.json'), 'utf8'));

  assert.equal(pkg.dependencies['agora-agents'], '^2.4.0');
  assert.ok(pkg.dependencies['agora-realtime-react']);
});

test('packaged template declares TypeScript build dependencies', async () => {
  const pkg = JSON.parse(await readFile(path.join(packageTemplateDir, 'package.json'), 'utf8'));

  assert.equal(pkg.devDependencies.typescript, '5.9.3');
  assert.equal(pkg.devDependencies['@types/node'], '24.10.1');
  assert.equal(pkg.devDependencies['@types/react'], '19.2.7');
});
