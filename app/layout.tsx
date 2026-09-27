import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'], variable: '--font-outfit' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://offstagepr.in'),
  title: { default: 'Off Stage Productions — Events · Productions · Live experiences', template: '%s · Off Stage Productions' },
  description:
    'A full-service production team for festivals, brand launches, concerts and celebrations — concept, stage, light, sound and every cue in between.',
  icons: { icon: '/assets/logo.png' },
  openGraph: { type: 'website', siteName: 'Off Stage Productions', images: ['/assets/logo.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
