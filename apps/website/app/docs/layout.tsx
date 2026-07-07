import type { ReactNode } from 'react';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="docs-shell">
      <header className="site-nav docs-nav" aria-label="Docs navigation">
        <a className="brand-mark" href="/">
          <span className="brand-dot" aria-hidden="true" />
          Agora Voice Agents
        </a>
        <nav className="nav-links">
          <a href="/">Demo</a>
          <a href="/docs/agora-realtime-react-package">Package</a>
          <a href="/docs/use-with-vercel-ai-sdk">AI SDK</a>
          <a href="/docs/deploy-agent-pipeline">Deploy</a>
          <a href="/docs/install-voice-ring-with-shadcn">UI</a>
        </nav>
      </header>

      <div className="docs-layout">
        <aside className="docs-sidebar" aria-label="Documentation paths">
          <div className="docs-sidebar-panel">
            <span>Guides</span>
            <a href="/docs/agora-realtime-react-package">NPM package</a>
            <a href="/docs/use-with-vercel-ai-sdk">Use with Vercel AI SDK</a>
            <a href="/docs/deploy-agent-pipeline">Deploy pipeline</a>
            <a href="/docs/install-voice-ring-with-shadcn">Install voice UI</a>
          </div>
        </aside>

        <article className="markdown-body">
          {children}
        </article>
      </div>
    </main>
  );
}
