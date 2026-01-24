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
        <p className="text-gray-600">
          {isTeacher ? 'Courses you are teaching' : 'Your enrolled courses'}
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-600">
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
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {course.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {course.description}
                </p>
                {course.instructor && (
                  <p className="text-sm text-gray-500 mt-2">
                    Instructor: {course.instructor.firstName} {course.instructor.lastName}
                  </p>
                )}
                <div className="flex gap-4 mt-3 text-sm text-gray-600">
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
              <ChevronDown className="w-6 h-6 text-gray-400 group-open:hidden" />
              <ChevronUp className="w-6 h-6 text-gray-400 hidden group-open:block" />
            </div>
          </CardContent>
        </Card>
      </summary>

      <div className="mt-2 ml-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link
          href={`/lms/courses/${course.id}/announcements`}
          className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-blue-600" />
          <div>
            <h4 className="font-semibold text-blue-900">Announcements</h4>
            <p className="text-xs text-blue-700">Course updates</p>
          </div>
        </Link>

        <Link
          href={`/lms/courses/${course.id}/syllabus`}
          className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <FileText className="w-5 h-5 text-purple-600" />
          <div>
            <h4 className="font-semibold text-purple-900">Syllabus</h4>
            <p className="text-xs text-purple-700">Course outline</p>
          </div>
        </Link>

        <Link
          href={`/lms/courses/${course.id}/modules`}
          className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
        >
          <BookOpen className="w-5 h-5 text-green-600" />
          <div>
            <h4 className="font-semibold text-green-900">Modules</h4>
            <p className="text-xs text-green-700">{course._count?.modules || 0} modules</p>
          </div>
        </Link>

        <Link
          href={`/lms/courses/${course.id}/assignments`}
          className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <ClipboardList className="w-5 h-5 text-orange-600" />
          <div>
            <h4 className="font-semibold text-orange-900">Assignments</h4>
            <p className="text-xs text-orange-700">{course._count?.assignments || 0} assignments</p>
          </div>
        </Link>

        <Link
          href={`/lms/courses/${course.id}/grades`}
          className="flex items-center gap-3 p-4 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors"
        >
          <BarChart3 className="w-5 h-5 text-pink-600" />
          <div>
            <h4 className="font-semibold text-pink-900">Grades</h4>
            <p className="text-xs text-pink-700">View {isTeacher ? 'gradebook' : 'your grades'}</p>
          </div>
        </Link>

        <Link
          href={`/lms/courses/${course.id}/forum`}
          className="flex items-center gap-3 p-4 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-sky-600" />
          <div>
            <h4 className="font-semibold text-sky-900">Forum</h4>
            <p className="text-xs text-sky-700">Discussions</p>
          </div>
        </Link>
      </div>
    </details>
  );
}
