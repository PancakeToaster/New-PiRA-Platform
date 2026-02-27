import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        // Check if user has student role or profile
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has a student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: user.id }
        });

        if (!studentProfile) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        const body = await req.json();
        const { lessonId, status } = body;

        if (!lessonId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId }
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        // Update progress
        const progress = await prisma.lessonProgress.upsert({
            where: {
                lessonId_studentId: {
                    lessonId,
                    studentId: studentProfile.id
                }
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
            }
        });

        return NextResponse.json(progress);

    } catch (error) {
        console.error('Failed to update progress:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
