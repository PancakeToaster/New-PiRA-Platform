'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    Grip,
    FolderKanban,
    GraduationCap,
    BookOpen,
    Calendar,
    Home,
    Shield,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppSwitcher() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const userRoles = session?.user?.roles || [];

    const hasRole = (allowedRoles: string[]) => {
        if (allowedRoles.includes('*')) return true;
        return userRoles.some(role => allowedRoles.includes(role));
    };

    const allApps = [
        {
            name: 'Home',
            href: '/',
            icon: Home,
            color: 'text-gray-600',
            bg: 'bg-gray-100',
            allowedRoles: ['*']
        },
        {
            name: 'Projects',
            href: '/projects',
            icon: FolderKanban,
            color: 'text-sky-600',
            bg: 'bg-sky-100',
            allowedRoles: ['Mentor', 'Team Captain', 'Team Member', 'Admin']
        },
        {
            name: 'LMS',
            href: '/lms',
            icon: GraduationCap,
            color: 'text-purple-600',
            bg: 'bg-purple-100',
            allowedRoles: ['Student', 'Teacher', 'Parent', 'Admin']
        },
        {
            name: 'Wiki',
            href: '/wiki',
            icon: BookOpen,
            color: 'text-green-600',
            bg: 'bg-green-100',
            allowedRoles: ['*'] // Accessible to everyone logged in
        },
        {
            name: 'Calendar',
            href: '/calendar',
            icon: Calendar,
            color: 'text-orange-600',
            bg: 'bg-orange-100',
            allowedRoles: ['*']
        },
        {
            name: 'Admin',
            href: '/admin',
            icon: Shield,
            color: 'text-red-600',
            bg: 'bg-red-100',
            allowedRoles: ['Admin']
        },
    ];

    const visibleApps = allApps.filter(app => hasRole(app.allowedRoles));

    if (!session) return null;

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-2 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500",
                    isOpen ? "bg-gray-100 text-sky-600" : "text-gray-500"
                )}
                title="Switch App"
            >
                <Grip className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 origin-bottom-left">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Apps</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {visibleApps.map((app) => (
                            <Link
                                key={app.name}
                                href={app.href}
                                onClick={() => setIsOpen(false)}
                                className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors group text-center h-24"
                            >
                                <div className={cn("p-2.5 rounded-full mb-2 group-hover:scale-110 transition-transform", app.bg)}>
                                    <app.icon className={cn("w-5 h-5", app.color)} />
                                </div>
                                <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                                    {app.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
