# Agora Realtime React

React hooks and voice UI primitives for Agora-powered realtime voice agents.

`agora-realtime-react` gives React apps a browser-side Agora RTC runtime, voice
metering, and a reusable voice ring button. It is designed for agent apps backed
by Agora ConvoAI or Agora AI Studio pipelines.

## Install

```bash
npm install agora-realtime-react
```

You also need the peer dependencies used by your app:

```bash
npm install agora-rtc-sdk-ng react
```

## Exports

```tsx
import {
  VoiceRingButton,
  microphoneCompatibilityWarning,
  useAgoraRealtime,
  useVoiceMeter,
} from 'agora-realtime-react';
```

## What It Owns

- `useAgoraRealtime` for browser-side Agora RTC session state and controls.
- `useVoiceMeter` for Web Audio level analysis from a `MediaStream`.
- `VoiceRingButton` for human and agent voice activity visualization.
- Typed setup contracts between your browser client and app server.

## Server Boundary

The package does not store Agora credentials and does not publish AI Studio
pipelines. Keep App Certificate storage, token generation, and ConvoAI
join/leave calls on your server. The template in this repository shows one
Next.js route implementation.

## Docs

- Package guide: https://agora-realtime-agent.vercel.app/docs/agora-realtime-react-package
- Demo and template: https://agora-realtime-agent.vercel.app
