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

    if (loading) return <div className="text-sm text-muted-foreground">Loading discussion...</div>;

    const activeComments = comments.filter(c => !c.isResolved);
    const resolvedComments = comments.filter(c => c.isResolved);

    return (
        <div className="mt-12 border-t border-border pt-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                Discussion
            </h3>

            {/* Comment List */}
            <div className="space-y-6 mb-8">
                {activeComments.length === 0 && resolvedComments.length === 0 && (
                    <div className="text-sm text-muted-foreground italic">No comments yet. Start the conversation!</div>
                )}

                {activeComments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {comment.user.avatar ? (
                                <img src={comment.user.avatar} alt="User" className="w-8 h-8 rounded-full" />
                            ) : (
                                `${comment.user.firstName[0]}${comment.user.lastName[0]}`
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-foreground">
                                    {comment.user.firstName} {comment.user.lastName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>

                            {(isAdmin || currentUserId === comment.user.id) && (
                                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleResolve(comment.id, true)}
                                        className="text-xs text-muted-foreground hover:text-green-600 dark:hover:text-green-400 flex items-center gap-1"
                                    >
                                        <CheckCircle className="w-3 h-3" />
                                        Resolve
                                    </button>
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
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
                    <details className="text-sm text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground mb-4 select-none">
                            View {resolvedComments.length} resolved comments
                        </summary>
                        <div className="space-y-6 pl-4 border-l-2 border-border">
                            {resolvedComments.map((comment) => (
                                <div key={comment.id} className="flex gap-4 opacity-75">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold shrink-0">
                                        {comment.user.avatar ? (
                                            <img src={comment.user.avatar} alt="User" className="w-8 h-8 rounded-full grayscale" />
                                        ) : (
                                            `${comment.user.firstName[0]}${comment.user.lastName[0]}`
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {comment.user.firstName} {comment.user.lastName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">Resolved</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                                        {(isAdmin || currentUserId === comment.user.id) && (
                                            <button
                                                onClick={() => handleResolve(comment.id, false)}
                                                className="mt-2 text-xs text-sky-600 dark:text-sky-400 hover:underline"
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
                <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full min-h-[80px] p-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm resize-y"
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
