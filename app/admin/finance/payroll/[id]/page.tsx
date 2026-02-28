import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function PayrollRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes('Admin')) redirect('/admin');

    const { id } = await params;

    const run = await prisma.payrollRun.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } },
                },
                orderBy: { netPay: 'desc' },
            },
        },
    });

    if (!run) redirect('/admin/finance/payroll');

    const formattedPeriod = `${new Date(run.startDate).toLocaleDateString()} – ${new Date(run.endDate).toLocaleDateString()}`;
    const formattedPayDate = new Date(run.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const statusColors: Record<string, string> = {
        draft: 'bg-muted text-muted-foreground',
        processed: 'bg-sky-500/10 text-sky-600',
        paid: 'bg-emerald-500/10 text-emerald-600',
    };

    return (
        <div className="space-y-6">
            <Link href="/admin/finance/payroll" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm w-fit">
                <ArrowLeft className="w-4 h-4" />Back to Payroll Runs
            </Link>

            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Payroll Run</h1>
                    <p className="text-muted-foreground">Period: {formattedPeriod}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${statusColors[run.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {run.status}
                </span>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-5 flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">Total Paid</p>
                            <p className="text-xl font-bold text-foreground">${run.totalAmount.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 flex items-center gap-3">
                        <Users className="w-5 h-5 text-sky-500 shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">Recipients</p>
                            <p className="text-xl font-bold text-foreground">{run.items.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-500 shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">Payment Date</p>
                            <p className="text-sm font-bold text-foreground">{formattedPayDate}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">Avg. Net Pay</p>
                            <p className="text-xl font-bold text-foreground">
                                ${run.items.length > 0 ? (run.items.reduce((s, i) => s + i.netPay, 0) / run.items.length).toFixed(2) : '0.00'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Items table */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Recipient</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase text-right">Base Salary</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase text-right">Bonus</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase text-right">Deductions</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase text-right">Net Pay</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Method</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-card divide-y divide-border">
                                {run.items.map(item => (
                                    <TableRow key={item.id} className="hover:bg-muted/50">
                                        <TableCell className="px-4 py-3">
                                            <p className="font-medium text-foreground">{item.user.firstName} {item.user.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{item.user.email}</p>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right text-foreground">${item.baseSalary.toFixed(2)}</TableCell>
                                        <TableCell className="px-4 py-3 text-right text-emerald-600">
                                            {item.bonus > 0 ? `+$${item.bonus.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right text-rose-600">
                                            {item.deductions > 0 ? `-$${item.deductions.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right font-bold text-foreground">${item.netPay.toFixed(2)}</TableCell>
                                        <TableCell className="px-4 py-3 text-muted-foreground text-sm">{item.paymentMethod ?? '—'}</TableCell>
                                    </TableRow>
                                ))}
                                {run.items.length === 0 && (
                                    <TableRow><TableCell colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No items in this payroll run.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {run.notes && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Notes: </span>{run.notes}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
