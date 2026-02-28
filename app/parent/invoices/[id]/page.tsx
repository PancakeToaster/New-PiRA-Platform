import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import InvoiceDownloadButton from '@/components/invoices/InvoiceDownloadButton';
import { ChevronLeft } from 'lucide-react';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user?.profiles?.parent) {
        redirect('/login');
    }

    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            items: true,
            parent: {
                include: {
                    user: true
                }
            }
        }
    });

    if (!invoice) {
        notFound();
    }

    // Security check: ensure invoice belongs to this parent
    if (invoice.parentId !== user.profiles.parent) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">Access Denied</p>
                <Link href="/parent/invoices" className="text-blue-500 hover:underline mt-4 inline-block">
                    Return to Invoices
                </Link>
            </div>
        );
    }

    const statusColors = {
        paid: 'bg-green-100 text-green-800',
        unpaid: 'bg-amber-100 text-amber-800',
        overdue: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/parent/invoices" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
                <h1 className="text-2xl font-bold">Invoice Details</h1>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                    <div>
                        <CardTitle className="text-3xl font-bold text-foreground">{invoice.invoiceNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Issued: {formatDate(invoice.createdAt)}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${statusColors[invoice.status as keyof typeof statusColors]}`}>
                            {invoice.status.toUpperCase()}
                        </span>
                        <div suppressHydrationWarning>
                            {/* Client-side PDF generation button */}
                            {/* suppressHydrationWarning used because PDF generation is client-side only */}
                            <InvoiceDownloadButton invoice={invoice} />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-8 space-y-8">
                    {/* Bill To & Dates Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Bill To</h3>
                            <div className="text-foreground font-medium">
                                <p>{invoice.parent.user.firstName} {invoice.parent.user.lastName}</p>
                                <p>{invoice.parent.user.email}</p>
                                {invoice.parent.phone && <p>{invoice.parent.phone}</p>}
                                {invoice.parent.address && <p className="whitespace-pre-line">{invoice.parent.address}</p>}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">Invoice Date</span>
                                <span className="font-medium">{formatDate(invoice.createdAt)}</span>
                            </div>
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">Due Date</span>
                                <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                            </div>
                            {invoice.paidDate && (
                                <div className="flex justify-between border-b border-border pb-2">
                                    <span className="text-muted-foreground">Paid Date</span>
                                    <span className="font-medium text-green-600">{formatDate(invoice.paidDate)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-muted/50 text-muted-foreground text-sm">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Description</th>
                                    <th className="px-6 py-3 font-medium text-right">Qty</th>
                                    <th className="px-6 py-3 font-medium text-right">Unit Price</th>
                                    <th className="px-6 py-3 font-medium text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {invoice.items.map((item) => (
                                    <tr key={item.id} className="text-sm">
                                        <td className="px-6 py-4">{item.description}</td>
                                        <td className="px-6 py-4 text-right">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right">{formatCurrency(item.unitPrice)}</td>
                                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/3 space-y-3">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            {invoice.tax > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Tax</span>
                                    <span>{formatCurrency(invoice.tax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-3">
                                <span>Total</span>
                                <span>{formatCurrency(invoice.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                            <strong className="text-foreground">Notes:</strong> {invoice.notes}
                        </div>
                    )}

                    {/* Payment Info */}
                    <div className="mt-8 pt-8 border-t border-border">
                        <h4 className="font-semibold mb-4 text-foreground">Payment Methods</h4>
                        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                            <li><strong className="text-indigo-600 dark:text-indigo-400">Zelle:</strong> barry.py.chuang@gmail.com</li>
                            <li><strong className="text-sky-500 dark:text-sky-400">Venmo:</strong> @Barry-Chuang</li>
                            <li><strong className="text-foreground">Cash/Check:</strong> Please make checks payable to PLAYIDEAS INC.</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
