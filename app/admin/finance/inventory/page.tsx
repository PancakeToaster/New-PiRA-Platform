import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/Table';
import { Plus, Edit, AlertCircle, ShoppingCart } from 'lucide-react';
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

    const hotCommodities = await prisma.inventoryItem.findMany({
        orderBy: { expenses: { _count: 'desc' } },
        take: 5,
        include: { _count: { select: { expenses: true } } }
    });

    const totalValue = items.reduce((sum, item) => sum + ((item.unitCost || 0) * item.quantity), 0);
    const lowStockItems = items.filter(i => i.quantity <= i.reorderLevel);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                </div>
                <Link href="/admin/finance/inventory/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-gray-500">Total Asset Value</div>
                        <div className="text-2xl font-bold text-gray-900 mt-2">
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-gray-500">Total Items</div>
                        <div className="text-2xl font-bold text-gray-900 mt-2">
                            {items.length}
                        </div>
                    </CardContent>
                </Card>
                <Card className={lowStockItems.length > 0 ? "border-amber-200 bg-amber-50" : ""}>
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-amber-700">Low Stock Alerts</div>
                        <div className="text-2xl font-bold text-amber-900 mt-2 flex items-center gap-2">
                            {lowStockItems.length}
                            {lowStockItems.length > 0 && <AlertCircle className="w-5 h-5 text-amber-600" />}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Cost</TableHead>
                                    <TableHead>In Stock</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <div>{item.name}</div>
                                            <div className="text-xs text-gray-500 lowercase">{item.category}</div>
                                        </TableCell>
                                        <TableCell>{item.sku || '-'}</TableCell>
                                        <TableCell>{item.location || '-'}</TableCell>
                                        <TableCell>${item.unitCost?.toFixed(2) || '0.00'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {item.quantity}
                                                {item.quantity <= item.reorderLevel && (
                                                    <span className="w-2 h-2 rounded-full bg-red-500" title="Low Stock" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
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
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            No inventory items tracked yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Hot Commodities Sidebar */}
                <Card className="h-fit">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-purple-600" />
                            Hot Commodities
                        </h3>
                    </div>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {hotCommodities.map((item, idx) => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono text-gray-400 text-sm">#{idx + 1}</div>
                                        <div>
                                            <div className="font-medium text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-500">Purchased {item._count.expenses} times</div>
                                        </div>
                                    </div>
                                    <Link href={`/admin/finance/inventory/${item.id}/edit`}>
                                        <Button variant="ghost" size="sm" className="h-8 w-8">
                                            <Edit className="w-4 h-4 text-gray-400 hover:text-sky-600" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                            {hotCommodities.length === 0 && (
                                <div className="p-6 text-center text-gray-400 text-sm">No inventory activity yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
