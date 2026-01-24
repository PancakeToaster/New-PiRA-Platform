import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || !currentUser.roles.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const students = await prisma.user.findMany({
            where: {
                roles: {
                    some: {
                        role: {
                            name: {
                                in: ['Student', 'Team Member', 'Team Captain'],
                            },
                        },
                    },
                },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isApproved: true,
                roles: {
                    select: {
                        role: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                studentProfile: {
                    select: {
                        id: true,
                        grade: true,
                        school: true,
                        dateOfBirth: true,
                        performanceDiscount: true,
                        parents: {
                            select: {
                                parent: {
                                    select: {
                                        user: {
                                            select: {
                                                firstName: true,
                                                lastName: true,
                                                email: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                lastName: 'asc',
            },
        });

        return NextResponse.json(students);
    } catch (error) {
        console.error('[ADMIN_STUDENTS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || !currentUser.roles.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { userId, data } = body;

        if (!userId || !data) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Update User fields if present
        if (data.firstName || data.lastName || data.email) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                }
            });
        }

        // Update StudentProfile fields
        if (data.grade || data.school || data.dateOfBirth || data.performanceDiscount !== undefined) {
            await prisma.studentProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    grade: data.grade,
                    school: data.school,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    performanceDiscount: parseFloat(data.performanceDiscount) || 0,
                },
                update: {
                    grade: data.grade,
                    school: data.school,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    performanceDiscount: parseFloat(data.performanceDiscount) || 0,
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[ADMIN_STUDENTS_UPDATE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
