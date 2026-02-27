import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { startOfMonth, format, subMonths } from 'date-fns';

// GET /api/admin/finance/summary — Dashboard KPIs
export async function GET(_req: NextRequest) {
    const user = await getCurrentUser();
    const adminCheck = await isAdmin();
    if (!user || !adminCheck) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);

        // Parallel queries for speed
        const [
            invoices,
            expenses,
            payrollRuns,
            recentExpenses,
        ] = await Promise.all([
            prisma.invoice.findMany({
                select: { total: true, status: true, paidDate: true, createdAt: true },
            }),
            prisma.expense.findMany({
                select: { amount: true, date: true, category: true },
            }),
            prisma.payrollRun.findMany({
                select: { totalAmount: true, paymentDate: true },
            }),
            prisma.expense.findMany({
                take: 6,
                orderBy: { date: 'desc' },
                select: { amount: true, date: true, vendor: true, category: true },
            }),
        ]);

        // KPIs
        const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
        const totalPayroll = payrollRuns.reduce((s, r) => s + r.totalAmount, 0);
        const totalCosts = totalExpenses + totalPayroll;
        const netProfit = totalRevenue - totalCosts;

        const outstanding = invoices
            .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
            .reduce((s, i) => s + i.total, 0);

        const thisMonthRevenue = invoices
            .filter(i => i.status === 'paid' && i.paidDate && new Date(i.paidDate) >= startOfCurrentMonth)
            .reduce((s, i) => s + i.total, 0);

        const thisMonthExpenses = expenses
            .filter(e => new Date(e.date) >= startOfCurrentMonth)
            .reduce((s, e) => s + e.amount, 0);

        // Cash flow chart — last 6 months
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = subMonths(now, 5 - i);
            return { name: format(d, 'MMM yyyy'), start: startOfMonth(d), end: startOfMonth(subMonths(d, -1)) };
        });

        const cashFlow = months.map(m => ({
            name: m.name,
            income: invoices
                .filter(i => i.status === 'paid' && i.paidDate && new Date(i.paidDate) >= m.start && new Date(i.paidDate) < m.end)
                .reduce((s, i) => s + i.total, 0),
            expense: expenses
                .filter(e => new Date(e.date) >= m.start && new Date(e.date) < m.end)
                .reduce((s, e) => s + e.amount, 0),
        }));

        // Expense breakdown by category
        const categoryMap: Record<string, number> = {};
        for (const e of expenses) {
            categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount;
        }
        const expenseByCategory = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, amount]) => ({ name, amount }));

        return NextResponse.json({
            kpis: {
                totalRevenue,
                totalExpenses: totalCosts,
                netProfit,
                outstanding,
                thisMonthRevenue,
                thisMonthExpenses,
                totalInvoices: invoices.length,
                paidInvoices: invoices.filter(i => i.status === 'paid').length,
            },
            cashFlow,
            expenseByCategory,
            recentExpenses: recentExpenses.map(e => ({
                ...e,
                date: e.date.toISOString(),
            })),
        });
    } catch (error) {
        console.error('[FINANCE_SUMMARY]', error);
        return NextResponse.json({ error: 'Failed to load finance summary' }, { status: 500 });
    }
}
