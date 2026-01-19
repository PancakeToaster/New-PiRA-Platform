'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Loader2, Edit, Trash2 } from 'lucide-react';

interface StaffMember {
    id: string;
    name: string;
    role: string;
    bio: string;
    email: string | null;
    image: string | null;
    displayOrder: number;
    isActive: boolean;
}

export default function TeamPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        bio: '',
        email: '',
        isActive: true,
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    async function fetchStaff() {
        try {
            const res = await fetch('/api/admin/staff');
            if (res.ok) {
                const data = await res.json();
                setStaff(data.staff);
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const url = editingId
            ? `/api/admin/staff/${editingId}`
            : '/api/admin/staff';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                await fetchStaff();
                resetForm();
            }
        } catch (error) {
            console.error('Failed to save staff member:', error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this staff member?')) return;

        try {
            const res = await fetch(`/api/admin/staff/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await fetchStaff();
            }
        } catch (error) {
            console.error('Failed to delete staff member:', error);
        }
    }

    function handleEdit(member: StaffMember) {
        setEditingId(member.id);
        setFormData({
            name: member.name,
            role: member.role,
            bio: member.bio,
            email: member.email || '',
            isActive: member.isActive,
        });
    }

    function resetForm() {
        setEditingId(null);
        setFormData({
            name: '',
            role: '',
            bio: '',
            email: '',
            isActive: true,
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
            </div>

            {/* Create/Edit Form */}
            <Card>
                <CardHeader>
                    <CardTitle>{editingId ? 'Edit' : 'Add'} Team Member</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role/Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    placeholder="e.g., CEO, Director, Teacher"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bio *
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Active (Show on About page)</span>
                            </label>
                        </div>

                        <div className="flex space-x-2">
                            <Button type="submit">
                                {editingId ? 'Update' : 'Add'} Team Member
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Staff List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((member) => (
                    <Card key={member.id}>
                        <CardContent className="pt-6">
                            <div className="text-center mb-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-2xl font-bold text-white">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900">{member.name}</h3>
                                <p className="text-sm text-sky-600 font-semibold">{member.role}</p>
                                {member.email && (
                                    <p className="text-xs text-gray-500 mt-1">{member.email}</p>
                                )}
                            </div>

                            <p className="text-gray-600 text-sm mb-4">{member.bio}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {member.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(member)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(member.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {staff.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>No team members yet. Add your first one above!</p>
                </div>
            )}
        </div>
    );
}
