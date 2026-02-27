import type { Metadata } from 'next';
import PortfolioClient from './PortfolioClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

interface StudentInfo {
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export async function generateMetadata({ params }: { params: Promise<{ studentId: string }> }): Promise<Metadata> {
  const { studentId } = await params;

  try {
    const res = await fetch(`${SITE_URL}/api/portfolio/${studentId}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch portfolio');

    const data = await res.json();
    const student = data.student as StudentInfo;

    // Create base data
    const title = `${student.firstName} ${student.lastName}'s Portfolio | PiRA`;
    const description = `View ${student.firstName} ${student.lastName}'s robotics engineering portfolio and projects at the Premier Robotics Academy.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'profile',
        url: `${SITE_URL}/portfolio/${studentId}`,
        ...(student.avatar ? { images: [{ url: student.avatar }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(student.avatar ? { images: [student.avatar] } : {}),
      }
    };
  } catch (error) {
    return {
      title: 'Student Portfolio | PiRA',
      description: 'View student digital portfolio and robotics projects.',
    };
  }
}

export default async function PublicPortfolioPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return <PortfolioClient studentId={studentId} />;
}
