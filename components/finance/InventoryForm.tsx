'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface InventoryFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export default function InventoryForm({ initialData, isEditing = false }: InventoryFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        sku: initialData?.sku || '',
        category: initialData?.category || '',
        description: initialData?.description || '',
        quantity: initialData?.quantity?.toString() || '0',
        location: initialData?.location || '',
        unitCost: initialData?.unitCost?.toString() || '',
        reorderLevel: initialData?.reorderLevel?.toString() || '5',
        imageUrl: initialData?.imageUrl || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = isEditing
                ? `/api/admin/inventory/${initialData.id}`
                : '/api/admin/inventory';

            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/admin/finance/inventory');
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl">
            <div className="mb-6">
                <Link
                    href="/admin/finance/inventory"
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to List
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditing ? 'Edit Item' : 'Add Inventory Item'}
                </h1>
            </div>

            <Card>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Raspberry Pi 5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sku">SKU / Serial No.</Label>
                            <Input
                                id="sku"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                list="categories"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="Group similar items..."
                            />
                            <datalist id="categories">
                                <option value="Electronics" />
                                <option value="Motors" />
                                <option value="Hardware" />
                                <option value="Tools" />
                                <option value="Raw Materials" />
                            </datalist>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Storage Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Rack A1"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity On Hand</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="0"
                                required
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost">Unit Cost ($)</Label>
                            <Input
                                id="cost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.unitCost}
                                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reorder">Reorder Level</Label>
                            <Input
                                id="reorder"
                                type="number"
                                min="0"
                                value={formData.reorderLevel}
                                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Item
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
