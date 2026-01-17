import { redirect } from 'next/navigation';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import Navbar from '@/components/layout/Navbar';
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
} from 'lucide-react';

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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <aside className="w-64 bg-gray-900 text-white">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
            <nav className="space-y-2">
              <Link
                href="/admin"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>

              <div className="pt-4 pb-2">
                <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase">Content</h3>
              </div>

              <Link
                href="/admin/pages"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>Pages</span>
              </Link>

              <Link
                href="/admin/blog"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <Newspaper className="w-5 h-5" />
                <span>Blog</span>
              </Link>

              <Link
                href="/admin/courses"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <GraduationCap className="w-5 h-5" />
                <span>Courses</span>
              </Link>

              <div className="pt-4 pb-2">
                <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase">Management</h3>
              </div>

              <Link
                href="/admin/users"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>Users</span>
              </Link>

              <Link
                href="/admin/invoices"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <DollarSign className="w-5 h-5" />
                <span>Invoices</span>
              </Link>

              <Link
                href="/admin/knowledge"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>Knowledge Base</span>
              </Link>

              <div className="pt-4 pb-2">
                <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase">System</h3>
              </div>

              <Link
                href="/admin/analytics"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </Link>

              <Link
                href="/admin/roles"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <Shield className="w-5 h-5" />
                <span>Roles & Permissions</span>
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
