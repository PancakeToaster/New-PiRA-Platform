import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { updateStaffSalarySchema } from '@/lib/validations/finance';

// PATCH /api/admin/finance/salaries/[id]
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user || !(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const parsed = updateStaffSalarySchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
            { status: 400 }
        );
    }

    const {
        title, annualSalary, taxRate, healthDeduction, otherDeductions, paymentFrequency, endDate, notes
    } = parsed.data;

    const salary = await prisma.staffSalary.update({
        where: { id },
        data: {
            title,
            annualSalary: annualSalary ?? undefined,
            taxRate: taxRate ?? undefined,
            healthDeduction: healthDeduction ?? undefined,
            otherDeductions: otherDeductions ?? undefined,
            paymentFrequency,
            endDate: endDate ? new Date(endDate) : undefined,
            notes,
        },
    });
    return NextResponse.json({ salary });
}

// DELETE /api/admin/finance/salaries/[id]
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user || !(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await prisma.staffSalary.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
