import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { GraduationCap, Clock, CheckCircle, BookOpen } from 'lucide-react';

export default async function MyCoursesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const isStudent = user.roles?.includes('Student');

  // Fetch enrolled courses
  let enrolledCourses: any[] = [];

  if (isStudent && user.profiles?.student) {
    enrolledCourses = await prisma.courseEnrollment.findMany({
      where: { studentId: user.profiles.student },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  const currentCourses = enrolledCourses.filter((e) => e.status === 'active');
  const completedCourses = enrolledCourses.filter((e) => e.status === 'completed');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Courses</h1>

      {/* Current Courses */}
      <section className="mb-10">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-sky-500" />
          <h2 className="text-xl font-semibold">Current Courses</h2>
        </div>

        {currentCourses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">You are not enrolled in any courses yet.</p>
              <Link
                href="/courses"
                className="inline-block mt-4 text-sky-500 hover:text-sky-600 font-medium"
              >
                Browse Available Courses →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCourses.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{enrollment.course.title}</CardTitle>
                    <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-full">
                      In Progress
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {enrollment.course.description || 'No description available.'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>
                      By {enrollment.course.instructor.firstName} {enrollment.course.instructor.lastName}
                    </span>
                    <span className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{enrollment.course._count.lessons} lessons</span>
                    </span>
                  </div>
                  {enrollment.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{enrollment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-sky-500 h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <Link
                    href={`/lms/courses/${enrollment.course.id}`}
                    className="block w-full text-center bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-600 transition-colors"
                  >
                    Continue Learning
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Completed Courses */}
      <section>
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-semibold">Completed Courses</h2>
        </div>

        {completedCourses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">No completed courses yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Complete your current courses to see them here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedCourses.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{enrollment.course.title}</CardTitle>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Completed
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {enrollment.course.description || 'No description available.'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>
                      By {enrollment.course.instructor.firstName} {enrollment.course.instructor.lastName}
                    </span>
                    <span className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{enrollment.course._count.lessons} lessons</span>
                    </span>
                  </div>
                  {enrollment.completedAt && (
                    <p className="text-xs text-gray-500 mb-4">
                      Completed on {new Date(enrollment.completedAt).toLocaleDateString()}
                    </p>
                  )}
                  <Link
                    href={`/lms/courses/${enrollment.course.id}`}
                    className="block w-full text-center border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Review Course
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
