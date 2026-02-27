'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Users, Trash2, Edit2, Loader2, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubteamsClient({
    teamId,
    initialSubteams,
    teamMembers,
    canManage
}: {
    teamId: string;
    initialSubteams: any[];
    teamMembers: any[];
    canManage: boolean;
}) {
    const router = useRouter();
    const [subteams, setSubteams] = useState(initialSubteams);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const openModal = (subteam?: any) => {
        if (subteam) {
            setEditingId(subteam.id);
            setName(subteam.name);
            setDescription(subteam.description || '');
            setSelectedMembers(subteam.members.map((m: any) => m.userId));
        } else {
            setEditingId(null);
            setName('');
            setDescription('');
            setSelectedMembers([]);
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingId) {
                // Update basic info
                let res = await fetch(`/api/projects/teams/${teamId}/subteams/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description })
                });

                // Update members
                res = await fetch(`/api/projects/teams/${teamId}/subteams/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memberIds: selectedMembers })
                });

                if (res.ok) {
                    const data = await res.json();
                    setSubteams(subteams.map(st => st.id === editingId ? data.subteam : st));
                } else {
                    alert('Failed to update subteam');
                }
            } else {
                // Create new
                let res = await fetch(`/api/projects/teams/${teamId}/subteams`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description })
                });

                if (res.ok) {
                    const data = await res.json();
                    const newSubteamId = data.subteam.id;

                    // Assign members
                    await fetch(`/api/projects/teams/${teamId}/subteams/${newSubteamId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ memberIds: selectedMembers })
                    });

                    // Fetch fresh list to get all relations populated
                    router.refresh();
                    setShowModal(false);
                    return; // Avoid pushing partial data to state, let router refresh handle it
                } else {
                    alert('Failed to create subteam');
                }
            }
            setShowModal(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subteam?')) return;

        try {
            const res = await fetch(`/api/projects/teams/${teamId}/subteams/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSubteams(subteams.filter(st => st.id !== id));
            } else {
                alert('Failed to delete');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleMember = (userId: string) => {
        setSelectedMembers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    return (
        <div className="space-y-6">
            {canManage && (
                <div className="flex justify-end">
                    <Button onClick={() => openModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Subteam
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subteams.map((subteam) => (
                    <Card key={subteam.id} className="flex flex-col">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Users className="w-5 h-5 text-orange-500" />
                                        {subteam.name}
                                    </CardTitle>
                                    {subteam.description && (
                                        <CardDescription className="mt-1 line-clamp-2">
                                            {subteam.description}
                                        </CardDescription>
                                    )}
                                </div>
                                {canManage && (
                                    <div className="flex space-x-1">
                                        <Button variant="ghost" size="icon" onClick={() => openModal(subteam)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(subteam.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1">
                            <div className="text-sm font-medium mb-3">
                                Members ({subteam._count.members})
                            </div>
                            {subteam.members.length > 0 ? (
                                <ul className="space-y-2">
                                    {subteam.members.slice(0, 5).map((m: any) => (
                                        <li key={m.id} className="text-sm text-muted-foreground flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">
                                                {m.user.firstName.charAt(0)}
                                            </div>
                                            {m.user.firstName} {m.user.lastName}
                                        </li>
                                    ))}
                                    {subteam.members.length > 5 && (
                                        <li className="text-xs text-muted-foreground italic pl-8">
                                            + {subteam.members.length - 5} more
                                        </li>
                                    )}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No members assigned yet.</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {subteams.length === 0 && (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No subteams yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                        Create subteams to organize members into smaller working groups.
                    </p>
                    {canManage && (
                        <Button onClick={() => openModal()}>
                            Create First Subteam
                        </Button>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                            <h3 className="text-lg font-semibold text-foreground">
                                {editingId ? 'Edit Subteam' : 'Create Subteam'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary"
                                        placeholder="e.g. Software Team"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        rows={2}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div className="pt-2 border-t border-border">
                                    <label className="block text-sm font-medium mb-2">Assign Members</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                                        {teamMembers.map(tm => (
                                            <label key={tm.user.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer border border-transparent hover:border-border">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMembers.includes(tm.user.id)}
                                                    onChange={() => toggleMember(tm.user.id)}
                                                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                                                />
                                                <span className="text-sm truncate">
                                                    {tm.user.firstName} {tm.user.lastName}
                                                </span>
                                            </label>
                                        ))}
                                        {teamMembers.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic col-span-2">No members in this team.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 flex-shrink-0">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={loading || !name.trim()}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {editingId ? 'Save Changes' : 'Create'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
