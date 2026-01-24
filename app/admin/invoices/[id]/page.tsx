'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ChevronLeft, Edit, Trash2, Printer, Mail, Loader2, Undo, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import InvoiceDownloadButton from '@/components/invoices/InvoiceDownloadButton';
import SendInvoiceEmailButton from '@/components/invoices/SendInvoiceEmailButton';

interface Invoice {
    id: string;
    invoiceNumber: string;
    status: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
    dueDate: string;
    paidDate: string | null;
    subtotal: number;
    tax: number;
    total: number;
    notes: string | null;
    createdAt: string;
    parent: {
        id: string;
        user: {
            firstName: string;
            lastName: string;
            email: string;
        };
    };
    items: {
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
}

export default function InvoiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        async function fetchInvoice() {
            try {
                const res = await fetch(`/api/admin/invoices/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setInvoice(data.invoice);
                } else {
                    alert('Failed to load invoice');
                    router.push('/admin/invoices');
                }
            } catch (error) {
                console.error('Error fetching invoice:', error);
            } finally {
                setLoading(false);
            }
        }
        if (params.id) fetchInvoice();
    }, [params.id, router]);

    const handleUpdateStatus = async (status: string) => {
        if (!confirm(`Are you sure you want to mark this invoice as ${status}?`)) return;
        setActionLoading(true);
        try {
            const body: any = { status };
            if (status === 'paid') {
                body.paidDate = new Date().toISOString();
            } else if (status === 'unpaid') {
                body.paidDate = null;
            }

            const res = await fetch(`/api/admin/invoices/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                setInvoice(data.invoice);
                router.refresh();
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/invoices/${params.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                router.push('/admin/invoices');
                router.refresh();
            } else {
                alert('Failed to delete invoice');
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert('Error deleting invoice');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    if (!invoice) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/invoices" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            {invoice.invoiceNumber}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'unpaid' ? 'bg-yellow-100 text-yellow-800' :
                                    invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Created on {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <div suppressHydrationWarning>
                        <InvoiceDownloadButton invoice={invoice} />
                    </div>

                    <SendInvoiceEmailButton
                        invoiceId={invoice.id}
                        parentEmail={invoice.parent.user.email}
                    />

                    <Link href={`/admin/invoices/${invoice.id}/edit`}>
                        <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" /> Edit
                        </Button>
                    </Link>

                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDelete}
                        disabled={actionLoading}
                    >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                </div>
            </div>

            {/* Action Bar for Status Updates */}
            <Card className="bg-gray-50 border-dashed">
                <CardContent className="py-4 flex flex-wrap items-center gap-4 justify-end">
                    <span className="text-sm font-medium text-gray-600 mr-auto">Status Actions:</span>

                    {invoice.status !== 'paid' && (
                        <Button
                            variant="primary"
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                            onClick={() => handleUpdateStatus('paid')}
                            disabled={actionLoading}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" /> Mark as Paid
                        </Button>
                    )}

                    {invoice.status === 'paid' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus('unpaid')}
                            disabled={actionLoading}
                        >
                            <Undo className="w-4 h-4 mr-2" /> Mark Unpaid
                        </Button>
                    )}

                    {invoice.status !== 'cancelled' && (
                        <Button
                            variant="outline"
                            className="text-gray-600 hover:text-gray-900"
                            size="sm"
                            onClick={() => handleUpdateStatus('cancelled')}
                            disabled={actionLoading}
                        >
                            <XCircle className="w-4 h-4 mr-2" /> Cancel Invoice
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Content Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Invoice Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Items</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Description</th>
                                        <th className="px-6 py-3 text-right">Qty</th>
                                        <th className="px-6 py-3 text-right">Unit Price</th>
                                        <th className="px-6 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoice.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 text-right">{item.quantity}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 text-right">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="border-t p-6 space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(invoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tax</span>
                                    <span>{formatCurrency(invoice.tax)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                                    <span>Total</span>
                                    <span>{formatCurrency(invoice.total)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {invoice.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">Name</p>
                                <p className="font-medium">{invoice.parent.user.firstName} {invoice.parent.user.lastName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                                <p className="text-sm text-gray-600">{invoice.parent.user.email}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Payment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">Due Date</p>
                                <p className="text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">Paid Date</p>
                                <p className="text-sm">
                                    {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '-'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
