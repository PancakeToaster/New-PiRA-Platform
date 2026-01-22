'use client';

import { useState } from 'react';
import { FileText, Download, ExternalLink, CheckCircle, Save, Loader2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GradingInterfaceProps {
    courseId: string;
    assignment: any;
    submission: any;
    student: any;
}

export default function GradingInterface({ courseId, assignment, submission, student }: GradingInterfaceProps) {
    const router = useRouter();
    const [grade, setGrade] = useState<string>(submission.grade?.toString() || '');
    const [feedback, setFeedback] = useState(submission.feedback || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (status: 'graded' | 'returned' = 'graded') => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/assignments/${assignment.id}/submissions/${submission.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grade: grade ? parseFloat(grade) : null,
                    feedback,
                    status
                })
            });

            if (res.ok) {
                router.refresh();
                // Optionally show toast
            }
        } catch (error) {
            console.error('Failed to save grade:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-gray-50 -m-6 p-6 gap-6">
            {/* Left Side: Submission Viewer */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-4 flex items-center justify-between">
                    <Link href={`/admin/courses/${courseId}/assignments/${assignment.id}/submissions`}>
                        <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent">
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to Submissions
                        </Button>
                    </Link>
                    <div className="text-sm text-gray-500">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </div>
                </div>

                <Card className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-md">
                    <CardHeader className="bg-white border-b py-3 px-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-sky-500" />
                                {student.user.firstName}'s Submission
                            </h2>
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full font-medium text-gray-600 uppercase">
                                {submission.submissionType}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0 bg-gray-100/50">
                        {submission.submissionType === 'file' ? (
                            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
                                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">File Submission</h3>
                                <p className="text-gray-500 mb-6 max-w-sm">
                                    The student uploaded a file for this assignment.
                                    Preview functionality would go here, or download to view.
                                </p>
                                {submission.fileUrl && (
                                    <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline">
                                            <Download className="w-4 h-4 mr-2" />
                                            Download File
                                        </Button>
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="p-6 prose max-w-none">
                                <div className="bg-white p-6 rounded-lg shadow-sm border min-h-[300px]">
                                    {submission.content ? (
                                        <div dangerouslySetInnerHTML={{ __html: submission.content }} />
                                    ) : (
                                        <p className="text-gray-400 italic">No content provided.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Attachments Section if any */}
                        {submission.attachments?.length > 0 && (
                            <div className="p-6 pt-0">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Attachments</h4>
                                <div className="space-y-2">
                                    {submission.attachments.map((att: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={att.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 p-2 bg-white border rounded hover:bg-gray-50 transition-colors text-sm"
                                        >
                                            <Download className="w-4 h-4 text-gray-500" />
                                            <span className="text-blue-600 hover:underline">{att.name || 'Attachment'}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Side: Grading Form */}
            <div className="w-full md:w-80 lg:w-96 flex flex-col min-h-0">
                <Card className="h-full flex flex-col shadow-md">
                    <CardHeader className="border-b py-4">
                        <CardTitle>Grading</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Student Info */}
                        <div className="flex items-center gap-3 pb-6 border-b">
                            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold">
                                {student.user.firstName[0]}{student.user.lastName[0]}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900">
                                    {student.user.firstName} {student.user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{student.user.email}</div>
                            </div>
                        </div>

                        {/* Grade Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Grade (Max: {assignment.maxPoints})
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max={assignment.maxPoints}
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-lg p-3 border"
                                    placeholder="Enter score..."
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 text-sm">/ {assignment.maxPoints}</span>
                                </div>
                            </div>
                        </div>

                        {/* Feedback Input */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Feedback
                            </label>
                            <textarea
                                rows={8}
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-3 border resize-none"
                                placeholder="Write feedback for the student..."
                            />
                        </div>

                        {/* Status Info */}
                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
                            Current Status: <span className="font-semibold capitalize">{submission.status}</span>
                        </div>
                    </CardContent>

                    <div className="p-4 border-t bg-gray-50 space-y-3">
                        <Button
                            onClick={() => handleSave('graded')}
                            className="w-full"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Save Grade
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => handleSave('graded')}
                            variant="outline"
                            className="w-full"
                            disabled={isSaving}
                        >
                            Save Draft
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
