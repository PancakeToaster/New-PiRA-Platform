import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Lock, Globe, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default async function CourseForumPage({
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
    });

    if (!course) {
        return <div>Course not found</div>;
    }

    const isTeacher = user.roles?.includes('Teacher') && course.instructorId === user.id;

    // Get threads where user is either:
    // 1. Creator
    // 2. Participant (in private threads)
    // 3. Course member (for public threads)
    const threads = await prisma.forumThread.findMany({
        where: {
            lmsCourseId: id,
            OR: [
                { isPublic: true },
                { creatorId: user.id },
                {
                    participants: {
                        some: {
                            userId: user.id,
                        },
                    },
                },
                // Teachers can see all threads in their courses
                ...(isTeacher ? [{ lmsCourseId: id }] : []),
            ],
        },
        include: {
            creator: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
            participants: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    posts: true,
                },
            },
        },
        orderBy: [
            { isPinned: 'desc' },
            { updatedAt: 'desc' },
        ],
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/lms/courses">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Courses
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{course.name} - Forum</h1>
                        <p className="text-muted-foreground">Course discussions and Q&A</p>
                    </div>
                </div>
                <Link href={`/lms/courses/${id}/forum/new`}>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Thread
                    </Button>
                </Link>
            </div>

            {threads.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                        <p>No forum threads yet.</p>
                        <p className="mt-2 text-sm">Start a discussion by creating a new thread.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {threads.map((thread) => (
                        <Link key={thread.id} href={`/lms/courses/${id}/forum/${thread.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {thread.isPinned && (
                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-medium rounded">
                                                        Pinned
                                                    </span>
                                                )}
                                                {thread.isLocked && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs font-medium rounded">
                                                        Locked
                                                    </span>
                                                )}
                                                {thread.isPublic ? (
                                                    <span title="Public thread">
                                                        <Globe className="w-4 h-4 text-green-600" />
                                                    </span>
                                                ) : (
                                                    <span title="Private thread">
                                                        <Lock className="w-4 h-4 text-muted-foreground" />
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-lg text-foreground mb-1">
                                                {thread.title}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>
                                                    By {thread.creator.firstName} {thread.creator.lastName}
                                                </span>
                                                <span>•</span>
                                                <span>{thread._count.posts} replies</span>
                                                {!thread.isPublic && thread.participants.length > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {thread.participants.length} participant{thread.participants.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </>
                                                )}
                                                <span>•</span>
                                                <span>{new Date(thread.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
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
