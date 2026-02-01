import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { courseOrders } = body;

        if (!Array.isArray(courseOrders)) {
            return NextResponse.json(
                { error: 'courseOrders must be an array' },
                { status: 400 }
            );
        }

        // Validate all course IDs exist
        const courseIds = courseOrders.map((item: any) => item.id);
        const existingCourses = await prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: { id: true },
        });

        if (existingCourses.length !== courseIds.length) {
            return NextResponse.json(
                { error: 'One or more course IDs are invalid' },
                { status: 400 }
            );
        }

        // Update all courses in a transaction
        await prisma.$transaction(
            courseOrders.map((item: { id: string; displayOrder: number }) =>
                prisma.course.update({
                    where: { id: item.id },
                    data: { displayOrder: item.displayOrder },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to reorder courses:', error);
        return NextResponse.json(
            { error: 'Failed to reorder courses' },
            { status: 500 }
        );
    }
}
