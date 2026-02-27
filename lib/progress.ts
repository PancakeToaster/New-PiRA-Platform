import { prisma } from '@/lib/prisma';

export async function getStudentCourseProgress(studentId: string, courseId: string) {
    const modules = await prisma.module.findMany({
        where: { lmsCourseId: courseId, isPublished: true },
        include: {
            lessons: {
                where: { isPublished: true },
                select: { id: true }
            }
        }
    });

    const lessonIds = modules.flatMap(m => m.lessons.map(l => l.id));

    if (lessonIds.length === 0) return 0;

    const completedCount = await prisma.lessonProgress.count({
        where: {
            studentId,
            lessonId: { in: lessonIds },
            status: 'completed'
        }
    });

    return Math.round((completedCount / lessonIds.length) * 100);
}

export async function getStudentModuleProgress(studentId: string, moduleId: string) {
    const lessons = await prisma.lesson.findMany({
        where: { moduleId, isPublished: true },
        select: { id: true }
    });

    const lessonIds = lessons.map(l => l.id);

    if (lessonIds.length === 0) return 0;

    const completedCount = await prisma.lessonProgress.count({
        where: {
            studentId,
            lessonId: { in: lessonIds },
            status: 'completed'
        }
    });

    return Math.round((completedCount / lessonIds.length) * 100);
}

export async function updateLessonProgress(studentId: string, lessonId: string, status: 'not_started' | 'in_progress' | 'completed') {
    const data: any = { status };
    if (status === 'completed') {
        data.completedAt = new Date();
    }

    return await prisma.lessonProgress.upsert({
        where: {
            lessonId_studentId: {
                lessonId,
                studentId
            }
        },
        update: data,
        create: {
            lessonId,
            studentId,
            status,
            completedAt: status === 'completed' ? new Date() : null
        }
    });
}
