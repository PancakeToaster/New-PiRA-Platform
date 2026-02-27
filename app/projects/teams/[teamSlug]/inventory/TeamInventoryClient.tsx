'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { format } from 'date-fns';
import { PackageOpen, Plus, Loader2, ArrowLeftRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TeamInventoryClient({
    teamId,
    initialCheckouts,
    availableInventory,
    teamProjects,
    userId
}: {
    teamId: string;
    initialCheckouts: any[];
    availableInventory: any[];
    teamProjects: any[];
    userId: string;
}) {
    const router = useRouter();
    const [checkouts, setCheckouts] = useState(initialCheckouts);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [selectedItemId, setSelectedItemId] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [expectedReturn, setExpectedReturn] = useState('');
    const [notes, setNotes] = useState('');

    const maxQuantity = availableInventory.find(i => i.id === selectedItemId)?.quantity || 1;

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemId) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/finance/inventory/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inventoryItemId: selectedItemId,
                    teamId,
                    projectId: selectedProjectId || null,
                    quantity,
                    expectedReturn: expectedReturn || null,
                    notes
                })
            });

            if (res.ok) {
                const data = await res.json();
                setCheckouts([data.checkout, ...checkouts]);
                setShowCheckoutModal(false);
                router.refresh(); // Refresh server data
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to checkout item');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to checkout item');
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async (checkoutId: string) => {
        if (!confirm('Mark this item as returned?')) return;

        try {
            const res = await fetch('/api/admin/finance/inventory/checkout', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checkoutId, status: 'returned' })
            });

            if (res.ok) {
                const data = await res.json();
                setCheckouts(checkouts.map(c => c.id === checkoutId ? data.checkout : c));
                router.refresh();
            } else {
                alert('Failed to return item');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setShowCheckoutModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Checkout Hardware
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PackageOpen className="w-5 h-5 text-amber-500" />
                        Hardware Checked Out
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Checked Out By</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {checkouts.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium text-foreground">
                                            {c.item.name}
                                        </TableCell>
                                        <TableCell>{c.quantity}</TableCell>
                                        <TableCell>{c.user.firstName} {c.user.lastName}</TableCell>
                                        <TableCell>{c.project?.name || '-'}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {format(new Date(c.checkoutDate), 'MMM d, yyyy')}
                                            </div>
                                            {c.expectedReturn && (
                                                <div className="text-xs text-muted-foreground">
                                                    Due: {format(new Date(c.expectedReturn), 'MMM d, yyyy')}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    c.status === 'returned' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {c.status.toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {c.status === 'active' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleReturn(c.id)}
                                                >
                                                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                                                    Return
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {checkouts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No hardware currently checked out by this team.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Checkout Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
                    <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h3 className="text-lg font-semibold text-foreground">Checkout Hardware</h3>
                            <button onClick={() => setShowCheckoutModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
                        </div>
                        <form onSubmit={handleCheckout} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Item *</label>
                                <select
                                    required
                                    value={selectedItemId}
                                    onChange={(e) => {
                                        setSelectedItemId(e.target.value);
                                        setQuantity(1);
                                    }}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">-- Choose Hardware --</option>
                                    {availableInventory.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.quantity} available) - {item.location || 'No location'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedItemId && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Quantity * (Max: {maxQuantity})</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={maxQuantity}
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                                        required
                                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Associate with Project (Optional)</label>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">-- No Project --</option>
                                    {teamProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Expected Return Date (Optional)</label>
                                <input
                                    type="date"
                                    value={expectedReturn}
                                    onChange={(e) => setExpectedReturn(e.target.value)}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="e.g. For the regional competition"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowCheckoutModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={loading || !selectedItemId}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Checkout'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
