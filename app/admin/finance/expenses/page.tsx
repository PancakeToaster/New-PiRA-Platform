import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Plus, Download, FileText, Search } from 'lucide-react';
import Link from 'next/link';

export default async function ExpenseListPage() {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        redirect('/admin');
    }

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
        orderBy: { date: 'desc' },
        take: 50, // Pagination later if needed
        include: {
            incurredBy: { select: { firstName: true, lastName: true } },
            project: { select: { name: true } },
            inventoryItem: { select: { name: true } },
        }
    });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
                </div>
                <Link href="/admin/finance/expenses/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Log Expense
                    </Button>
                </Link>
            </div>

            {/* Simple Stats Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-gray-500">Total Logged (Recent 50)</div>
                        <div className="text-2xl font-bold text-gray-900 mt-2">
                            ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>
                {/* Add more stats later: By Category, By Quarter */}
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Project / Item</TableHead>
                                <TableHead>Incurred By</TableHead>
                                <TableHead className="text-right">Receipt</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="whitespace-nowrap text-gray-600">
                                        {new Date(expense.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {expense.vendor}
                                        <div className="text-xs text-gray-500 line-clamp-1">{expense.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {expense.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-bold text-gray-900">
                                        ${expense.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {expense.project && (
                                            <div className="flex items-center gap-1" title="Project">
                                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                                {expense.project.name}
                                            </div>
                                        )}
                                        {expense.inventoryItem && (
                                            <div className="flex items-center gap-1" title="Inventory Item">
                                                <span className="w-2 h-2 rounded-full bg-green-400" />
                                                {expense.inventoryItem.name}
                                            </div>
                                        )}
                                        {!expense.project && !expense.inventoryItem && <span className="text-gray-400">-</span>}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {expense.incurredBy.firstName} {expense.incurredBy.lastName?.[0]}.
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {expense.receiptUrl ? (
                                            <a
                                                href={expense.receiptUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sky-600 hover:text-sky-800"
                                            >
                                                <FileText className="w-4 h-4 inline-block" />
                                            </a>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {expenses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No expenses logged yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
