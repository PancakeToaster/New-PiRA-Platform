import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { updateExpenseSchema } from '@/lib/validations/finance';

// GET: Single Expense
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes('Admin')) { // Only admin can see details? Or Teacher too?
        // Assuming Teachers can see expenses too based on previous context
        if (!user?.roles.includes('Teacher')) return new NextResponse('Unauthorized', { status: 401 });
    }
    const { id } = await params;

    try {
        const expense = await prisma.expense.findUnique({
            where: { id },
            include: {
                incurredBy: true,
                project: true,
                inventoryItem: true
            }
        });

        if (!expense) return new NextResponse('Not Found', { status: 404 });
        return NextResponse.json(expense);
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// PUT: Update Expense
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const { id } = await params;

    try {
        const body = await req.json();
        const parsed = updateExpenseSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
                { status: 400 }
            );
        }

        const {
            amount,
            date,
            vendor,
            description,
            category,
            receiptUrl,
            status,
            projectId,
            inventoryItemId,
            quarter
        } = parsed.data;

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                amount,
                date: date ? new Date(date) : undefined,
                vendor,
                description,
                category,
                receiptUrl,
                status,
                projectId: projectId || null,
                inventoryItemId: inventoryItemId || null,
                quarter
            }
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Update failed:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// DELETE: Remove Expense
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user || user.roles.includes('Visitor')) { // Stricter delete? Admin/Teacher ok.
        if (!user?.roles.includes('Admin') && !user?.roles.includes('Teacher')) return new NextResponse('Unauthorized', { status: 401 });
    }
    const { id } = await params;

    try {
        await prisma.expense.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}
