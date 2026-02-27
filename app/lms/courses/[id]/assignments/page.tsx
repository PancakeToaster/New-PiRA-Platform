import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default async function CourseAssignmentsPage({
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
            assignments: {
                orderBy: { dueDate: 'asc' },
            },
        },
    });

    if (!course) {
        return <div>Course not found</div>;
    }

    const isStudent = user.roles?.includes('Student');

    // Get submissions if student
    let submissions: any[] = [];
    if (isStudent && user.profiles?.student) {
        submissions = await prisma.assignmentSubmission.findMany({
            where: {
                studentId: user.profiles.student,
                assignment: {
                    lmsCourseId: id,
                },
            },
        });
    }

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
                    <h1 className="text-3xl font-bold">{course.name} - Assignments</h1>
                    <p className="text-muted-foreground">Course assignments and submissions</p>
                </div>
            </div>

            {course.assignments.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No assignments available yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {course.assignments.map((assignment) => {
                        const submission = submissions.find((s) => s.assignmentId === assignment.id);
                        const isPastDue = new Date(assignment.dueDate) < new Date();

                        return (
                            <Card key={assignment.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <ClipboardList className="w-5 h-5 text-orange-600" />
                                                {assignment.title}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}{' '}
                                                {isPastDue && (
                                                    <span className="text-red-600 dark:text-red-400 font-medium">(Past Due)</span>
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Points: {assignment.maxPoints}
                                            </p>
                                        </div>
                                        {isStudent && submission && (
                                            <div className="text-right">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm ${submission.status === 'graded'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                        : submission.status === 'submitted'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : 'bg-muted text-muted-foreground'
                                                        }`}
                                                >
                                                    {submission.status}
                                                </span>
                                                {submission.grade !== null && (
                                                    <p className="text-sm font-medium mt-2">
                                                        Grade: {submission.grade} / {assignment.maxPoints}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 dark:text-gray-300">{assignment.description}</p>
                                    <div className="mt-4">
                                        <Link href={`/lms/assignments/${assignment.id}`}>
                                            <Button size="sm">
                                                {isStudent ? 'View Assignment' : 'Manage Assignment'}
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
