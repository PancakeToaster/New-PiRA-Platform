'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Comment {
    id: string;
    content: string;
    isResolved: boolean;
    createdAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
    };
}

interface WikiCommentsProps {
    nodeId: string;
    currentUserId: string;
    isAdmin: boolean;
}

export default function WikiComments({ nodeId, currentUserId, isAdmin }: WikiCommentsProps) {
    const router = useRouter();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, [nodeId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/wiki/nodes/${nodeId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Failed to fetch comments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await fetch(`/api/wiki/nodes/${nodeId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });

            if (res.ok) {
                setNewComment('');
                fetchComments();
            }
        } catch (error) {
            console.error('Failed to post comment', error);
        }
    };

    const handleResolve = async (commentId: string, isResolved: boolean) => {
        try {
            await fetch(`/api/wiki/nodes/${nodeId}/comments/${commentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isResolved }),
            });
            fetchComments();
        } catch (error) {
            console.error('Failed to resolve comment', error);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Area you sure you want to delete this comment?')) return;
        try {
            await fetch(`/api/wiki/nodes/${nodeId}/comments/${commentId}`, {
                method: 'DELETE',
            });
            fetchComments();
        } catch (error) {
            console.error('Failed to delete comment', error);
        }
    };

    if (loading) return <div className="text-sm text-gray-400">Loading discussion...</div>;

    const activeComments = comments.filter(c => !c.isResolved);
    const resolvedComments = comments.filter(c => c.isResolved);

    return (
        <div className="mt-12 border-t border-gray-100 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                Discussion
            </h3>

            {/* Comment List */}
            <div className="space-y-6 mb-8">
                {activeComments.length === 0 && resolvedComments.length === 0 && (
                    <div className="text-sm text-gray-500 italic">No comments yet. Start the conversation!</div>
                )}

                {activeComments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                            {comment.user.avatar ? (
                                <img src={comment.user.avatar} alt="User" className="w-8 h-8 rounded-full" />
                            ) : (
                                `${comment.user.firstName[0]}${comment.user.lastName[0]}`
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                    {comment.user.firstName} {comment.user.lastName}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>

                            {(isAdmin || currentUserId === comment.user.id) && (
                                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleResolve(comment.id, true)}
                                        className="text-xs text-gray-400 hover:text-green-600 flex items-center gap-1"
                                    >
                                        <CheckCircle className="w-3 h-3" />
                                        Resolve
                                    </button>
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Resolved Comments Toggle */}
            {resolvedComments.length > 0 && (
                <div className="mb-8">
                    <details className="text-sm text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-700 mb-4 select-none">
                            View {resolvedComments.length} resolved comments
                        </summary>
                        <div className="space-y-6 pl-4 border-l-2 border-gray-100">
                            {resolvedComments.map((comment) => (
                                <div key={comment.id} className="flex gap-4 opacity-75">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                                        {comment.user.avatar ? (
                                            <img src={comment.user.avatar} alt="User" className="w-8 h-8 rounded-full grayscale" />
                                        ) : (
                                            `${comment.user.firstName[0]}${comment.user.lastName[0]}`
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-gray-600">
                                                {comment.user.firstName} {comment.user.lastName}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Resolved</span>
                                        </div>
                                        <p className="text-sm text-gray-500">{comment.content}</p>
                                        {(isAdmin || currentUserId === comment.user.id) && (
                                            <button
                                                onClick={() => handleResolve(comment.id, false)}
                                                className="mt-2 text-xs text-indigo-600 hover:underline"
                                            >
                                                Re-open
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </details>
                </div>
            )}

            {/* Post Comment */}
            <form onSubmit={handleSubmit} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-y"
                    />
                    <div className="flex justify-end mt-2">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!newComment.trim()}
                        >
                            Post Comment
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
