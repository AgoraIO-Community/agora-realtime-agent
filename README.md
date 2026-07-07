# Agora + Vercel Voice Agents

Reference implementation for building Agora realtime voice agents as Vercel apps. The repo includes a React npm package, a Vercel-ready Next.js template, a public demo site, and a shadcn voice UI component.

Homepage: https://agora-realtime-agent.vercel.app/?utm_source=github&utm_medium=readme&utm_campaign=agora_voice_agents

Official Agora resources:

- Agora: https://www.agora.io/en/
- Agora Docs (English): https://docs.agora.io/en/
- Agora realtime voice docs: https://docs.agora.io/en/realtime-media/voice
- Agora AI and Conversational AI docs: https://docs.agora.io/en/ai

Research baseline: 2026-07-02.

## Current direction

The product shape is an Agora + Vercel stack:

```text
Browser device
  - mic, speaker, typed text
  - useAgoraRealtime hook from agora-realtime-react
  - Agora Web SDK joins the RTC channel directly
        |
        v
Vercel / Next.js routes
  - POST /api/agora/realtime/setup
  - POST /api/agora/realtime/end
  - mint browser RTC token and start/stop ConvoAI agent
        |
        v
Agora RTC channel + ConvoAI
  - browser publishes mic audio
  - ConvoAI agent subscribes, runs ASR/Turn/LLM/TTS, and publishes speaker audio
```

Agora owns the realtime media and agent runtime. Vercel owns the web app, API routes, environment variables, and deployment flow. The browser never sees the App Certificate.

`packages/agora-realtime-react` exports `useAgoraRealtime`, `useVoiceMeter`, and the reusable `VoiceRingButton` UI primitive. The package gives Vercel apps a React API for Agora RTC while keeping credentials, token generation, and ConvoAI setup on the server.

## Requirements

- Repository development uses Node.js `>=24.0.0` and npm `11.x` as declared in `package.json`.
- Consumer React apps can use `agora-realtime-react` with React `^18.3.0` or `^19.0.0`; the package must not pin a single React patch release.
- The shadcn path assumes a normal npm app with shadcn initialized, for example `create-next-app --use-npm` followed by `npx shadcn@latest init -d`.
- Google Analytics is optional for the public website. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel when the GA4 Measurement ID is available; leave it empty to disable analytics.
- Live agent demos require server-only Agora credentials: `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`, and `AGORA_CONVOAI_PIPELINE_ID`.
- Microphone capture requires HTTPS in production, or `http://localhost` during local development.

## Implemented layout

```text
apps/
  website/                   Public Agora + Vercel landing page with local PCM voice demo
templates/
  agora-agent-pipeline/      Vercel-ready agent template with Agora RTC setup/end routes
packages/
  agora-realtime-react/      React package using agora-rtc-sdk-ng
  create-agora-realtime-agent/ npm init/create scaffold package for the template
registry/
  default/voice-ring-button/ shadcn registry source for the voice ring primitive
```

## Create a new agent app

After `create-agora-realtime-agent` is published, developers can scaffold the Vercel-ready template with npm:

```bash
npm create agora-realtime-agent@latest my-agent
```

Equivalent forms:

```bash
npm init agora-realtime-agent@latest my-agent
npx create-agora-realtime-agent@latest my-agent
```

Use `-- --no-install` for smoke tests or CI runs that should only copy the template.

## External platform tracking

Platform-facing pages link back to the homepage with source-specific UTM tags so traffic from npm, shadcn, GitHub, and generated templates can be separated in analytics. The homepage remains the single campaign landing page.

## Run locally

```bash
npm install
npm run lint
npm run typecheck
npm --workspace agora-realtime-react run build
npm --workspace agora-agent-pipeline-website run build
npm --workspace agora-agent-pipeline-template run build
```

Useful dev servers:

```bash
npm run dev:website   # http://localhost:3001
npm run dev:template  # http://localhost:3000
```

The website runs from local PCM demo assets and does not require Agora credentials.

The template requires Agora app credentials and ConvoAI access:

```bash
AGORA_APP_ID=... \
AGORA_APP_CERTIFICATE=... \
AGORA_CONVOAI_PIPELINE_ID=bf6a5c2396714f81a0de57ab2fbe2b72 \
npm run dev:template
```

`AGORA_CONVOAI_PIPELINE_ID` should point at the published AI Studio pipeline. The Vercel setup route sends it as top-level `pipeline_id`, generates the RTC channel, UIDs, and tokens server-side, and avoids overriding the pipeline's published ASR/LLM/TTS/turn settings.

## Documentation map

- [`apps/website/app/docs/agora-realtime-react-package/page.mdx`](./apps/website/app/docs/agora-realtime-react-package/page.mdx) — React package for using Agora RTC from a Vercel app.
- [`apps/website/app/docs/deploy-agent-pipeline/page.mdx`](./apps/website/app/docs/deploy-agent-pipeline/page.mdx) — deploy an Agora AI Studio pipeline through the Vercel template.
- [`apps/website/app/docs/install-voice-ring-with-shadcn/page.mdx`](./apps/website/app/docs/install-voice-ring-with-shadcn/page.mdx) — install the Agora voice ring UI through the shadcn registry endpoint.
