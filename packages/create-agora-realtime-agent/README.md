# create-agora-realtime-agent

[![Agora + Vercel Voice Agents](https://agora-realtime-agent.vercel.app/api/badges/npm-homepage.svg?pkg=create-agora-realtime-agent)](https://agora-realtime-agent.vercel.app/?utm_source=npm-create-agora-realtime-agent&utm_medium=readme-badge&utm_campaign=agora_voice_agents)

Create an Agora + Vercel realtime voice agent app from the official template.

Homepage: https://agora-realtime-agent.vercel.app/?utm_source=npm-create-agora-realtime-agent&utm_medium=readme&utm_campaign=agora_voice_agents

Official Agora resources:

- Agora: https://www.agora.io/en/
- Agora Docs (English): https://docs.agora.io/en/
- Agora realtime voice docs: https://docs.agora.io/en/realtime-media/voice
- Agora AI and Conversational AI docs: https://docs.agora.io/en/ai

## Usage

```bash
npm create agora-realtime-agent@latest my-agent
```

Equivalent forms:

```bash
npm init agora-realtime-agent@latest my-agent
npx create-agora-realtime-agent@latest my-agent
```

For CI or quick smoke tests, copy the template without installing dependencies:

```bash
npm create agora-realtime-agent@latest my-agent -- --no-install
```

## Options

- `--no-install` — copy the template without running `npm install`.
- `--install` — run `npm install` after copying the template. This is the default.
- `--force` / `-f` — allow writing into a non-empty target directory.
- `--help` / `-h` — print usage.

## Generated app

The generated app is a Vercel-ready Next.js app that keeps Agora credentials on the server and uses `agora-realtime-react` in the browser.

It links back to the project homepage so teams can track template adoption: https://agora-realtime-agent.vercel.app/?utm_source=create-agora-realtime-agent&utm_medium=generated-template&utm_campaign=agora_voice_agents

After creation:

```bash
cd my-agent
cp .env.example .env.local
# Fill AGORA_APP_ID, AGORA_APP_CERTIFICATE, and AGORA_CONVOAI_PIPELINE_ID
npm run dev
```
