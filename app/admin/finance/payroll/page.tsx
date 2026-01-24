import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/Table';
import { Plus, Users, Calendar, ArrowRight } from 'lucide-react';
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payroll History</h1>
                    <p className="text-gray-500">Record keeping for external payroll payments.</p>
                </div>
                <Link href="/admin/finance/payroll/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Record Run
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {runs.map(run => (
                    <Card key={run.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-0 flex flex-col md:flex-row items-center">
                            <div className="p-6 flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">
                                            {new Date(run.paymentDate).toLocaleDateString(undefined, {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Period: {new Date(run.startDate).toLocaleDateString()} - {new Date(run.endDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-l w-full md:w-64 flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-500">Total Paid</span>
                                    <span className="font-bold text-gray-900">${run.totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Recipients</span>
                                    <span className="text-sm text-gray-900 flex items-center">
                                        <Users className="w-3 h-3 mr-1" />
                                        {run._count.items}
                                    </span>
                                </div>
                            </div>

                            <div className="px-6 py-4 md:py-0">
                                <Button variant="ghost" disabled title="Details view coming soon">
                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {runs.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed text-gray-500">
                        <p>No payroll runs recorded.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
