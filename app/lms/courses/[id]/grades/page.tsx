import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { calculateGrade, GradeResult } from '@/lib/grades';

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
            quizzes: {
                orderBy: { createdAt: 'desc' }, // Or due date if exists
            }
        },
    });

    if (!course) {
        return <div>Course not found</div>;
    }

    const isStudent = user.roles?.includes('Student');
    const isTeacher = user.roles?.includes('Teacher');
    const isInstructor = course.instructorId === user.id;
    const isAdmin = user.roles?.includes('Admin');

    // Fetch quiz max points
    const quizQuestions = await prisma.quizQuestion.findMany({
        where: {
            quiz: {
                lmsCourseId: id,
            },
        },
        select: {
            quizId: true,
            points: true,
        },
    });

    const quizMaxPointsMap = new Map<string, number>();
    quizQuestions.forEach((q) => {
        const current = quizMaxPointsMap.get(q.quizId) || 0;
        quizMaxPointsMap.set(q.quizId, current + q.points);
    });

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

    const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
            quiz: {
                lmsCourseId: id
            }
        },
        select: {
            studentId: true,
            quizId: true,
            score: true,
            pointsEarned: true
        }
    });

    // Helper to get grade for a student
    const getStudentGrade = (studentId: string): GradeResult => {
        const studentSubmissions = submissions.filter(s => s.studentId === studentId);
        const studentAttempts = quizAttempts.filter(qa => qa.studentId === studentId);

        return calculateGrade(
            course,
            course.assignments,
            course.quizzes,
            studentSubmissions.map(s => ({ assignmentId: s.assignmentId, grade: s.grade })),
            studentAttempts.map(qa => ({ quizId: qa.quizId, pointsEarned: qa.pointsEarned })),
            quizMaxPointsMap
        );
    };

    // For students, show their own grades
    if (isStudent && user.profiles?.student) {
        const studentId = user.profiles.student;
        const studentSubmissions = submissions.filter(
            (s) => s.studentId === studentId
        );
        const gradeResult = getStudentGrade(studentId);

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
                        <p className="text-muted-foreground">Your assignment grades</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Grade</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-4">
                                <div className="text-4xl font-bold text-primary">
                                    {gradeResult.percentage}%
                                </div>
                                <div className="text-xl font-medium text-muted-foreground mt-2">
                                    {gradeResult.letterGrade}
                                </div>
                                {gradeResult.isWeighted && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Weighted Grading
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Assignments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {studentSubmissions.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No graded assignments yet.</p>
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
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                                        {submission.assignment.title}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs ${submission.status === 'graded'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                : submission.status === 'submitted'
                                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                                    : 'bg-muted text-muted-foreground'
                                                                }`}
                                                        >
                                                            {submission.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                        {submission.grade !== null
                                                            ? `${submission.grade} / ${submission.assignment.maxPoints}`
                                                            : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-muted-foreground">
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
                        <p className="text-muted-foreground">Manage student grades</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Gradebook</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Edit mode functionality will be added via client component
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted/50 z-10">
                                            Student
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider sticky left-[150px] bg-muted/50 z-10 border-r border-border">
                                            Course Grade
                                        </th>
                                        {course.assignments.map((assignment) => (
                                            <th
                                                key={assignment.id}
                                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                            >
                                                <div className="flex flex-col">
                                                    <span>{assignment.title}</span>
                                                    <span className="text-gray-400 font-normal">
                                                        ({assignment.maxPoints} pts)
                                                    </span>
                                                    {assignment.gradeCategory && (
                                                        <span className="text-xs text-blue-500 font-normal">
                                                            {assignment.gradeCategory}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        {course.quizzes.map((quiz) => (
                                            <th
                                                key={quiz.id}
                                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                            >
                                                <div className="flex flex-col">
                                                    <span>{quiz.title}</span>
                                                    <span className="text-gray-400 font-normal">
                                                        ({quizMaxPointsMap.get(quiz.id) || 0} pts)
                                                    </span>
                                                    {quiz.gradeCategory && (
                                                        <span className="text-xs text-blue-500 font-normal">
                                                            {quiz.gradeCategory}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-background divide-y divide-border">
                                    {course.enrollments.map((enrollment) => {
                                        const studentSubmissions = submissions.filter(
                                            (s) => s.studentId === enrollment.studentId
                                        );
                                        const gradeResult = getStudentGrade(enrollment.studentId);
                                        const quizAttemptsForStudent = quizAttempts.filter(qa => qa.studentId === enrollment.studentId);

                                        return (
                                            <tr key={enrollment.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground sticky left-0 bg-background z-10">
                                                    {enrollment.student.user.firstName}{' '}
                                                    {enrollment.student.user.lastName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground sticky left-[150px] bg-background z-10 border-r border-border">
                                                    {gradeResult.percentage}% ({gradeResult.letterGrade})
                                                </td>
                                                {course.assignments.map((assignment) => {
                                                    const submission = studentSubmissions.find(
                                                        (s) => s.assignmentId === assignment.id
                                                    );

                                                    return (
                                                        <td
                                                            key={assignment.id}
                                                            className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                                                        >
                                                            {submission?.grade !== null && submission?.grade !== undefined
                                                                ? submission.grade
                                                                : '-'}
                                                        </td>
                                                    );
                                                })}
                                                {course.quizzes.map((quiz) => {
                                                    const attempts = quizAttemptsForStudent.filter(qa => qa.quizId === quiz.id);
                                                    const bestScore = attempts.length > 0
                                                        ? Math.max(...attempts.map(a => a.pointsEarned || 0))
                                                        : null;

                                                    return (
                                                        <td
                                                            key={quiz.id}
                                                            className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                                                        >
                                                            {bestScore !== null ? bestScore : '-'}
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
