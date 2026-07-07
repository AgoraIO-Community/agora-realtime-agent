# Agora Realtime React

[![Agora + Vercel Voice Agents](https://agora-realtime-agent.vercel.app/api/badges/npm-homepage.svg?pkg=agora-realtime-react)](https://agora-realtime-agent.vercel.app/?utm_source=npm-agora-realtime-react&utm_medium=readme-badge&utm_campaign=agora_voice_agents)

React hooks and voice UI primitives for Agora voice agents running inside Vercel and React apps.

`agora-realtime-react` gives the browser a typed Agora RTC runtime, audio metering, and a reusable voice ring button. Pair it with Vercel or any server runtime that can mint Agora RTC tokens and start a ConvoAI or AI Studio pipeline.

Homepage: https://agora-realtime-agent.vercel.app/?utm_source=npm-agora-realtime-react&utm_medium=readme&utm_campaign=agora_voice_agents

## Install

```bash
npm install agora-realtime-react
```

For package managers that do not auto-install peers, install the peer dependencies in your app:

```bash
npm install agora-rtc-sdk-ng @ai-sdk/react@4.0.9 ai@7.0.8
```

## Requirements

- React `^18.3.0` or `^19.0.0`.
- A browser-capable React app. The package owns the client Agora RTC session; it does not run on the server by itself.
- A server endpoint that returns the typed setup payload with an Agora App ID, RTC channel, UID, and RTC token.
- Agora App Certificate storage, RTC token generation, and ConvoAI / AI Studio start-end calls must stay server-side.
- Microphone capture requires HTTPS in production, or `http://localhost` during local development.

## Exports

```tsx
import {
  VoiceRingButton,
  microphoneCompatibilityWarning,
  useAgoraRealtime,
  useVoiceMeter,
} from 'agora-realtime-react';
```

## What it owns

- `useAgoraRealtime` for browser-side Agora RTC session state and controls.
- `useVoiceMeter` for Web Audio level analysis from a `MediaStream`.
- `VoiceRingButton` for human and agent voice activity visualization.
- Typed setup contracts between your browser client and Vercel route.

## Server boundary

The package does not store Agora credentials and does not publish AI Studio pipelines. Keep App Certificate storage, token generation, and ConvoAI join/leave calls on your server. The template in this repository shows the Vercel / Next.js route implementation.

## Docs

- Package guide: https://agora-realtime-agent.vercel.app/docs/agora-realtime-react-package
- Demo and Vercel template: https://agora-realtime-agent.vercel.app/?utm_source=npm-agora-realtime-react&utm_medium=readme-docs&utm_campaign=agora_voice_agents
