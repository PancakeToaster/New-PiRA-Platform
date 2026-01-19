import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { User, GraduationCap, School, Calendar, Mail } from 'lucide-react';
import Link from 'next/link';

export default async function ParentStudentsPage() {
  const user = await getCurrentUser();

  if (!user?.profiles?.parent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Parent profile not found</p>
      </div>
    );
  }

  const parentProfile = await prisma.parentProfile.findUnique({
    where: { id: user.profiles.parent },
    include: {
      students: {
        include: {
          student: {
            include: {
              user: true,
              enrollments: {
                include: {
                  course: true,
                },
                where: {
                  status: 'active',
                },
              },
            },
          },
        },
      },
    },
  });

  if (!parentProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Parent profile not found</p>
      </div>
    );
  }

  const students = parentProfile.students.map((ps) => ps.student);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-600 mt-2">
          View and manage information about your enrolled students
        </p>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Students Linked
            </h3>
            <p className="text-gray-600">
              No students are currently linked to your account. Please contact
              the academy if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/parent/students/${student.id}`}
              className="block"
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-sky-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {student.user.firstName} {student.user.lastName}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {student.user.email}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {student.grade && (
                      <div className="flex items-center text-gray-600">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        <span>Grade {student.grade}</span>
                      </div>
                    )}
                    {student.school && (
                      <div className="flex items-center text-gray-600">
                        <School className="w-4 h-4 mr-2" />
                        <span>{student.school}</span>
                      </div>
                    )}
                    {student.dateOfBirth && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          Born:{' '}
                          {new Date(student.dateOfBirth).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700">
                        Active Enrollments
                      </p>
                      {student.enrollments.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {student.enrollments.slice(0, 3).map((enrollment) => (
                            <span
                              key={enrollment.id}
                              className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-full"
                            >
                              {enrollment.course.title}
                            </span>
                          ))}
                          {student.enrollments.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{student.enrollments.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          No active courses
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
