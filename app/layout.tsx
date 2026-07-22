import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campaign Automation',
  description: 'SMS and WhatsApp campaign automation module',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
