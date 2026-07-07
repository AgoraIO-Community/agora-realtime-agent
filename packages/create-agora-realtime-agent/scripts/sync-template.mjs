import { cp, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const packageRoot = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const repoRoot = path.resolve(packageRoot, '../..');
const source = path.join(repoRoot, 'templates/agora-agent-pipeline');
const destination = path.join(packageRoot, 'template');

await rm(destination, { recursive: true, force: true });
await cp(source, destination, {
  recursive: true,
  filter(sourcePath) {
    const relative = path.relative(source, sourcePath);
    const segments = relative.split(path.sep);
    return !segments.some((segment) => ['node_modules', '.next', 'package-lock.json', '.DS_Store'].includes(segment));
  },
});

// The canonical template uses a real .gitignore so GitHub/Vercel can clone the
// subdirectory directly. The npm create package stores it as _gitignore because
// npm treats .gitignore specially when packing templates.
try {
  await rename(path.join(destination, '.gitignore'), path.join(destination, '_gitignore'));
} catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
    throw error;
  }
}
