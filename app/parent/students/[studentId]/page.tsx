import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  User,
  GraduationCap,
  School,
  Calendar,
  Mail,
  Phone,
  BookOpen,
  Trophy,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: { studentId: string };
}

export default async function StudentDetailPage({ params }: Props) {
  const user = await getCurrentUser();

  if (!user?.profiles?.parent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Parent profile not found</p>
      </div>
    );
  }

  // Check if this student belongs to this parent
  const parentStudent = await prisma.parentStudent.findFirst({
    where: {
      parentId: user.profiles.parent,
      studentId: params.studentId,
    },
  });

  if (!parentStudent) {
    notFound();
  }

  const student = await prisma.studentProfile.findUnique({
    where: { id: params.studentId },
    include: {
      user: true,
      courseEnrollments: {
        include: {
          lmsCourse: true,
        },
        orderBy: { enrolledAt: 'desc' },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const activeEnrollments = student.courseEnrollments.filter(
    (e) => e.status === 'active'
  );
  const completedEnrollments = student.courseEnrollments.filter(
    (e) => e.status === 'completed'
  );

  return (
    <div>
      <Link
        href="/parent/students"
        className="inline-flex items-center text-sky-600 hover:text-sky-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Students
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {student.user.avatar ? (
                  <img
                    src={student.user.avatar}
                    alt={`${student.user.firstName} ${student.user.lastName}`}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-sky-600" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {student.user.firstName} {student.user.lastName}
              </h1>
              <p className="text-gray-500">Student</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Mail className="w-5 h-5 mr-3 text-gray-400" />
                <span className="text-sm">{student.user.email}</span>
              </div>

              {student.grade && (
                <div className="flex items-center text-gray-600">
                  <GraduationCap className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-sm">Grade {student.grade}</span>
                </div>
              )}
              {student.school && (
                <div className="flex items-center text-gray-600">
                  <School className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-sm">{student.school}</span>
                </div>
              )}
              {student.dateOfBirth && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-sm">
                    {new Date(student.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>


          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="w-8 h-8 text-sky-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{activeEnrollments.length}</p>
                <p className="text-sm text-gray-500">Active Courses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {completedEnrollments.length}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-sky-500" />
                Active Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeEnrollments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No active course enrollments
                </p>
              ) : (
                <div className="space-y-3">
                  {activeEnrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {enrollment.lmsCourse.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Enrolled:{' '}
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                        {enrollment.progress !== null && (
                          <p className="text-sm text-gray-500 mt-1">
                            Progress: {enrollment.progress}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Courses */}
          {completedEnrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-green-500" />
                  Completed Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedEnrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {enrollment.lmsCourse.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Completed:{' '}
                          {enrollment.completedAt
                            ? new Date(
                              enrollment.completedAt
                            ).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
