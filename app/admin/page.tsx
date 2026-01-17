import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, FileText, DollarSign, BookOpen, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export const revalidate = 0; // Disable caching for admin dashboard

export default async function AdminDashboard() {
  const [
    totalUsers,
    totalStudents,
    totalParents,
    totalTeachers,
    totalInvoices,
    unpaidInvoices,
    totalRevenue,
    unpaidRevenue,
    totalKnowledgeNodes,
    publishedNodes,
    totalAssignments,
    recentPageViews,
    contactSubmissions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.studentProfile.count(),
    prisma.parentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: 'unpaid' } }),
    prisma.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'unpaid' },
      _sum: { total: true },
    }),
    prisma.knowledgeNode.count(),
    prisma.knowledgeNode.count({ where: { isPublished: true } }),
    prisma.assignment.count(),
    prisma.pageView.count({
      where: {
        viewedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    }),
    prisma.contactSubmission.count({
      where: { status: 'new' },
    }),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your platform's key metrics</p>
      </div>

      {/* User Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold">{totalUsers}</p>
                </div>
                <Users className="w-12 h-12 text-primary-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="text-3xl font-bold">{totalStudents}</p>
                </div>
                <Users className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Parents</p>
                  <p className="text-3xl font-bold">{totalParents}</p>
                </div>
                <Users className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Teachers</p>
                  <p className="text-3xl font-bold">{totalTeachers}</p>
                </div>
                <Users className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(totalRevenue._sum.total || 0)}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unpaid Amount</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(unpaidRevenue._sum.total || 0)}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-yellow-600 opacity-20" />
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
                <FileText className="w-12 h-12 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content & Activity Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Content & Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Knowledge Nodes</p>
                  <p className="text-3xl font-bold">{totalKnowledgeNodes}</p>
                  <p className="text-xs text-gray-500">{publishedNodes} published</p>
                </div>
                <BookOpen className="w-12 h-12 text-primary-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assignments</p>
                  <p className="text-3xl font-bold">{totalAssignments}</p>
                </div>
                <FileText className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Page Views (24h)</p>
                  <p className="text-3xl font-bold">{recentPageViews}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New Contacts</p>
                  <p className="text-3xl font-bold">{contactSubmissions}</p>
                </div>
                <Activity className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Users</CardTitle>
              <Link
                href="/admin/users"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-gray-600">No users yet.</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {user.roles.map((ur) => (
                          <span
                            key={ur.roleId}
                            className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded-full"
                          >
                            {ur.role.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link
                href="/admin/users/new"
                className="block p-4 bg-primary-50 border-2 border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <h3 className="font-semibold text-primary-900">Create New User</h3>
                <p className="text-sm text-primary-700">Add a student, parent, or teacher</p>
              </Link>
              <Link
                href="/admin/invoices/new"
                className="block p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <h3 className="font-semibold text-green-900">Create Invoice</h3>
                <p className="text-sm text-green-700">Generate a new invoice for a parent</p>
              </Link>
              <Link
                href="/admin/blog/new"
                className="block p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <h3 className="font-semibold text-blue-900">Write Blog Post</h3>
                <p className="text-sm text-blue-700">Share news and updates</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
