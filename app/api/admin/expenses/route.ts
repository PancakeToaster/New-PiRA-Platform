import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { createExpenseSchema } from '@/lib/validations/finance';

// GET: List Expenses — supports ?recurring=true to filter recurring-only
export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const projectId = searchParams.get('projectId');
    const quarter = searchParams.get('quarter');
    const recurringOnly = searchParams.get('recurring') === 'true';

    try {
        const whereClause: Record<string, unknown> = {};
        if (category) whereClause.category = category;
        if (projectId) whereClause.projectId = projectId;
        if (quarter) whereClause.quarter = quarter;
        if (recurringOnly) whereClause.isRecurring = true;

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            include: {
                incurredBy: { select: { firstName: true, lastName: true, email: true } },
                project: { select: { name: true, slug: true } },
                inventoryItem: { select: { name: true } },
            },
        });
        return NextResponse.json(expenses);
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST: Create Expense (supports recurring fields)
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const parsed = createExpenseSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
                { status: 400 }
            );
        }

        const {
            amount, date, vendor, description, category,
            receiptUrl, projectId, inventoryItemId, quarter,
            isRecurring, recurringFrequency, nextRecurringDate,
            status, incurredById
        } = parsed.data;

        const expense = await prisma.expense.create({
            data: {
                amount,
                date: date ? new Date(date) : new Date(),
                vendor,
                description: description || null,
                category,
                receiptUrl: receiptUrl || null,
                status: status || 'pending',
                incurredById: incurredById || user.id,
                projectId: projectId || null,
                inventoryItemId: inventoryItemId || null,
                quarter: quarter || null,
                isRecurring: isRecurring ?? false,
                recurringFrequency: isRecurring ? (recurringFrequency ?? 'monthly') : null,
                nextRecurringDate: isRecurring && nextRecurringDate ? new Date(nextRecurringDate) : null,
            },
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Failed to create expense:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
