'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    Calendar,
    Settings,
    ChevronDown,
    Plus,
    Menu,
    X,
    BookOpen,
    LogOut,
    Folder,
} from 'lucide-react';
import AppSwitcher from '@/components/layout/AppSwitcher';

interface Team {
    id: string;
    name: string;
    slug: string;
    color: string | null;
}

export default function ProjectsAppShell({
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
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        fetchTeams();
    }, []);

    async function fetchTeams() {
        try {
            const response = await fetch('/api/projects/teams');
            if (response.ok) {
                const data = await response.json();
                // Only show active teams in sidebar dropdown
                const activeTeams = data.teams.filter((t: any) => t.isActive !== false);
                setTeams(activeTeams);
                if (activeTeams.length > 0 && !selectedTeam) {
                    setSelectedTeam(activeTeams[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        }
    }

    const navigation = [
        { name: 'Dashboard', href: '/projects', icon: LayoutDashboard },
        { name: 'My Teams', href: '/projects/teams', icon: Users },
        { name: 'Knowledge Base', href: '/wiki', icon: BookOpen },
    ];

    const teamNavigation = selectedTeam
        ? [
            { name: 'Projects', href: `/projects/teams/${selectedTeam.slug}`, icon: FolderKanban },
            { name: 'Files', href: `/projects/teams/${selectedTeam.slug}/files`, icon: Folder }, // Re-using FolderKanban or Folder if imported? Folder is better.
            { name: 'Members', href: `/projects/teams/${selectedTeam.slug}/members`, icon: Users },
            { name: 'Settings', href: `/projects/teams/${selectedTeam.slug}/settings`, icon: Settings },
        ]
        : [];

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
                    <span className="font-semibold text-foreground">Projects</span>
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
                        <Link href="/projects" className="flex items-center space-x-2">
                            <FolderKanban className="w-8 h-8 text-primary" />
                            <span className="text-xl font-bold text-foreground">Projects</span>
                        </Link>
                    </div>

                    {/* Team Selector */}
                    <div className="px-4 py-3 border-b border-border">
                        <div className="relative">
                            <button
                                onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-accent border border-border rounded-lg hover:bg-accent/80"
                            >
                                <div className="flex items-center space-x-2">
                                    {selectedTeam && (
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: selectedTeam.color || '#0ea5e9' }}
                                        />
                                    )}
                                    <span className="font-medium text-foreground">
                                        {selectedTeam?.name || 'Select Team'}
                                    </span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isTeamDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isTeamDropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10">
                                    {teams.map((team) => (
                                        <button
                                            key={team.id}
                                            onClick={() => {
                                                setSelectedTeam(team);
                                                setIsTeamDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-foreground/80 hover:bg-accent"
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: team.color || '#0ea5e9' }}
                                            />
                                            <span>{team.name}</span>
                                        </button>
                                    ))}
                                    <hr className="my-1" />
                                    <Link
                                        href="/projects/teams/new"
                                        onClick={() => setIsTeamDropdownOpen(false)}
                                        className="flex items-center space-x-2 px-3 py-2 text-sm text-primary hover:bg-primary/10"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Create New Team</span>
                                    </Link>
                                </div>
                            )}
                        </div>
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

                        {selectedTeam && (
                            <>
                                <div className="pt-4 pb-2">
                                    <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {selectedTeam.name}
                                    </h3>
                                </div>
                                {teamNavigation.map((item) => {
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
