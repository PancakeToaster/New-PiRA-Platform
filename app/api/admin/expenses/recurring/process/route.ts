import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { addMonths, addWeeks } from 'date-fns';

function computeNextDate(from: Date, frequency: string): Date {
    switch (frequency) {
        case 'weekly': return addWeeks(from, 1);
        case 'quarterly': return addMonths(from, 3);
        case 'yearly': return addMonths(from, 12);
        default: return addMonths(from, 1); // monthly
    }
}

// POST /api/admin/expenses/recurring/process
// Finds all recurring expenses with nextRecurringDate <= today, clones them as new pending expenses,
// and advances the nextRecurringDate on the template.
export async function POST(_req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes('Admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const due = await prisma.expense.findMany({
            where: {
                isRecurring: true,
                nextRecurringDate: { lte: now },
            },
        });

        if (due.length === 0) {
            return NextResponse.json({ processed: 0, message: 'No recurring expenses are due.' });
        }

        const created: string[] = [];

        // Process each one inside a transaction
        await prisma.$transaction(async tx => {
            for (const template of due) {
                // 1. Create a new one-off expense from this template
                const newExpense = await tx.expense.create({
                    data: {
                        amount: template.amount,
                        date: now,
                        vendor: template.vendor,
                        description: template.description,
                        category: template.category,
                        receiptUrl: null, // New occurrence has no receipt yet
                        status: 'pending',
                        incurredById: template.incurredById,
                        projectId: template.projectId,
                        inventoryItemId: template.inventoryItemId,
                        quarter: template.quarter,
                        isRecurring: false, // The generated copy is not itself recurring
                    },
                });

                // 2. Advance the template's nextRecurringDate
                const next = computeNextDate(
                    template.nextRecurringDate ?? now,
                    template.recurringFrequency ?? 'monthly'
                );
                await tx.expense.update({
                    where: { id: template.id },
                    data: { nextRecurringDate: next },
                });

                created.push(newExpense.id);
            }
        });

        return NextResponse.json({
            processed: created.length,
            createdExpenseIds: created,
            message: `${created.length} recurring expense${created.length !== 1 ? 's' : ''} processed successfully.`,
        });
    } catch (error) {
        console.error('[RECURRING_PROCESS]', error);
        return NextResponse.json({ error: 'Failed to process recurring expenses' }, { status: 500 });
    }
}
