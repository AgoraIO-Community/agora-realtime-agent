export const registryCatalog = {
  '$schema': 'https://ui.shadcn.com/schema/registry.json',
  homepage: 'https://agora-agent-pipeline.vercel.app',
  items: [
    {
      categories: ['voice', 'realtime', 'agent'],
      description: 'A canvas-rendered dual-channel voice ring button with a Web Audio voice meter hook.',
      files: [
        {
          path: 'packages/agora-realtime-react/src/components/voice-ring-button.tsx',
          target: '@ui/voice-ring-button.tsx',
          type: 'registry:ui',
        },
        {
          path: 'packages/agora-realtime-react/src/use-voice-meter.ts',
          target: '@hooks/use-voice-meter.ts',
          type: 'registry:hook',
        },
      ],
      name: 'voice-ring-button',
      title: 'Voice Ring Button',
      type: 'registry:ui',
    },
  ],
  name: 'agora-agent-pipeline',
};

export type RegistryItem = typeof registryCatalog.items[number];
