'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Loader2, Activity, AlertTriangle, BarChart3, Server } from 'lucide-react';
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
  activityLogs?: {
    id: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    createdAt: string;
    user: { firstName: string; lastName: string } | null;
  }[];
  errorLogs?: {
    id: string;
    message: string;
    path: string | null;
    severity: string;
    resolved: boolean;
    createdAt: string;
    user: { firstName: string; lastName: string } | null;
  }[];
}

interface SystemHealthData {
  cpu: {
    manufacturer: string;
    brand: string;
    speed: string;
    cores: number;
    load: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    active: number;
    available: number;
  };
  disk: {
    fs: string;
    type: string;
    size: number;
    used: number;
    use: number;
    mount: string;
    appSize?: number;
    dbSize?: number;
  } | null;
  os: {
    platform: string;
    distro: string;
    release: string;
    arch: string;
    hostname: string;
    uptime: number;
  };
  nodeVersion: string;
}

type TabType = 'overview' | 'activity' | 'errors' | 'system';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [systemData, setSystemData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [analyticsRes, systemRes] = await Promise.all([
          fetch('/api/admin/analytics'),
          fetch('/api/admin/system/health')
        ]);

        if (analyticsRes.ok) {
          setData(await analyticsRes.json());
        }
        if (systemRes.ok) {
          setSystemData(await systemRes.json());
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
      <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'system'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>System Health</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'activity'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Activity Logs</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'errors'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Error Logs</span>
            </div>
          </button>
        </nav>
      </div>

      {/* System Health Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {!systemData ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading System Health...</p>
            </div>
          ) : (
            <>
              {/* Host Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">OS Platform</p>
                      <p className="text-lg font-medium text-gray-900">{systemData.os.distro} ({systemData.os.arch})</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Backend Node.js</p>
                      <p className="text-lg font-medium text-gray-900">{systemData.nodeVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Hostname</p>
                      <p className="text-lg font-medium text-gray-900">{systemData.os.hostname}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Uptime</p>
                      <p className="text-lg font-medium text-gray-900">{Math.floor(systemData.os.uptime / 3600)}h {Math.floor((systemData.os.uptime % 3600) / 60)}m</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CPU Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">CPU Load</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center py-4">
                      <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-gray-100">
                        <div
                          className="absolute inset-0 rounded-full border-8 border-sky-500 transition-all duration-1000"
                          style={{
                            clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
                            transform: `rotate(${Math.min(systemData.cpu.load * 3.6, 360)}deg)`,
                            opacity: 0.2 // Simplified visual representation
                          }}
                        />
                        <div className="text-center">
                          <span className="text-3xl font-bold text-gray-900">{systemData.cpu.load}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cores</span>
                        <span className="font-medium">{systemData.cpu.cores}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Speed</span>
                        <span className="font-medium">{systemData.cpu.speed} GHz</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Brand</span>
                        <span className="font-medium truncate max-w-[150px]" title={systemData.cpu.brand}>{systemData.cpu.brand}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Memory Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Memory Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Used</span>
                          <span className="text-sm text-gray-500">{Math.round(systemData.memory.used / 1024 / 1024 / 1024 * 100) / 100} GB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${(systemData.memory.used / systemData.memory.total) * 100}%` }}></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-semibold text-gray-900">{Math.round(systemData.memory.total / 1024 / 1024 / 1024)} GB</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">Free</p>
                          <p className="font-semibold text-gray-900">{Math.round(systemData.memory.free / 1024 / 1024 / 1024 * 100) / 100} GB</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Disk Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Disk Storage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {systemData.disk ? (
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Storage Distribution</span>
                            <span className="text-sm text-gray-500">{Math.round(systemData.disk.used / 1024 / 1024 / 1024)} GB used</span>
                          </div>

                          {/* Stacked Bar container */}
                          <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
                            {/* App Code (Blue) */}
                            {systemData.disk.appSize && (
                              <div
                                className="bg-blue-600 h-full"
                                style={{ width: `${(systemData.disk.appSize / systemData.disk.size) * 100}%` }}
                                title={`App Code: ${(systemData.disk.appSize / 1024 / 1024).toFixed(2)} MB`}
                              />
                            )}

                            {/* Database (Purple) */}
                            {systemData.disk.dbSize && (
                              <div
                                className="bg-purple-600 h-full"
                                style={{ width: `${(systemData.disk.dbSize / systemData.disk.size) * 100}%` }}
                                title={`Database: ${(systemData.disk.dbSize / 1024 / 1024).toFixed(2)} MB`}
                              />
                            )}

                            {/* System Usage (Gray/Dark) */}
                            <div
                              className={`h-full ${systemData.disk.use > 90 ? 'bg-red-500' : 'bg-gray-500'}`}
                              style={{
                                width: `${((systemData.disk.used - (systemData.disk.appSize || 0) - (systemData.disk.dbSize || 0)) / systemData.disk.size) * 100}%`
                              }}
                              title={`System: ${(Math.round((systemData.disk.used - (systemData.disk.appSize || 0) - (systemData.disk.dbSize || 0)) / 1024 / 1024 / 1024))} GB`}
                            />
                          </div>

                          <div className="flex items-center space-x-4 mt-2 text-xs">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                              <span>App ({(systemData.disk.appSize ? (systemData.disk.appSize / 1024 / 1024).toFixed(0) : 0)} MB)</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
                              <span>DB ({(systemData.disk.dbSize ? (systemData.disk.dbSize / 1024 / 1024).toFixed(0) : 0)} MB)</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                              <span>System</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
                              <span>Free</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm border-t pt-4">
                          <div className="flex justify-between pb-1">
                            <span className="text-gray-500">Total Capacity</span>
                            <span className="font-medium">{Math.round(systemData.disk.size / 1024 / 1024 / 1024)} GB</span>
                          </div>
                          <div className="flex justify-between pb-1">
                            <span className="text-gray-500">Mount Point</span>
                            <span className="font-medium text-xs break-all">{systemData.disk.mount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">File System</span>
                            <span className="font-medium">{systemData.disk.fs}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Disk info unavailable</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
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
        </>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!data.activityLogs || data.activityLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activity logs yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-sky-100 text-sky-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.entityType || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Logs Tab */}
      {activeTab === 'errors' && (
        <Card>
          <CardHeader>
            <CardTitle>Error Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {!data.errorLogs || data.errorLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No errors logged</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Path</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.errorLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${log.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : log.severity === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-orange-100 text-orange-800'
                              }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">
                          {log.message}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.path || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${log.resolved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {log.resolved ? 'Resolved' : 'Open'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
