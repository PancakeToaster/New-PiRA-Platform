import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
    status: z.enum(['new', 'read', 'replied', 'archived']),
});

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = updateStatusSchema.parse(body);

        const updatedSubmission = await prisma.contactSubmission.update({
            where: { id: params.id },
            data: {
                status: validatedData.status,
            },
        });

        return NextResponse.json(updatedSubmission, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error updating contact submission:', error);
        return NextResponse.json(
            { error: 'Failed to update contact submission' },
            { status: 500 }
        );
    }
}
