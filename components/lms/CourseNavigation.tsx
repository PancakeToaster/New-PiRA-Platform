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
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <div className="text-left">
                        <h3 className="font-semibold text-lg text-gray-900">{courseName}</h3>
                        <p className="text-sm text-gray-500">{isTeacher ? 'Teaching' : 'Enrolled'}</p>
                    </div>
                </div>
                {!isExpanded && (
                    <div className="flex gap-2">
                        {badges?.announcements && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                {badges.announcements} new
                            </span>
                        )}
                        {badges?.assignments && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                {badges.assignments} due
                            </span>
                        )}
                        {badges?.forumUnread && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                {badges.forumUnread} unread
                            </span>
                        )}
                    </div>
                )}
            </button>

            {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 p-4">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <Link
                                    key={section.name}
                                    href={section.path}
                                    className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg hover:bg-sky-50 hover:border-sky-200 border border-gray-200 transition-all group"
                                >
                                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-sky-600" />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-sky-700">
                                            {section.name}
                                        </span>
                                    </div>
                                    {section.badge && (
                                        <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">
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
