import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-dm-sans',
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Vigil Web Framework — Demonstration Surface',
  description:
    'The visual contract for the section library, design tokens and page archetypes. Neutral placeholder identity — no division content.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${dmSans.variable} ${playfair.variable}`}>
      {/* vf-typography = opt-in shared type scale (framework tokens.css) */}
      <body className="vf-typography">{children}</body>
    </html>
  );
}
