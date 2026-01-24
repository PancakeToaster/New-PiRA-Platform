'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
    Users,
    Search,
    Plus,
    ArrowLeft,
    MoreVertical,
    Shield,
    Trash2,
    Loader2,
    UserPlus
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/Dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/Label';

interface TeamMember {
    id: string;
    role: string;
    joinedAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string | null;
    };
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export default function TeamMembersPage({ params }: { params: { teamSlug: string } }) {
    const { teamSlug } = params;
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [team, setTeam] = useState<{ id: string; name: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Add Member State
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('member');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const canAdd = isAdmin || (userRole && ['owner', 'captain', 'mentor'].includes(userRole));
    const canEdit = isAdmin || (userRole && ['owner', 'captain'].includes(userRole));

    useEffect(() => {
        fetchData();
    }, [teamSlug]);

    async function fetchData() {
        try {
            // Fetch current user permissions
            const sessionRes = await fetch('/api/auth/session');
            if (sessionRes.ok) {
                const session = await sessionRes.json();
                const hasAdminRole = session.user?.roles?.some((r: any) => r.role?.name === 'Admin');
                setIsAdmin(hasAdminRole);
            }

            // Fetch team details to get ID
            const teamRes = await fetch(`/api/projects/teams/${teamSlug}`);
            if (teamRes.ok) {
                const teamData = await teamRes.json();
                setTeam(teamData.team);
                setUserRole(teamData.userRole);

                // Fetch members using team ID
                const membersRes = await fetch(`/api/projects/teams/${teamData.team.id}/members`);
                if (membersRes.ok) {
                    const membersData = await membersRes.json();
                    setMembers(membersData.members);
                }
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSearchUsers(term: string) {
        setSearchTerm(term);
        if (term.length < 2) return;

        try {
            // Use admin API to search users (only works if admin)
            const res = await fetch(`/api/admin/users?search=${term}`);
            if (res.ok) {
                const data = await res.json();
                // Filter out existing members
                const currentMemberIds = new Set(members.map(m => m.user.id));
                const filtered = data.users.filter((u: User) => !currentMemberIds.has(u.id));
                setAvailableUsers(filtered);
            }
        } catch (error) {
            console.error('Failed to search users:', error);
        }
    }

    async function handleAddMember() {
        if (!team || !selectedUserId) return;
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/projects/teams/${team.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    role: selectedRole
                })
            });

            if (res.ok) {
                setIsAddDialogOpen(false);
                setSelectedUserId('');
                setSearchTerm('');
                fetchData(); // Refresh list
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to add member');
            }
        } catch (error) {
            console.error('Failed to add member:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleRemoveMember(userId: string) {
        if (!team || !confirm('Are you sure you want to remove this member?')) return;

        try {
            const res = await fetch(`/api/projects/teams/${team.id}/members?userId=${userId}`, {
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

    async function handleUpdateRole(userId: string, newRole: string) {
        if (!team) return;

        try {
            const res = await fetch(`/api/projects/teams/${team.id}/members`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole }),
            });

            if (res.ok) {
                fetchData();
            } else {
                alert('Failed to update role');
            }
        } catch (error) {
            console.error('Failed to update role:', error);
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
                    <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
                </div>
                {canAdd && (
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Team Member</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Search User</Label>
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearchUsers(e.target.value)}
                                    />
                                    {availableUsers.length > 0 && (
                                        <div className="border rounded-md max-h-40 overflow-y-auto mt-2">
                                            {availableUsers.map(user => (
                                                <div
                                                    key={user.id}
                                                    className={`p-2 cursor-pointer hover:bg-gray-50 flex justify-between items-center ${selectedUserId === user.id ? 'bg-sky-50' : ''
                                                        }`}
                                                    onClick={() => setSelectedUserId(user.id)}
                                                >
                                                    <div>
                                                        <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                    {selectedUserId === user.id && <Check className="w-4 h-4 text-sky-600" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                    >
                                        <option value="member">Member</option>
                                        <option value="mentor">Mentor</option>
                                        <option value="captain">Captain</option>
                                        <option value="owner">Owner</option>
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddMember} disabled={!selectedUserId || isSubmitting}>
                                    {isSubmitting ? 'Adding...' : 'Add Member'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                    <Card key={member.id} className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-6 flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-bold">
                                    {member.user.avatar ? (
                                        <img src={member.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span>{member.user.firstName[0]}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {member.user.firstName} {member.user.lastName}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">{member.user.email}</p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1
                    ${member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                                            member.role === 'captain' ? 'bg-blue-100 text-blue-800' :
                                                member.role === 'mentor' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </span>
                                </div>
                                {canEdit && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleUpdateRole(member.user.id, 'member')}>
                                                Set as Member
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateRole(member.user.id, 'mentor')}>
                                                Set as Mentor
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateRole(member.user.id, 'captain')}>
                                                Set as Captain
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveMember(member.user.id)}>
                                                Remove from Team
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// Icon for checkmark
function Check({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
