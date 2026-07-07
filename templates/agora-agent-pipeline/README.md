# Agora Voice Agents for Vercel

This app was generated from the AI SDK-compatible Agora WebRTC voice agent template.

Project homepage: [agora-realtime-agent.vercel.app](https://agora-realtime-agent.vercel.app/?utm_source=create-agora-realtime-agent&utm_medium=generated-template&utm_campaign=agora_voice_agents)

Official Agora resources:

- Agora: https://www.agora.io/en/
- Agora Docs (English): https://docs.agora.io/en/
- Agora realtime voice docs: https://docs.agora.io/en/realtime-media/voice
- Agora AI and Conversational AI docs: https://docs.agora.io/en/ai

## Requirements

- Node.js compatible with Next.js 16. This template is tested from Node.js `>=20.9.0`; the source repo uses Node.js `>=24.0.0`.
- npm.
- Agora credentials and an Agora AI Studio / ConvoAI pipeline ID for live agent sessions.
- Optional AI SDK-shaped session config from the React hook; Agora RTC remains the media transport.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local`:

```env
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
AGORA_CONVOAI_PIPELINE_ID=
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Runtime boundary

- The browser joins Agora RTC using a scoped token from the server route.
- `app/api/agora/realtime/setup` mints the RTC token and starts the ConvoAI / AI Studio pipeline agent.
- `app/api/agora/realtime/end` stops the agent when the session ends.
- Never expose `AGORA_APP_CERTIFICATE` to the browser.


## Vercel AI SDK boundary

This template uses `agora-realtime-react`, whose hook shape and session config are aligned with Vercel AI SDK realtime types. It is not a native `experimental_useRealtime` provider. The runtime path is:

1. Browser React hook requests setup from this Next.js app.
2. The server route mints an Agora RTC token and starts the ConvoAI / AI Studio pipeline.
3. The browser joins Agora RTC and publishes microphone audio.
4. The Agora agent joins the same channel and publishes speech back to the browser.
