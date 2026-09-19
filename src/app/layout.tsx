import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skylark Drones - Monday.com Business Intelligence Agent',
  description: 'AI-powered BI Agent for Monday.com Deals and Work Orders analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
