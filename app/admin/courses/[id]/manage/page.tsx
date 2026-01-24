import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import CourseEnrollments from '@/components/admin/CourseEnrollments';

export default async function CourseManagePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('Admin')) {
        return <div>Unauthorized</div>;
    }

    const course = await prisma.lMSCourse.findUnique({
        where: { id },
        include: {
            instructor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
            _count: {
                select: {
                    enrollments: true,
                    modules: true,
                    assignments: true,
                },
            },
        },
    });

    if (!course) {
        return <div>Course not found</div>;
    }

    // Get all teachers for instructor selection
    const teachers = await prisma.user.findMany({
        where: {
            roles: {
                some: {
                    role: {
                        name: 'Teacher',
                    },
                },
            },
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/courses">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Courses
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">{course.name}</h1>
                    <p className="text-gray-600">Manage course settings and enrollments</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Enrolled Students</p>
                                <p className="text-3xl font-bold">{course._count.enrollments}</p>
                            </div>
                            <Users className="w-12 h-12 text-sky-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Modules</p>
                                <p className="text-3xl font-bold">{course._count.modules}</p>
                            </div>
                            <BookOpen className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Assignments</p>
                                <p className="text-3xl font-bold">{course._count.assignments}</p>
                            </div>
                            <BookOpen className="w-12 h-12 text-orange-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Course Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Instructor</p>
                            <p className="text-gray-900">
                                {course.instructor
                                    ? `${course.instructor.firstName} ${course.instructor.lastName}`
                                    : 'Not assigned'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Status</p>
                            <span
                                className={`inline-block px-2 py-1 rounded-full text-xs ${course.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                {course.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="pt-4">
                            <Link href={`/admin/courses/${id}`}>
                                <Button variant="outline" className="w-full">
                                    Edit Course Details
                                </Button>
                            </Link>
                        </div>
                        <div>
                            <Link href={`/admin/courses/${id}/builder`}>
                                <Button className="w-full">
                                    Manage Modules & Content
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <CourseEnrollments courseId={id} />
            </div>
        </div>
    );
}
