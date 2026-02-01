import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import InvoiceDownloadButton from '@/components/invoices/InvoiceDownloadButton';

import StudentListActions from '@/components/parent/StudentListActions';

// ...

export default async function ParentInvoicesPage() {
  const user = await getCurrentUser();
  const typedUser = user as any;
  let parentId = typedUser?.profiles?.parent;

  // FAILSAFE logic same as dashboard
  if (!parentId && (typedUser?.isTestMode || typedUser?.roles?.includes('Admin'))) {
    const demoProfile = await prisma.parentProfile.findFirst();
    if (demoProfile) parentId = demoProfile.id;
  }

  if (!parentId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Parent profile not found</p>
      </div>
    );
  }

  const studentCount = await prisma.parentStudent.count({
    where: { parentId }
  });

  const invoices = await prisma.invoice.findMany({
    where: { parentId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
    },
  });

  const statusColors = {
    paid: 'bg-green-500/10 text-green-500 dark:text-green-400',
    unpaid: 'bg-yellow-500/10 text-yellow-500 dark:text-yellow-400',
    overdue: 'bg-destructive/10 text-destructive dark:text-red-400',
    cancelled: 'bg-muted text-muted-foreground',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Invoices</h1>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No invoices found.</p>
            {studentCount === 0 && (
              <div className="bg-primary/10 p-4 rounded-lg inline-block text-left max-w-md border border-primary/20">
                <h4 className="font-semibold text-foreground mb-1">Get Started</h4>
                <p className="text-sm text-muted-foreground mb-3">You don't have any students linked yet. Create an account for your child to get started.</p>
                <StudentListActions isEmptyState />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-muted-foreground">
                      Created: {formatDate(invoice.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due Date: {formatDate(invoice.dueDate)}
                    </p>
                    {invoice.paidDate && (
                      <p className="text-sm text-muted-foreground">
                        Paid: {formatDate(invoice.paidDate)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-2 ${statusColors[invoice.status as keyof typeof statusColors]
                        }`}
                    >
                      {invoice.status.toUpperCase()}
                    </span>
                    <p className="text-2xl font-bold">{formatCurrency(invoice.total)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Invoice Items</h4>
                  <div className="space-y-2">
                    {invoice.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.description} x {item.quantity}
                        </span>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t mt-4 pt-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>{formatCurrency(invoice.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>

                  {invoice.notes && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border">
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {invoice.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  {/* Client-side PDF Download */}
                  {/* Using suppressHydrationWarning to avoid mismatch on PDF blob generation */}
                  <div suppressHydrationWarning>
                    <InvoiceDownloadButton invoice={invoice} />
                  </div>

                  <Link
                    href={`/parent/invoices/${invoice.id}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    View Details →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
