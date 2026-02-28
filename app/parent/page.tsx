import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import AnnouncementsWidget from '@/components/parent/AnnouncementsWidget';
import UpcomingWidget, { UpcomingItem } from '@/components/parent/UpcomingWidget';
import { format } from 'date-fns';

export const revalidate = 0; // Ensure fresh data for dashboard

export default async function ParentDashboard() {
  const user = await getCurrentUser();



  // 1. Fetch Parent & Students Data
  const typedUser = user as any;
  let parentId = typedUser?.profiles?.parent;

  // FAILSAFE: If in Test Mode or Admin mode but no parent profile, fetch the first available one to demo the UI.
  if (!parentId && (typedUser.isTestMode || typedUser.roles.includes('Admin'))) {
    const demoProfile = await prisma.parentProfile.findFirst();
    if (demoProfile) {
      parentId = demoProfile.id;
    }
  }

  if (!parentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Setup Required</h2>
        <p className="text-muted-foreground mb-4">No Parent Profile found for this user.</p>
        {typedUser.roles.includes('Admin') && (
          <p className="text-sm text-primary">Admin Tip: Create at least one Parent Profile in the database to test this view.</p>
        )}
      </div>
    );
  }

  const parentProfile = await prisma.parentProfile.findUnique({
    where: { id: parentId },
    include: {
      students: {
        include: {
          student: {
            include: {
              courseEnrollments: {
                where: { status: 'active' },
                include: { lmsCourse: true }
              },
              // Although Team isn't directly on Dashboard, we need IDs for events
              // Note: Team membership is on User, not StudentProfile directly in simplest schema, 
              // but StudentProfile -> User -> TeamMember.
              user: {
                include: {
                  teamMemberships: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!parentProfile) return <div>Profile not found</div>;

  // 2. Extract Context IDs (Courses, Teams)
  const studentUserIds = parentProfile.students.map(s => s.student.userId);
  const lmsCourseIds = parentProfile.students.flatMap(s =>
    s.student.courseEnrollments.map(e => e.lmsCourseId)
  );

  // Flatten all team IDs from all students
  const teamIds = parentProfile.students.flatMap(s =>
    s.student.user.teamMemberships.map(tm => tm.teamId)
  );

  // 3. Fetch Announcements
  // System-wide OR specific to child's course/team
  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { type: 'system' },
        { type: 'course', targetId: { in: lmsCourseIds } },
        { type: 'team', targetId: { in: teamIds } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      author: {
        select: { firstName: true, lastName: true, avatar: true }
      }
    }
  });

  // Enrich announcements with context names (Course/Team names) if needed
  // Optimization: For now we just display generic or we can fetch names.
  // Ideally we map targetId to name in the UI or fetch here. 
  // Let's do a quick lookup fetch if we want perfection, but labels like "Course Update" are okay for now given time.
  // Actually, let's fetch course/team names to map them.
  const lmsCourses = await prisma.lMSCourse.findMany({ where: { id: { in: lmsCourseIds } }, select: { id: true, name: true } });
  const teams = await prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } });

  const formattedAnnouncements = announcements.map(a => {
    let contextName;
    if (a.type === 'course') contextName = lmsCourses.find(c => c.id === a.targetId)?.name;
    if (a.type === 'team') contextName = teams.find(t => t.id === a.targetId)?.name;
    return { ...a, contextName };
  });


  // 4. Fetch Upcoming items
  const now = new Date();

  // A. Calendar Events (Public + Team)
  const events = await prisma.calendarEvent.findMany({
    where: {
      startTime: { gte: now },
      OR: [
        { isPublic: true },
        { teamId: { in: teamIds } }
      ]
    },
    take: 5,
    orderBy: { startTime: 'asc' }
  });

  // B. Invoices (Unpaid)
  const invoices = await prisma.invoice.findMany({
    where: {
      parentId: parentProfile.id,
      status: { in: ['unpaid', 'overdue'] }
    },
    orderBy: { dueDate: 'asc' },
    take: 3
  });

  // C. Assignments (Due soon for students)
  // We need to query assignments where lmsCourseId is in enrolled courses
  const assignments = await prisma.assignment.findMany({
    where: {
      lmsCourseId: { in: lmsCourseIds },
      dueDate: { gte: now }
    },
    orderBy: { dueDate: 'asc' },
    take: 5
  });

  // Combine and Sort
  const combinedUpcoming = [
    ...events.map(e => ({
      id: e.id,
      title: e.title,
      date: e.startTime,
      type: e.eventType === 'competition' ? 'competition' : 'event' as const,
      description: e.eventType,
      formattedDate: format(e.startTime, 'MMM d, h:mm a'),
      href: '/parent/calendar'
    })),
    ...invoices.map(i => ({
      id: i.id,
      title: `Invoice #${i.invoiceNumber}`,
      date: i.dueDate,
      type: 'invoice' as const,
      description: `$${i.total.toFixed(2)}`,
      formattedDate: `Due ${format(i.dueDate, 'MMM d')}`,
      isOverdue: i.status === 'overdue' || (i.dueDate < now),
      href: `/parent/invoices/${i.id}`
    })),
    ...assignments.map(a => ({
      id: a.id,
      title: a.title,
      date: a.dueDate,
      type: 'assignment' as const,
      description: 'Assignment Due',
      formattedDate: `Due ${format(a.dueDate, 'MMM d, h:mm a')}`,
      href: '/parent/students'
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 7); // Show top 7 items

  return (
    <div className="max-w-7xl mx-auto">
      {/* Personalized Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {typedUser.firstName || typedUser.name || 'Parent'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here is what is happening with your students today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Center/Main Column: Announcements (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          <AnnouncementsWidget
            initialAnnouncements={formattedAnnouncements}
            totalAnnouncements={formattedAnnouncements.length}
          />

          {/* We could put the "My Students" grid here or below if needed, 
               but user emphasized "widget centered". 
               Let's keep Announcements prime real estate. 
               Maybe add Students summary as a secondary section below announcements. 
           */}
        </div>

        {/* Right Column: Upcoming (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          <UpcomingWidget items={combinedUpcoming as UpcomingItem[]} />
        </div>
      </div>
    </div>
  );
}
