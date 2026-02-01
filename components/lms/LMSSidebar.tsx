'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ChevronDown,
    ChevronRight,
    Home,
    Bell,
    BookOpen,
    List,
    FileText,
    ClipboardList,
    BarChart3,
    MessageSquare,
} from 'lucide-react';

interface Course {
    id: string;
    name: string;
    code: string;
}

interface LMSSidebarProps {
    courses: Course[];
    userRole: 'student' | 'teacher';
}

export default function LMSSidebar({ courses, userRole }: LMSSidebarProps) {
    const pathname = usePathname();
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

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

    const coursePages = [
        { name: 'Announcements', icon: Bell, path: 'announcements' },
        { name: 'Syllabus', icon: BookOpen, path: 'syllabus' },
        { name: 'Modules', icon: List, path: 'modules' },
        { name: 'Assignments', icon: FileText, path: 'assignments' },
        { name: 'Assessments', icon: ClipboardList, path: 'assessments' },
        { name: 'Grades', icon: BarChart3, path: 'grades' },
        { name: 'Forum', icon: MessageSquare, path: 'forum' },
    ];

    return (
        <aside className="w-72 bg-card border-r border-border overflow-y-auto">
            <div className="p-4 border-b border-border">
                <Link href="/lms/courses" className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary">
                    <Home className="w-5 h-5" />
                    My Courses
                </Link>
            </div>

            <nav className="p-2">
                {courses.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                        No courses enrolled
                    </div>
                ) : (
                    <div className="space-y-1">
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
                    </div>
                )}
            </nav>
        </aside>
    );
}
