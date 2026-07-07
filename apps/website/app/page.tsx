import { DemoVoiceShowcase } from '../components/demo-voice-showcase';

const pipelineSteps = [
  {
    label: 'Agora realtime media',
    text: 'The browser joins an Agora RTC channel directly. ConvoAI or an AI Studio pipeline joins the same channel as the agent.',
  },
  {
    label: 'Vercel app boundary',
    text: 'Next.js routes on Vercel mint the RTC token, start the agent, and keep the Agora App Certificate on the server.',
  },
  {
    label: 'React developer path',
    text: 'Use the npm package for the full runtime, or install the voice ring through shadcn when you only need the UI.',
  },
];

const packageFeatures = [
  'useAgoraRealtime for Agora RTC session state in React',
  'typed setup responses for Vercel server routes',
  'useVoiceMeter for microphone and remote audio levels',
  'VoiceRingButton for human and AI voice activity',
];

const deployChecklist = [
  'Create an Agora project and copy the App ID plus App Certificate.',
  'Publish an AI Studio pipeline and copy its pipeline ID.',
  'Deploy the Vercel template with AGORA_APP_ID, AGORA_APP_CERTIFICATE, and AGORA_CONVOAI_PIPELINE_ID.',
];

const uiChecklist = [
  'Install the registry item with shadcn.',
  'Render VoiceRingButton from your shadcn UI alias.',
  'Feed human and AI levels from useVoiceMeter or your own audio analysis.',
];

const officialResources = [
  {
    href: 'https://www.agora.io/en/',
    label: 'Agora',
    text: 'Official Agora homepage for realtime engagement and AI products.',
  },
  {
    href: 'https://docs.agora.io/en/',
    label: 'Agora Docs',
    text: 'English documentation hub for Agora product setup, SDKs, and APIs.',
  },
  {
    href: 'https://docs.agora.io/en/realtime-media/voice',
    label: 'Realtime voice docs',
    text: 'Voice calling docs for the RTC media layer used by browser sessions.',
  },
  {
    href: 'https://docs.agora.io/en/ai',
    label: 'AI and Conversational AI docs',
    text: 'Agora AI docs for agent pipelines, model configuration, and runtime concepts.',
  },
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <header className="site-nav" aria-label="Primary">
        <a className="brand-mark" href="/">
          <span className="brand-dot" aria-hidden="true" />
          Agora Voice Agents for Vercel
        </a>
        <nav className="nav-links">
          <a href="#stack">Stack</a>
          <a href="#package">Package</a>
          <a href="#deploy">Deploy</a>
          <a href="#ui">UI</a>
          <a href="#resources">Resources</a>
        </nav>
      </header>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Agora realtime voice, shipped as a Vercel app</p>
          <h1 id="hero-title">Build Agora Voice Agents for Vercel.</h1>
          <p className="hero-lede">
            Agora handles the live voice channel and ConvoAI agent. Vercel hosts the React app, server routes, and deployment flow. This repo gives you the SDK, template, and voice UI to connect both sides.
          </p>
        </div>

        <DemoVoiceShowcase />
      </section>

      <section className="pipeline-section" id="stack" aria-label="Agora and Vercel stack overview">
        {pipelineSteps.map((step) => (
          <article className="pipeline-card" key={step.label}>
            <span>{step.label}</span>
            <p>{step.text}</p>
          </article>
        ))}
      </section>

      <section className="template-section" id="package">
        <div>
          <p className="eyebrow">NPM package</p>
          <h2>React runtime for Agora agents in Vercel apps.</h2>
        </div>
        <div className="package-copy">
          <p>
            <code>agora-realtime-react</code> gives the browser a clean React API for Agora RTC. Your Vercel route owns credentials, token generation, and ConvoAI startup.
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
            <p className="eyebrow">Deploy path</p>
            <h2>Run an Agora agent from Vercel.</h2>
            <p>
              Publish a pipeline in Agora AI Studio, add the credentials to Vercel, and deploy the template. The browser gets only a scoped RTC token. The App Certificate stays server-side.
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
            <p className="eyebrow">UI path</p>
            <h2>Add the Agora voice ring to any React app.</h2>
            <p>
              The shadcn registry serves the voice ring and meter hook from the same SDK source. Use it in a Vercel app, a prototype, or an existing design system without adopting the full template.
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

      <section className="official-resources" id="resources" aria-labelledby="resources-title">
        <div className="resource-heading">
          <p className="eyebrow">Official references</p>
          <h2 id="resources-title">Build against Agora's English docs.</h2>
          <p>
            This project packages the Vercel and React path. Use Agora's official site and English documentation for product setup, RTC behavior, and AI agent configuration details.
          </p>
        </div>
        <div className="resource-grid">
          {officialResources.map((resource) => (
            <a className="resource-card" href={resource.href} key={resource.href} rel="noreferrer" target="_blank">
              <span>{resource.label}</span>
              <p>{resource.text}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
