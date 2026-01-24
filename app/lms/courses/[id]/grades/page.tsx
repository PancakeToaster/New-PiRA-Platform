import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default async function CourseGradesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    const course = await prisma.lMSCourse.findUnique({
        where: { id },
        include: {
            instructor: true,
            enrollments: {
                include: {
                    student: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
            },
            assignments: {
                orderBy: { dueDate: 'asc' },
            },
        },
    });

    if (!course) {
        return <div>Course not found</div>;
    }

    const isStudent = user.roles?.includes('Student');
    const isTeacher = user.roles?.includes('Teacher');
    const isInstructor = course.instructorId === user.id;
    const isAdmin = user.roles?.includes('Admin');

    // Get submissions for gradebook
    const submissions = await prisma.assignmentSubmission.findMany({
        where: {
            assignment: {
                lmsCourseId: id,
            },
        },
        include: {
            assignment: true,
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
        },
    });

    // For students, show their own grades
    if (isStudent && user.profiles?.student) {
        const studentSubmissions = submissions.filter(
            (s) => s.studentId === user.profiles?.student
        );

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/lms/courses">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Courses
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{course.name} - My Grades</h1>
                        <p className="text-gray-600">Your assignment grades</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Grades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {studentSubmissions.length === 0 ? (
                            <p className="text-gray-600 text-center py-8">No graded assignments yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Assignment
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Grade
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Feedback
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {studentSubmissions.map((submission) => (
                                            <tr key={submission.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {submission.assignment.title}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs ${submission.status === 'graded'
                                                            ? 'bg-green-100 text-green-800'
                                                            : submission.status === 'submitted'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {submission.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {submission.grade !== null
                                                        ? `${submission.grade} / ${submission.assignment.maxPoints}`
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {submission.feedback || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // For teachers/instructors, show gradebook with edit mode
    if (isTeacher || isInstructor || isAdmin) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/lms/courses">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Courses
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{course.name} - Gradebook</h1>
                        <p className="text-gray-600">Manage student grades</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Gradebook</CardTitle>
                            <p className="text-sm text-gray-600">
                                Edit mode functionality will be added via client component
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                                            Student
                                        </th>
                                        {course.assignments.map((assignment) => (
                                            <th
                                                key={assignment.id}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                <div className="flex flex-col">
                                                    <span>{assignment.title}</span>
                                                    <span className="text-gray-400 font-normal">
                                                        ({assignment.maxPoints} pts)
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {course.enrollments.map((enrollment) => {
                                        const studentSubmissions = submissions.filter(
                                            (s) => s.studentId === enrollment.studentId
                                        );

                                        return (
                                            <tr key={enrollment.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                                    {enrollment.student.user.firstName}{' '}
                                                    {enrollment.student.user.lastName}
                                                </td>
                                                {course.assignments.map((assignment) => {
                                                    const submission = studentSubmissions.find(
                                                        (s) => s.assignmentId === assignment.id
                                                    );

                                                    return (
                                                        <td
                                                            key={assignment.id}
                                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                                        >
                                                            {submission?.grade !== null && submission?.grade !== undefined
                                                                ? submission.grade
                                                                : '-'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <div>Unauthorized</div>;
}
