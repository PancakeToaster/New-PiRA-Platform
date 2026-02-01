import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

export async function GET() {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Date calculations
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all data in parallel
    const [
      totalUsers,
      totalStudents,
      totalParents,
      totalTeachers,
      newUsersThisWeek,
      totalRevenue,
      revenueThisMonth,
      unpaidAmount,
      totalKnowledgeNodes,
      publishedNodes,
      totalAssignments,
      totalBlogs,
      pageViews24h,
      newContacts,
      submissionsThisWeek,
      pageViewsByPath,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.studentProfile.count(),
      prisma.parentProfile.count(),
      prisma.teacherProfile.count(),
      prisma.user.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),
      prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'paid',
          paidDate: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { not: 'paid' } },
        _sum: { total: true },
      }),
      prisma.knowledgeNode.count(),
      prisma.knowledgeNode.count({ where: { isPublished: true } }),
      prisma.assignment.count(),
      prisma.blog.count(),
      prisma.pageView.count({
        where: { viewedAt: { gte: oneDayAgo } },
      }),
      prisma.contactSubmission.count({
        where: { status: 'new' },
      }),
      prisma.assignmentSubmission.count({
        where: { submittedAt: { gte: oneWeekAgo } },
      }),
      // Get top pages with titles
      prisma.pageView.findMany({
        where: { viewedAt: { gte: thirtyDaysAgo } },
        select: {
          path: true,
          pageTitle: true,
          knowledgeNode: {
            select: { title: true }
          }
        },
        orderBy: { viewedAt: 'desc' },
        take: 1000, // Get more to group properly
      }),
    ]);

    // Process page views to group by path and get titles
    const pageViewsMap = new Map<string, { path: string; title: string | null; count: number }>();
    for (const pv of pageViewsByPath) {
      const title = pv.pageTitle || pv.knowledgeNode?.title || null;
      const existing = pageViewsMap.get(pv.path);
      if (existing) {
        existing.count++;
        // Prefer non-null titles
        if (!existing.title && title) {
          existing.title = title;
        }
      } else {
        pageViewsMap.set(pv.path, { path: pv.path, title, count: 1 });
      }
    }
    const topPageViews = Array.from(pageViewsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get referrer analytics
    const referrerData = await prisma.pageView.groupBy({
      by: ['referrerDomain'],
      _count: { referrerDomain: true },
      where: {
        viewedAt: { gte: thirtyDaysAgo },
        referrerDomain: { not: null },
      },
      orderBy: { _count: { referrerDomain: 'desc' } },
      take: 10,
    });

    const totalExternalViews = await prisma.pageView.count({
      where: {
        viewedAt: { gte: thirtyDaysAgo },
        referrerDomain: { not: null },
      },
    });

    const totalDirectViews = await prisma.pageView.count({
      where: {
        viewedAt: { gte: thirtyDaysAgo },
        referrer: null,
      },
    });

    // Fetch recent activity and error logs
    const [activityLogs, errorLogs] = await Promise.all([
      prisma.activityLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      prisma.errorLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        students: totalStudents,
        parents: totalParents,
        teachers: totalTeachers,
        newThisWeek: newUsersThisWeek,
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        thisMonth: revenueThisMonth._sum.total || 0,
        unpaid: unpaidAmount._sum.total || 0,
      },
      content: {
        knowledgeNodes: totalKnowledgeNodes,
        publishedNodes,
        assignments: totalAssignments,
        blogs: totalBlogs,
      },
      activity: {
        pageViews24h,
        newContacts,
        submissionsThisWeek,
      },
      pageViews: topPageViews.map(pv => ({
        path: pv.path,
        title: pv.title,
        count: pv.count,
      })),
      referrers: {
        topReferrers: referrerData.map(r => ({
          domain: r.referrerDomain,
          count: r._count.referrerDomain,
        })),
        externalViews: totalExternalViews,
        directViews: totalDirectViews,
      },
      activityLogs,
      errorLogs,
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
