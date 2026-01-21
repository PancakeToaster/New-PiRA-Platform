import { redirect } from 'next/navigation';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  DollarSign,
  Settings,
  BarChart3,
  Shield,
  Newspaper,
  GraduationCap,
  LogOut,
  FolderKanban,
  Calendar,
} from 'lucide-react';
import AppSwitcher from '@/components/layout/AppSwitcher';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 flex flex-col z-30">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Link href="/" className="block mb-8">
              <h1 className="text-xl font-bold text-gray-900">Robotics Academy</h1>
            </Link>
            <h2 className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-4">Admin Panel</h2>

            <nav className="space-y-1">
              <Link
                href="/admin"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>

              <div className="pt-4 pb-2">
                <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase">Content</h3>
              </div>

              <Link
                href="/admin/pages"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>Pages</span>
              </Link>

              <Link
                href="/admin/blog"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <Newspaper className="w-5 h-5" />
                <span>Blog</span>
              </Link>

              <Link
                href="/admin/courses"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <GraduationCap className="w-5 h-5" />
                <span>Courses</span>
              </Link>

              <div className="pt-4 pb-2">
                <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase">Management</h3>
              </div>

              <Link
                href="/admin/users"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>Users</span>
              </Link>

              <Link
                href="/admin/invoices"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <DollarSign className="w-5 h-5" />
                <span>Invoices</span>
              </Link>

              <Link
                href="/admin/knowledge"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>Knowledge Base</span>
              </Link>

              <div className="pt-4 pb-2">
                <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase">Projects</h3>
              </div>

              <Link
                href="/admin/teams"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <FolderKanban className="w-5 h-5" />
                <span>Teams & Projects</span>
              </Link>

              <Link
                href="/admin/calendar"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span>Calendar Events</span>
              </Link>

              <div className="pt-4 pb-2">
                <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase">System</h3>
              </div>

              <Link
                href="/admin/analytics"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </Link>

              <Link
                href="/admin/roles"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <Shield className="w-5 h-5" />
                <span>Roles & Permissions</span>
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* User info at bottom */}
        <div className="p-6 border-t border-gray-200 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-900 truncate">{(user as any).firstName}</p>
                <p className="text-sm font-medium text-gray-700 truncate">{(user as any).lastName}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <AppSwitcher />
              <Link href="/api/auth/signout" className="text-gray-400 hover:text-gray-600">
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
