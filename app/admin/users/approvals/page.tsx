'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, X, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface PendingUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    roles: { role: { name: string } }[];
}

export default function PendingApprovalsPage() {
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    async function fetchPendingUsers() {
        try {
            const response = await fetch('/api/admin/users/pending');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch pending users:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAction(userId: string, approve: boolean) {
        setProcessingId(userId);
        try {
            const response = await fetch('/api/admin/users/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, approve }),
            });

            if (response.ok) {
                setUsers((prev) => prev.filter((u) => u.id !== userId));
            }
        } catch (error) {
            console.error('Failed to process action:', error);
        } finally {
            setProcessingId(null);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
                <p className="text-gray-500 mt-1">Review and approve new account requests.</p>
            </div>

            {users.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
                        <p className="text-gray-500">There are no pending account requests.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {users.map((user) => (
                        <Card key={user.id}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {user.firstName} {user.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <div className="flex gap-2 mt-1">
                                            {user.roles.map(r => (
                                                <span key={r.role.name} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {r.role.name}
                                                </span>
                                            ))}
                                            <span className="text-xs text-gray-400 flex items-center">
                                                Applied: {new Date(user.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                        disabled={!!processingId}
                                        onClick={() => handleAction(user.id, false)}
                                    >
                                        {processingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                                        Reject
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        disabled={!!processingId}
                                        onClick={() => handleAction(user.id, true)}
                                    >
                                        {processingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                        Approve
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
