'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Target, CheckCircle2, Clock, Trash2, Edit2, Loader2, X, Save } from 'lucide-react';
import { format } from 'date-fns';

export default function MilestonesClient({ projectId, teamSlug }: { projectId: string; teamSlug: string }) {
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState('pending'); // pending, active, completed

    useEffect(() => {
        fetchMilestones();
    }, [projectId]);

    const fetchMilestones = async () => {
        try {
            const res = await fetch(`/api/projects/${teamSlug}/${projectId}/milestones`);
            if (res.ok) {
                const data = await res.json();
                setMilestones(data.milestones);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (m?: any) => {
        if (m) {
            setEditingId(m.id);
            setName(m.name);
            setDescription(m.description || '');
            setDueDate(m.dueDate ? m.dueDate.split('T')[0] : '');
            setStatus(m.status);
        } else {
            setEditingId(null);
            setName('');
            setDescription('');
            setDueDate('');
            setStatus('pending');
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);

        const payload = {
            name,
            description,
            dueDate: dueDate || null,
            status
        };

        try {
            const url = editingId
                ? `/api/projects/${teamSlug}/${projectId}/milestones/${editingId}`
                : `/api/projects/${teamSlug}/${projectId}/milestones`;
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await fetchMilestones();
                setShowModal(false);
            } else {
                alert('Failed to save milestone');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this milestone?')) return;
        try {
            const res = await fetch(`/api/projects/${teamSlug}/${projectId}/milestones/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMilestones(prev => prev.filter(m => m.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="h-32 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="flex items-center space-x-2 text-xl">
                    <Target className="w-5 h-5 text-indigo-500" />
                    <span>Project Milestones</span>
                </CardTitle>
                <Button size="sm" onClick={() => openModal()} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Milestone
                </Button>
            </CardHeader>
            <CardContent>
                {milestones.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg border-border">
                        <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No milestones defined yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {milestones.map(m => (
                            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-foreground">{m.name}</h3>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${m.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            m.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                            {m.status.toUpperCase()}
                                        </span>
                                    </div>
                                    {m.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {m.dueDate ? format(new Date(m.dueDate), 'MMM d, yyyy') : 'No due date'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {m._count.tasks} Tasks Linked
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0 flex items-center space-x-2 sm:ml-4 flex-shrink-0">
                                    <Button variant="ghost" size="icon" onClick={() => openModal(m)}>
                                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h3 className="text-lg font-semibold text-foreground">
                                {editingId ? 'Edit Milestone' : 'New Milestone'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary"
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={actionLoading || !name.trim()}>
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {editingId ? 'Save' : 'Create'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Card>
    );
}
