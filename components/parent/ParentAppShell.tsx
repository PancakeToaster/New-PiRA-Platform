'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, FileText, Users, Menu, X, LogOut } from 'lucide-react';
import AppSwitcher from '@/components/layout/AppSwitcher';

export default function ParentAppShell({
    children,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    user,
}: {
    children: React.ReactNode;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    user?: any;
}) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/parent', icon: Home },
        { name: 'Invoices', href: '/parent/invoices', icon: FileText },
        { name: 'My Students', href: '/parent/students', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    <span className="font-semibold text-gray-900">Parent Portal</span>
                    <div className="w-6" />
                </div>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Title */}
                    <div className="flex items-center h-16 px-4 border-b border-gray-200">
                        <Link href="/parent" className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-gray-900">Robotics Academy</span>
                        </Link>
                    </div>

                    <div className="px-4 py-2">
                        <h2 className="text-xs font-semibold text-sky-600 uppercase tracking-wider mt-4 mb-2">
                            Parent Portal
                        </h2>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-sky-50 text-sky-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info */}
                    {session?.user && (
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-sky-700">
                                        {session.user.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {session.user.name?.split(' ')[0]}
                                    </p>
                                    <p className="text-sm font-medium text-gray-700 truncate">
                                        {session.user.name?.split(' ').slice(1).join(' ')}
                                    </p>
                                </div>
                                <AppSwitcher user={user} />
                                <Link
                                    href="/api/auth/signout"
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Sign out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </Link>
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
