import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default async function CourseGradesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user) {
        redirect('/auth/signin');
    }

    // Basic permission check (Teacher of course or Admin)
    const course = await prisma.course.findUnique({
        where: { id },
        include: {
            assignments: {
                orderBy: { dueDate: 'asc' },
            },
            enrollments: {
                include: {
                    student: {
                        include: {
                            user: true,
                            submissions: {
                                where: {
                                    assignment: {
                                        courseId: id
                                    }
                                }
                            },
                            quizAttempts: {
                                where: {
                                    quiz: {
                                        courseId: id
                                    }
                                },
                                include: {
                                    quiz: true
                                }
                            }
                        },
                    },
                },
            },
            quizzes: true
        },
    });

    if (!course) {
        notFound();
    }

    if (!userIsAdmin && course.instructorId !== user.id) {
        redirect('/admin/courses');
    }

    // Combine assignments and quizzes for columns
    const gradeableItems = [
        ...course.assignments.map(a => ({ type: 'assignment', id: a.id, title: a.title, maxPoints: a.maxPoints })),
        ...course.quizzes.map(q => ({ type: 'quiz', id: q.id, title: q.title, maxPoints: 100 })) // Quizzes usually scored out of 100
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gradebook: {course.name}</h1>
                    <p className="text-gray-500">{course.enrollments.length} Students Enrolled</p>
                </div>
                <div className="flex gap-2">
                    {/* Export button could go here */}
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px] sticky left-0 bg-white z-10">Student</TableHead>
                                {gradeableItems.map((item) => (
                                    <TableHead key={item.id} className="min-w-[150px]">
                                        <div className="flex flex-col">
                                            <span>{item.title}</span>
                                            <span className="text-xs text-gray-400 font-normal">{item.maxPoints} pts</span>
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="text-right">Total Grade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {course.enrollments.map((enrollment) => {
                                const student = enrollment.student;
                                const user = student.user;

                                // Calculate total grade (simple average for now, could be weighted)
                                let totalPointsEarned = 0;
                                let totalMaxPoints = 0;

                                return (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.image || undefined} />
                                                    <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                                                    <span className="text-xs text-gray-500">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        {gradeableItems.map((item) => {
                                            let score = null;
                                            let status = 'missing'; // missing, submitted, graded

                                            if (item.type === 'assignment') {
                                                const submission = student.submissions.find(s => s.assignmentId === item.id);
                                                if (submission) {
                                                    score = submission.grade;
                                                    status = submission.status;
                                                }
                                            } else {
                                                const attempts = student.quizAttempts.filter(qa => qa.quizId === item.id);
                                                if (attempts.length > 0) {
                                                    // Best score
                                                    const bestAttempt = attempts.reduce((prev, current) => (prev.score > current.score) ? prev : current);
                                                    score = bestAttempt.score;
                                                    status = 'graded';
                                                }
                                            }

                                            if (score !== null && item.maxPoints) {
                                                totalPointsEarned += score;
                                                totalMaxPoints += item.maxPoints;
                                            }

                                            return (
                                                <TableCell key={`${student.id}-${item.id}`}>
                                                    {score !== null ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {score}
                                                            </span>
                                                            {status === 'submitted' && (
                                                                <Badge variant="secondary" className="text-[10px] h-5 px-1">Pending</Badge>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300 text-sm">-</span>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell className="text-right font-bold">
                                            {totalMaxPoints > 0 ? Math.round((totalPointsEarned / totalMaxPoints) * 100) : 0}%
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {course.enrollments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={gradeableItems.length + 2} className="text-center py-8 text-gray-500">
                                        No students enrolled in this course.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
