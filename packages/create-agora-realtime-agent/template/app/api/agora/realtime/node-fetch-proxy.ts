import { ProxyAgent, setGlobalDispatcher } from 'undici';

let proxyConfigured = false;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function configureNodeFetchProxy() {
  if (proxyConfigured) return;
  proxyConfigured = true;

  const proxy = env('HTTPS_PROXY')
    ?? env('https_proxy')
    ?? env('HTTP_PROXY')
    ?? env('http_proxy');
  if (!proxy) return;
  setGlobalDispatcher(new ProxyAgent(proxy));
}
