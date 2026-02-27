import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import HomeClient from '@/components/home/HomeClient';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Home',
  description: 'PiRA offers hands-on robotics education for students of all ages. Explore courses, competitions, and programs that build real-world skills.',
  openGraph: {
    title: 'PiRA - Premier Robotics Academy',
    description: 'Hands-on robotics education for students of all ages. Explore courses, competitions, and programs that build real-world skills.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PiRA - Premier Robotics Academy',
    description: 'Hands-on robotics education for students of all ages. Explore courses, competitions, and programs that build real-world skills.',
  }
};

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

async function getHomeContent() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'home_content' },
  });

  if (!setting || !setting.value) {
    // Return default structure if not found
    return {
      stats: {
        studentsTaught: "5,000+",
        yearsExperience: "15+",
        awardsWon: "50+",
        programLevels: "3"
      },
      handsOn: {
        title: "Hands-On Learning",
        description: "Real-world projects and competitions that develop critical thinking and problem-solving skills."
      },
      competition: {
        title: "Competing & Winning",
        description: "Our teams consistently excel in robotics competitions and innovation challenges."
      },
      programs: {
        title: "Featured Programs",
        description: "Comprehensive robotics education designed for every skill level"
      },
      events: {
        title: "Upcoming Events",
        description: "Join us for workshops and competitions"
      },
      cta: {
        title: "Ready to Start Your Journey?",
        description: "Join our community of young innovators and start building the future today",
        buttonText: "Get Started Today"
      }
    };
  }

  try {
    return JSON.parse(setting.value);
  } catch (e) {
    console.error('Failed to parse home_content', e);
    return {};
  }
}

export default async function HomePage() {
  const [courses, activities, testimonials, companyInfo, homeContent] = await Promise.all([
    getFeaturedCourses(),
    getRecentActivities(),
    getTestimonials(),
    getCompanyInfo(),
    getHomeContent(),
  ]);

  return (
    <HomeClient
      initialCourses={courses}
      initialActivities={activities}
      initialTestimonials={testimonials}
      companyInfo={companyInfo}
      homeContent={homeContent}
      footer={<Footer />}
    />
  );
}
