import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/admin/announcements - List all announcements
export async function GET() {
    try {
        const isUserAdmin = await isAdmin();

        if (!isUserAdmin) {
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
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ announcements });
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

        if (!user || !isUserAdmin) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const {
            title,
            content,
            type,
            targetId,
            sendToAll,
            sendToStudents,
            sendToParents,
            sendToTeachers,
        } = body;

        if (!title || !content || !type) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

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
