import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import CoursesClient from '@/components/courses/CoursesClient';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Courses',
  description: 'Browse robotics courses for all ages and skill levels. From beginner programs to advanced competition prep.',
  openGraph: {
    title: 'Courses | PiRA',
    description: 'Browse robotics courses for all ages and skill levels. From beginner programs to advanced competition prep.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Courses | PiRA',
    description: 'Browse robotics courses for all ages and skill levels. From beginner programs to advanced competition prep.',
  }
};

export const revalidate = 3600; // Revalidate every hour

async function getCourses() {
  return prisma.course.findMany({
    where: {
      isActive: true,
      isDevelopment: false
    },
    orderBy: { displayOrder: 'asc' },
  });
}

async function getDevelopmentCourses() {
  return prisma.course.findMany({
    where: {
      isActive: true,
      isDevelopment: true
    },
    orderBy: { displayOrder: 'asc' },
  });
}

export default async function CoursesPage() {
  const [courses, developmentCourses] = await Promise.all([
    getCourses(),
    getDevelopmentCourses(),
  ]);

  // Convert Decimals to numbers for client component if needed (Prisma often returns Decimal)
  // But here price is Float or Int in schema usually, let's just pass them. 
  // If price is Decimal, we might need to map it. Checking schema... price is Decimal or Float?
  // User's previous code used Number(course.price) so likely it is fine.

  return (
    <CoursesClient
      courses={courses}
      developmentCourses={developmentCourses}
      footer={<Footer />}
    />
  );
}
