'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, User, DollarSign, Percent, Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SalaryRecord {
    id: string;
    userId: string;
    title: string | null;
    annualSalary: number;
    taxRate: number;
    healthDeduction: number;
    otherDeductions: number;
    paymentFrequency: string;
    effectiveDate: string;
    endDate: string | null;
    notes: string | null;
    user: { id: string; firstName: string; lastName: string; email: string };
}

interface StaffOption {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface SalaryManagementClientProps {
    initialSalaries: SalaryRecord[];
    staffOptions: StaffOption[];
}

function computeNetAnnual(s: SalaryRecord) {
    const grossMonthly = s.annualSalary / (s.paymentFrequency === 'monthly' ? 12 : s.paymentFrequency === 'biweekly' ? 26 : 52);
    const taxAmt = grossMonthly * s.taxRate;
    return s.annualSalary - taxAmt * 12 - s.healthDeduction * 12 - s.otherDeductions * 12;
}

function fmt(n: number) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
}

export default function SalaryManagementClient({ initialSalaries, staffOptions }: SalaryManagementClientProps) {
    const [salaries, setSalaries] = useState(initialSalaries);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        userId: '', title: '', annualSalary: '', taxRate: '0',
        healthDeduction: '0', otherDeductions: '0', paymentFrequency: 'monthly',
        effectiveDate: new Date().toISOString().split('T')[0], notes: '',
    });

    function resetForm() {
        setForm({ userId: '', title: '', annualSalary: '', taxRate: '0', healthDeduction: '0', otherDeductions: '0', paymentFrequency: 'monthly', effectiveDate: new Date().toISOString().split('T')[0], notes: '' });
        setEditingId(null);
        setShowForm(false);
        setError(null);
    }

    function startEdit(s: SalaryRecord) {
        setForm({
            userId: s.userId, title: s.title ?? '', annualSalary: String(s.annualSalary),
            taxRate: String(s.taxRate), healthDeduction: String(s.healthDeduction),
            otherDeductions: String(s.otherDeductions), paymentFrequency: s.paymentFrequency,
            effectiveDate: s.effectiveDate.split('T')[0], notes: s.notes ?? '',
        });
        setEditingId(s.id);
        setShowForm(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const url = editingId ? `/api/admin/finance/salaries/${editingId}` : '/api/admin/finance/salaries';
            const method = editingId ? 'PATCH' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (!res.ok) throw new Error('Failed to save salary record');
            const data = await res.json();
            if (editingId) {
                setSalaries(prev => prev.map(s => s.id === editingId ? { ...s, ...data.salary } : s));
            } else {
                setSalaries(prev => [data.salary, ...prev]);
            }
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this salary record?')) return;
        await fetch(`/api/admin/finance/salaries/${id}`, { method: 'DELETE' });
        setSalaries(prev => prev.filter(s => s.id !== id));
    }

    const freqLabel: Record<string, string> = { weekly: '/wk', biweekly: '/2wk', monthly: '/mo' };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Staff Salary Management</h1>
                    <p className="text-muted-foreground">Track annual salaries, tax rates, and deductions.</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                    <Plus className="w-4 h-4" />Add Salary Record
                </Button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-xs text-muted-foreground mb-1">Active Records</p>
                        <p className="text-2xl font-bold text-foreground">{salaries.filter(s => !s.endDate).length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-xs text-muted-foreground mb-1">Total Annual Payroll</p>
                        <p className="text-2xl font-bold text-foreground">{fmt(salaries.filter(s => !s.endDate).reduce((sum, s) => sum + s.annualSalary, 0))}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-xs text-muted-foreground mb-1">Est. Net Payroll</p>
                        <p className="text-2xl font-bold text-emerald-500">{fmt(salaries.filter(s => !s.endDate).reduce((sum, s) => sum + computeNetAnnual(s), 0))}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-xs text-muted-foreground mb-1">Avg. Annual Salary</p>
                        <p className="text-2xl font-bold text-foreground">
                            {salaries.filter(s => !s.endDate).length > 0
                                ? fmt(salaries.filter(s => !s.endDate).reduce((sum, s) => sum + s.annualSalary, 0) / salaries.filter(s => !s.endDate).length)
                                : '$0'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Add / Edit Form */}
            {showForm && (
                <Card className="border-sky-500/30">
                    <CardHeader><CardTitle>{editingId ? 'Edit' : 'New'} Salary Record</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {!editingId && (
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-foreground mb-1">Staff Member *</label>
                                    <select required value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-sky-500">
                                        <option value="">Select staff member...</option>
                                        {staffOptions.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.email})</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Job Title</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. Head Instructor" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Annual Salary ($) *</label>
                                <input required type="number" min="0" step="0.01" value={form.annualSalary} onChange={e => setForm(f => ({ ...f, annualSalary: e.target.value }))}
                                    placeholder="e.g. 45000" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Tax Rate (0–1)</label>
                                <input type="number" min="0" max="1" step="0.01" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                                    placeholder="e.g. 0.25" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Health Deduction ($/mo)</label>
                                <input type="number" min="0" step="0.01" value={form.healthDeduction} onChange={e => setForm(f => ({ ...f, healthDeduction: e.target.value }))}
                                    placeholder="0" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Other Deductions ($/mo)</label>
                                <input type="number" min="0" step="0.01" value={form.otherDeductions} onChange={e => setForm(f => ({ ...f, otherDeductions: e.target.value }))}
                                    placeholder="0" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Payment Frequency</label>
                                <select value={form.paymentFrequency} onChange={e => setForm(f => ({ ...f, paymentFrequency: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-sky-500">
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Bi-weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Effective Date</label>
                                <input type="date" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-sky-500 resize-none" />
                            </div>
                            {error && (
                                <div className="sm:col-span-2 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                                    <AlertTriangle className="w-4 h-4" />{error}
                                </div>
                            )}
                            <div className="sm:col-span-2 flex gap-3">
                                <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : editingId ? 'Update' : 'Create'}</Button>
                                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Salary list */}
            <Card>
                <CardHeader><CardTitle>Salary Records ({salaries.length})</CardTitle></CardHeader>
                <CardContent>
                    {salaries.length === 0 && <p className="text-center text-muted-foreground py-8">No salary records yet. Add one above.</p>}
                    <div className="space-y-3">
                        {salaries.map(s => {
                            const netAnnual = computeNetAnnual(s);
                            const grossPeriod = s.annualSalary / (s.paymentFrequency === 'monthly' ? 12 : s.paymentFrequency === 'biweekly' ? 26 : 52);
                            const isActive = !s.endDate;
                            return (
                                <div key={s.id} className={`flex items-center gap-4 p-4 rounded-lg border ${isActive ? 'border-border bg-muted/30' : 'border-border/50 bg-muted/10 opacity-60'}`}>
                                    <div className="w-10 h-10 bg-sky-500/10 rounded-full flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-sky-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-foreground">{s.user.firstName} {s.user.lastName}</p>
                                            {s.title && <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{s.title}</span>}
                                            {!isActive && <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">Ended</span>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{s.user.email}</p>
                                        <div className="flex gap-4 mt-1 flex-wrap">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" />Gross: {fmt(grossPeriod)}{freqLabel[s.paymentFrequency]}</span>
                                            <span className="text-xs text-emerald-600 flex items-center gap-1">Net/yr: {fmt(netAnnual)}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Percent className="w-3 h-3" />Tax: {(s.taxRate * 100).toFixed(0)}%</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />From {new Date(s.effectiveDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-foreground">{fmt(s.annualSalary)}<span className="text-xs text-muted-foreground font-normal">/yr</span></p>
                                        <div className="flex gap-2 mt-2 justify-end">
                                            <Button size="sm" variant="ghost" onClick={() => startEdit(s)}><Pencil className="w-3 h-3" /></Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-3 h-3" /></Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
