# Agora + Vercel Voice Agent

This app was generated from the Agora realtime voice agent template.

Project homepage: https://agora-realtime-agent.vercel.app/?utm_source=create-agora-realtime-agent&utm_medium=generated-template&utm_campaign=agora_voice_agents

## Requirements

- Node.js compatible with Next.js 16. This template is tested from Node.js `>=20.9.0`; the source repo uses Node.js `>=24.0.0`.
- npm.
- Agora credentials for live agent sessions.

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
- `app/api/agora/realtime/setup` mints the RTC token and starts the ConvoAI / AI Studio agent.
- `app/api/agora/realtime/end` stops the agent when the session ends.
- Never expose `AGORA_APP_CERTIFICATE` to the browser.
