'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronLeft, Plus, Trash2, Loader2, Save, Calendar, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import InvoiceDownloadButton from '@/components/invoices/InvoiceDownloadButton';

// Reuse interfaces (should ideally be shared in a types file)
interface Student {
    id: string;
    performanceDiscount: number;
    _count: { referrals: number };
    user: { firstName: string; lastName: string };
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    parentProfile: {
        id: string;
        students: { student: Student }[];
    } | null;
}

interface Course {
    id: string;
    name: string;
    price: number | null;
    duration: string | null;
    hidePrice: boolean;
    isActive: boolean;
}

interface LineItem {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    studentId?: string;
    courseId?: string;
    discountDetails?: string;
    missedWeeks?: number;
    student?: any; // Full student object for PDF generation
    durationWeeks?: number; // Total weeks for proration
    originalPrice?: number; // Base price
}

interface Installment {
    id: number;
    amount: number;
    dueDate: string;
}

export default function EditInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [parents, setParents] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);

    // Form State
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [parentId, setParentId] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<LineItem[]>([]);
    const [tax, setTax] = useState(0);

    // Payment Schedule State
    const [isSplitPayment, setIsSplitPayment] = useState(false);
    // Since existing invoices might not strictly follow split logic in local state, 
    // we mostly rely on dueDate/installments from DB.
    // For editing, complex installment re-calc might be tricky if data structure is simple.
    // We'll simplify: If installments exist, show split mode.

    const [singleDueDate, setSingleDueDate] = useState('');
    const [installments, setInstallments] = useState<Installment[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [usersRes, coursesRes, invoiceRes] = await Promise.all([
                    fetch('/api/admin/users', { cache: 'no-store' }),
                    fetch('/api/admin/courses', { cache: 'no-store' }),
                    fetch(`/api/admin/invoices/${params.id}`, { cache: 'no-store' })
                ]);

                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setParents(data.users.filter((u: User) => u.parentProfile !== null));
                }

                if (coursesRes.ok) {
                    const data = await coursesRes.json();
                    setCourses(data.courses.filter((c: Course) => c.isActive));
                }

                if (invoiceRes.ok) {
                    const data = await invoiceRes.json();
                    const inv = data.invoice;

                    setInvoiceNumber(inv.invoiceNumber);
                    setParentId(inv.parent.id); // Note: verify if inv.parent.id is Profile ID or User ID. Schema says parentId refs ParentProfile.
                    setNotes(inv.notes || '');
                    setTax(inv.tax || 0);

                    // Map Items - preserve student data for PDF generation
                    const mappedItems = inv.items.map((item: any, idx: number) => ({
                        id: Date.now() + idx, // temporary ID for frontend key
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        originalPrice: item.unitPrice, // Initialize original price with current price (assuming it's correct on load)
                        // We might lose specific student/course linkage if not stored in items table, 
                        // but API route creates them without storing relation ID in item unless updated schema?
                        // Checking create route: it stores studentId/courseId if present.
                        studentId: item.studentId || undefined,
                        courseId: item.courseId || undefined,
                        student: item.student || undefined // Preserve full student object
                    }));
                    setItems(mappedItems);

                    // Map Installments
                    // Note: Schema might vary, checking route logic...
                    // The route creates installments but fetching often returns them if included.
                    // If fetching invoice doesn't return installments, we can't edit them easily.
                    // Let's assume for now we just edit the main fields or if installments are supported check API 'include'.
                    // The GET route creates an `include` for items but NOT installments.
                    // So we might only be able to edit the single due date for now unless we update GET.

                    if (inv.dueDate) {
                        setSingleDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
                    }

                    // If we want to support installments editing, we need to fetch them.
                    // For MPV/Fix, let's stick to core invoice data.
                    setIsSplitPayment(false); // Default to simple for edit unless we see multiple installments
                } else {
                    alert('Invoice not found');
                    router.push('/admin/finance/invoices');
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        }
        if (params.id) fetchData();
    }, [params.id, router]);

    // --- Line Item Handlers ---
    const handleAddItem = () => {
        setItems([
            ...items,
            { id: Date.now(), description: '', quantity: 1, unitPrice: 0 }
        ]);
    };

    const handleRemoveItem = (id: number) => {
        if (items.length === 1) return;
        setItems(items.filter(item => item.id !== id));
    };

    // Helper function to parse duration string (e.g., "8 weeks" -> 8)
    const parseDurationWeeks = (duration: string | null): number | null => {
        if (!duration) return null;
        const match = duration.match(/(\d+)\s*week/i);
        return match ? parseInt(match[1], 10) : null;
    };

    const handleItemChange = (id: number, field: keyof LineItem, value: string | number) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                // Auto-set duration weeks if course changes
                if (field === 'courseId') {
                    const course = courses.find(c => c.id === value);
                    if (course) {
                        updatedItem.description = course.name;
                        updatedItem.unitPrice = course.price || 0;
                        updatedItem.originalPrice = course.price || 0; // Set original price

                        if (course.duration) {
                            const weeks = parseDurationWeeks(course.duration);
                            if (weeks) {
                                updatedItem.durationWeeks = weeks;
                            } else {
                                delete updatedItem.durationWeeks;
                            }
                        }
                    }
                }

                // Apply proration if missedWeeks or durationWeeks is set
                if (field === 'missedWeeks' || field === 'durationWeeks' || (field === 'courseId' && (updatedItem.missedWeeks || updatedItem.durationWeeks))) {
                    const course = courses.find(c => c.id === updatedItem.courseId);

                    // Use manual duration or fall back to course duration
                    let durationWeeks = updatedItem.durationWeeks;
                    if (!durationWeeks && course && course.duration) {
                        durationWeeks = parseDurationWeeks(course.duration) || undefined;
                    }

                    // Capture original price if not already set (first time proration)
                    if (updatedItem.originalPrice === undefined) {
                        // If course matches, prefer course price, otherwise current unit price
                        updatedItem.originalPrice = course && (course.price === updatedItem.unitPrice) ? (course.price || 0) : updatedItem.unitPrice;
                    }

                    if (durationWeeks && durationWeeks > 0) {
                        // If we have missed weeks, calculate prorated price
                        if (updatedItem.missedWeeks && updatedItem.missedWeeks > 0) {
                            const basePrice = updatedItem.originalPrice || 0;
                            const proratedPrice = basePrice - (basePrice / durationWeeks) * updatedItem.missedWeeks;
                            updatedItem.unitPrice = parseFloat(proratedPrice.toFixed(2));

                            // Update description
                            const proratedText = `(Prorated: ${updatedItem.missedWeeks}/${durationWeeks} weeks missed)`;
                            let baseDescription = updatedItem.description;
                            if (baseDescription.includes('(Prorated:')) {
                                baseDescription = baseDescription.split('(Prorated:')[0].trim();
                            }
                            updatedItem.description = `${baseDescription} ${proratedText}`;
                        } else {
                            // If missed weeks is 0/cleared, revert to original price and description
                            updatedItem.unitPrice = updatedItem.originalPrice || 0;

                            if (updatedItem.description.includes('(Prorated:')) {
                                updatedItem.description = updatedItem.description.split('(Prorated:')[0].trim();
                            }
                        }
                    }
                }

                // If user manually changes unit price, update original price to match (unless it's a proration calculation happening above)
                if (field === 'unitPrice') {
                    updatedItem.originalPrice = value as number;
                }

                return updatedItem;
            }
            return item;
        }));
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const calculateTotal = () => {
        const taxValue = typeof tax === 'number' ? tax : (parseFloat(tax as any) || 0);
        return calculateSubtotal() + taxValue;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!parentId) {
            alert('Please select a parent');
            return;
        }

        if (!singleDueDate) {
            alert('Please select a due date');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`/api/admin/invoices/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parentId, // Usually can't change parent easily but API might allow
                    dueDate: singleDueDate,
                    notes,
                    items: items.map(({ description, quantity, unitPrice, studentId, courseId, durationWeeks, missedWeeks }) => ({
                        description, quantity, unitPrice, studentId, courseId, durationWeeks, missedWeeks
                    })),
                    tax
                }),
            });

            if (response.ok) {
                router.push(`/admin/finance/invoices/${params.id}`);
                router.refresh();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update invoice');
            }
        } catch (error) {
            console.error('Failed to update invoice:', error);
            alert('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href={`/admin/finance/invoices/${params.id}`} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Edit Invoice {invoiceNumber}</h1>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Preview
                    </Button>
                    <div suppressHydrationWarning>
                        <InvoiceDownloadButton
                            invoice={{
                                id: params.id as string,
                                invoiceNumber,
                                status: 'unpaid' as const,
                                dueDate: singleDueDate,
                                paidDate: null,
                                subtotal: calculateSubtotal(),
                                tax,
                                total: calculateTotal(),
                                notes,
                                createdAt: new Date().toISOString(),
                                parent: {
                                    id: parentId,
                                    user: {
                                        firstName: '',
                                        lastName: '',
                                        email: ''
                                    }
                                },
                                items
                            }}
                        />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Parent Selection (Disabled for Edit usually, but left enabled if schema supports re-assigning) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Parent</label>
                            <select
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-muted text-muted-foreground"
                                disabled
                            >
                                <option value="">-- Select Parent --</option>
                                {parents.map((user) => (
                                    <option key={user.id} value={user.parentProfile?.id}>
                                        {user.firstName} {user.lastName} ({user.email})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground">Parent cannot be changed once invoice is created.</p>
                        </div>

                        {/* Line Items */}
                        <div className="border border-border rounded-lg p-4 bg-muted/50">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-foreground">Line Items</h3>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-2">
                                    <Plus className="w-4 h-4" /> Add Item
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={item.id} className="flex gap-4 items-start flex-wrap bg-card p-3 rounded border border-border">
                                        <div className="flex-1 min-w-[200px] hover:grow">
                                            {index === 0 && <label className="text-xs text-muted-foreground block mb-1">Description</label>}
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                                                required
                                            />
                                        </div>
                                        <div className="w-20">
                                            {index === 0 && <label className="text-xs text-muted-foreground block mb-1">Qty</label>}
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border border-input rounded-md text-sm text-right bg-background text-foreground"
                                                required
                                            />
                                        </div>
                                        <div className="w-28">
                                            {index === 0 && <label className="text-xs text-muted-foreground block mb-1">Unit Price</label>}
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border border-input rounded-md text-sm text-right bg-background text-foreground"
                                            />
                                        </div>
                                        <div className="w-24">
                                            {index === 0 && <label className="text-xs text-muted-foreground block mb-1">Total Wks</label>}
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={item.durationWeeks || ''}
                                                onChange={(e) => handleItemChange(item.id, 'durationWeeks', parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border border-input rounded-md text-sm text-right bg-background text-foreground"
                                                placeholder="-"
                                            />
                                        </div>
                                        <div className="w-24">
                                            {index === 0 && <label className="text-xs text-muted-foreground block mb-1">Missed Wks</label>}
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={item.missedWeeks || 0}
                                                onChange={(e) => handleItemChange(item.id, 'missedWeeks', parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border border-input rounded-md text-sm text-right bg-background text-foreground"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="w-24 pt-0.5">
                                            {index === 0 && <label className="text-xs text-muted-foreground w-full block text-right mb-1">Total</label>}
                                            <div className="h-[38px] flex items-center justify-end text-sm font-medium text-foreground">
                                                ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className={index === 0 ? "pt-6" : ""}>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                                                disabled={items.length === 1}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals & Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <div className="space-y-2 mb-6">
                                    <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full px-3 py-2 border border-input rounded-md min-h-[120px] text-sm bg-background text-foreground"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Due Date *</label>
                                    <input
                                        type="date"
                                        value={singleDueDate}
                                        onChange={(e) => setSingleDueDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-muted/30 border border-border p-6 rounded-lg space-y-3 h-fit">
                                <div className="flex justify-between text-sm text-foreground">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(calculateSubtotal())}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-foreground">
                                    <span>Tax Amount</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={tax}
                                        onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                                        className="w-24 px-2 py-1 border border-input rounded text-right bg-background text-foreground"
                                    />
                                </div>
                                <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-3">
                                    <span>Total Due</span>
                                    <span>{formatCurrency(calculateTotal())}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t">
                            <Link href={`/admin/finance/invoices/${params.id}`}>
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={saving} className="min-w-[120px]">
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
