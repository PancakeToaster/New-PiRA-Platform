import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/courses`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/events`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/history`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/join`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/wiki`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ];

  // Dynamic blog posts
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blog.findMany({
      where: { isDraft: false, publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
    });
    blogPages = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch {
    // Database may not be available during build
  }

  // Dynamic wiki pages
  let wikiPages: MetadataRoute.Sitemap = [];
  try {
    const nodes = await prisma.knowledgeNode.findMany({
      where: { isPublished: true },
      select: { id: true, updatedAt: true },
    });
    wikiPages = nodes.map((node) => ({
      url: `${SITE_URL}/wiki/${node.id}`,
      lastModified: node.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
  } catch {
    // Database may not be available during build
  }

  // Public student portfolios
  let portfolioPages: MetadataRoute.Sitemap = [];
  try {
    const students = await prisma.portfolioItem.findMany({
      where: { isPublic: true },
      select: { studentId: true, updatedAt: true },
      distinct: ['studentId'],
    });
    portfolioPages = students.map((item) => ({
      url: `${SITE_URL}/portfolio/${item.studentId}`,
      lastModified: item.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }));
  } catch {
    // Database may not be available during build
  }

  return [...staticPages, ...blogPages, ...wikiPages, ...portfolioPages];
}
