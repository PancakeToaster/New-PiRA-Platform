'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
    Users,
    Plus,
    ArrowLeft,
    Settings,
    Trash2,
    Loader2,
    UserPlus,
    X
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';

interface SubTeam {
    id: string;
    name: string;
    description: string | null;
    _count: {
        members: number;
    };
    members: {
        user: {
            id: string;
            firstName: string;
            lastName: string;
        }
    }[];
}

interface TeamMember {
    user: {
        id: string;
        firstName: string;
        lastName: string;
    };
    role: string;
}

export default function SubTeamsPage({ params }: { params: { teamSlug: string } }) {
    const { teamSlug } = params;
    const [subTeams, setSubTeams] = useState<SubTeam[]>([]);
    const [team, setTeam] = useState<{ id: string; name: string } | null>(null);
    const [canManage, setCanManage] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Create Subteam State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Manage Members State
    const [managingSubTeam, setManagingSubTeam] = useState<SubTeam | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState('');

    useEffect(() => {
        fetchData();
    }, [teamSlug]);

    async function fetchData() {
        try {
            // 1. Fetch team details
            const teamRes = await fetch(`/api/projects/teams/${teamSlug}`);
            if (!teamRes.ok) throw new Error('Failed to fetch team');
            const teamData = await teamRes.json();
            setTeam(teamData.team);

            // Determine permissions
            // We rely on the API user role from fetch team response if available, or fetch session
            // But team API returns { team, userRole }
            const role = teamData.userRole;
            const sessionRes = await fetch('/api/auth/session');
            const session = await sessionRes.json();
            const isAdmin = session.user?.roles?.some((r: any) => r.role.name === 'Admin');

            setCanManage(isAdmin || ['mentor', 'captain'].includes(role));

            // 2. Fetch subteams
            const subTeamsRes = await fetch(`/api/projects/teams/${teamData.team.id}/subteams`);
            if (subTeamsRes.ok) {
                const data = await subTeamsRes.json();
                setSubTeams(data.subTeams);
            }

            // 3. Fetch all team members (for assignment dropdown)
            const membersRes = await fetch(`/api/projects/teams/${teamData.team.id}/members`);
            if (membersRes.ok) {
                const data = await membersRes.json();
                setTeamMembers(data.members);
            }

        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateSubTeam() {
        if (!team || !newName) return;
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/projects/teams/${team.id}/subteams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    description: newDescription
                })
            });

            if (res.ok) {
                setIsCreateDialogOpen(false);
                setNewName('');
                setNewDescription('');
                fetchData();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create subteam');
            }
        } catch (error) {
            console.error('Failed to create subteam:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleAddMember() {
        if (!managingSubTeam || !selectedMemberId) return;

        try {
            const res = await fetch(`/api/projects/subteams/${managingSubTeam.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedMemberId })
            });

            if (res.ok) {
                setSelectedMemberId('');
                fetchData(); // Refresh list to update managingSubTeam members
                // Also update local state for immediate feedback
                // But fetch is safer to ensure sync
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to add member');
            }
        } catch (error) {
            console.error('Failed to add member:', error);
        }
    }

    async function handleRemoveMember(userId: string) {
        if (!managingSubTeam || !confirm('Remove this member from subteam?')) return;

        try {
            const res = await fetch(`/api/projects/subteams/${managingSubTeam.id}/members?userId=${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchData();
            } else {
                alert('Failed to remove member');
            }
        } catch (error) {
            console.error('Failed to remove member:', error);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    if (!team) return <div>Team not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/projects/teams/${teamSlug}`}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Subteams</h1>
                </div>
                {canManage && (
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Subteam
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Subteam</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. Drive Team"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        placeholder="Brief description of responsibilities..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateSubTeam} disabled={!newName || isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Subteam'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subTeams.map((subTeam) => (
                    <Card key={subTeam.id} className="flex flex-col">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold">{subTeam.name}</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">{subTeam.description}</p>
                            </div>
                            {canManage && (
                                <Button variant="ghost" size="icon" onClick={() => setManagingSubTeam(subTeam)}>
                                    <Settings className="w-4 h-4 text-gray-500" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center justify-between">
                                    <span>Members ({subTeam._count.members})</span>
                                </h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {subTeam.members.length > 0 ? (
                                        subTeam.members.map((m) => (
                                            <div key={m.user.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                                <span>{m.user.firstName} {m.user.lastName}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No members yet</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {subTeams.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No subteams created yet.</p>
                    </div>
                )}
            </div>

            {/* Manage Members Dialog */}
            <Dialog open={!!managingSubTeam} onOpenChange={(open) => !open && setManagingSubTeam(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manage {managingSubTeam?.name} Members</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex space-x-2">
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                            >
                                <option value="">Select team member to add...</option>
                                {teamMembers
                                    .filter(tm => !managingSubTeam?.members.some(sm => sm.user.id === tm.user.id))
                                    .map(tm => (
                                        <option key={tm.user.id} value={tm.user.id}>
                                            {tm.user.firstName} {tm.user.lastName} ({tm.role})
                                        </option>
                                    ))}
                            </select>
                            <Button onClick={handleAddMember} disabled={!selectedMemberId}>
                                <UserPlus className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            <Label>Current Members</Label>
                            {managingSubTeam?.members.map(m => (
                                <div key={m.user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm font-medium">{m.user.firstName} {m.user.lastName}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                        onClick={() => handleRemoveMember(m.user.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {managingSubTeam?.members.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No members assigneds.</p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
