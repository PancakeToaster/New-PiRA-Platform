import { redirect } from 'next/navigation';
import { getCurrentUser, hasRole } from '@/lib/permissions';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { Home, FileText, Users } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <aside className="w-64 bg-gray-900 text-white">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-6">Parent Portal</h2>
            <nav className="space-y-2">
              <Link
                href="/parent"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/parent/invoices"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>Invoices</span>
              </Link>
              <Link
                href="/parent/students"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>My Students</span>
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 bg-gray-50 p-8">{children}</main>
      </div>
    </div>
  );
}
