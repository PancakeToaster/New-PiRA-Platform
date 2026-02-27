import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  ClipboardList,
  MessageSquare,
  FileText,
  BarChart3,
  Bell
} from 'lucide-react';

export default async function MyCoursesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const isStudent = user.roles?.includes('Student');
  const isTeacher = user.roles?.includes('Teacher');

  let courses: any[] = [];

  if (isStudent && user.profiles?.student) {
    // Get enrolled LMS courses for students
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: user.profiles.student },
      include: {
        lmsCourse: {
          include: {
            instructor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                assignments: true,
                quizzes: true,
                modules: true,
              },
            },
          },
        },
      },
    });

    courses = enrollments.map(e => e.lmsCourse);
  } else if (isTeacher) {
    // Get LMS courses taught by teacher
    courses = await prisma.lMSCourse.findMany({
      where: { instructorId: user.id },
      include: {
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            quizzes: true,
            modules: true,
          },
        },
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Courses</h1>
        <p className="text-muted-foreground">
          {isTeacher ? 'Courses you are teaching' : 'Your enrolled courses'}
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No courses found.</p>
            {isStudent && (
              <p className="mt-2 text-sm">
                Contact your administrator to enroll in courses.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} isTeacher={isTeacher} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, isTeacher }: { course: any; isTeacher: boolean }) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  {course.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
                {course.instructor && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Instructor: {course.instructor.firstName} {course.instructor.lastName}
                  </p>
                )}
                <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                  {course._count?.modules > 0 && (
                    <span>{course._count.modules} Modules</span>
                  )}
                  {course._count?.assignments > 0 && (
                    <span>{course._count.assignments} Assignments</span>
                  )}
                  {course._count?.quizzes > 0 && (
                    <span>{course._count.quizzes} Quizzes</span>
                  )}
                  {course._count?.enrollments > 0 && isTeacher && (
                    <span>{course._count.enrollments} Students</span>
                  )}
                </div>
              </div>
              <ChevronDown className="w-6 h-6 text-muted-foreground group-open:hidden" />
              <ChevronUp className="w-6 h-6 text-muted-foreground hidden group-open:block" />
            </div>
          </CardContent>
        </Card>
      </summary>

      <div className="mt-2 ml-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link
          href={`/lms/courses/${course.id}/announcements`}
          className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-300">Announcements</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400">Course updates</p>
          </div>
        </Link>

        <Link
          href={`/lms/courses/${course.id}/syllabus`}
          className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
        >
          <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <div>
            <h4 className="font-semibold text-purple-900 dark:text-purple-300">Syllabus</h4>
            <p className="text-xs text-purple-700 dark:text-purple-400">Course outline</p>
          </div>
        </Link>

        <Link
          href={`/lms/courses/${course.id}/modules`}
          className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        >
          <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div>
            <h4 className="font-semibold text-green-900 dark:text-green-300">Modules</h4>
            <p className="text-xs text-green-700 dark:text-green-400">{course._count?.modules || 0} modules</p>
          </div>
        </Link>

        <Link
          href={`/lms/courses/${course.id}/assignments`}
          className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
        >
          <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <div>
            <h4 className="font-semibold text-orange-900 dark:text-orange-300">Assignments</h4>
            <p className="text-xs text-orange-700 dark:text-orange-400">{course._count?.assignments || 0} assignments</p>
          </div>
        </Link>

        <Link
          href={`/lms/courses/${course.id}/grades`}
          className="flex items-center gap-3 p-4 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
        >
          <BarChart3 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          <div>
            <h4 className="font-semibold text-pink-900 dark:text-pink-300">Grades</h4>
            <p className="text-xs text-pink-700 dark:text-pink-400">View {isTeacher ? 'gradebook' : 'your grades'}</p>
          </div>
        </Link>

        <Link
          href={`/lms/courses/${course.id}/forum`}
          className="flex items-center gap-3 p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <div>
            <h4 className="font-semibold text-sky-900 dark:text-sky-300">Forum</h4>
            <p className="text-xs text-sky-700 dark:text-sky-400">Discussions</p>
          </div>
        </Link>
      </div>
    </details>
  );
}
