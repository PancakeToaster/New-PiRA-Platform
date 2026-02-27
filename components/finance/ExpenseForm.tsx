'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Loader2, Save, ArrowLeft, Upload, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';

interface ProjectOption { id: string; name: string; slug: string; }
interface InventoryOption { id: string; name: string; }
interface ExpenseFormProps {
    projects: ProjectOption[];
    inventoryItems: InventoryOption[];
    initialData?: Record<string, unknown>;
    isEditing?: boolean;
}

const CATEGORIES = ['Hardware', 'Software', 'Travel', 'Food', 'Event Registration', 'Marketing', 'Office Supplies', 'Contractor', 'Other'];
const FREQUENCIES = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Yearly', value: 'yearly' },
];

function defaultNextDate(frequency: string): string {
    const d = new Date();
    if (frequency === 'weekly') d.setDate(d.getDate() + 7);
    else if (frequency === 'quarterly') d.setMonth(d.getMonth() + 3);
    else if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1); // monthly
    return d.toISOString().split('T')[0];
}

export default function ExpenseForm({ projects, inventoryItems, initialData, isEditing = false }: ExpenseFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        amount: String(initialData?.amount ?? ''),
        date: initialData?.date ? new Date(initialData.date as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        vendor: String(initialData?.vendor ?? ''),
        description: String(initialData?.description ?? ''),
        category: String(initialData?.category ?? 'Hardware'),
        projectId: String(initialData?.projectId ?? ''),
        inventoryItemId: String(initialData?.inventoryItemId ?? ''),
        quarter: String(initialData?.quarter ?? ''),
        receiptUrl: String(initialData?.receiptUrl ?? ''),
        isRecurring: Boolean(initialData?.isRecurring ?? false),
        recurringFrequency: String(initialData?.recurringFrequency ?? 'monthly'),
        nextRecurringDate: initialData?.nextRecurringDate
            ? new Date(initialData.nextRecurringDate as string).toISOString().split('T')[0]
            : defaultNextDate('monthly'),
    });

    function update<K extends keyof typeof formData>(key: K, value: typeof formData[K]) {
        setFormData(prev => {
            const next = { ...prev, [key]: value };
            // Auto-refresh next date when frequency changes
            if (key === 'recurringFrequency') {
                next.nextRecurringDate = defaultNextDate(value as string);
            }
            return next;
        });
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const data = new FormData();
        data.append('file', file);
        try {
            const res = await fetch('/api/upload/receipt', { method: 'POST', body: data });
            if (!res.ok) throw new Error('Upload failed');
            const json = await res.json();
            update('receiptUrl', json.url);
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
            const url = isEditing ? `/api/admin/expenses/${(initialData as Record<string, unknown>).id}` : '/api/admin/expenses';
            const method = isEditing ? 'PUT' : 'POST';
            const payload = {
                ...formData,
                isRecurring: formData.isRecurring,
                recurringFrequency: formData.isRecurring ? formData.recurringFrequency : null,
                nextRecurringDate: formData.isRecurring ? formData.nextRecurringDate : null,
            };
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) {
                router.push('/admin/finance/expenses');
                router.refresh();
            } else {
                const err = await res.json().catch(() => ({}));
                alert('Failed to save expense: ' + (err.error ?? res.statusText));
            }
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/admin/finance/expenses" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
                    <ArrowLeft className="w-4 h-4 mr-1" />Back to Expenses
                </Link>
                <h1 className="text-2xl font-bold text-foreground">{isEditing ? 'Edit Expense' : 'Log New Expense'}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Core details */}
                    <Card>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount ($)</Label>
                                    <Input id="amount" type="number" step="0.01" required value={formData.amount}
                                        onChange={e => update('amount', e.target.value)} placeholder="0.00" className="text-lg font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input id="date" type="date" required value={formData.date}
                                        onChange={e => update('date', e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vendor">Vendor / Merchant</Label>
                                <Input id="vendor" required value={formData.vendor}
                                    onChange={e => update('vendor', e.target.value)} placeholder="e.g. Amazon, Home Depot" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <select id="category" className={selectClass} value={formData.category}
                                        onChange={e => update('category', e.target.value)}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quarter">Quarter (Optional)</Label>
                                    <Input id="quarter" placeholder="e.g. Q1 2024" value={formData.quarter}
                                        onChange={e => update('quarter', e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea id="description" value={formData.description}
                                    onChange={e => update('description', e.target.value)}
                                    placeholder="What was purchased and why?" rows={3} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recurring section */}
                    <Card className={formData.isRecurring ? 'border-sky-500/40 bg-sky-500/5' : ''}>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 text-sky-500" />Recurring Schedule
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Auto-generate this expense on a schedule</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={formData.isRecurring}
                                        onChange={e => update('isRecurring', e.target.checked)} />
                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-sky-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                                </label>
                            </div>

                            {formData.isRecurring && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="recurringFrequency">Frequency</Label>
                                        <select id="recurringFrequency" className={selectClass} value={formData.recurringFrequency}
                                            onChange={e => update('recurringFrequency', e.target.value)}>
                                            {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nextRecurringDate">Next Due Date</Label>
                                        <Input id="nextRecurringDate" type="date" value={formData.nextRecurringDate}
                                            onChange={e => update('nextRecurringDate', e.target.value)} />
                                    </div>
                                    <div className="md:col-span-2 p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs text-sky-700 dark:text-sky-300">
                                        <strong>How it works:</strong> On the next due date, Admins can click &ldquo;Process Recurring&rdquo; on the
                                        <Link href="/admin/finance/expenses/recurring" className="underline mx-1">recurring schedule page</Link>
                                        to generate the next expense occurrence automatically.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Allocations */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="font-medium text-foreground border-b border-border pb-2">Allocations (Optional)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="project">Link to Project</Label>
                                    <select id="project" className={selectClass} value={formData.projectId}
                                        onChange={e => update('projectId', e.target.value)}>
                                        <option value="">-- No Project --</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="inventory">Link to Inventory Item</Label>
                                    <select id="inventory" className={selectClass} value={formData.inventoryItemId}
                                        onChange={e => update('inventoryItemId', e.target.value)}>
                                        <option value="">-- No Inventory Item --</option>
                                        {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                    </select>
                                    <p className="text-xs text-muted-foreground">Links this cost to the item&apos;s history.</p>
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
                                        <div className="h-40 bg-muted flex items-center justify-center text-muted-foreground">
                                            <span className="font-medium">PDF Document</span>
                                        </div>
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={formData.receiptUrl} alt="Receipt" className="w-full h-auto object-contain bg-muted max-h-60" />
                                    )}
                                    <button type="button" onClick={() => update('receiptUrl', '')}
                                        className="absolute top-2 right-2 p-1 bg-background/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors relative">
                                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-foreground font-medium">Upload Receipt</span>
                                    <span className="text-xs text-muted-foreground mt-1">Image or PDF (Max 5MB)</span>
                                    <input type="file" accept="image/*,application/pdf"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileUpload} disabled={isUploading} />
                                </div>
                            )}

                            {isUploading && (
                                <div className="text-sm text-sky-600 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                                </div>
                            )}

                            <Button type="submit" className="w-full mt-4" disabled={isLoading || isUploading}>
                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                {isEditing ? 'Update Expense' : 'Save Expense'}
                            </Button>

                            {formData.isRecurring && (
                                <p className="text-xs text-center text-sky-600">
                                    <RefreshCw className="w-3 h-3 inline mr-1" />
                                    This will be saved as a recurring template
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
