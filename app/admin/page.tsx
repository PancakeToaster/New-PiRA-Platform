import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, FileText, DollarSign, BookOpen, TrendingUp, Activity, TrendingDown, Wallet, Package, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import TestUserSelector from '@/components/admin/TestUserSelector';
import FinanceDashboardClient from '@/components/finance/FinanceDashboardClient';
import SystemHealthWidget from '@/components/admin/SystemHealthWidget';

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
    pendingUserCount,
    // Finance Added
    expenses,
    payrollRuns,

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
    prisma.user.count({ where: { isApproved: false } }),
    // Finance fetch
    prisma.expense.findMany({
      select: { amount: true, date: true, quarter: true }
    }),
    prisma.payrollRun.findMany({ select: { totalAmount: true, paymentDate: true } }),

  ]);

  // Finance Aggregations
  // Re-fetch paid invoices for chart data granularity if needed, but we can approximate or just add a chart tailored for this.
  // Actually, let's fetch raw paid invoices for the chart logic specifically, as totalRevenue aggregate doesn't give date distribution.
  const paidInvoicesForChart = await prisma.invoice.findMany({
    where: { status: 'paid' },
    select: { total: true, paidDate: true }
  });

  const totalExpenses = expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
  const totalPayroll = payrollRuns.reduce((sum: number, r: { totalAmount: number }) => sum + r.totalAmount, 0);
  const totalOutgoing = totalExpenses + totalPayroll;
  const netCashFlow = (totalRevenue._sum.total || 0) - totalOutgoing;

  // Chart Data Prep
  const getQuarter = (date: Date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const q = Math.ceil(month / 3);
    return `Q${q} ${year}`;
  };

  const quarterMap = new Map<string, { income: number, expense: number }>();

  paidInvoicesForChart.forEach(inv => {
    if (inv.paidDate) {
      const q = getQuarter(inv.paidDate);
      const current = quarterMap.get(q) || { income: 0, expense: 0 };
      current.income += inv.total;
      quarterMap.set(q, current);
    }
  });

  expenses.forEach(exp => {
    const q = exp.quarter || getQuarter(exp.date);
    const current = quarterMap.get(q) || { income: 0, expense: 0 };
    current.expense += exp.amount;
    quarterMap.set(q, current);
  });

  payrollRuns.forEach(run => {
    const q = getQuarter(run.paymentDate);
    const current = quarterMap.get(q) || { income: 0, expense: 0 };
    current.expense += run.totalAmount;
    quarterMap.set(q, current);
  });

  const chartData = Array.from(quarterMap.entries())
    .map(([name, data]) => ({ name, income: data.income, expense: data.expense }))
    .sort((a, b) => a.name.localeCompare(b.name));




  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your platform's key metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <TestUserSelector />
        </div>
      </div>

      {/* Financial Health & Cash Flow */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Financial Health</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column: Metrics Grid (2x2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-fit">
            <Card className="bg-card border-l-4 border-l-emerald-500 shadow-sm min-h-[160px]">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Income (Paid)</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(totalRevenue._sum.total || 0)}
                    </h3>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-full text-green-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-l-4 border-l-rose-500 shadow-sm min-h-[160px]">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Outgoing</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(totalOutgoing)}
                    </h3>
                  </div>
                  <div className="p-3 bg-rose-500/10 rounded-full text-rose-600">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-card border-l-4 shadow-sm min-h-[160px] ${netCashFlow >= 0 ? 'border-l-sky-500' : 'border-l-amber-500'}`}>
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Flow</p>
                    <h3 className={`text-2xl font-bold mt-1 ${netCashFlow >= 0 ? 'text-sky-600' : 'text-amber-600'}`}>
                      {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-full ${netCashFlow >= 0 ? 'bg-sky-500/10 text-sky-600' : 'bg-amber-500/10 text-amber-600'}`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-l-4 border-l-yellow-500 shadow-sm min-h-[160px]">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unpaid</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(unpaidRevenue._sum.total || 0)}
                    </h3>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-600">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Cash Flow Chart */}
          <div className="h-full">
            <FinanceDashboardClient data={chartData} />
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
                </div>
                <Users className="w-12 h-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Students</p>
                  <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
                </div>
                <Users className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Parents</p>
                  <p className="text-3xl font-bold text-foreground">{totalParents}</p>
                </div>
                <Users className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Teachers</p>
                  <p className="text-3xl font-bold text-foreground">{totalTeachers}</p>
                </div>
                <Users className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* Content & Activity Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Content & Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Knowledge Nodes</p>
                  <p className="text-3xl font-bold text-foreground">{totalKnowledgeNodes}</p>
                  <p className="text-xs text-muted-foreground">{publishedNodes} published</p>
                </div>
                <BookOpen className="w-12 h-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assignments</p>
                  <p className="text-3xl font-bold text-foreground">{totalAssignments}</p>
                </div>
                <FileText className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Page Views (24h)</p>
                  <p className="text-3xl font-bold text-foreground">{recentPageViews}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Contacts</p>
                  <p className="text-3xl font-bold text-foreground">{contactSubmissions}</p>
                </div>
                <Activity className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SystemHealthWidget />




      </div>
    </div>
  );
}
