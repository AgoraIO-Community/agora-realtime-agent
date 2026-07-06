import type { NextConfig } from 'next';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

const nextConfig: NextConfig = {
  outputFileTracingRoot: workspaceRoot,
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      'agora-realtime-react': '../../packages/agora-realtime-react/dist/index.js',
    },
    root: workspaceRoot,
  },
};

export default nextConfig;
