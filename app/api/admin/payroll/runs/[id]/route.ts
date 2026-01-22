import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET: Payroll Run Detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const { id } = await params;

    try {
        const run = await prisma.payrollRun.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true }
                        }
                    }
                }
            }
        });

        if (!run) return new NextResponse('Not Found', { status: 404 });
        return NextResponse.json(run);
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// DELETE: Void Payroll Run
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes('Admin')) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const { id } = await params;

    try {
        await prisma.payrollRun.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}
