import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileText, DollarSign, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default async function ParentDashboard() {
  const user = await getCurrentUser();

  if (!user?.profiles?.parent) {
    return <div>Parent profile not found</div>;
  }

  const parentProfile = await prisma.parentProfile.findUnique({
    where: { id: user.profiles.parent },
    include: {
      students: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!parentProfile) {
    return <div>Parent profile not found</div>;
  }

  const totalInvoices = await prisma.invoice.count({
    where: { parentId: parentProfile.id },
  });

  const unpaidInvoices = await prisma.invoice.count({
    where: { parentId: parentProfile.id, status: 'unpaid' },
  });

  const totalOwed = await prisma.invoice.aggregate({
    where: { parentId: parentProfile.id, status: 'unpaid' },
    _sum: { total: true },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Parent Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Students</p>
                <p className="text-3xl font-bold">{parentProfile.students.length}</p>
              </div>
              <Users className="w-12 h-12 text-sky-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-3xl font-bold">{totalInvoices}</p>
              </div>
              <FileText className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unpaid Invoices</p>
                <p className="text-3xl font-bold">{unpaidInvoices}</p>
              </div>
              <DollarSign className="w-12 h-12 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Amount Owed</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(totalOwed._sum.total || 0)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>My Students</CardTitle>
          </CardHeader>
          <CardContent>
            {parentProfile.students.length === 0 ? (
              <p className="text-gray-600">No students linked yet.</p>
            ) : (
              <div className="space-y-4">
                {parentProfile.students.map(({ student }) => (
                  <Link
                    key={student.id}
                    href={`/parent/students/${student.id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-semibold text-lg">
                      {student.user.firstName} {student.user.lastName}
                    </h3>
                    {student.grade && (
                      <p className="text-sm text-gray-600">Grade: {student.grade}</p>
                    )}
                    {student.school && (
                      <p className="text-sm text-gray-600">School: {student.school}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Invoices</CardTitle>
              <Link
                href="/parent/invoices"
                className="text-sm text-sky-500 hover:text-sky-600"
              >
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {parentProfile.invoices.length === 0 ? (
              <p className="text-gray-600">No invoices yet.</p>
            ) : (
              <div className="space-y-3">
                {parentProfile.invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/parent/invoices/${invoice.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
