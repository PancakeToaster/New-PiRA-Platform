import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { ClipboardList, TrendingUp, Award, Calendar, GraduationCap } from 'lucide-react';
import DueSoonWidget from '@/components/lms/DueSoonWidget';
import RecentGradesWidget from '@/components/lms/RecentGradesWidget';

export default async function LMSDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const isStudent = user.roles?.includes('Student');
  const isTeacher = user.roles?.includes('Teacher');

  console.log('LMS Dashboard - User roles:', user.roles);
  console.log('LMS Dashboard - isStudent:', isStudent);
  console.log('LMS Dashboard - student profile:', user.profiles?.student);

  let stats = {
    enrolledCourses: 0,
    assignments: 0,
    completedAssignments: 0,
    progress: 0,
  };

  if (isStudent && user.profiles?.student) {
    const enrolledCourses = await prisma.courseEnrollment.count({
      where: { studentId: user.profiles.student },
    });

    const studentAssignments = await prisma.assignment.count({
      where: {
        OR: [
          { studentId: user.profiles.student },
          { studentId: null }, // All-student assignments
        ],
      },
    });

    const completedAssignments = await prisma.assignmentSubmission.count({
      where: {
        studentId: user.profiles.student,
        status: 'graded',
      },
    });

    const progressRecords = await prisma.studentProgress.findMany({
      where: { studentId: user.profiles.student },
    });

    const totalProgress = progressRecords.reduce((acc, p) => acc + p.progress, 0);
    const avgProgress = progressRecords.length > 0 ? totalProgress / progressRecords.length : 0;

    stats = {
      enrolledCourses,
      assignments: studentAssignments,
      completedAssignments,
      progress: Math.round(avgProgress),
    };
  }

  if (isTeacher && user.profiles?.teacher) {
    const teacherCourses = await prisma.lMSCourse.count({
      where: { instructorId: user.id },
    });

    const teacherAssignments = await prisma.assignment.count({
      where: { teacherId: user.id },
    });

    stats = {
      enrolledCourses: teacherCourses,
      assignments: teacherAssignments,
      completedAssignments: 0,
      progress: 0,
    };
  }

  // Fetch upcoming events
  const now = new Date();
  const upcomingEvents = await prisma.calendarEvent.findMany({
    where: {
      startTime: { gte: now },
      isPublic: true,
    },
    orderBy: { startTime: 'asc' },
    take: 5,
  });

  const recentNodes = await prisma.knowledgeNode.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'competition':
        return 'bg-red-500 dark:bg-red-600';
      case 'deadline':
        return 'bg-orange-500 dark:bg-orange-600';
      case 'meeting':
        return 'bg-violet-500 dark:bg-violet-600';
      case 'class':
        return 'bg-sky-500 dark:bg-sky-600';
      case 'practice':
        return 'bg-green-500 dark:bg-green-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-foreground">
        {isTeacher ? 'Teacher Dashboard' : 'Student Dashboard'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isTeacher ? 'Your Courses' : 'Enrolled Courses'}
                </p>
                <p className="text-3xl font-bold text-foreground">{stats.enrolledCourses}</p>
              </div>
              <GraduationCap className="w-12 h-12 text-sky-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isTeacher ? 'Created Assignments' : 'Assignments'}
                </p>
                <p className="text-3xl font-bold text-foreground">{stats.assignments}</p>
              </div>
              <ClipboardList className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {isStudent && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold text-foreground">{stats.completedAssignments}</p>
                  </div>
                  <Award className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Progress</p>
                    <p className="text-3xl font-bold text-foreground">{stats.progress}%</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Due Soon & Recent Grades Widgets - Students Only */}
      {isStudent && user.profiles?.student && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Due Soon Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-orange-500" />
                <span>Due Soon</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DueSoonWidget studentId={user.profiles.student} />
            </CardContent>
          </Card>

          {/* Recent Grades Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-green-500" />
                <span>Recent Grades & Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentGradesWidget studentId={user.profiles.student} />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events Calendar Widget */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-sky-500" />
                <span>Upcoming Events</span>
              </CardTitle>
              <Link
                href="/calendar"
                className="text-sm text-sky-500 hover:text-sky-600"
              >
                View Calendar
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getEventTypeColor(
                        event.eventType
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.startTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {!event.allDay && (
                          <> at {new Date(event.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}</>
                        )}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground mt-1">{event.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Knowledge Nodes</CardTitle>
              <Link
                href="/wiki"
                className="text-sm text-sky-500 hover:text-sky-600"
              >
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentNodes.length === 0 ? (
              <p className="text-muted-foreground">No knowledge nodes yet.</p>
            ) : (
              <div className="space-y-3">
                {recentNodes.map((node) => (
                  <Link
                    key={node.id}
                    href={`/wiki/${node.id}`}
                    className="block p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <h3 className="font-semibold text-foreground">{node.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      By {node.author.firstName} {node.author.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {new Date(node.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isTeacher && (
              <>
                <Link
                  href="/wiki"
                  className="block p-4 bg-sky-50 border-2 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
                >
                  <h3 className="font-semibold text-sky-800 dark:text-sky-300">Create Knowledge Node</h3>
                  <p className="text-sm text-sky-600 dark:text-sky-400">Go to Wiki to add content</p>
                </Link>
                <Link
                  href="/admin/courses"
                  className="block p-4 bg-blue-50 border-2 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300">Create Assignment</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">Select a course to add assignment</p>
                </Link>
              </>
            )}
            <Link
              href="/wiki"
              className="block p-4 bg-green-50 border-2 border-green-200 dark:bg-green-900/20 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <h3 className="font-semibold text-green-900 dark:text-green-300">Browse Knowledge Base</h3>
              <p className="text-sm text-green-700 dark:text-green-400">Explore learning materials</p>
            </Link>
            <Link
              href="/lms/courses"
              className="block p-4 bg-purple-50 border-2 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <h3 className="font-semibold text-purple-900 dark:text-purple-300">My Courses</h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">View enrolled courses</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
