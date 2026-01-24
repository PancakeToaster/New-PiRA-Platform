'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    Calendar,
    Shield,
    UserCircle,
    X,
    Grid,
    FolderKanban,
    Grip,
    Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSwitcherProps {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    user?: any;
}

export default function AppSwitcher({ user }: AppSwitcherProps = {}) {
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

    const activeUser = user || session?.user;
    const userRoles = activeUser?.roles || [];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const userPermissions = activeUser?.permissions || [];

    const hasPermission = (resource: string, action: string) => {
        if (userRoles.includes('Admin')) return true;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        return userPermissions.some((p: any) => p.resource === resource && p.action === action);
    };

    const allApps = [
        {
            name: 'Home',
            href: '/',
            icon: Home,
            color: 'text-gray-600',
            bg: 'bg-gray-100',
            isVisible: () => true
        },
        {
            name: 'Projects',
            href: '/projects',
            icon: FolderKanban,
            color: 'text-sky-600',
            bg: 'bg-sky-100',
            isVisible: () => hasPermission('projects', 'view')
        },
        {
            name: 'LMS',
            href: '/lms',
            icon: GraduationCap,
            color: 'text-purple-600',
            bg: 'bg-purple-100',
            isVisible: () => hasPermission('lms', 'view')
        },
        {
            name: 'Wiki',
            href: '/wiki',
            icon: BookOpen,
            color: 'text-green-600',
            bg: 'bg-green-100',
            isVisible: () => hasPermission('knowledge', 'view')
        },
        {
            name: 'Calendar',
            href: '/calendar',
            icon: Calendar,
            color: 'text-orange-600',
            bg: 'bg-orange-100',
            isVisible: () => hasPermission('calendar', 'view')
        },
        {
            name: 'Parent Portal',
            href: '/parent',
            icon: UserCircle,
            color: 'text-pink-600',
            bg: 'bg-pink-100',
            isVisible: () => hasPermission('parent_portal', 'view')
        },
        {
            name: 'Admin',
            href: '/admin',
            icon: Shield,
            color: 'text-red-600',
            bg: 'bg-red-100',
            isVisible: () => userRoles.includes('Admin')
        },
    ];

    const visibleApps = allApps.filter(app => app.isVisible());

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
