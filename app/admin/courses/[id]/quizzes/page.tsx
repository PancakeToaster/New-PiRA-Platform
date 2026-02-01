import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, HelpCircle, Clock, FileText, Edit, MoreVertical, Trash2, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default async function CourseQuizzesPage({
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

    const course = await prisma.lMSCourse.findUnique({
        where: { id },
        include: {
            quizzes: {
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { questions: true, attempts: true }
                    }
                }
            }
        }
    });

    if (!course) {
        notFound();
    }

    if (!userIsAdmin && course.instructorId !== user.id) {
        redirect('/admin/courses');
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
                    <p className="text-muted-foreground">Manage assessments for {course.name}</p>
                </div>
                <Link href={`/admin/courses/${id}/quizzes/new`}>
                    <Button variant="primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Quiz
                    </Button>
                </Link>
            </div>

            {course.quizzes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <BrainCircuit className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No quizzes yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first quiz to assess student knowledge.</p>
                        <Link href={`/admin/courses/${id}/quizzes/new`}>
                            <Button variant="outline">
                                Create Quiz
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {course.quizzes.map((quiz) => (
                        <div
                            key={quiz.id}
                            className="bg-card border-border border rounded-lg p-4 flex items-start justify-between hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-foreground">{quiz.title}</h3>
                                    {!quiz.isPublished && (
                                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs rounded-full">
                                            Draft
                                        </span>
                                    )}
                                </div>

                                {quiz.description && (
                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{quiz.description}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <HelpCircle className="w-3 h-3" />
                                        {quiz._count.questions} Questions
                                    </span>
                                    {quiz.timeLimit ? (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {quiz.timeLimit} mins
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            No Limit
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {quiz._count.attempts} Attempts
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link href={`/admin/courses/${id}/quizzes/${quiz.id}/builder`}>
                                    <Button variant="outline" size="sm">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Questions
                                    </Button>
                                </Link>
                                <Link href={`/admin/courses/${id}/quizzes/${quiz.id}/settings`}>
                                    <Button variant="ghost" size="sm">
                                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
