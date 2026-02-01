'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    BookOpen,
    Menu,
    X,
    LayoutDashboard,
    LogOut,
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
    isAdmin,
    user,
}: {
    children: React.ReactNode;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    folders: any[];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    nodes: any[];
    searchNodes: Array<{ id: string; title: string; content: string; nodeType: string }>;
    isAdmin: boolean;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    user?: any;
}) {
    const { data: session } = useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                    <span className="font-semibold text-foreground">Knowledge Base</span>
                    <div className="w-6" />
                </div>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-72 bg-card border-r-0 transition-transform duration-200 lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Title */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                        <Link href="/wiki" className="flex items-center space-x-2">
                            <BookOpen className="w-8 h-8 text-primary" />
                            <span className="text-xl font-bold text-foreground">Wiki</span>
                        </Link>
                        <WikiSearch nodes={searchNodes} compact />
                    </div>

                    {/* Navigation Content */}
                    <div className="flex-1 px-4 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 transition-colors">


                        <div className="mb-4">



                            <WikiCreationMenu isAdmin={isAdmin} />

                            <WikiSidebar folders={folders} nodes={nodes} isAdmin={isAdmin} />
                        </div>
                    </div>

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
