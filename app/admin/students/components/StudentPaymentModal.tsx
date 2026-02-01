'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { DollarSign, Calendar, FileText, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Invoice {
    id: string;
    invoiceNumber: string;
    status: string;
    dueDate: string;
    total: number;
    items: {
        id: string;
        description: string;
        total: number;
        studentId: string | null;
    }[];
}

interface StudentPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    studentId: string;
    invoices: Invoice[];
}

export function StudentPaymentModal({
    isOpen,
    onClose,
    studentName,
    studentId,
    invoices,
}: StudentPaymentModalProps) {
    // Filter invoices that have items for this student or all items if no specific student items
    const relevantInvoices = invoices.map(invoice => {
        const studentItems = invoice.items.filter(item => item.studentId === studentId);
        const hasStudentItems = studentItems.length > 0;

        return {
            ...invoice,
            relevantItems: hasStudentItems ? studentItems : invoice.items,
            isFullInvoice: !hasStudentItems,
        };
    });

    // Calculate totals
    const totalAmount = relevantInvoices.reduce((sum, inv) => {
        const itemsTotal = inv.relevantItems.reduce((s, item) => s + item.total, 0);
        return sum + (inv.isFullInvoice ? inv.total : itemsTotal);
    }, 0);

    const paidAmount = relevantInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => {
            const itemsTotal = inv.relevantItems.reduce((s, item) => s + item.total, 0);
            return sum + (inv.isFullInvoice ? inv.total : itemsTotal);
        }, 0);

    const unpaidCount = relevantInvoices.filter(inv => inv.status === 'unpaid').length;
    const overdueCount = relevantInvoices.filter(inv => inv.status === 'overdue').length;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Paid
                    </span>
                );
            case 'overdue':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Overdue
                    </span>
                );
            case 'unpaid':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Unpaid
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Payment History - ${studentName}`}>
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-blue-600 font-medium">Total Invoices</p>
                                <p className="text-2xl font-bold text-blue-900">{relevantInvoices.length}</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-green-600 font-medium">Paid</p>
                                <p className="text-2xl font-bold text-green-900">${paidAmount.toFixed(2)}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-yellow-600 font-medium">Unpaid</p>
                                <p className="text-2xl font-bold text-yellow-900">{unpaidCount}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-red-600 font-medium">Overdue</p>
                                <p className="text-2xl font-bold text-red-900">{overdueCount}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Invoice List */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h3>
                    {relevantInvoices.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No invoices found for this student</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {relevantInvoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h4>
                                                {getStatusBadge(invoice.status)}
                                                {invoice.isFullInvoice && (
                                                    <span className="text-xs text-gray-500 italic">(Full invoice)</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    Due: {new Date(invoice.dueDate).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    {invoice.isFullInvoice
                                                        ? `$${invoice.total.toFixed(2)}`
                                                        : `$${invoice.relevantItems.reduce((s, i) => s + i.total, 0).toFixed(2)}`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <Link href={`/admin/invoices/${invoice.id}`} target="_blank">
                                            <Button size="sm" variant="outline">
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                View
                                            </Button>
                                        </Link>
                                    </div>

                                    {/* Invoice Items */}
                                    <div className="border-t pt-2 mt-2">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Items:</p>
                                        <ul className="space-y-1">
                                            {invoice.relevantItems.map((item) => (
                                                <li key={item.id} className="flex justify-between text-sm">
                                                    <span className="text-gray-700">{item.description}</span>
                                                    <span className="font-medium text-gray-900">${item.total.toFixed(2)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-sky-600">${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-gray-600">Outstanding Balance:</span>
                        <span className="font-semibold text-red-600">${(totalAmount - paidAmount).toFixed(2)}</span>
                    </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
