'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';

interface Project {
    id: string;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    color: string | null;
    startDate: string | null;
    endDate: string | null;
}

export default function ProjectSettingsPage({
    params,
}: {
    params: { teamSlug: string; projectSlug: string };
}) {
    const { teamSlug, projectSlug } = params;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [project, setProject] = useState<Project | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Project>>({});

    useEffect(() => {
        fetchProject();
    }, [teamSlug, projectSlug]);

    async function fetchProject() {
        try {
            const response = await fetch(`/api/projects/${teamSlug}/${projectSlug}`);
            if (response.ok) {
                const data = await response.json();
                setProject(data.project);
                setFormData({
                    name: data.project.name,
                    description: data.project.description,
                    status: data.project.status,
                    priority: data.project.priority,
                    color: data.project.color,
                    startDate: data.project.startDate ? new Date(data.project.startDate).toISOString().split('T')[0] : '',
                    endDate: data.project.endDate ? new Date(data.project.endDate).toISOString().split('T')[0] : '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch project:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!project) return;
        setIsSaving(true);

        try {
            const response = await fetch(`/api/projects/${teamSlug}/${projectSlug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.refresh();
                // Optional: Show success toast
            }
        } catch (error) {
            console.error('Failed to update project:', error);
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    if (!project) return <div>Project not found</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
                <p className="text-gray-500">Manage project details and configuration.</p>
            </div>

            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="name">Project Name</Label>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                                >
                                    <option value="planning">Planning</option>
                                    <option value="active">Active</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="priority">Priority</Label>
                                <select
                                    id="priority"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate || ''}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate || ''}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
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

            {/* Danger Zone (Future impl for delete project) */}
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                        Deleting a project is irreversible. All tasks, documents, and data associated with this project will be permanently removed.
                    </p>
                    <Button variant="danger" disabled={true}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Project (Coming Soon)
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
