import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/announcements - Get announcements for current user
export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const isStudent = user.roles?.includes('Student');
        const isParent = user.roles?.includes('Parent');
        const isTeacher = user.roles?.includes('Teacher');

        // Build where clause based on user roles
        const announcements = await prisma.announcement.findMany({
            where: {
                isActive: true,
                OR: [
                    { sendToAll: true },
                    ...(isStudent ? [{ sendToStudents: true }] : []),
                    ...(isParent ? [{ sendToParents: true }] : []),
                    ...(isTeacher ? [{ sendToTeachers: true }] : []),
                ],
            },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        return NextResponse.json({ announcements });
    } catch (error) {
        console.error('[ANNOUNCEMENTS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
