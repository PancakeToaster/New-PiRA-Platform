'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FolderKanban,
    GraduationCap,
    BookOpen,
    Calendar,
    Shield,
    Home,
    LogOut,
    UserCircle,
    Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function PortalPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    const { user } = session!;
    const userRoles = user?.roles || [];

    const hasRole = (allowedRoles: string[]) => {
        if (allowedRoles.includes('*')) return true;
        // @ts-ignore - Handle test mode override if present in session or just rely on roles array
        return userRoles.some(role => allowedRoles.includes(role));
    };

    const apps = [
        {
            name: 'LMS Platform',
            description: 'Access courses, assignments, and grades.',
            href: '/lms',
            icon: GraduationCap,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            allowedRoles: ['Student', 'Teacher', 'Admin']
        },
        {
            name: 'Project Management',
            description: 'Manage teams, tasks, and project timelines.',
            href: '/projects',
            icon: FolderKanban,
            color: 'text-sky-600',
            bg: 'bg-sky-50',
            allowedRoles: ['Mentor', 'Team Captain', 'Team Member', 'Admin']
        },
        {
            name: 'Knowledge Base',
            description: 'Internal documentation, guides, and resources.',
            href: '/wiki',
            icon: BookOpen,
            color: 'text-green-600',
            bg: 'bg-green-50',
            allowedRoles: ['*']
        },
        {
            name: 'Calendar',
            description: 'View schedules, events, and deadlines.',
            href: '/calendar',
            icon: Calendar,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            allowedRoles: ['*']
        },
        {
            name: 'Admin Panel',
            description: 'System administration and management.',
            href: '/admin',
            icon: Shield,
            color: 'text-red-600',
            bg: 'bg-red-50',
            allowedRoles: ['Admin']
        },
        {
            name: 'Parent Portal',
            description: 'View child progress and invoices.',
            href: '/parent',
            icon: UserCircle,
            color: 'text-pink-600',
            bg: 'bg-pink-50',
            allowedRoles: ['Parent', 'Admin']
        }
    ];

    const visibleApps = apps.filter(app => hasRole(app.allowedRoles));

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
                    <p className="mt-2 text-lg text-gray-600">Select a portal to continue</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleApps.map((app) => (
                        <Link key={app.name} href={app.href} className="group block">
                            <Card className="h-full hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-sky-100 group-hover:-translate-y-1">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className={`p-3 rounded-xl ${app.bg} ${app.color} transition-colors group-hover:scale-110 duration-200`}>
                                        <app.icon className="w-8 h-8" />
                                    </div>
                                    <CardTitle className="text-xl text-gray-900 group-hover:text-sky-600 transition-colors">
                                        {app.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        {app.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="flex justify-center mt-12">
                    <Link href="/">
                        <Button variant="ghost" className="text-gray-500 hover:text-gray-900">
                            <Home className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
