'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Search, Receipt, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import InvoiceDownloadButton from '@/components/invoices/InvoiceDownloadButton';
import SendInvoiceEmailButton from '@/components/invoices/SendInvoiceEmailButton';

interface InvoiceWithParent {
  id: string;
  invoiceNumber: string;
  status: string;
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

interface InvoiceStats {
  total: number;
  totalRevenue: number;
  unpaidAmount: number;
  pending: number;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithParent[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({ total: 0, totalRevenue: 0, unpaidAmount: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const response = await fetch('/api/admin/invoices');
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices);
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const parentName = `${invoice.parent.user.firstName} ${invoice.parent.user.lastName}`.toLowerCase();
    const matchesSearch =
      parentName.includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && invoice.status === statusFilter;
  });

  const handleUpdateStatus = async (invoiceId: string, status: string) => {
    if (!confirm(`Are you sure you want to mark this invoice as ${status}?`)) return;

    try {
      const body: any = { status };
      if (status === 'paid') {
        body.paidDate = new Date().toISOString();
      } else if (status === 'unpaid') {
        body.paidDate = null;
      }

      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const { invoice: updatedInvoice } = await response.json();
        setInvoices(invoices.map(inv => inv.id === invoiceId ? updatedInvoice : inv));
        // Refresh stats (simple approximation, ideally re-fetch stats)
        // For simplicity, let's just update the local invoices state and maybe trigger a soft-refresh or just leave stats slightly stale until reload
        // Or re-fetch everything? Re-fetching is safer for stats consistency.
        const statsRes = await fetch('/api/admin/invoices');
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
        }
      } else {
        alert('Failed to update invoice');
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
      alert('Failed to update invoice');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <Link href="/admin/invoices/new">
          <Button>
            <Receipt className="w-4 h-4 mr-2" />
            Create New Invoice
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.unpaidAmount)}</p>
              <p className="text-sm text-gray-500">Unpaid Amount</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by invoice number or parent name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.parent.user.firstName} {invoice.parent.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{invoice.parent.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {invoice.items.length > 0
                            ? invoice.items[0].description
                            : 'No items'}
                          {invoice.items.length > 1 && (
                            <span className="text-gray-500"> (+{invoice.items.length - 1} more)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(invoice.total)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'unpaid'
                              ? 'bg-yellow-100 text-yellow-800'
                              : invoice.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link href={`/admin/invoices/${invoice.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>

                        {/* Client-side PDF generation */}
                        {/* suppressHydrationWarning added for client-only rendering of PDF */}
                        <div suppressHydrationWarning className="inline-block">
                          <InvoiceDownloadButton invoice={invoice} />
                        </div>

                        <div className="inline-block">
                          <SendInvoiceEmailButton
                            invoiceId={invoice.id}
                            parentEmail={invoice.parent.user.email}
                          />
                        </div>

                        <Link href={`/admin/invoices/${invoice.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>

                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Mark Paid
                          </Button>
                        )}
                        {invoice.status === 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(invoice.id, 'unpaid')}
                            title="Undo Mark Paid"
                          >
                            Undo
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}
