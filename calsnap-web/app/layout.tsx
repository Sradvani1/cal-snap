import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/components/providers/AppProviders';
import { copy } from '@/lib/copy';
import { lightColors } from '@/lib/design/colors';
import './globals.css';

export const metadata: Metadata = {
  title: copy('common.brand.calsnap'),
  description: copy('onboarding.welcome.tagline'),
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: copy('common.brand.calsnap') },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: lightColors.primary,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
