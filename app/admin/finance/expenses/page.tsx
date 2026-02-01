import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/Table';
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
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground">Expense Management</h1>
                <Link href="/admin/finance/expenses/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Log Expense
                    </Button>
                </Link>
            </div>

            {/* Stats - matching Invoices layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-foreground">{expenses.length}</p>
                            <p className="text-sm text-muted-foreground">Total Expenses</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-destructive">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-foreground">50</p>
                            <p className="text-sm text-muted-foreground">Recent Limit</p>
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
            </div>

            {/* Search and Filter - visual placeholder matching Invoices */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                disabled // Disabled for server component version
                            />
                        </div>
                        <select
                            className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            disabled
                        >
                            <option value="all">All Categories</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Expenses ({expenses.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendor</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Project / Item</TableHead>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Incurred By</TableHead>
                                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Receipt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-card divide-y divide-border">
                                {expenses.map((expense) => (
                                    <TableRow key={expense.id} className="hover:bg-muted/50">
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 font-medium text-foreground">
                                            {expense.vendor}
                                            <div className="text-xs text-muted-foreground line-clamp-1">{expense.description}</div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                                {expense.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 font-bold text-foreground">
                                            ${expense.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                                            {expense.project && (
                                                <div className="flex items-center gap-1" title="Project">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                    {expense.project.name}
                                                </div>
                                            )}
                                            {expense.inventoryItem && (
                                                <div className="flex items-center gap-1" title="Inventory Item">
                                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                                    {expense.inventoryItem.name}
                                                </div>
                                            )}
                                            {!expense.project && !expense.inventoryItem && <span className="text-muted-foreground/50">-</span>}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                                            {expense.incurredBy.firstName} {expense.incurredBy.lastName?.[0]}.
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            {expense.receiptUrl ? (
                                                <a
                                                    href={expense.receiptUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary hover:text-primary/80"
                                                >
                                                    <FileText className="w-4 h-4 inline-block" />
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground/30">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {expenses.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                            No expenses logged yet.
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
