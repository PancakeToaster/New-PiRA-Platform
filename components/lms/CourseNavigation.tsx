'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Bell, BookOpen, List, FileText, ClipboardList, BarChart3, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface CourseNavigationProps {
    courseId: string;
    courseName: string;
    isTeacher: boolean;
    badges?: {
        announcements?: number;
        assignments?: number;
        assessments?: number;
        forumUnread?: number;
    };
}

export default function CourseNavigation({ courseId, courseName, isTeacher, badges }: CourseNavigationProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const sections = [
        { name: 'Announcements', icon: Bell, path: `/lms/courses/${courseId}/announcements`, badge: badges?.announcements },
        { name: 'Syllabus', icon: BookOpen, path: `/lms/courses/${courseId}/syllabus` },
        { name: 'Modules', icon: List, path: `/lms/courses/${courseId}/modules` },
        { name: 'Assignments', icon: FileText, path: `/lms/courses/${courseId}/assignments`, badge: badges?.assignments },
        { name: 'Assessments', icon: ClipboardList, path: `/lms/courses/${courseId}/assessments` },
        { name: 'Grades', icon: BarChart3, path: `/lms/courses/${courseId}/grades` },
        { name: 'Forum', icon: MessageSquare, path: `/lms/courses/${courseId}/forum`, badge: badges?.forumUnread },
    ];

    return (
        <Card className="overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div className="text-left">
                        <h3 className="font-semibold text-lg text-foreground">{courseName}</h3>
                        <p className="text-sm text-muted-foreground">{isTeacher ? 'Teaching' : 'Enrolled'}</p>
                    </div>
                </div>
                {!isExpanded && (
                    <div className="flex gap-2">
                        {badges?.announcements && (
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded-full">
                                {badges.announcements} new
                            </span>
                        )}
                        {badges?.assignments && (
                            <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-xs font-medium rounded-full">
                                {badges.assignments} due
                            </span>
                        )}
                        {badges?.forumUnread && (
                            <span className="px-2 py-1 bg-purple-500/10 text-purple-500 text-xs font-medium rounded-full">
                                {badges.forumUnread} unread
                            </span>
                        )}
                    </div>
                )}
            </button>

            {isExpanded && (
                <div className="border-t border-border bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 p-4">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <Link
                                    key={section.name}
                                    href={section.path}
                                    className="flex items-center gap-3 px-4 py-3 bg-card rounded-lg hover:bg-primary/5 hover:border-primary/20 border border-border transition-all group"
                                >
                                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-foreground group-hover:text-primary">
                                            {section.name}
                                        </span>
                                    </div>
                                    {section.badge && (
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                            {section.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
}
