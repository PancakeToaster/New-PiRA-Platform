'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AnalyticsData {
  users: {
    total: number;
    students: number;
    parents: number;
    teachers: number;
    newThisWeek: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    unpaid: number;
  };
  content: {
    knowledgeNodes: number;
    publishedNodes: number;
    assignments: number;
    blogs: number;
  };
  activity: {
    pageViews24h: number;
    newContacts: number;
    submissionsThisWeek: number;
  };
  pageViews: {
    path: string;
    count: number;
  }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/admin/analytics');
        if (response.ok) {
          const analyticsData = await response.json();
          setData(analyticsData);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  const maxPageViews = Math.max(...(data.pageViews.map(p => p.count) || [1]));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{data.users.total}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-sky-600">{data.users.students}</p>
              <p className="text-sm text-gray-500">Active Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{data.content.knowledgeNodes}</p>
              <p className="text-sm text-gray-500">Knowledge Nodes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(data.revenue.thisMonth)}</p>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Page Views (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.pageViews.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No page view data available</p>
            ) : (
              <div className="space-y-3">
                {data.pageViews.slice(0, 5).map((page, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{page.path}</span>
                      <span className="text-sm font-medium text-gray-900">{page.count} views</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-sky-600 h-2 rounded-full"
                        style={{ width: `${(page.count / maxPageViews) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <div>
                  <p className="text-sm font-medium text-gray-900">New Registrations</p>
                  <p className="text-xs text-gray-500">This week</p>
                </div>
                <p className="text-2xl font-bold text-green-600">+{data.users.newThisWeek}</p>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <div>
                  <p className="text-sm font-medium text-gray-900">Page Views</p>
                  <p className="text-xs text-gray-500">Last 24 hours</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{data.activity.pageViews24h}</p>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <div>
                  <p className="text-sm font-medium text-gray-900">Assignments Submitted</p>
                  <p className="text-xs text-gray-500">This week</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{data.activity.submissionsThisWeek}</p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">New Contacts</p>
                  <p className="text-xs text-gray-500">Pending response</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">{data.activity.newContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Students</span>
                  <span className="text-sm font-medium text-gray-900">{data.users.students}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-sky-600 h-2 rounded-full"
                    style={{ width: `${data.users.total > 0 ? (data.users.students / data.users.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Parents</span>
                  <span className="text-sm font-medium text-gray-900">{data.users.parents}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${data.users.total > 0 ? (data.users.parents / data.users.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Teachers</span>
                  <span className="text-sm font-medium text-gray-900">{data.users.teachers}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${data.users.total > 0 ? (data.users.teachers / data.users.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <div>
                  <p className="text-sm font-medium text-gray-900">Total Revenue</p>
                  <p className="text-xs text-gray-500">All time</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.revenue.total)}</p>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <div>
                  <p className="text-sm font-medium text-gray-900">This Month</p>
                  <p className="text-xs text-gray-500">Collected</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.revenue.thisMonth)}</p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">Outstanding</p>
                  <p className="text-xs text-gray-500">Unpaid invoices</p>
                </div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(data.revenue.unpaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
