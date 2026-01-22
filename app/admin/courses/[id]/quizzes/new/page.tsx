'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface NewQuizPageProps {
    params: {
        id: string; // Course ID
    };
}

export default function NewQuizPage({ params }: NewQuizPageProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        timeLimit: '',
        passingScore: '70',
        maxAttempts: '',
        shuffleQuestions: false,
        showResults: true,
        isPublished: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: params.id,
                    title: formData.title,
                    description: formData.description,
                    timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
                    passingScore: parseFloat(formData.passingScore),
                    maxAttempts: formData.maxAttempts ? parseInt(formData.maxAttempts) : null,
                    shuffleQuestions: formData.shuffleQuestions,
                    showResults: formData.showResults,
                    isPublished: formData.isPublished
                })
            });

            if (res.ok) {
                const data = await res.json();
                // Redirect to builder immediately after creation
                router.push(`/admin/courses/${params.id}/quizzes/${data.quiz.id}/builder`);
                router.refresh();
            } else {
                console.error("Failed to create quiz");
            }
        } catch (error) {
            console.error('Error creating quiz:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link
                    href={`/admin/courses/${params.id}/quizzes`}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Quizzes
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quiz Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Quiz Title</Label>
                            <Input
                                id="title"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Module 1 Review"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of what this quiz covers..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                                <Input
                                    id="timeLimit"
                                    type="number"
                                    min="1"
                                    value={formData.timeLimit}
                                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                                    placeholder="Optional (No limit)"
                                />
                                <p className="text-xs text-gray-500">Leave empty for no time limit.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="passingScore">Passing Score (%)</Label>
                                <Input
                                    id="passingScore"
                                    type="number"
                                    min="0"
                                    max="100"
                                    required
                                    value={formData.passingScore}
                                    onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxAttempts">Max Attempts</Label>
                            <Input
                                id="maxAttempts"
                                type="number"
                                min="1"
                                value={formData.maxAttempts}
                                onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                                placeholder="Optional (Unlimited)"
                            />
                            <p className="text-xs text-gray-500">Leave empty for unlimited attempts.</p>
                        </div>

                        <div className="flex items-center justify-between py-2 border-t">
                            <div>
                                <Label htmlFor="shuffle" className="text-base">Shuffle Questions</Label>
                                <p className="text-xs text-gray-500">Randomize question order for each student</p>
                            </div>
                            <Switch
                                id="shuffle"
                                checked={formData.shuffleQuestions}
                                onCheckedChange={(checked) => setFormData({ ...formData, shuffleQuestions: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-2 border-t">
                            <div>
                                <Label htmlFor="results" className="text-base">Show Results Immediately</Label>
                                <p className="text-xs text-gray-500">Students see their score right after submission</p>
                            </div>
                            <Switch
                                id="results"
                                checked={formData.showResults}
                                onCheckedChange={(checked) => setFormData({ ...formData, showResults: checked })}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create & Go to Builder
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
