'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    BookOpen,
    Menu,
    X,
    LayoutDashboard
} from 'lucide-react';
import WikiSidebar from '@/components/wiki/WikiSidebar';
import WikiSearch from '@/components/wiki/WikiSearch';
import WikiCreationMenu from '@/components/wiki/WikiCreationMenu';
import AppSwitcher from '@/components/layout/AppSwitcher';

export default function WikiAppShell({
    children,
    folders,
    nodes,
    searchNodes,
    isAdmin
}: {
    children: React.ReactNode;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    folders: any[];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    nodes: any[];
    searchNodes: Array<{ id: string; title: string; content: string; nodeType: string }>;
    isAdmin: boolean;
}) {
    const { data: session } = useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                    <span className="font-semibold text-gray-900">Knowledge Base</span>
                    <div className="w-6" />
                </div>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-200 lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Title */}
                    <div className="flex items-center h-16 px-4 border-b border-gray-200">
                        <Link href="/wiki" className="flex items-center space-x-2">
                            <BookOpen className="w-8 h-8 text-sky-600" />
                            <span className="text-xl font-bold text-gray-900">Wiki</span>
                        </Link>
                    </div>

                    {/* Navigation Content */}
                    <div className="flex-1 px-4 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                        <div className="mb-6">
                            <WikiSearch nodes={searchNodes} />
                        </div>

                        <div className="mb-4">
                            <Link
                                href="/wiki"
                                className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors mb-4 px-2"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Overview</span>
                            </Link>

                            <WikiCreationMenu />

                            <WikiSidebar folders={folders} nodes={nodes} isAdmin={isAdmin} />
                        </div>
                    </div>

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
                                <AppSwitcher />
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
