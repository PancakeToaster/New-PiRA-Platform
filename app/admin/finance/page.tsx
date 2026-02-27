import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, BarChart2, CreditCard, Receipt, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import FinanceDashboardClient from '@/components/finance/FinanceDashboardClient';

export const metadata = { title: 'Financial Dashboard' };

function formatCurrency(n: number) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default async function FinanceDashboardPage() {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes('Admin')) redirect('/admin');

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [invoices, installments, expenses, payrollRuns, recentExpenses, staffSalaryCount] = await Promise.all([
        prisma.invoice.findMany({
            select: { id: true, total: true, status: true, createdAt: true },
        }),
        prisma.invoiceInstallment.findMany({
            select: { amount: true, status: true, paidDate: true },
        }),
        prisma.expense.findMany({
            select: { amount: true, date: true, category: true },
        }),
        prisma.payrollRun.findMany({
            select: { totalAmount: true, paymentDate: true },
        }),
        prisma.expense.findMany({
            take: 5, orderBy: { date: 'desc' },
            include: { incurredBy: { select: { firstName: true, lastName: true } } },
        }),
        prisma.staffSalary.count({ where: { endDate: null } }),
    ]);

    const paidInstallments = installments.filter((i: { status: string; amount: number; paidDate: Date | null }) => i.status === 'paid');
    const totalRevenue = paidInstallments.reduce((s: number, i: { amount: number }) => s + i.amount, 0);
    const thisMonthRevenue = paidInstallments
        .filter((i: { paidDate: Date | null }) => i.paidDate && new Date(i.paidDate) >= startOfCurrentMonth)
        .reduce((s: number, i: { amount: number }) => s + i.amount, 0);

    const totalExpenses = expenses.reduce((s: number, e: { amount: number }) => s + e.amount, 0);
    const totalPayroll = payrollRuns.reduce((s: number, r: { totalAmount: number }) => s + r.totalAmount, 0);
    const netProfit = totalRevenue - totalExpenses - totalPayroll;

    const outstanding = invoices
        .filter((i: { status: string; total: number }) => i.status !== 'paid' && i.status !== 'cancelled')
        .reduce((s: number, i: { total: number }) => s + i.total, 0);

    const thisMonthExpenses = expenses
        .filter((e: { date: Date }) => new Date(e.date) >= startOfCurrentMonth)
        .reduce((s: number, e: { amount: number }) => s + e.amount, 0);

    // Cash flow chart — past 6 months
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        return { name: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), start: d, end };
    });

    const cashFlowData = months.map(m => ({
        name: m.name,
        income: paidInstallments
            .filter(i => i.paidDate && new Date(i.paidDate) >= m.start && new Date(i.paidDate) < m.end)
            .reduce((s, i) => s + i.amount, 0),
        expense: expenses
            .filter((e: { date: Date }) => new Date(e.date) >= m.start && new Date(e.date) < m.end)
            .reduce((s: number, e: { amount: number }) => s + e.amount, 0),
    }));

    // Top expense categories
    const catMap: Record<string, number> = {};
    for (const e of expenses) {
        catMap[(e as { category: string }).category] = (catMap[(e as { category: string }).category] ?? 0) + (e as { amount: number }).amount;
    }
    const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
                    <p className="text-muted-foreground">Overview of revenue, expenses, and net profit</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-background">
                    <CardContent className="pt-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground font-medium">Total Revenue</span>
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(thisMonthRevenue)} this month</p>
                    </CardContent>
                </Card>
                <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-background">
                    <CardContent className="pt-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground font-medium">Total Expenses</span>
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(totalExpenses + totalPayroll)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(thisMonthExpenses)} this month</p>
                    </CardContent>
                </Card>
                <Card className={`${netProfit >= 0 ? 'border-sky-500/20' : 'border-amber-500/20'}`}>
                    <CardContent className="pt-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground font-medium">Net Profit</span>
                            <DollarSign className={`w-4 h-4 ${netProfit >= 0 ? 'text-sky-500' : 'text-amber-500'}`} />
                        </div>
                        <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-sky-500' : 'text-amber-500'}`}>{formatCurrency(netProfit)}</p>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </CardContent>
                </Card>
                <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-background">
                    <CardContent className="pt-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground font-medium">Outstanding</span>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold text-amber-500">{formatCurrency(outstanding)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Unpaid invoices</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <FinanceDashboardClient data={cashFlowData} />
                </div>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-sky-500" />Top Expense Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {topCategories.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No expenses yet.</p>}
                        {topCategories.map(([cat, amt]) => {
                            const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
                            return (
                                <div key={cat} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-foreground font-medium truncate">{cat}</span>
                                        <span className="text-muted-foreground">{formatCurrency(amt)} ({pct}%)</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-rose-500" />Recent Expenses
                                </CardTitle>
                                <Link href="/admin/finance/expenses" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {recentExpenses.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No expenses yet.</p>}
                            {recentExpenses.map(e => (
                                <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{e.vendor}</p>
                                        <p className="text-xs text-muted-foreground">{e.category} · {new Date(e.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className="font-bold text-sm text-rose-500 ml-4">-${e.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-4">
                    <Card>
                        <CardContent className="pt-5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Invoices</p>
                                <p className="text-xl font-bold text-foreground">{invoices.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-sky-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Payroll Runs</p>
                                <p className="text-xl font-bold text-foreground">{payrollRuns.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Active Salary Records</p>
                                <p className="text-xl font-bold text-foreground">{staffSalaryCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
