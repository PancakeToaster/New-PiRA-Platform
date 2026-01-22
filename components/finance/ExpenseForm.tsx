'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Loader2, Save, ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';

interface ProjectOption {
    id: string;
    name: string;
    slug: string;
}

interface InventoryOption {
    id: string;
    name: string;
}

interface ExpenseFormProps {
    projects: ProjectOption[];
    inventoryItems: InventoryOption[];
    initialData?: any;
    isEditing?: boolean;
}

export default function ExpenseForm({
    projects,
    inventoryItems,
    initialData,
    isEditing = false
}: ExpenseFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        amount: initialData?.amount?.toString() || '',
        date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        vendor: initialData?.vendor || '',
        description: initialData?.description || '',
        category: initialData?.category || 'Hardware',
        projectId: initialData?.projectId || '',
        inventoryItemId: initialData?.inventoryItemId || '',
        quarter: initialData?.quarter || '',
        receiptUrl: initialData?.receiptUrl || ''
    });

    const categories = [
        'Hardware', 'Software', 'Travel', 'Food', 'Event Registration',
        'Marketing', 'Office Supplies', 'Contractor', 'Other'
    ];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/upload/receipt', {
                method: 'POST',
                body: data
            });

            if (!res.ok) throw new Error('Upload failed');

            const json = await res.json();
            setFormData(prev => ({ ...prev, receiptUrl: json.url }));
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload receipt');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = isEditing
                ? `/api/admin/expenses/${initialData.id}`
                : '/api/admin/expenses';

            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/admin/finance/expenses');
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/admin/finance/expenses"
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Expenses
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditing ? 'Edit Expense' : 'Log New Expense'}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount ($)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        className="text-lg font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vendor">Vendor / Merchant</Label>
                                <Input
                                    id="vendor"
                                    required
                                    value={formData.vendor}
                                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                    placeholder="e.g. Amazon, Home Depot, Flight Details"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <select
                                        id="category"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quarter">Quarter (Optional)</Label>
                                    <Input
                                        id="quarter"
                                        placeholder="e.g. Q1 2024"
                                        value={formData.quarter}
                                        onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What was purchased and why?"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="font-medium text-gray-900 border-b pb-2">Allocations (Optional)</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="project" className="text-gray-600">Link to Project</Label>
                                    <select
                                        id="project"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.projectId}
                                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                    >
                                        <option value="">-- No Project --</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="inventory" className="text-gray-600">Link to Inventory Item</Label>
                                    <select
                                        id="inventory"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.inventoryItemId}
                                        onChange={(e) => setFormData({ ...formData, inventoryItemId: e.target.value })}
                                    >
                                        <option value="">-- No Inventory Item --</option>
                                        {inventoryItems.map(i => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500">Links this cost to the item's history.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Receipt & Save */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <Label className="block font-medium mb-1">Receipt / Invoice</Label>

                            {formData.receiptUrl ? (
                                <div className="relative border rounded-lg overflow-hidden group">
                                    {formData.receiptUrl.endsWith('.pdf') ? (
                                        <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-500">
                                            <span className="font-medium">PDF Document</span>
                                        </div>
                                    ) : (
                                        <img
                                            src={formData.receiptUrl}
                                            alt="Receipt"
                                            className="w-full h-auto object-contain bg-gray-50 max-h-60"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, receiptUrl: '' })}
                                        className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative">
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-600 font-medium">Upload Receipt</span>
                                    <span className="text-xs text-gray-400 mt-1">Image or PDF (Max 5MB)</span>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                </div>
                            )}

                            {isUploading && (
                                <div className="text-sm text-sky-600 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                                </div>
                            )}

                            <Button type="submit" className="w-full mt-4" disabled={isLoading || isUploading}>
                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Expense
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
