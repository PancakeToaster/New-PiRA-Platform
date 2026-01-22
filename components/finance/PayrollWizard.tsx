'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Loader2, Check, ArrowLeft, Plus, Trash2, Users } from 'lucide-react';
import Link from 'next/link';

interface StaffMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface PayrollWizardProps {
    staff: StaffMember[];
}

export default function PayrollWizard({ staff }: PayrollWizardProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Run Details
    const [runDetails, setRunDetails] = useState({
        startDate: '',
        endDate: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Step 2: Employee Payments
    // Default to empty list or pre-fill? Let's user select who to pay to avoid clutter.
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
    const [payments, setPayments] = useState<Record<string, any>>({});

    const handleStaffToggle = (id: string) => {
        if (selectedStaffIds.includes(id)) {
            setSelectedStaffIds(prev => prev.filter(s => s !== id));
            // Cleanup payment data? Nah, keep it in cache just in case.
        } else {
            setSelectedStaffIds(prev => [...prev, id]);
            // Init default payment structure
            if (!payments[id]) {
                setPayments(prev => ({
                    ...prev,
                    [id]: { netPay: '', notes: '', paymentMethod: 'Direct Deposit' }
                }));
            }
        }
    };

    const updatePayment = (id: string, field: string, value: string) => {
        setPayments(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const items = selectedStaffIds.map(id => ({
                userId: id,
                ...payments[id]
            }));

            const res = await fetch('/api/admin/payroll/runs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...runDetails,
                    items
                })
            });

            if (res.ok) {
                router.push('/admin/finance/payroll');
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to save payroll:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/admin/finance/payroll"
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to History
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Recorded Payroll Run</h1>
            </div>

            {/* Stepper */}
            <div className="flex items-center mb-8 border-b pb-4">
                <div className={`flex items-center ${step >= 1 ? 'text-sky-600 font-bold' : 'text-gray-400'}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center border mr-2 ${step >= 1 ? 'bg-sky-100 border-sky-600' : 'border-gray-300'}`}>1</span>
                    Period Details
                </div>
                <div className="w-12 h-px bg-gray-200 mx-4" />
                <div className={`flex items-center ${step >= 2 ? 'text-sky-600 font-bold' : 'text-gray-400'}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center border mr-2 ${step >= 2 ? 'bg-sky-100 border-sky-600' : 'border-gray-300'}`}>2</span>
                    Enter Payments
                </div>
            </div>

            {step === 1 && (
                <Card>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    required
                                    value={runDetails.startDate}
                                    onChange={e => setRunDetails({ ...runDetails, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    required
                                    value={runDetails.endDate}
                                    onChange={e => setRunDetails({ ...runDetails, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Payment Date</Label>
                                <Input
                                    type="date"
                                    required
                                    value={runDetails.paymentDate}
                                    onChange={e => setRunDetails({ ...runDetails, paymentDate: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">When the funds were actually sent.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Input
                                    placeholder="e.g. Regular bi-weekly run"
                                    value={runDetails.notes}
                                    onChange={e => setRunDetails({ ...runDetails, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={() => setStep(2)}
                                disabled={!runDetails.startDate || !runDetails.endDate}
                            >
                                Next Step
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-4 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-gray-500" />
                                Select Staff to Pay
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {staff.map(member => (
                                    <div
                                        key={member.id}
                                        onClick={() => handleStaffToggle(member.id)}
                                        className={`cursor-pointer border rounded-lg p-3 flex items-center justify-between transition-colors ${selectedStaffIds.includes(member.id)
                                                ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-300'
                                                : 'hover:bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <div className="truncate pr-2">
                                            <div className="font-medium text-gray-900">{member.firstName} {member.lastName}</div>
                                            <div className="text-xs text-gray-500 truncate">{member.email}</div>
                                        </div>
                                        {selectedStaffIds.includes(member.id) && <Check className="w-4 h-4 text-sky-600 flex-shrink-0" />}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        {selectedStaffIds.map(id => {
                            const member = staff.find(s => s.id === id);
                            return (
                                <Card key={id} className="bg-white">
                                    <CardContent className="pt-6 flex flex-col md:flex-row gap-6 items-start">
                                        <div className="w-full md:w-1/4 pt-1">
                                            <h4 className="font-bold text-gray-900">{member?.firstName} {member?.lastName}</h4>
                                            <p className="text-sm text-gray-500">{member?.email}</p>
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                            <div>
                                                <Label className="text-xs">Net Amount ($)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="font-semibold"
                                                    value={payments[id]?.netPay || ''}
                                                    onChange={(e) => updatePayment(id, 'netPay', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Base Salary ($)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Optional"
                                                    value={payments[id]?.baseSalary || ''}
                                                    onChange={(e) => updatePayment(id, 'baseSalary', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Notes</Label>
                                                <Input
                                                    placeholder="e.g. Check #123"
                                                    value={payments[id]?.notes || ''}
                                                    onChange={(e) => updatePayment(id, 'notes', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-400 hover:text-red-500 mt-6"
                                            onClick={() => handleStaffToggle(id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {selectedStaffIds.length === 0 && (
                        <div className="text-center py-10 text-gray-400 italic">
                            Select staff members above to enter payment details.
                        </div>
                    )}

                    <div className="flex justify-between pt-4 pb-12">
                        <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || selectedStaffIds.length === 0}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Record Run (${selectedStaffIds.reduce((sum, id) => sum + (parseFloat(payments[id]?.netPay) || 0), 0).toFixed(2)})
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
