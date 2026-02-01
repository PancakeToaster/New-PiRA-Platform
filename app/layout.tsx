import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { getSiteSettings } from '@/lib/settings';
import TestModeWrapper from '@/components/admin/TestModeWrapper';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: settings.siteName || 'PiRA - Premier Robotics Academy',
    description: settings.siteDescription || 'PiRA: The premier robotics education platform offering hands-on learning experiences for students of all ages.',
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
        <Providers>
          <TestModeWrapper />
          {children}
        </Providers>
      </body>
    </html>
  );
}
