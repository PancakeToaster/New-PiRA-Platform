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
    title: string | null;
    count: number;
  }[];
  referrers?: {
    topReferrers: {
      domain: string | null;
      count: number;
    }[];
    externalViews: number;
    directViews: number;
  };
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

interface GoogleAnalyticsData {
  metrics: {
    activeUsers: number;
    totalUsers: number;
    sessions: number;
    pageViews: number;
    averageSessionDuration: number;
    bounceRate: number;
  } | null;
  topPages: {
    path: string;
    title: string;
    views: number;
    users: number;
  }[];
  trafficSources: {
    source: string;
    medium: string;
    sessions: number;
    users: number;
  }[];
  deviceCategories: {
    category: string;
    users: number;
    sessions: number;
  }[];
  countries: {
    country: string;
    users: number;
    sessions: number;
  }[];
  notConfigured?: boolean;
}

type TabType = 'analytics' | 'overview' | 'activity' | 'errors' | 'system';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [systemData, setSystemData] = useState<SystemHealthData | null>(null);
  const [gaData, setGaData] = useState<GoogleAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [analyticsRes, systemRes, gaRes] = await Promise.all([
          fetch('/api/admin/analytics'),
          fetch('/api/admin/system/health'),
          fetch('/api/admin/analytics/google'),
        ]);

        if (analyticsRes.ok) {
          setData(await analyticsRes.json());
        }
        if (systemRes.ok) {
          setSystemData(await systemRes.json());
        }
        if (gaRes.ok) {
          setGaData(await gaRes.json());
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  // Calculate max page views for the progress bar scaling
  const maxPageViews = data.pageViews && data.pageViews.length > 0
    ? Math.max(...data.pageViews.map(p => p.count))
    : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">System Analytics</h1>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'analytics'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
            <div className="text-center py-12 text-muted-foreground">
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
                      <p className="text-xs text-muted-foreground uppercase font-semibold">OS Platform</p>
                      <p className="text-lg font-medium text-foreground">{systemData.os.distro} ({systemData.os.arch})</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Backend Node.js</p>
                      <p className="text-lg font-medium text-foreground">{systemData.nodeVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Hostname</p>
                      <p className="text-lg font-medium text-foreground">{systemData.os.hostname}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Uptime</p>
                      <p className="text-lg font-medium text-foreground">{Math.floor(systemData.os.uptime / 3600)}h {Math.floor((systemData.os.uptime % 3600) / 60)}m</p>
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
                      <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-muted">
                        <div
                          className="absolute inset-0 rounded-full border-8 border-primary transition-all duration-1000"
                          style={{
                            clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
                            transform: `rotate(${Math.min(systemData.cpu.load * 3.6, 360)}deg)`,
                            opacity: 0.2 // Simplified visual representation
                          }}
                        />
                        <div className="text-center">
                          <span className="text-3xl font-bold text-foreground">{systemData.cpu.load}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cores</span>
                        <span className="font-medium">{systemData.cpu.cores}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Speed</span>
                        <span className="font-medium">{systemData.cpu.speed} GHz</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Brand</span>
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
                          <span className="text-sm font-medium text-foreground">Used</span>
                          <span className="text-sm text-muted-foreground">{Math.round(systemData.memory.used / 1024 / 1024 / 1024 * 100) / 100} GB</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className="bg-purple-600 dark:bg-purple-400 h-2.5 rounded-full" style={{ width: `${(systemData.memory.used / systemData.memory.total) * 100}%` }}></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-muted/30 p-2 rounded">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-semibold text-foreground">{Math.round(systemData.memory.total / 1024 / 1024 / 1024)} GB</p>
                        </div>
                        <div className="bg-muted/30 p-2 rounded">
                          <p className="text-xs text-muted-foreground">Free</p>
                          <p className="font-semibold text-foreground">{Math.round(systemData.memory.free / 1024 / 1024 / 1024 * 100) / 100} GB</p>
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
                            <span className="text-sm font-medium text-foreground">Storage Distribution</span>
                            <span className="text-sm text-muted-foreground">{Math.round(systemData.disk.used / 1024 / 1024 / 1024)} GB used</span>
                          </div>

                          {/* Stacked Bar container */}
                          <div className="w-full bg-muted rounded-full h-4 flex overflow-hidden">
                            {/* App Code (Blue) */}
                            {systemData.disk.appSize && (
                              <div
                                className="bg-blue-600 dark:bg-blue-500 h-full"
                                style={{ width: `${(systemData.disk.appSize / systemData.disk.size) * 100}%` }}
                                title={`App Code: ${(systemData.disk.appSize / 1024 / 1024).toFixed(2)} MB`}
                              />
                            )}

                            {/* Database (Purple) */}
                            {systemData.disk.dbSize && (
                              <div
                                className="bg-purple-600 dark:bg-purple-500 h-full"
                                style={{ width: `${(systemData.disk.dbSize / systemData.disk.size) * 100}%` }}
                                title={`Database: ${(systemData.disk.dbSize / 1024 / 1024).toFixed(2)} MB`}
                              />
                            )}

                            {/* System Usage (Gray/Dark) */}
                            <div
                              className={`h-full ${systemData.disk.use > 90 ? 'bg-destructive' : 'bg-muted-foreground/50'}`}
                              style={{
                                width: `${((systemData.disk.used - (systemData.disk.appSize || 0) - (systemData.disk.dbSize || 0)) / systemData.disk.size) * 100}%`
                              }}
                              title={`System: ${(Math.round((systemData.disk.used - (systemData.disk.appSize || 0) - (systemData.disk.dbSize || 0)) / 1024 / 1024 / 1024))} GB`}
                            />
                          </div>

                          <div className="flex items-center space-x-4 mt-2 text-xs">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full mr-2"></div>
                              <span>App ({(systemData.disk.appSize ? (systemData.disk.appSize / 1024 / 1024).toFixed(0) : 0)} MB)</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-purple-600 dark:bg-purple-500 rounded-full mr-2"></div>
                              <span>DB ({(systemData.disk.dbSize ? (systemData.disk.dbSize / 1024 / 1024).toFixed(0) : 0)} MB)</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-muted-foreground/50 rounded-full mr-2"></div>
                              <span>System</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-muted rounded-full mr-2"></div>
                              <span>Free</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm border-t border-border pt-4">
                          <div className="flex justify-between pb-1">
                            <span className="text-muted-foreground">Total Capacity</span>
                            <span className="font-medium">{Math.round(systemData.disk.size / 1024 / 1024 / 1024)} GB</span>
                          </div>
                          <div className="flex justify-between pb-1">
                            <span className="text-muted-foreground">Mount Point</span>
                            <span className="font-medium text-xs break-all">{systemData.disk.mount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">File System</span>
                            <span className="font-medium">{systemData.disk.fs}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Disk info unavailable</p>
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
                  <p className="text-3xl font-bold text-foreground">{data.users.total}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{data.users.students}</p>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{data.content.knowledgeNodes}</p>
                  <p className="text-sm text-muted-foreground">Knowledge Nodes</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(data.revenue.thisMonth)}</p>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
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
                  <p className="text-muted-foreground text-center py-4">No page view data available</p>
                ) : (
                  <div className="space-y-3">
                    {data.pageViews.slice(0, 5).map((page, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {page.title || page.path}
                            </p>
                            {page.title && (
                              <p className="text-xs text-muted-foreground truncate">{page.path}</p>
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground ml-4">{page.count} views</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div
                            className="bg-primary h-2 rounded-full"
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
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">New Registrations</p>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{data.users.newThisWeek}</p>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Page Views</p>
                      <p className="text-xs text-muted-foreground">Last 24 hours</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.activity.pageViews24h}</p>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Assignments Submitted</p>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.activity.submissionsThisWeek}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-foreground">New Contacts</p>
                      <p className="text-xs text-muted-foreground">Pending response</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{data.activity.newContacts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources Card */}
            {data.referrers && (
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Direct Traffic</p>
                        <p className="text-xs text-muted-foreground">No referrer</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.referrers.directViews}</p>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">External Referrals</p>
                        <p className="text-xs text-muted-foreground">From other sites</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.referrers.externalViews}</p>
                    </div>
                    {data.referrers.topReferrers.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Top Referrers</p>
                        <div className="space-y-2">
                          {data.referrers.topReferrers.slice(0, 5).map((referrer, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground truncate flex-1">{referrer.domain || 'Unknown'}</span>
                              <span className="text-foreground font-medium ml-2">{referrer.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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
                      <span className="text-sm text-muted-foreground">Students</span>
                      <span className="text-sm font-medium text-foreground">{data.users.students}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${data.users.total > 0 ? (data.users.students / data.users.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Parents</span>
                      <span className="text-sm font-medium text-foreground">{data.users.parents}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                        style={{ width: `${data.users.total > 0 ? (data.users.parents / data.users.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Teachers</span>
                      <span className="text-sm font-medium text-foreground">{data.users.teachers}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full"
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
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Total Revenue</p>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.revenue.total)}</p>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">This Month</p>
                      <p className="text-xs text-muted-foreground">Collected</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(data.revenue.thisMonth)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-foreground">Outstanding</p>
                      <p className="text-xs text-muted-foreground">Unpaid invoices</p>
                    </div>
                    <p className="text-2xl font-bold text-destructive">{formatCurrency(data.revenue.unpaid)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Analytics Tab - Google Analytics */}
      {activeTab === 'analytics' && gaData && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Google Analytics (Last 30 Days)</h2>
            <p className="text-muted-foreground mt-1">Comprehensive traffic analytics powered by Google Analytics 4</p>
          </div>

          {/* Setup Notification */}
          {gaData.notConfigured && (
            <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">📊 Google Analytics Not Configured</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground mb-3">
                  Google Analytics 4 tracking is installed but not yet configured. Complete the setup to see detailed analytics here.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Quick Setup:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Create a GA4 property at <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">analytics.google.com</a></li>
                    <li>Get your Measurement ID (format: G-XXXXXXXXXX)</li>
                    <li>Add <code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX</code> to your .env file</li>
                    <li>Restart your server</li>
                  </ol>
                  <p className="mt-3">
                    <strong>For full admin dashboard integration:</strong> See the <a href="/admin/analytics#setup-guide" className="text-blue-600 dark:text-blue-400 hover:underline">complete setup guide</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* GA Metrics Overview */}
          {gaData.metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{gaData.metrics.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Unique visitors</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{gaData.metrics.sessions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total visits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{gaData.metrics.pageViews.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total views</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Session Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{Math.round(gaData.metrics.averageSessionDuration)}s</p>
                  <p className="text-xs text-muted-foreground mt-1">Time on site</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Bounce Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{(gaData.metrics.bounceRate * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Single page visits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{gaData.metrics.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Recently active</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* GA Top Pages and Traffic Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Top Pages from GA */}
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                {gaData.topPages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No page data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {gaData.topPages.slice(0, 10).map((page, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-sm font-medium text-foreground truncate">{page.title || page.path}</p>
                          <p className="text-xs text-muted-foreground truncate">{page.path}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{page.views.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{page.users.toLocaleString()} users</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                {gaData.trafficSources.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No traffic source data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {gaData.trafficSources.slice(0, 10).map((source, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-sm font-medium text-foreground truncate">{source.source}</p>
                          <p className="text-xs text-muted-foreground">{source.medium}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{source.sessions.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{source.users.toLocaleString()} users</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Device Categories and Countries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {gaData.deviceCategories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No device data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {gaData.deviceCategories.map((device, index) => {
                      const totalUsers = gaData.deviceCategories.reduce((sum, d) => sum + d.users, 0);
                      const percentage = totalUsers > 0 ? (device.users / totalUsers) * 100 : 0;
                      return (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-foreground capitalize">{device.category}</span>
                            <span className="text-sm text-muted-foreground">{device.users.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Countries */}
            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
              </CardHeader>
              <CardContent>
                {gaData.countries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No geographic data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {gaData.countries.slice(0, 10).map((country, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">{country.country}</span>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{country.users.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{country.sessions.toLocaleString()} sessions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              <p className="text-muted-foreground text-center py-8">No activity logs yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Entity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
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
              <p className="text-muted-foreground text-center py-8">No errors logged</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Message</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Path</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.errorLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${log.severity === 'critical'
                              ? 'bg-destructive/10 text-destructive'
                              : log.severity === 'warning'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground max-w-md truncate">
                          {log.message}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {log.path || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${log.resolved
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-muted text-muted-foreground'
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
