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
      prisma.pageView.groupBy({
        by: ['path'],
        _count: { path: true },
        where: { viewedAt: { gte: thirtyDaysAgo } },
        orderBy: { _count: { path: 'desc' } },
        take: 10,
      }),
    ]);

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
      pageViews: pageViewsByPath.map(pv => ({
        path: pv.path,
        count: pv._count.path,
      })),
      activityLogs,
      errorLogs,
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
