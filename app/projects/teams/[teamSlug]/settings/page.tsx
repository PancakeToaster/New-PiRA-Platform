'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Archive } from "lucide-react";

interface Team {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    isActive: boolean;
}

export default function TeamSettingsPage({ params }: { params: { teamSlug: string } }) {
    const { teamSlug } = params;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [team, setTeam] = useState<Team | null>(null);
    const [formData, setFormData] = useState<Partial<Team>>({});

    // Dialog States
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteName, setDeleteName] = useState("");
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);

    useEffect(() => {
        fetchTeam();
    }, [teamSlug]);

    async function fetchTeam() {
        try {
            const response = await fetch(`/api/projects/teams/${teamSlug}`);
            if (response.ok) {
                const data = await response.json();
                setTeam(data.team);
                setFormData({
                    name: data.team.name,
                    description: data.team.description,
                    color: data.team.color,
                    isActive: data.team.isActive
                });
            }
        } catch (error) {
            console.error('Failed to fetch team:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!team) return;
        setIsSaving(true);

        try {
            const response = await fetch(`/api/projects/teams/${team.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to update team:', error);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleRestore() {
        if (!team) return;
        setIsSaving(true);

        try {
            const response = await fetch(`/api/projects/teams/${team.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: true }),
            });

            if (response.ok) {
                router.refresh();
                router.push('/projects/teams');
            }
        } catch (error) {
            console.error('Failed to restore team:', error);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleArchive() {
        if (!team) return;
        setIsSaving(true);

        try {
            const response = await fetch(`/api/projects/teams/${team.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archive: true }),
            });

            if (response.ok) {
                router.push('/projects/teams');
            }
        } catch (error) {
            console.error('Failed to archive team:', error);
        } finally {
            setIsSaving(false);
            setIsArchiveOpen(false);
        }
    }

    async function handleDelete() {
        if (!team) return;

        try {
            const response = await fetch(`/api/projects/teams/${team.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                router.push('/projects/teams');
            }
        } catch (error) {
            console.error('Failed to delete team:', error);
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
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Settings</h1>
                <p className="text-gray-500">Manage your team profile and preferences.</p>
            </div>

            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="name">Team Name</Label>
                            <Input
                                id="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>
                        <div>
                            <Label htmlFor="color">Brand Color</Label>
                            <div className="flex items-center space-x-2 mt-2">
                                <Input
                                    id="color"
                                    type="color"
                                    value={formData.color || '#0ea5e9'}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-16 h-10 p-1"
                                />
                                <span className="text-sm text-gray-500">{formData.color}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end bg-gray-50 p-4 rounded-b-xl">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            {!team.isActive ? (
                <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                        <CardTitle className="text-green-700 flex items-center">
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Restore Team
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                            Restoring this team will make it active and visible again.
                            <br />
                            <strong>Note:</strong> Members removed during archival will NOT be automatically re-added. You must invite them again.
                        </p>
                        <Button
                            variant="outline"
                            className="border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                            onClick={handleRestore}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                            Restore Team
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader>
                        <CardTitle className="text-orange-700 flex items-center">
                            <Archive className="w-5 h-5 mr-2" />
                            Archive Team
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                            Archiving a team makes it read-only and removes all members except the owner. It can be restored later by an admin.
                        </p>
                        <Dialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                                    Archive Team
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Archive Team?</DialogTitle>
                                    <DialogDescription>
                                        This action will remove all members from the team and mark it as inactive. Current projects will be hidden from members. This action can be undone by an Admin.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsArchiveOpen(false)}>Cancel</Button>
                                    <Button variant="danger" onClick={handleArchive} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Archive'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            )}

            <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                        Deleting this team will permanently remove all projects, tasks, and data associated with it. This action cannot be undone.
                    </p>

                    <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                        <DialogTrigger asChild>
                            <Button variant="danger">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Team
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Team Permanently?</DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This will permanently delete the team <strong>{team.name}</strong> and remove all associated data.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Label className="mb-2 block">Type <strong>{team.name}</strong> to confirm:</Label>
                                <Input
                                    value={deleteName}
                                    onChange={(e) => setDeleteName(e.target.value)}
                                    placeholder={team.name}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                                <Button
                                    variant="danger"
                                    onClick={handleDelete}
                                    disabled={deleteName !== team.name || isSaving}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Permanently'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    );
}
