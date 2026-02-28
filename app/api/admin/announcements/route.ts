import { getCurrentUser, isAdmin, hasRole } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createAnnouncementSchema } from '@/lib/validations/system';

// GET /api/admin/announcements - List all announcements
export async function GET() {
    try {
        const isUserAdmin = await isAdmin();
        const userIsTeacher = await hasRole('Teacher');

        if (!isUserAdmin && !userIsTeacher) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const announcements = await prisma.announcement.findMany({
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: { reads: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const totalUsers = await prisma.user.count();

        return NextResponse.json({ announcements, totalUsers });
    } catch (error) {
        console.error('[ANNOUNCEMENTS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST /api/admin/announcements - Create announcement
export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        const isUserAdmin = await isAdmin();

        if (!user || (!user.roles?.includes('Admin') && !user.roles?.includes('Teacher'))) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const parsed = createAnnouncementSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
                { status: 400 }
            );
        }

        const {
            title,
            content,
            type,
            targetId,
            sendToAll,
            sendToStudents,
            sendToParents,
            sendToTeachers,
        } = parsed.data;

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                type,
                targetId: targetId || null,
                authorId: user.id,
                sendToAll: sendToAll || false,
                sendToStudents: sendToStudents || false,
                sendToParents: sendToParents || false,
                sendToTeachers: sendToTeachers || false,
            }
        });

        return NextResponse.json(announcement);
    } catch (error) {
        console.error('[ANNOUNCEMENTS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
