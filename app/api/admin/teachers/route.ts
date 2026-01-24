import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/admin/teachers - Get all users with Teacher role
export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const teachers = await prisma.user.findMany({
            where: {
                roles: {
                    some: {
                        role: {
                            name: 'Teacher'
                        }
                    }
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
            orderBy: {
                lastName: 'asc',
            },
        });

        return NextResponse.json({ teachers });
    } catch (error) {
        console.error('[TEACHERS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
