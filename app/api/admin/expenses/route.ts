import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET: List Expenses
export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const projectId = searchParams.get('projectId');
    const quarter = searchParams.get('quarter');

    try {
        const whereClause: any = {};
        if (category) whereClause.category = category;
        if (projectId) whereClause.projectId = projectId;
        if (quarter) whereClause.quarter = quarter;

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            include: {
                incurredBy: {
                    select: { firstName: true, lastName: true, email: true }
                },
                project: {
                    select: { name: true, slug: true }
                },
                inventoryItem: {
                    select: { name: true }
                }
            }
        });
        return NextResponse.json(expenses);
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST: Create Expense
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            amount,
            date,
            vendor,
            description,
            category,
            receiptUrl,
            projectId,
            inventoryItemId,
            quarter
        } = body;

        const expense = await prisma.expense.create({
            data: {
                amount: parseFloat(amount),
                date: new Date(date),
                vendor,
                description,
                category,
                receiptUrl,
                status: 'pending', // Default
                incurredById: user.id, // Currently logged in user
                projectId: projectId || null,
                inventoryItemId: inventoryItemId || null,
                quarter
            }
        });

        // If linked to Inventory, update unit cost?
        // Logic: If we just bought more, we might want to update the 'last purchased cost' or average cost.
        // For simplicity, let's update the unitCost to the most recent purchase price derived from this expense?
        // Or maybe not mess with it automatically. Let's just track it. 
        // User requirement: "track how much we spend on specific hardware" -> handled by relation.

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Failed to create expense:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
