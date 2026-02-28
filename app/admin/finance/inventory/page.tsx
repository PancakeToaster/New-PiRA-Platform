import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Plus, Edit, AlertCircle, ShoppingCart, Search } from 'lucide-react';
import Link from 'next/link';

export default async function AdminInventoryPage() {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        redirect('/admin');
    }

    // Fetch full inventory details
    const items = await prisma.inventoryItem.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { expenses: true } // How many times we bought this
            }
        }
    });

    const activeCheckouts = await prisma.inventoryCheckout.findMany({
        where: { status: 'active' },
        orderBy: { checkoutDate: 'desc' },
        include: {
            item: { select: { name: true } },
            team: { select: { name: true, slug: true } },
            user: { select: { firstName: true, lastName: true } }
        },
        take: 10
    });

    const hotCommodities = await prisma.inventoryItem.findMany({
        orderBy: { expenses: { _count: 'desc' } },
        take: 5,
        include: { _count: { select: { expenses: true } } }
    });

    const totalValue = items.reduce((sum, item) => sum + ((item.unitCost || 0) * item.quantity), 0);
    const lowStockItems = items.filter(i => i.quantity <= i.reorderLevel);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
                <Link href="/admin/finance/inventory/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </Link>
            </div>

            {/* Stats - matching Invoices layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-foreground">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            <p className="text-sm text-muted-foreground">Total Asset Value</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-foreground">{items.length}</p>
                            <p className="text-sm text-muted-foreground">Total Items</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={lowStockItems.length > 0 ? "border-amber-500/20 bg-amber-500/10" : ""}>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                                <p className={`text-3xl font-bold ${lowStockItems.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                                    {lowStockItems.length}
                                </p>
                                {lowStockItems.length > 0 && <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
                            </div>
                            <p className={`text-sm ${lowStockItems.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                                Low Stock Alerts
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{hotCommodities.length}</p>
                            <p className="text-sm text-muted-foreground">Hot Items</p>
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
                                placeholder="Search inventory..."
                                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                disabled
                            />
                        </div>
                        <select
                            className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            disabled
                        >
                            <option value="all">All Locations</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Inventory Items ({items.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Item Name</TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SKU</TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost</TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">In Stock</TableHead>
                                        <TableHead className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="bg-card divide-y divide-border">
                                    {items.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-muted/50">
                                            <TableCell className="px-6 py-4 font-medium">
                                                <div className="text-foreground">{item.name}</div>
                                                <div className="text-xs text-muted-foreground lowercase">{item.category}</div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-sm text-foreground">{item.sku || '-'}</TableCell>
                                            <TableCell className="px-6 py-4 text-sm text-foreground">{item.location || '-'}</TableCell>
                                            <TableCell className="px-6 py-4 text-sm text-foreground">${item.unitCost?.toFixed(2) || '0.00'}</TableCell>
                                            <TableCell className="px-6 py-4 text-sm text-foreground">
                                                <div className="flex items-center gap-2">
                                                    {item.quantity}
                                                    {item.quantity <= item.reorderLevel && (
                                                        <span className="w-2 h-2 rounded-full bg-destructive" title="Low Stock" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <Link href={`/admin/finance/inventory/${item.id}/edit`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                                No inventory items tracked yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Hot Commodities Sidebar */}
                <Card className="h-fit">
                    <CardHeader className="border-b border-border">
                        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            Hot Commodities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            {hotCommodities.map((item, idx) => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono text-muted-foreground text-sm">#{idx + 1}</div>
                                        <div>
                                            <div className="font-medium text-foreground">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">Purchased {item._count.expenses} times</div>
                                        </div>
                                    </div>
                                    <Link href={`/admin/finance/inventory/${item.id}/edit`}>
                                        <Button variant="ghost" size="sm" className="h-8 w-8">
                                            <Edit className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                            {hotCommodities.length === 0 && (
                                <div className="p-6 text-center text-muted-foreground text-sm">No inventory activity yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Checkouts Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Checkouts</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="px-6 py-3">Item</TableHead>
                                    <TableHead className="px-6 py-3">Team</TableHead>
                                    <TableHead className="px-6 py-3">Checked Out By</TableHead>
                                    <TableHead className="px-6 py-3">Checked Out On</TableHead>
                                    <TableHead className="px-6 py-3">Expected Return</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-card divide-y divide-border">
                                {activeCheckouts.map(checkout => (
                                    <TableRow key={checkout.id} className="hover:bg-muted/50">
                                        <TableCell className="px-6 py-4 font-medium">
                                            {checkout.item.name} <span className="text-muted-foreground text-xs ml-2">x{checkout.quantity}</span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <Link href={`/projects/teams/${checkout.team.slug}/inventory`} className="text-sky-600 hover:text-sky-500">
                                                {checkout.team.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-muted-foreground">
                                            {checkout.user.firstName} {checkout.user.lastName}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-muted-foreground">
                                            {new Date(checkout.checkoutDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-muted-foreground">
                                            {checkout.expectedReturn ? new Date(checkout.expectedReturn).toLocaleDateString() : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {activeCheckouts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                            No hardware currently checked out.
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
