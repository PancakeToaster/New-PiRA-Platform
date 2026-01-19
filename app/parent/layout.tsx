import { redirect } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/permissions';
import Link from 'next/link';
import { Home, FileText, Users, LogOut } from 'lucide-react';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const isParent = await hasRole('Parent');

  if (!user || !isParent) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0">
        <div className="p-6">
          <Link href="/" className="block mb-8">
            <h1 className="text-xl font-bold text-gray-900">Robotics Academy</h1>
          </Link>
          <h2 className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-4">Parent Portal</h2>
          <nav className="space-y-1">
            <Link
              href="/parent"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/parent/invoices"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Invoices</span>
            </Link>
            <Link
              href="/parent/students"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>My Students</span>
            </Link>
          </nav>
        </div>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{(user as any).firstName} {(user as any).lastName}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <Link href="/api/auth/signout" className="text-gray-400 hover:text-gray-600">
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
