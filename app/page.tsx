import { prisma } from '@/lib/prisma';
import HomeClient from '@/components/home/HomeClient';
import Footer from '@/components/layout/Footer';

export const revalidate = 3600; // Revalidate every hour

async function getCompanyInfo() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'company_info' },
  });

  if (!setting || !setting.value) {
    // Fallback if not found (though seed should ensure it exists)
    return {
      name: 'PLAYIDEAs',
      tagline: 'No Limits, Just Imagination',
      mission: 'Creating transformative learning experiences that inspire creativity and innovation',
    };
  }

  try {
    const data = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
    return {
      name: data.name,
      tagline: data.tagline,
      mission: data.mission,
      contact: data.contact,
    };
  } catch (e) {
    console.error('Failed to parse company_info', e);
    return {
      name: 'PLAYIDEAs',
      tagline: 'No Limits, Just Imagination',
      mission: 'Default Mission',
    };
  }
}

async function getFeaturedCourses() {
  return prisma.course.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }, // or however you want to order them
    take: 3,
  });
}

async function getRecentActivities() {
  return prisma.activity.findMany({
    where: {
      date: {
        gte: new Date(), // Only future or today
      },
    },
    orderBy: { date: 'asc' },
    take: 3,
  });
}

async function getTestimonials() {
  return prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    take: 3,
  });
}

export default async function HomePage() {
  const [courses, activities, testimonials, companyInfo] = await Promise.all([
    getFeaturedCourses(),
    getRecentActivities(),
    getTestimonials(),
    getCompanyInfo(),
  ]);

  return (
    <HomeClient
      initialCourses={courses}
      initialActivities={activities}
      initialTestimonials={testimonials}
      companyInfo={companyInfo}
      footer={<Footer />}
    />
  );
}
