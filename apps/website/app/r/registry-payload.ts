import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { RegistryItem } from './registry-data';

const sourceFiles = {
  'packages/agora-realtime-react/src/components/voice-ring-button.tsx': [
    path.join(process.cwd(), 'packages', 'agora-realtime-react', 'src', 'components', 'voice-ring-button.tsx'),
    path.join(process.cwd(), '..', '..', 'packages', 'agora-realtime-react', 'src', 'components', 'voice-ring-button.tsx'),
  ],
  'packages/agora-realtime-react/src/use-voice-meter.ts': [
    path.join(process.cwd(), 'packages', 'agora-realtime-react', 'src', 'use-voice-meter.ts'),
    path.join(process.cwd(), '..', '..', 'packages', 'agora-realtime-react', 'src', 'use-voice-meter.ts'),
  ],
} satisfies Record<string, string[]>;

type SourcePath = keyof typeof sourceFiles;

function isSourcePath(value: string): value is SourcePath {
  return value in sourceFiles;
}

async function readSourceFile(relativePath: string): Promise<string> {
  if (!isSourcePath(relativePath)) throw new Error(`Unsupported registry source ${relativePath}`);
  const candidates = sourceFiles[relativePath];

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return await readFile(candidate, 'utf8');
    } catch (caught) {
      lastError = caught;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to read ${relativePath}`);
}

export async function registryItemPayload(item: RegistryItem) {
  return {
    '$schema': 'https://ui.shadcn.com/schema/registry-item.json',
    categories: item.categories,
    description: item.description,
    docs: 'Install with `npx shadcn@latest add https://agora-realtime-agent.vercel.app/r/voice-ring-button.json`, then import `VoiceRingButton` and `useVoiceMeter` from your configured shadcn aliases.',
    files: await Promise.all(item.files.map(async (file) => ({
      content: await readSourceFile(file.path),
      path: file.path,
      target: file.target,
      type: file.type,
    }))),
    name: item.name,
    title: item.title,
    type: item.type,
  };
}
