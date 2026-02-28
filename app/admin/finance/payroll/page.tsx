import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Plus, Users, Calendar, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';

export default async function PayrollListPage() {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        redirect('/admin');
    }

    // Fetch runs
    const runs = await prisma.payrollRun.findMany({
        orderBy: { paymentDate: 'desc' },
        include: {
            _count: { select: { items: true } }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Payroll History</h1>
                    <p className="text-muted-foreground">Record keeping for external payroll payments.</p>
                </div>
                <Link href="/admin/finance/payroll/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Record Run
                    </Button>
                </Link>
            </div>

            {/* Stats - matching Invoices layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-foreground">{runs.length}</p>
                            <p className="text-sm text-muted-foreground">Total Runs</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        {/* Summing total amount across all runs for display */}
                        <div className="text-center">
                            <p className="text-3xl font-bold text-foreground">
                                ${runs.reduce((acc, run) => acc + run.totalAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground">Total Paid Out</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-muted-foreground">-</p>
                            <p className="text-sm text-muted-foreground">Pending Approval</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-muted-foreground">-</p>
                            <p className="text-sm text-muted-foreground">Next Scheduled</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search payroll runs..."
                                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                disabled
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Payroll Runs ({runs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Date</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Paid</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipients</TableHead>
                                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-card divide-y divide-border">
                                {runs.map((run) => (
                                    <TableRow key={run.id} className="hover:bg-muted/50">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-medium text-foreground">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                {new Date(run.paymentDate).toLocaleDateString(undefined, {
                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                                            {new Date(run.startDate).toLocaleDateString()} - {new Date(run.endDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 font-bold text-foreground">
                                            ${run.totalAmount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-sm text-foreground">
                                            <div className="flex items-center">
                                                <Users className="w-3 h-3 mr-1 text-muted-foreground" />
                                                {run._count.items}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <Link href={`/admin/finance/payroll/${run.id}`}>
                                                <Button variant="ghost">
                                                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {runs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                            No payroll runs recorded.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
