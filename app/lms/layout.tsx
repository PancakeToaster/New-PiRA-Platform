import { redirect } from 'next/navigation';
import { getCurrentUser, hasAnyPermission } from '@/lib/permissions';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { BookOpen, FolderTree, ClipboardList, BarChart, GraduationCap, FileText } from 'lucide-react';

export default async function LMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const hasAccess = await hasAnyPermission([
    { resource: 'knowledge', action: 'view' },
    { resource: 'knowledge', action: 'create' },
  ]);

  if (!user || !hasAccess) {
    redirect('/login');
  }

  const isTeacher = user.roles?.includes('Teacher');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <aside className="w-64 bg-gray-900 text-white">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-6">Learning Hub</h2>
            <nav className="space-y-2">
              <Link
                href="/lms"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/lms/knowledge"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <FolderTree className="w-5 h-5" />
                <span>Knowledge Base</span>
              </Link>
              <Link
                href="/lms/assignments"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <ClipboardList className="w-5 h-5" />
                <span>Assignments</span>
              </Link>
              <Link
                href="/lms/courses"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <GraduationCap className="w-5 h-5" />
                <span>My Courses</span>
              </Link>
              <Link
                href="/lms/grades"
                className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>Grades</span>
              </Link>
              {isTeacher && (
                <Link
                  href="/lms/progress"
                  className="flex items-center space-x-3 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  <BarChart className="w-5 h-5" />
                  <span>Student Progress</span>
                </Link>
              )}
            </nav>
          </div>
        </aside>

        <main className="flex-1 bg-gray-50 p-8">{children}</main>
      </div>
    </div>
  );
}
