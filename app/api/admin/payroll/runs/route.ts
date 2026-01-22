import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET: List Payroll Runs
export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const runs = await prisma.payrollRun.findMany({
            orderBy: { paymentDate: 'desc' },
            include: {
                _count: {
                    select: { items: true }
                }
            }
        });
        return NextResponse.json(runs);
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST: Create New Payroll Run
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            startDate,
            endDate,
            paymentDate,
            notes,
            items // Array of user payments
        } = body;

        // Calculate total
        const totalAmount = items.reduce((sum: number, item: any) => sum + (parseFloat(item.netPay) || 0), 0);

        const run = await prisma.payrollRun.create({
            data: {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                paymentDate: new Date(paymentDate),
                notes,
                status: 'processed', // Default to processed for record keeping
                totalAmount,
                items: {
                    create: items.map((item: any) => ({
                        userId: item.userId,
                        baseSalary: item.baseSalary ? parseFloat(item.baseSalary) : 0,
                        bonus: item.bonus ? parseFloat(item.bonus) : 0,
                        deductions: item.deductions ? parseFloat(item.deductions) : 0,
                        netPay: parseFloat(item.netPay),
                        paymentMethod: item.paymentMethod || 'Direct Deposit',
                        notes: item.notes
                    }))
                }
            }
        });

        return NextResponse.json(run);
    } catch (error) {
        console.error('Failed to create payroll run:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
