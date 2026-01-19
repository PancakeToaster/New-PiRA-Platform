import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { ClipboardList, TrendingUp, Award, Calendar, GraduationCap } from 'lucide-react';

export default async function LMSDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const isStudent = user.roles?.includes('Student');
  const isTeacher = user.roles?.includes('Teacher');

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
    const teacherCourses = await prisma.course.count({
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
        return 'bg-red-500';
      case 'deadline':
        return 'bg-orange-500';
      case 'meeting':
        return 'bg-violet-500';
      case 'class':
        return 'bg-sky-500';
      case 'practice':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        {isTeacher ? 'Teacher Dashboard' : 'Student Dashboard'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isTeacher ? 'Your Courses' : 'Enrolled Courses'}
                </p>
                <p className="text-3xl font-bold">{stats.enrolledCourses}</p>
              </div>
              <GraduationCap className="w-12 h-12 text-sky-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isTeacher ? 'Created Assignments' : 'Assignments'}
                </p>
                <p className="text-3xl font-bold">{stats.assignments}</p>
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
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-3xl font-bold">{stats.completedAssignments}</p>
                  </div>
                  <Award className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Progress</p>
                    <p className="text-3xl font-bold">{stats.progress}%</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

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
              <p className="text-gray-600 text-center py-4">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getEventTypeColor(
                        event.eventType
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                      <p className="text-sm text-gray-600">
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
                        <p className="text-xs text-gray-500 mt-1">{event.location}</p>
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
                href="/lms/knowledge"
                className="text-sm text-sky-500 hover:text-sky-600"
              >
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentNodes.length === 0 ? (
              <p className="text-gray-600">No knowledge nodes yet.</p>
            ) : (
              <div className="space-y-3">
                {recentNodes.map((node) => (
                  <Link
                    key={node.id}
                    href={`/lms/knowledge/${node.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-semibold">{node.title}</h3>
                    <p className="text-sm text-gray-600">
                      By {node.author.firstName} {node.author.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
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
                  href="/lms/knowledge/new"
                  className="block p-4 bg-sky-50 border-2 border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                >
                  <h3 className="font-semibold text-sky-800">Create Knowledge Node</h3>
                  <p className="text-sm text-sky-600">Add new content to the knowledge base</p>
                </Link>
                <Link
                  href="/lms/assignments/new"
                  className="block p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <h3 className="font-semibold text-blue-900">Create Assignment</h3>
                  <p className="text-sm text-blue-700">Assign work to students</p>
                </Link>
              </>
            )}
            <Link
              href="/lms/knowledge"
              className="block p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <h3 className="font-semibold text-green-900">Browse Knowledge Base</h3>
              <p className="text-sm text-green-700">Explore learning materials</p>
            </Link>
            <Link
              href="/lms/courses"
              className="block p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <h3 className="font-semibold text-purple-900">My Courses</h3>
              <p className="text-sm text-purple-700">View enrolled courses</p>
            </Link>
            <Link
              href="/lms/grades"
              className="block p-4 bg-orange-50 border-2 border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <h3 className="font-semibold text-orange-900">View Grades</h3>
              <p className="text-sm text-orange-700">Check your assignment grades</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
