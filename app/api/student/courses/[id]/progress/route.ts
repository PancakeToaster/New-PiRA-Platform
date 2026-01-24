import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/student/courses/[id]/progress - Get student's progress for a course
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: currentUser.id },
        });

        if (!studentProfile) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        // Get all lessons in the course with progress
        const modules = await prisma.module.findMany({
            where: { lmsCourseId: id, isPublished: true },
            include: {
                lessons: {
                    where: { isPublished: true },
                    include: {
                        studentProgress: {
                            where: { studentId: studentProfile.id },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        });

        // Calculate overall progress
        const totalLessons = modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
        const completedLessons = modules.reduce(
            (sum, mod) => sum + mod.lessons.filter(l => l.studentProgress[0]?.status === 'completed').length,
            0
        );
        const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return NextResponse.json({
            modules,
            progress: {
                total: totalLessons,
                completed: completedLessons,
                percentage: progressPercentage,
            },
        });
    } catch (error) {
        console.error('Failed to fetch course progress:', error);
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }
}

// POST /api/student/courses/[id]/progress - Mark lesson as complete
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { lessonId, status } = body;

        // Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: currentUser.id },
        });

        if (!studentProfile) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        // Upsert lesson progress
        const progress = await prisma.lessonProgress.upsert({
            where: {
                lessonId_studentId: {
                    lessonId,
                    studentId: studentProfile.id,
                },
            },
            update: {
                status,
                completedAt: status === 'completed' ? new Date() : null,
            },
            create: {
                lessonId,
                studentId: studentProfile.id,
                status,
                completedAt: status === 'completed' ? new Date() : null,
            },
        });

        return NextResponse.json({ progress });
    } catch (error) {
        console.error('Failed to update progress:', error);
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }
}
