import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft, Lock, Globe, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { notFound } from 'next/navigation';
import ForumPostForm from '@/components/lms/ForumPostForm';
import ForumPost from '@/components/lms/ForumPost';

export default async function ForumThreadPage({
    params,
}: {
    params: Promise<{ id: string; threadId: string }>;
}) {
    const { id, threadId } = await params;
    const user = await getCurrentUser();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    const course = await prisma.lMSCourse.findUnique({
        where: { id },
    });

    if (!course) {
        return notFound();
    }

    const isTeacher = user.roles?.includes('Teacher') && course.instructorId === user.id;

    // Get thread with access check
    const thread = await prisma.forumThread.findFirst({
        where: {
            id: threadId,
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
                ...(isTeacher ? [{ lmsCourseId: id }] : []),
            ],
        },
        include: {
            creator: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                },
            },
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                },
            },
            posts: {
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
            },
        },
    });

    if (!thread) {
        return notFound();
    }

    const canManage = isTeacher || thread.creatorId === user.id;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/lms/courses/${id}/forum`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Forum
                        </Button>
                    </Link>
                </div>
                {canManage && (
                    <Link href={`/lms/courses/${id}/forum/${threadId}/settings`}>
                        <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                    </Link>
                )}
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {thread.isPinned && (
                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                        Pinned
                                    </span>
                                )}
                                {thread.isLocked && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                                        Locked
                                    </span>
                                )}
                                {thread.isPublic ? (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                                        <Globe className="w-3 h-3" />
                                        Public
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                                        <Lock className="w-3 h-3" />
                                        Private
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{thread.title}</h1>
                            <div className="text-sm text-gray-600">
                                Started by {thread.creator.firstName} {thread.creator.lastName} on{' '}
                                {new Date(thread.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {!thread.isPublic && thread.participants.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Users className="w-4 h-4" />
                                <span className="font-medium">Participants:</span>
                                <span>
                                    {thread.participants.map((p) => `${p.user.firstName} ${p.user.lastName}`).join(', ')}
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-4">
                {thread.posts.map((post) => (
                    <ForumPost key={post.id} post={post} currentUserId={user.id} canManage={canManage} />
                ))}
            </div>

            {!thread.isLocked && (
                <ForumPostForm courseId={id} threadId={threadId} />
            )}

            {thread.isLocked && (
                <Card>
                    <CardContent className="p-6 text-center text-gray-600">
                        <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p>This thread is locked. No new replies can be added.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
