import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, FileText, Calendar, Clock, Edit, MoreVertical, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default async function CourseAssignmentsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        redirect('/auth/signin');
    }

    const course = await prisma.lMSCourse.findUnique({
        where: { id },
        include: {
            assignments: {
                orderBy: { dueDate: 'asc' },
                include: {
                    _count: {
                        select: { submissions: true }
                    },
                    lesson: {
                        select: { title: true }
                    }
                }
            }
        }
    });

    if (!course) {
        notFound();
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
                    <p className="text-muted-foreground">Manage assignments for {course.name}</p>
                </div>
                <Link href={`/admin/courses/${id}/assignments/new`}>
                    <Button variant="primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Assignment
                    </Button>
                </Link>
            </div>

            {course.assignments.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No assignments yet</h3>
                        <p className="text-muted-foreground mb-4">create your first assignment to get started.</p>
                        <Link href={`/admin/courses/${id}/assignments/new`}>
                            <Button variant="outline">
                                Create Assignment
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {course.assignments.map((assignment) => (
                        <div
                            key={assignment.id}
                            className="bg-card border-border border rounded-lg p-4 flex items-start justify-between hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                                    {new Date(assignment.dueDate) < new Date() && (
                                        <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded-full">
                                            Closed
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                    {assignment.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {assignment.maxPoints} pts
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-4 h-4" />
                                        {assignment._count.submissions} Submissions
                                    </span>
                                    {assignment.lesson && (
                                        <span className="px-2 py-0.5 bg-muted rounded text-xs text-foreground">
                                            Lesson: {assignment.lesson.title}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link href={`/admin/courses/${id}/assignments/${assignment.id}/edit`}>
                                    <Button variant="ghost" size="sm">
                                        <Edit className="w-4 h-4 text-muted-foreground" />
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
