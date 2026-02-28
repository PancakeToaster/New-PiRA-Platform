import { redirect } from 'next/navigation';
import { getCurrentUser, isAdmin, hasRole } from '@/lib/permissions';
import Link from 'next/link';
import Image from 'next/image';
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
  Boxes,
} from 'lucide-react';
import AppSwitcher from '@/components/layout/AppSwitcher';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();
  const userIsTeacher = await hasRole('Teacher');

  if (!user || (!userIsAdmin && !userIsTeacher)) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-card border-r border-border fixed inset-y-0 left-0 flex flex-col z-30">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Link href="/" className="block mb-8 px-2">
              <div className="relative h-12 w-48">
                <Image
                  src="/images/logo.png"
                  alt="PiRA Logo"
                  fill
                  sizes="192px"
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>

            <Link href="/admin" className="flex items-center space-x-2 text-primary mb-6 hover:text-primary transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Admin Panel</span>
            </Link>

            <nav className="space-y-1">
              {userIsAdmin && (
                <>
                  {/* CONTENT & OFFERINGS */}
                  <div className="pt-2 pb-2">
                    <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase">Content & Offerings</h3>
                  </div>

                  <Link
                    href="/admin/blog"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <Newspaper className="w-5 h-5" />
                    <span>Blog</span>
                  </Link>

                  <Link
                    href="/admin/courses"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <GraduationCap className="w-5 h-5" />
                    <span>Offerings</span>
                  </Link>
                </>
              )}

              {(userIsAdmin || userIsTeacher) && (
                <>
                  <div className="pt-2 pb-2">
                    <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase">Teaching & Learning</h3>
                  </div>

                  <Link
                    href="/admin/lms-courses"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>LMS Courses</span>
                  </Link>

                  <Link
                    href="/admin/announcements"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <Newspaper className="w-5 h-5" />
                    <span>Announcements</span>
                  </Link>

                  <Link
                    href="/admin/knowledge"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Knowledge Base</span>
                  </Link>
                </>
              )}

              {userIsAdmin && (
                <>
                  {/* FINANCE & OPS */}
                  <div className="pt-4 pb-2">
                    <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase">Finance & Ops</h3>
                  </div>


                  <Link
                    href="/admin/finance"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Finance Dashboard</span>
                  </Link>

                  {/* PROJECTS */}
                  <div className="pt-4 pb-2">
                    <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase">Projects</h3>
                  </div>

                  <Link
                    href="/admin/teams"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <FolderKanban className="w-5 h-5" />
                    <span>Teams & Projects</span>
                  </Link>

                  <Link
                    href="/admin/calendar"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Calendar Events</span>
                  </Link>

                  {/* SYSTEM */}
                  <div className="pt-4 pb-2">
                    <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase">System</h3>
                  </div>

                  <Link
                    href="/admin/users"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>Users</span>
                  </Link>

                  <Link
                    href="/admin/contacts"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Contacts & Leads</span>
                  </Link>

                  <Link
                    href="/admin/students"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <GraduationCap className="w-5 h-5" />
                    <span>Student Info</span>
                  </Link>

                  <Link
                    href="/admin/analytics"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Analytics</span>
                  </Link>

                  <Link
                    href="/admin/roles"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Roles & Permissions</span>
                  </Link>

                  <Link
                    href="/admin/settings"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* User info at bottom */}
        <div className="p-6 border-t border-border bg-card shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-foreground truncate">{(user as any).firstName}</p>
                <p className="text-sm font-medium text-foreground/80 truncate">{(user as any).lastName}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <AppSwitcher user={user} />
              <Link href="/api/auth/signout" className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-72 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
