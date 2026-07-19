import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/components/providers/AppProviders';
import { PwaStartupImages } from '@/components/pwa/PwaStartupImages';
import { copy } from '@/lib/copy';
import { darkColors, lightColors } from '@/lib/design/colors';
import './globals.css';

export const metadata: Metadata = {
  title: copy('common.brand.calsnap'),
  description: copy('onboarding.welcome.tagline'),
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: copy('common.brand.calsnap'),
    statusBarStyle: 'black-translucent',
  },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  interactiveWidget: 'overlays-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: lightColors.primary },
    { media: '(prefers-color-scheme: dark)', color: darkColors.background },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <PwaStartupImages />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
