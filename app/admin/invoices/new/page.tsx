'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronLeft, Plus, Trash2, Loader2, Save, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

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
    discountApplied?: number; // Calculated discount amount per unit
    discountDetails?: string; // e.g., "5% Referral + 10% Performance"
}

interface Installment {
    id: number;
    amount: number;
    dueDate: string;
}

export default function CreateInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [parents, setParents] = useState<User[]>([]);

    // Form State
    const [parentId, setParentId] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<LineItem[]>([
        { id: 1, description: '', quantity: 1, unitPrice: 0 }
    ]);
    const [tax, setTax] = useState(0);

    // Payment Schedule State
    const [isSplitPayment, setIsSplitPayment] = useState(false);
    const [singleDueDate, setSingleDueDate] = useState('');
    const [installments, setInstallments] = useState<Installment[]>([
        { id: 1, amount: 0, dueDate: '' },
        { id: 2, amount: 0, dueDate: '' }
    ]);

    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [usersRes, coursesRes] = await Promise.all([
                    fetch('/api/admin/users', { cache: 'no-store' }),
                    fetch('/api/admin/courses', { cache: 'no-store' })
                ]);

                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setParents(data.users.filter((u: User) => u.parentProfile !== null));
                }

                if (coursesRes.ok) {
                    const data = await coursesRes.json();
                    setCourses(data.courses.filter((c: Course) => c.isActive));
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

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

    const handleItemChange = (id: number, field: keyof LineItem, value: string | number) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                // Auto-calculate discount and price if student/course changes
                if (field === 'courseId' || field === 'studentId') {
                    const course = courses.find(c => c.id === (field === 'courseId' ? value : item.courseId));
                    const studentId = field === 'studentId' ? value : item.studentId;

                    // Set description and price from course if not set manually (or if course changed)
                    if (field === 'courseId' && course) {
                        updatedItem.description = course.name;
                        updatedItem.unitPrice = course.price || 0;
                    }

                    // Calculate discount if both student and price exist
                    if (studentId && updatedItem.unitPrice > 0) {
                        const parent = parents.find(p => p.parentProfile?.id === parentId);
                        const studentObj = parent?.parentProfile?.students.find(s => s.student.id === studentId)?.student;

                        if (studentObj) {
                            const referralDiscountPercent = Math.min(studentObj._count.referrals * 5, 20); // Cap at 20%
                            const performanceDiscountPercent = studentObj.performanceDiscount || 0;
                            const totalDiscountPercent = referralDiscountPercent + performanceDiscountPercent;

                            if (totalDiscountPercent > 0) {
                                const discountAmount = updatedItem.unitPrice * (totalDiscountPercent / 100);
                                // We don't change unitPrice, but we could add a discount field or adjust the total logic
                                // Ideally, we'd have a 'discount' field. For now, let's adjust unit price and note it?
                                // Or better, let's keep unit price as list price, and actually support discount in the model?
                                // The model doesn't have a discount field on InvoiceItem.
                                // So we must reduce the unit price and describe it in calculation.
                                // OR: We just change the unit price and set description to include calculation.

                                updatedItem.unitPrice = parseFloat((updatedItem.unitPrice - discountAmount).toFixed(2));
                                updatedItem.discountDetails = `${totalDiscountPercent}% Off (${referralDiscountPercent}% Ref + ${performanceDiscountPercent}% Perf)`;
                                updatedItem.description = `${course?.name || updatedItem.description} (${updatedItem.discountDetails})`;
                            }
                        }
                    }
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
        return calculateSubtotal() + tax;
    };

    // --- Installment Handlers ---
    const handleAddInstallment = () => {
        setInstallments([...installments, { id: Date.now(), amount: 0, dueDate: '' }]);
    };

    const handleRemoveInstallment = (id: number) => {
        if (installments.length <= 2) return; // Minimum 2 for splits
        setInstallments(installments.filter(i => i.id !== id));
    };

    const handleInstallmentChange = (id: number, field: keyof Installment, value: string | number) => {
        setInstallments(installments.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const calculateInstallmentTotal = () => {
        return installments.reduce((sum, i) => sum + (i.amount || 0), 0);
    };

    const autoDistributeInstallments = () => {
        const total = calculateTotal();
        const count = installments.length;
        const amountPerInstallment = parseFloat((total / count).toFixed(2));
        const remainder = total - (amountPerInstallment * count);

        setInstallments(installments.map((inst, idx) => ({
            ...inst,
            amount: idx === 0 ? amountPerInstallment + remainder : amountPerInstallment
        })));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!parentId) {
            alert('Please select a parent');
            return;
        }

        if (!isSplitPayment && !singleDueDate) {
            alert('Please select a due date');
            return;
        }

        const total = calculateTotal();

        if (isSplitPayment) {
            const installmentTotal = calculateInstallmentTotal();
            // Allow small floating point difference
            if (Math.abs(installmentTotal - total) > 0.01) {
                alert(`Installment total (${formatCurrency(installmentTotal)}) must match invoice total (${formatCurrency(total)})`);
                return;
            }

            for (const inst of installments) {
                if (!inst.dueDate) {
                    alert('All installments must have a due date');
                    return;
                }
            }
        }

        setSaving(true);
        try {
            const response = await fetch('/api/admin/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parentId,
                    dueDate: isSplitPayment ? installments[0].dueDate : singleDueDate, // Main due date is 1st installment or single date
                    isSplitPayment,
                    installments: isSplitPayment ? installments : [],
                    notes,
                    items: items.map(({ description, quantity, unitPrice, studentId, courseId }) => ({
                        description, quantity, unitPrice, studentId, courseId
                    })),
                    tax
                }),
            });

            if (response.ok) {
                router.push('/admin/invoices');
                router.refresh();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to create invoice');
            }
        } catch (error) {
            console.error('Failed to create invoice:', error);
            alert('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentTotal = calculateTotal();
    const installmentTotal = calculateInstallmentTotal();
    const remainingParams = currentTotal - installmentTotal;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/invoices" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
                <h1 className="text-2xl font-bold">Create New Invoice</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Parent Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Select Parent *</label>
                            <select
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                                required
                            >
                                <option value="">-- Select Parent --</option>
                                {parents.map((user) => (
                                    <option key={user.id} value={user.parentProfile?.id}>
                                        {user.firstName} {user.lastName} ({user.email})
                                    </option>
                                ))}
                            </select>
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
                                {items.map((item, index) => {
                                    const selectedParent = parents.find(p => p.parentProfile?.id === parentId);
                                    const parentStudents = selectedParent?.parentProfile?.students || [];

                                    return (
                                        <div key={item.id} className="flex gap-4 items-start flex-wrap bg-card p-3 rounded border border-border">
                                            {/* First Row: Student & Course */}
                                            <div className="w-full flex gap-4 mb-2">
                                                <div className="flex-1">
                                                    {index === 0 && <label className="text-xs text-muted-foreground block mb-1">Student (Optional)</label>}
                                                    <select
                                                        value={item.studentId || ''}
                                                        onChange={(e) => handleItemChange(item.id, 'studentId', e.target.value)}
                                                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                                                        disabled={!parentId}
                                                    >
                                                        <option value="">-- No Student --</option>
                                                        {parentStudents.map(s => (
                                                            <option key={s.student.id} value={s.student.id}>
                                                                {s.student.user.firstName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    {index === 0 && <label className="text-xs text-muted-foreground block mb-1">Offering (Optional)</label>}
                                                    <select
                                                        value={item.courseId || ''}
                                                        onChange={(e) => handleItemChange(item.id, 'courseId', e.target.value)}
                                                        className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                                                    >
                                                        <option value="">-- Custom Item --</option>
                                                        {courses.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Second Row: Description, Qty, Price */}
                                            <div className="flex-1 min-w-[200px] hover:grow">
                                                {index === 0 && <label className="text-xs text-muted-foreground block mb-1">Description</label>}
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                    placeholder="Item description"
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
                                            <div className="w-24 pt-0.5">
                                                {index === 0 && <label className="text-xs text-muted-foreground w-full block text-right mb-1">Total</label>}
                                                <div className="h-[38px] flex items-center justify-end text-sm font-medium text-foreground">
                                                    ${(item.quantity * item.unitPrice).toFixed(2)}
                                                </div>
                                            </div>
                                            <div className={index === 0 ? "pt-6" : ""}>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                                                    disabled={items.length === 1}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Totals & Payment Schedule */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                {/* Notes */}
                                <div className="space-y-2 mb-6">
                                    <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add any additional notes..."
                                        className="w-full px-3 py-2 border border-input rounded-md min-h-[120px] text-sm bg-background text-foreground"
                                    />
                                </div>

                                {/* Payment Schedule Configuration */}
                                <div className="border border-primary/20 bg-primary/5 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-primary flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Payment Schedule
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                id="splitPayment"
                                                checked={isSplitPayment}
                                                onChange={(e) => setIsSplitPayment(e.target.checked)}
                                                className="rounded border-input text-primary focus:ring-primary bg-background"
                                            />
                                            <label htmlFor="splitPayment" className="text-foreground user-select-none cursor-pointer">
                                                Split into Installments
                                            </label>
                                        </div>
                                    </div>

                                    {!isSplitPayment ? (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Due Date *</label>
                                            <input
                                                type="date"
                                                value={singleDueDate}
                                                onChange={(e) => setSingleDueDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                                                required={!isSplitPayment}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {installments.map((inst, idx) => (
                                                <div key={inst.id} className="flex gap-3 items-center">
                                                    <span className="text-xs font-bold text-muted-foreground w-6">#{idx + 1}</span>
                                                    <div className="flex-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={inst.amount}
                                                            onChange={(e) => handleInstallmentChange(inst.id, 'amount', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-2 py-1.5 border border-input rounded text-sm bg-background text-foreground"
                                                            placeholder="Amount"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <input
                                                            type="date"
                                                            value={inst.dueDate}
                                                            onChange={(e) => handleInstallmentChange(inst.id, 'dueDate', e.target.value)}
                                                            className="w-full px-2 py-1.5 border border-input rounded text-sm bg-background text-foreground"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveInstallment(inst.id)}
                                                        disabled={installments.length <= 2}
                                                        className="h-8 w-8 p-0 text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}

                                            <div className="flex gap-2 pt-2">
                                                <Button type="button" variant="outline" size="sm" onClick={handleAddInstallment} className="flex-1 text-xs">
                                                    <Plus className="w-3 h-3 mr-1" /> Add Installment
                                                </Button>
                                                <Button type="button" variant="outline" size="sm" onClick={autoDistributeInstallments} className="flex-1 text-xs">
                                                    Auto Distribute
                                                </Button>
                                            </div>

                                            <div className="text-right text-xs pt-2">
                                                <span className={Math.abs(currentTotal - installmentTotal) < 0.01 ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                                                    Allocated: {formatCurrency(installmentTotal)} / {formatCurrency(currentTotal)}
                                                </span>
                                                {Math.abs(currentTotal - installmentTotal) >= 0.01 && (
                                                    <span className="text-red-500 block">
                                                        Remaining: {formatCurrency(currentTotal - installmentTotal)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
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
                            <Link href="/admin/invoices">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={saving} className="min-w-[120px]">
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Create Invoice
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
