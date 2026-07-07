export const registryCatalog = {
  '$schema': 'https://ui.shadcn.com/schema/registry.json',
  homepage: 'https://agora-realtime-agent.vercel.app/',
  items: [
    {
      categories: ['voice', 'realtime', 'agent', 'ai-sdk', 'webrtc', 'vercel'],
      description: 'A canvas-rendered voice ring button for AI SDK-compatible Agora WebRTC voice agents in Vercel and React apps.',
      docs: 'Install with `npx shadcn@latest add https://agora-realtime-agent.vercel.app/r/voice-ring-button.json`, then import `VoiceRingButton` and `useVoiceMeter` from your shadcn aliases. Homepage: [agora-realtime-agent.vercel.app](https://agora-realtime-agent.vercel.app/?utm_source=shadcn-registry&utm_medium=registry-item-docs&utm_campaign=agora_voice_agents). Vercel AI SDK guide: https://agora-realtime-agent.vercel.app/docs/use-with-vercel-ai-sdk. Official Agora docs: https://docs.agora.io/en/',
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
      title: 'Agora Voice Ring Button',
      type: 'registry:ui',
    },
  ],
  name: 'agora-voice-agents',
};

export type RegistryItem = typeof registryCatalog.items[number];
