import { DemoVoiceShowcase } from '../components/demo-voice-showcase';

const pipelineSteps = [
  {
    label: 'NPM package',
    text: 'agora-realtime-react is the standalone SDK boundary: hooks, typed RTC state, voice meters, and reusable voice UI primitives.',
  },
  {
    label: 'AI SDK adjacent',
    text: 'The hook shape is familiar to Vercel AI SDK realtime users, while the media plane stays on Agora RTC instead of an AI SDK WebSocket provider.',
  },
  {
    label: 'Agent apps',
    text: 'Use it for voice-first support, tutoring, concierge, interview, and sales agent experiences backed by Agora ConvoAI or AI Studio pipelines.',
  },
];

const packageFeatures = [
  'useAgoraRealtime for browser-side Agora RTC session state',
  'useVoiceMeter for microphone or remote audio level analysis',
  'VoiceRingButton for human and AI voice activity visualization',
  'typed setup contracts for your own server routes',
];

const deployChecklist = [
  'Create an Agora project and copy the App ID plus App Certificate.',
  'Publish an AI Studio pipeline and copy its pipeline ID.',
  'Deploy the template on Vercel with AGORA_APP_ID, AGORA_APP_CERTIFICATE, and AGORA_CONVOAI_PIPELINE_ID.',
];

const uiChecklist = [
  'Install the registry item with shadcn.',
  'Render VoiceRingButton from your shadcn UI alias.',
  'Feed human and AI levels from useVoiceMeter or your own audio analysis.',
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <header className="site-nav" aria-label="Primary">
        <a className="brand-mark" href="/">
          <span className="brand-dot" aria-hidden="true" />
          Agora Agent Pipeline
        </a>
        <nav className="nav-links">
          <a href="#sdk">SDK</a>
          <a href="#package">Package</a>
          <a href="#deploy">Deploy</a>
          <a href="#ui">UI</a>
        </nav>
      </header>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Standalone npm SDK for Agora realtime agents</p>
          <h1 id="hero-title">Agora Realtime React</h1>
          <p className="hero-lede">
            A publishable React package for Agora-powered voice agents, with AI-SDK-like frontend ergonomics, Agora RTC media, and reusable voice UI primitives.
          </p>
        </div>

        <DemoVoiceShowcase />
      </section>

      <section className="pipeline-section" id="sdk" aria-label="SDK and template overview">
        {pipelineSteps.map((step) => (
          <article className="pipeline-card" key={step.label}>
            <span>{step.label}</span>
            <p>{step.text}</p>
          </article>
        ))}
      </section>

      <section className="template-section" id="package">
        <div>
          <p className="eyebrow">Package boundary</p>
          <h2>Publish the runtime once, reuse it across every agent app.</h2>
        </div>
        <div className="package-copy">
          <p>
            The npm package owns the browser realtime runtime. Templates and product apps own credentials, server routes, pipeline configuration, and visual composition.
          </p>
          <ul className="package-list">
            {packageFeatures.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
          <a className="text-link" href="/docs/agora-realtime-react-package">Read package guide</a>
        </div>
      </section>

      <section className="journey-section" aria-label="User journeys">
        <article className="journey-panel" id="deploy">
          <div className="journey-copy">
            <p className="eyebrow">Journey 1</p>
            <h2>Deploy your own voice agent.</h2>
            <p>
              Publish a pipeline in Agora AI Studio, then deploy the template on Vercel. The server route owns token generation and starts the ConvoAI agent with your published pipeline ID.
            </p>
          </div>
          <ol className="journey-list">
            {deployChecklist.map((item) => <li key={item}>{item}</li>)}
          </ol>
          <pre className="command-block"><code>{`AGORA_APP_ID=...
AGORA_APP_CERTIFICATE=...
AGORA_CONVOAI_PIPELINE_ID=...`}</code></pre>
          <a className="text-link" href="/docs/deploy-agent-pipeline">Read deployment guide</a>
        </article>

        <article className="journey-panel" id="ui">
          <div className="journey-copy">
            <p className="eyebrow">Journey 2</p>
            <h2>Install only the voice UI.</h2>
            <p>
              The shadcn registry endpoint emits the voice ring and meter hook from the SDK source of truth. Product teams can install the UI without adopting the agent template.
            </p>
          </div>
          <ol className="journey-list">
            {uiChecklist.map((item) => <li key={item}>{item}</li>)}
          </ol>
          <pre className="command-block"><code>{`npx shadcn@latest add \\
  https://agora-realtime-agent.vercel.app/r/voice-ring-button.json`}</code></pre>
          <a className="text-link" href="/docs/install-voice-ring-with-shadcn">Read shadcn guide</a>
        </article>
      </section>
    </main>
  );
}
