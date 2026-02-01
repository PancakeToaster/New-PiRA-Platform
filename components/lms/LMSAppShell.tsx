'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    BookOpen,
    ClipboardList,
    BarChart,
    GraduationCap,
    FileText,
    Menu,
    X,
    LayoutDashboard,
    ChevronDown,
    ChevronRight,
    Bell,
    List,
    MessageSquare,
    LogOut,
} from 'lucide-react';
import AppSwitcher from '@/components/layout/AppSwitcher';

interface Course {
    id: string;
    name: string;
    code: string;
}

export default function LMSAppShell({
    children,
    user,
    courses = [],
}: {
    children: React.ReactNode;
    user?: any;
    courses?: Course[];
}) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

    const isTeacher = session?.user?.roles?.includes('Teacher');

    const navigation = [
        { name: 'Dashboard', href: '/lms', icon: LayoutDashboard },
        { name: 'My Courses', href: '/lms/courses', icon: GraduationCap },
        { name: 'Knowledge Base', href: '/wiki', icon: BookOpen },
    ];

    if (isTeacher) {
        navigation.push({ name: 'Student Progress', href: '/lms/progress', icon: BarChart });
    }

    const coursePages = [
        { name: 'Announcements', icon: Bell, path: 'announcements' },
        { name: 'Syllabus', icon: BookOpen, path: 'syllabus' },
        { name: 'Modules', icon: List, path: 'modules' },
        { name: 'Assignments', icon: FileText, path: 'assignments' },
        { name: 'Assessments', icon: ClipboardList, path: 'assessments' },
        { name: 'Grades', icon: BarChart, path: 'grades' },
        { name: 'Forum', icon: MessageSquare, path: 'forum' },
    ];

    const toggleCourse = (courseId: string) => {
        setExpandedCourses((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(courseId)) {
                newSet.delete(courseId);
            } else {
                newSet.add(courseId);
            }
            return newSet;
        });
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile sidebar toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    <span className="font-semibold text-foreground">Learning Hub</span>
                    <div className="w-6" />
                </div>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-72 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Title */}
                    <div className="flex items-center h-16 px-4 border-b border-border">
                        <Link href="/lms" className="flex items-center space-x-2">
                            <GraduationCap className="w-8 h-8 text-primary" />
                            <span className="text-xl font-bold text-foreground">Learning Hub</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}

                        {/* Course Dropdowns */}
                        {courses.length > 0 && (
                            <>
                                <div className="pt-4 pb-2 px-3">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        My Courses
                                    </h3>
                                </div>
                                {courses.map((course) => {
                                    const isExpanded = expandedCourses.has(course.id);
                                    return (
                                        <div key={course.id}>
                                            <button
                                                onClick={() => toggleCourse(course.id)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent rounded-lg transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                                )}
                                                <span className="truncate flex-1 text-left">
                                                    {course.code || course.name}
                                                </span>
                                            </button>

                                            {isExpanded && (
                                                <div className="ml-6 mt-1 space-y-1">
                                                    {coursePages.map((page) => {
                                                        const Icon = page.icon;
                                                        const pagePath = `/lms/courses/${course.id}/${page.path}`;
                                                        const isActive = pathname === pagePath;

                                                        return (
                                                            <Link
                                                                key={page.path}
                                                                href={pagePath}
                                                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${isActive
                                                                    ? 'bg-primary/10 text-primary font-medium'
                                                                    : 'text-muted-foreground hover:bg-accent'
                                                                    }`}
                                                            >
                                                                <Icon className="w-4 h-4 flex-shrink-0" />
                                                                <span className="truncate">{page.name}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </nav>

                    {/* User Info */}
                    {session?.user && (
                        <div className="p-4 border-t border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="text-sm font-medium text-primary">
                                            {session.user.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {session.user.name?.split(' ')[0]}
                                        </p>
                                        <p className="text-sm font-medium text-foreground/80 truncate">
                                            {session.user.name?.split(' ').slice(1).join(' ')}
                                        </p>
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
                    )}
                </div>
            </aside>

            {/* Main content */}
            <main className="lg:pl-64 pt-14 lg:pt-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </div>
            </main>

            {/* Mobile sidebar overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
