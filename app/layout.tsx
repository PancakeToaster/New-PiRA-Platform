import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { getSiteSettings } from '@/lib/settings';
import TestModeWrapper from '@/components/admin/TestModeWrapper';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.siteName || 'PiRA - Premier Robotics Academy';
  const description = settings.siteDescription || 'PiRA: The premier robotics education platform offering hands-on learning experiences for students of all ages.';

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      template: `%s | ${siteName}`,
      default: siteName,
    },
    description,
    icons: {
      icon: '/favicon.ico',
    },
    openGraph: {
      type: 'website',
      siteName,
      locale: 'en_US',
      description,
    },
    twitter: {
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
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
