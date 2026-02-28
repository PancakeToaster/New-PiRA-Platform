import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function ForumThreadSettingsPage({
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

    const thread = await prisma.forumThread.findUnique({
        where: { id: threadId },
    });

    if (!thread) {
        return notFound();
    }

    const isTeacher = user.roles?.includes('Teacher') && course.instructorId === user.id;
    const isCreator = thread.creatorId === user.id;

    if (!isTeacher && !isCreator) {
        return <div>Unauthorized to manage this thread.</div>;
    }

    async function updateThread(formData: FormData) {
        'use server';

        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('Unauthorized');

        const title = formData.get('title') as string;
        const isPublic = formData.get('isPublic') === 'true';
        // Only teachers can pin or lock threads
        const isTeacherAction = currentUser.roles?.includes('Teacher');
        const isPinned = isTeacherAction ? formData.get('isPinned') === 'true' : thread!.isPinned;
        const isLocked = isTeacherAction ? formData.get('isLocked') === 'true' : thread!.isLocked;

        await prisma.forumThread.update({
            where: { id: threadId },
            data: {
                title,
                isPublic,
                isPinned,
                isLocked,
            },
        });

        revalidatePath(`/lms/courses/${id}/forum/${threadId}`);
        redirect(`/lms/courses/${id}/forum/${threadId}`);
    }

    async function deleteThread() {
        'use server';

        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('Unauthorized');

        await prisma.forumThread.delete({
            where: { id: threadId },
        });

        revalidatePath(`/lms/courses/${id}/forum`);
        redirect(`/lms/courses/${id}/forum`);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/lms/courses/${id}/forum/${threadId}`}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Thread
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Thread Settings</h1>
                    <p className="text-muted-foreground">Manage thread privacy and properties</p>
                </div>
            </div>

            <form action={updateThread}>
                <Card>
                    <CardHeader>
                        <CardTitle>Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Thread Title
                            </label>
                            <input
                                name="title"
                                type="text"
                                defaultValue={thread.title}
                                required
                                className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div className="space-y-4 border-t border-border pt-4">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="isPublic"
                                    value="true"
                                    defaultChecked={thread.isPublic}
                                    className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                                />
                                <div>
                                    <div className="font-medium">Public Thread</div>
                                    <div className="text-sm text-muted-foreground">Allow all enrolled students to see and participate.</div>
                                </div>
                            </label>

                            {isTeacher && (
                                <>
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name="isPinned"
                                            value="true"
                                            defaultChecked={thread.isPinned}
                                            className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                                        />
                                        <div>
                                            <div className="font-medium text-yellow-600 dark:text-yellow-500">Pin Thread</div>
                                            <div className="text-sm text-muted-foreground">Keep this thread at the top of the forum.</div>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name="isLocked"
                                            value="true"
                                            defaultChecked={thread.isLocked}
                                            className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                                        />
                                        <div>
                                            <div className="font-medium text-red-600 dark:text-red-500">Lock Thread</div>
                                            <div className="text-sm text-muted-foreground">Prevent any new replies from being added.</div>
                                        </div>
                                    </label>
                                </>
                            )}
                        </div>

                        <div className="pt-4 border-t border-border flex justify-between">
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            <form action={deleteThread}>
                <Card className="border-red-200 dark:border-red-900/50">
                    <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-500">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Once you delete a thread, there is no going back. Please be certain.
                        </p>
                        <Button variant="destructive" type="submit">
                            Delete Thread
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
