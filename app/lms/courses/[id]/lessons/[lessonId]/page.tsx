import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import TiptapEditor from '@/components/editor/TiptapEditor';
import LessonCompleteButton from '@/components/lms/LessonCompleteButton';

export default async function LessonPage({
    params,
}: {
    params: Promise<{ id: string; lessonId: string }>;
}) {
    const { id, lessonId } = await params;
    const user = await getCurrentUser();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
            module: {
                select: {
                    id: true,
                    title: true,
                    lmsCourseId: true,
                }
            }
        }
    });

    if (!lesson) {
        return <div>Lesson not found</div>;
    }

    // Verify lesson belongs to course
    // Lessons can belong directly to a course OR via a module
    const lessonCourseId = lesson.module?.lmsCourseId || lesson.lmsCourseId;

    if (lessonCourseId !== id) {
        return <div>Lesson does not belong to this course</div>;
    }

    // Get student profile and progress
    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: user.id }
    });

    let progress = null;
    if (studentProfile) {
        progress = await prisma.lessonProgress.findUnique({
            where: {
                lessonId_studentId: {
                    lessonId: lesson.id,
                    studentId: studentProfile.id
                }
            }
        });
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/lms/courses/${id}/modules`}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Modules
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">{lesson.title}</h1>
                    {lesson.module && <p className="text-gray-600">Module: {lesson.module.title}</p>}
                </div>
            </div>

            <Card>
                <CardContent className="p-8">
                    {lesson.videoUrl && (
                        <div className="mb-8 aspect-video">
                            <iframe
                                src={lesson.videoUrl.replace('watch?v=', 'embed/')}
                                className="w-full h-full rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}

                    {lesson.content ? (
                        <div className="prose max-w-none dark:prose-invert">
                            {/* Use TiptapEditor in read-only mode */}
                            <TiptapEditor
                                content={lesson.content}
                                editable={false}
                            />
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No content available for this lesson.</p>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <LessonCompleteButton
                    lessonId={lesson.id}
                    initialStatus={progress?.status as any || 'not_started'}
                />
            </div>
        </div>
    );
}
