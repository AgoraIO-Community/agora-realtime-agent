# Agora Agent Pipeline

Reference implementation for a standalone Agora Realtime React npm package, a public demo website, and an Agora Agent Pipeline template.

Research baseline: 2026-07-02.

## Current Direction

The active product shape is a publishable React package plus examples that consume it. The browser uses Agora Web SDK / RTC directly, while the app server owns session setup and teardown:

```text
Browser device
  - mic, speaker, typed text
  - useAgoraRealtime hook from agora-realtime-react
  - Agora Web SDK joins the RTC channel directly
        |
        v
Next.js demo routes
  - POST /api/agora/realtime/setup
  - POST /api/agora/realtime/end
  - mint browser RTC token and start/stop ConvoAI agent
        |
        v
Agora RTC channel + ConvoAI
  - browser publishes mic audio
  - ConvoAI agent subscribes, runs ASR/Turn/LLM/TTS, and publishes speaker audio
```

`packages/agora-realtime-react` exports `useAgoraRealtime`, `useVoiceMeter`, and the reusable `VoiceRingButton` UI primitive. It is designed to be published as a standalone npm package. Its React hook ergonomics stay close to `@ai-sdk/react` `experimental_useRealtime` where useful, but the primary media plane is Agora RTC, not an AI SDK WebSocket provider.

## Implemented Layout

```text
apps/
  website/                  Public SDK/template landing page with local PCM voice demo
templates/
  agora-agent-pipeline/    Agent pipeline template with direct Agora RTC setup/end routes
packages/
  agora-realtime-react/    Publishable React realtime package using agora-rtc-sdk-ng
registry/
  default/voice-ring-button/ shadcn registry source for the voice ring primitive
```

## Run Locally

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

`AGORA_CONVOAI_PIPELINE_ID` should point at the published AI Studio pipeline. The setup route sends it as top-level `pipeline_id`, generates the RTC channel, UIDs, and tokens server-side, and avoids overriding the pipeline's published ASR/LLM/TTS/turn settings.

## Documentation Map

- [`apps/website/app/docs/agora-realtime-react-package/page.mdx`](./apps/website/app/docs/agora-realtime-react-package/page.mdx) — standalone npm package positioning and relationship to Vercel AI SDK.
- [`apps/website/app/docs/deploy-agent-pipeline/page.mdx`](./apps/website/app/docs/deploy-agent-pipeline/page.mdx) — deploy an Agora AI Studio pipeline with the Vercel template.
- [`apps/website/app/docs/install-voice-ring-with-shadcn/page.mdx`](./apps/website/app/docs/install-voice-ring-with-shadcn/page.mdx) — install the voice ring UI through the shadcn registry endpoint.
