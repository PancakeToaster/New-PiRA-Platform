'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface QuizSettingsPageProps {
    params: {
        id: string; // Course ID
        quizId: string;
    };
}

export default function QuizSettingsPage({ params }: QuizSettingsPageProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        timeLimit: '',
        passingScore: '70',
        maxAttempts: '',
        shuffleQuestions: false,
        showResults: true,
        showCorrectAnswers: true,
        gradeCategory: '',
        isPublished: false
    });

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await fetch(`/api/admin/quizzes/${params.quizId}`);
                if (res.ok) {
                    const data = await res.json();
                    const quiz = data.quiz;
                    setFormData({
                        title: quiz.title,
                        description: quiz.description || '',
                        timeLimit: quiz.timeLimit?.toString() || '',
                        passingScore: quiz.passingScore.toString(),
                        maxAttempts: quiz.maxAttempts?.toString() || '',
                        shuffleQuestions: quiz.shuffleQuestions,
                        showResults: quiz.showResults,
                        showCorrectAnswers: quiz.showCorrectAnswers ?? true,
                        gradeCategory: quiz.gradeCategory || '',
                        isPublished: quiz.isPublished
                    });
                }
            } catch (error) {
                console.error('Failed to fetch quiz', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuiz();
    }, [params.quizId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch(`/api/admin/quizzes/${params.quizId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
                    passingScore: parseFloat(formData.passingScore),
                    maxAttempts: formData.maxAttempts ? parseInt(formData.maxAttempts) : null,
                    shuffleQuestions: formData.shuffleQuestions,
                    showResults: formData.showResults,
                    showCorrectAnswers: formData.showCorrectAnswers,
                    gradeCategory: formData.gradeCategory || null,
                    isPublished: formData.isPublished
                })
            });

            if (res.ok) {
                router.refresh();
                // Optional: show toast
            } else {
                console.error("Failed to update quiz");
            }
        } catch (error) {
            console.error('Error updating quiz:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link
                    href={`/admin/courses/${params.id}/quizzes`}
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Quizzes
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Quiz Settings</h1>
                    <Link href={`/admin/courses/${params.id}/quizzes/${params.quizId}/builder`}>
                        <Button variant="outline">
                            Go to Builder
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Details</CardTitle>
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
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="timeLimit">Time Limit (mins)</Label>
                                <Input
                                    id="timeLimit"
                                    type="number"
                                    min="1"
                                    value={formData.timeLimit}
                                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                                    placeholder="No limit"
                                />
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
                                placeholder="Unlimited"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Grade Category</Label>
                            <Input
                                id="category"
                                value={formData.gradeCategory}
                                onChange={(e) => setFormData({ ...formData, gradeCategory: e.target.value })}
                                placeholder="e.g. Homework, Exam"
                            />
                            <p className="text-xs text-muted-foreground">Used for weighted grading.</p>
                        </div>

                        <div className="flex items-center justify-between py-2 border-t">
                            <div>
                                <Label htmlFor="shuffle" className="text-base">Shuffle Questions</Label>
                                <p className="text-xs text-muted-foreground">Randomize question order</p>
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
                                <p className="text-xs text-muted-foreground">Show score after submission</p>
                            </div>
                            <Switch
                                id="results"
                                checked={formData.showResults}
                                onCheckedChange={(checked) => setFormData({ ...formData, showResults: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-2 border-t">
                            <div>
                                <Label htmlFor="correctAnswers" className="text-base">Show Correct Answers</Label>
                                <p className="text-xs text-muted-foreground">Allow viewing correct answers in review</p>
                            </div>
                            <Switch
                                id="correctAnswers"
                                checked={formData.showCorrectAnswers}
                                onCheckedChange={(checked) => setFormData({ ...formData, showCorrectAnswers: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-2 border-t">
                            <div>
                                <Label htmlFor="published" className="text-base">Published</Label>
                                <p className="text-xs text-muted-foreground">Visible to students</p>
                            </div>
                            <Switch
                                id="published"
                                checked={formData.isPublished}
                                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
