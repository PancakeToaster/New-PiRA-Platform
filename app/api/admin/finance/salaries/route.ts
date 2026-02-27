import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { createStaffSalarySchema } from '@/lib/validations/finance';

// GET /api/admin/finance/salaries
export async function GET(_req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || !(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const salaries = await prisma.staffSalary.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
    });
    return NextResponse.json({ salaries });
}

// POST /api/admin/finance/salaries
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || !(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = createStaffSalarySchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
            { status: 400 }
        );
    }

    const { userId, title, annualSalary, taxRate, healthDeduction, otherDeductions, paymentFrequency, effectiveDate, notes } = parsed.data;

    const salary = await prisma.staffSalary.create({
        data: {
            userId,
            title,
            annualSalary,
            taxRate: taxRate ?? 0,
            healthDeduction: healthDeduction ?? 0,
            otherDeductions: otherDeductions ?? 0,
            paymentFrequency: paymentFrequency ?? 'monthly',
            effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
            notes,
        },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    return NextResponse.json({ salary }, { status: 201 });
}
