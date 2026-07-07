import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Agora ConvoAI Default Agent',
  description: 'A default Agora Web SDK direct RTC UI for ConvoAI sessions.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
