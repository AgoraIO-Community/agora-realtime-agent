import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { GoogleAnalytics } from '../components/google-analytics';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agora Voice Agents for Vercel',
  description: 'Build AI SDK-compatible Agora WebRTC voice agents with Vercel server routes, React hooks, a deployable template, and shadcn voice UI.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      </body>
    </html>
  );
}
