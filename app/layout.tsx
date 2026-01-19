import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { getSiteSettings } from '@/lib/settings';
import TestModeWrapper from '@/components/admin/TestModeWrapper';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: settings.siteName || 'Robotics Academy - Empowering Future Innovators',
    description: settings.siteDescription || 'Premier robotics education platform offering hands-on learning experiences for students of all ages.',
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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <Providers>
          <TestModeWrapper />
          {children}
        </Providers>
      </body>
    </html>
  );
}
