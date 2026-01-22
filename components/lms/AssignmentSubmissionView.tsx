'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
    FileText,
    UploadCloud,
    X,
    Loader2,
    CheckCircle,
    AlertCircle,
    Clock,
    Calendar,
    Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssignmentSubmissionViewProps {
    assignment: any;
    submission: any;
    studentId: string;
}

export default function AssignmentSubmissionView({
    assignment,
    submission: initialSubmission,
    studentId
}: AssignmentSubmissionViewProps) {
    const router = useRouter();
    const [submission, setSubmission] = useState(initialSubmission);
    const [content, setContent] = useState(initialSubmission?.content || '');
    const [attachments, setAttachments] = useState<string[]>(initialSubmission?.attachments || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const isGraded = submission?.status === 'graded';
    const isSubmitted = submission?.status === 'submitted';
    const isOverdue = new Date(assignment.dueDate) < new Date();

    // Handle File Upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', files[0]);

            const res = await fetch('/api/upload/assignment', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setAttachments((prev) => [...prev, data.url]);
        } catch (err) {
            setError('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const removeAttachment = (urlToRemove: string) => {
        if (isSubmitted || isGraded) return;
        setAttachments((prev) => prev.filter(url => url !== urlToRemove));
    };

    const handleSubmit = async (status: 'draft' | 'submitted') => {
        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch(`/api/student/assignments/${assignment.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    attachments,
                    status
                }),
            });

            if (!res.ok) throw new Error('Submission failed');

            const data = await res.json();
            setSubmission(data.submission);

            if (status === 'submitted') {
                router.refresh();
            }
        } catch (err) {
            setError('Failed to save submission. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatFileName = (url: string) => {
        return url.split('/').pop() || 'File';
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                        {assignment.course && (
                            <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {assignment.course.name}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {assignment.maxPoints} Points
                        </span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                    {isGraded ? (
                        <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center gap-2 font-medium">
                            <CheckCircle className="w-5 h-5" />
                            Graded: {submission.grade}/{assignment.maxPoints}
                        </div>
                    ) : isSubmitted ? (
                        <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg flex items-center gap-2 font-medium">
                            <CheckCircle className="w-5 h-5" />
                            Submitted
                        </div>
                    ) : isOverdue ? (
                        <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg flex items-center gap-2 font-medium">
                            <AlertCircle className="w-5 h-5" />
                            Overdue
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg flex items-center gap-2 font-medium">
                            <Clock className="w-5 h-5" />
                            In Progress
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            <Card>
                <CardContent className="pt-6 prose text-gray-700">
                    {assignment.description}
                </CardContent>
            </Card>

            {/* Submission Form */}
            <Card className="border-t-4 border-t-sky-500">
                <CardContent className="pt-6 space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Your Submission</h2>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Text Entry */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Online Text / Notes
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={isSubmitted || isGraded}
                            rows={6}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="Type your answer or add comments here..."
                        />
                    </div>

                    {/* File Attachments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Attachments
                        </label>

                        {/* File List */}
                        <div className="space-y-2 mb-4">
                            {attachments.map((url, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded border">
                                            <FileText className="w-5 h-5 text-sky-600" />
                                        </div>
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-600 hover:underline">
                                            {formatFileName(url)}
                                        </a>
                                    </div>
                                    {!isSubmitted && !isGraded && (
                                        <button
                                            onClick={() => removeAttachment(url)}
                                            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Upload Button */}
                        {!isSubmitted && !isGraded && (
                            <div className="relative">
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                    disabled={isUploading}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-white transition-colors
                    ${isUploading ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-sky-500'}`}
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {isUploading ? (
                                            <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-2" />
                                        ) : (
                                            <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                                        )}
                                        <p className="text-sm text-gray-500">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">PDF, DOCX, ZIP, Images (Max 5MB)</p>
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        {isGraded ? (
                            <div className="text-sm text-gray-500 italic">
                                This assignment has been graded.
                            </div>
                        ) : isSubmitted ? (
                            <>
                                <div className="text-sm text-gray-500 italic mr-auto">
                                    Submitted on {new Date(submission.submittedAt).toLocaleString()}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => handleSubmit('draft')}
                                    disabled={isSubmitting}
                                >
                                    Unsubmit to Edit
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSubmit('draft')}
                                    disabled={isSubmitting || isUploading}
                                >
                                    Save Draft
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => handleSubmit('submitted')}
                                    disabled={isSubmitting || isUploading || (!content && attachments.length === 0)}
                                    isLoading={isSubmitting}
                                >
                                    Submit Assignment
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Feedback Section (if graded) */}
            {submission?.feedback && (
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            Teacher Feedback
                        </h3>
                        <div className="prose bg-green-50 p-4 rounded-lg text-gray-800">
                            {submission.feedback}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
