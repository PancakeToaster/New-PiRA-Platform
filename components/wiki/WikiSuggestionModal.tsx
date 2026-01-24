'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import MarkdownEditor from '@/components/wiki/editors/MarkdownEditor';
import { AlertCircle } from 'lucide-react';

interface WikiSuggestionModalProps {
    nodeId: string;
    initialContent: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function WikiSuggestionModal({ nodeId, initialContent, isOpen, onClose }: WikiSuggestionModalProps) {
    const [content, setContent] = useState(initialContent);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!content.trim() || !reason.trim()) {
            alert('Please provide both content and a reason for your suggestion.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/wiki/nodes/${nodeId}/suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, reason }),
            });

            if (res.ok) {
                alert('Suggestion submitted for review!');
                onClose();
            } else {
                alert('Failed to submit suggestion.');
            }
        } catch (error) {
            console.error('Error submitting suggestion:', error);
            alert('An error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Suggest Changes</h2>
                        <p className="text-sm text-gray-500 mt-1">Propose edits to this page. An admin will review them.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="sr-only">Close</span>
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>
                            You are editing a <strong>copy</strong> of the page. Your changes won't be live until approved.
                        </p>
                    </div>

                    <div className="border rounded-md shadow-sm">
                        <div className="h-[400px] overflow-hidden">
                            <MarkdownEditor
                                content={content}
                                onChange={setContent}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1"> Reason for Change <span className="text-red-500">*</span></label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Fixed a typo, Updated outdated information..."
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
                        {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
