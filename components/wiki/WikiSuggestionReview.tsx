'use client';

import { useState, useEffect } from 'react';
import { Check, X, GitPullRequest } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Suggestion {
    id: string;
    content: string;
    reason: string;
    createdAt: string;
    user: {
        firstName: string;
        lastName: string;
    };
}

interface WikiSuggestionReviewProps {
    nodeId: string;
    currentContent: string;
}

export default function WikiSuggestionReview({ nodeId, currentContent }: WikiSuggestionReviewProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSuggestions();
    }, [nodeId]);

    const fetchSuggestions = async () => {
        try {
            const res = await fetch(`/api/wiki/nodes/${nodeId}/suggestions`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data);
            }
        } catch (error) {
            console.error('Failed to fetch suggestions', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (suggestionId: string, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this suggestion?`)) return;

        try {
            const res = await fetch(`/api/wiki/nodes/${nodeId}/suggestions/${suggestionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                if (action === 'approve') {
                    // Reload page to show new content
                    window.location.reload();
                } else {
                    fetchSuggestions();
                }
            }
        } catch (error) {
            console.error(`Failed to ${action} suggestion`, error);
        }
    };

    if (loading || suggestions.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-indigo-600" />
                Pending Suggestions ({suggestions.length})
            </h3>

            <div className="space-y-4">
                {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="font-semibold text-indigo-900">
                                    {suggestion.user.firstName} {suggestion.user.lastName}
                                </span>
                                <span className="text-indigo-700 text-sm ml-2">suggested a change:</span>
                            </div>
                            <span className="text-xs text-indigo-400">
                                {new Date(suggestion.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="bg-white/50 p-2 rounded text-sm text-indigo-800 italic mb-4 border border-indigo-100">
                            "{suggestion.reason}"
                        </div>

                        {/* Simple diff visualization could go here, for now just show action buttons */}
                        <div className="flex gap-2">
                            {/* In a real implementation, we'd show a diff view here. 
                                 For now, trust the admin to review standard content or copy-paste check if needed. */}
                            <Button size="sm" onClick={() => handleAction(suggestion.id, 'approve')} className="bg-green-600 hover:bg-green-700">
                                <Check className="w-4 h-4 mr-1" /> Approve & Merge
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleAction(suggestion.id, 'reject')} className="text-red-600 border-red-200 hover:bg-red-50">
                                <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
