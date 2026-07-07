# Agora Voice Agents for Vercel

This app was generated from the Agora realtime voice agent template.

Project homepage: [agora-realtime-agent.vercel.app](https://agora-realtime-agent.vercel.app/?utm_source=create-agora-realtime-agent&utm_medium=generated-template&utm_campaign=agora_voice_agents)

Official Agora resources:

- Agora: https://www.agora.io/en/
- Agora Docs (English): https://docs.agora.io/en/
- Agora realtime voice docs: https://docs.agora.io/en/realtime-media/voice
- Agora AI and Conversational AI docs: https://docs.agora.io/en/ai

## Requirements

- Node.js compatible with Next.js 16. This template is tested from Node.js `>=20.9.0`; the source repo uses Node.js `>=24.0.0`.
- npm.
- Agora credentials for live agent sessions.
- An OpenAI API key for the default BYOK demo path, or an Agora AI Studio / ConvoAI pipeline ID.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local`:

```env
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
OPENAI_API_KEY=

# Optional: use an Agora AI Studio / ConvoAI pipeline instead of the default BYOK path.
AGORA_CONVOAI_PIPELINE_ID=
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Runtime boundary

- The browser joins Agora RTC using a scoped token from the server route.
- `app/api/agora/realtime/setup` mints the RTC token and starts the agent. If `OPENAI_API_KEY` is set, the route uses the default BYOK STT/LLM/TTS demo stack; otherwise it falls back to `AGORA_CONVOAI_PIPELINE_ID` / `agent.config.json`.
- `app/api/agora/realtime/end` stops the agent when the session ends.
- Never expose `AGORA_APP_CERTIFICATE` to the browser.
