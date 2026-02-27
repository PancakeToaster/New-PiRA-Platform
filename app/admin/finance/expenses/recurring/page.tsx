import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import RecurringExpenseClient from '@/components/finance/RecurringExpenseClient';

export const metadata = { title: 'Recurring Expenses' };

export default async function RecurringExpensesPage() {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes('Admin')) redirect('/admin');

    const templates = await prisma.expense.findMany({
        where: { isRecurring: true },
        orderBy: { nextRecurringDate: 'asc' },
        include: {
            incurredBy: { select: { firstName: true, lastName: true } },
            project: { select: { name: true } },
        },
    });

    const now = new Date();
    const dueCount = templates.filter(t => t.nextRecurringDate && new Date(t.nextRecurringDate) <= now).length;

    const serialized = templates.map(t => ({
        ...t,
        date: t.date.toISOString(),
        nextRecurringDate: t.nextRecurringDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
                <Link href="/admin/finance/expenses" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-foreground">Recurring Expenses</h1>
                    <p className="text-muted-foreground">Scheduled expense templates that auto-generate on a defined frequency.</p>
                </div>
                {dueCount > 0 && (
                    <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-sm font-medium text-amber-600">
                        {dueCount} due now
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-xs text-muted-foreground mb-1">Total Templates</p>
                        <p className="text-2xl font-bold text-foreground">{templates.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-xs text-muted-foreground mb-1">Due Now</p>
                        <p className="text-2xl font-bold text-amber-500">{dueCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-xs text-muted-foreground mb-1">Monthly Templates</p>
                        <p className="text-2xl font-bold text-foreground">{templates.filter(t => t.recurringFrequency === 'monthly').length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-xs text-muted-foreground mb-1">Est. Monthly Cost</p>
                        <p className="text-2xl font-bold text-rose-500">
                            ${templates
                                .filter(t => t.recurringFrequency === 'monthly')
                                .reduce((s, t) => s + t.amount, 0)
                                .toFixed(0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <RecurringExpenseClient initialTemplates={serialized as any} dueCount={dueCount} />
        </div>
    );
}
