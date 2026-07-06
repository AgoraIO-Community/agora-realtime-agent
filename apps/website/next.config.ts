import type { NextConfig } from 'next';
import createMdx from '@next/mdx';

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  turbopack: {
    resolveAlias: {
      'agora-realtime-react': '../../packages/agora-realtime-react/dist/index.js',
    },
  },
};

const withMdx = createMdx();

export default withMdx(nextConfig);
