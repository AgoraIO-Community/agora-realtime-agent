import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { GoogleAnalytics } from '../components/google-analytics';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agora Voice Agents for Vercel',
  description: 'Build Agora-powered realtime voice agents with a Vercel-hosted React app, server routes, npm SDK, and shadcn voice UI.',
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
