'use client';

import { useState } from 'react';
import {
    Plus,
    Trash2,
    GripVertical,
    Save,
    HelpCircle,
    CheckCircle2,
    Type,
    ListChecks,
    AlignLeft,
    Settings,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { useRouter } from 'next/navigation';

export interface Question {
    id: string;
    question: string;
    questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    points: number;
    options?: any[]; // For MC
    correctAnswer?: string | boolean; // For T/F or Simple
    explanation?: string;
    order: number;
}

interface QuizBuilderProps {
    courseId: string;
    quizId: string;
    initialQuestions: Question[];
    quizTitle: string;
}

export default function QuizBuilder({ courseId, quizId, initialQuestions, quizTitle }: QuizBuilderProps) {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [isSaving, setIsSaving] = useState(false);
    const [editQuestion, setEditQuestion] = useState<Question | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Initial new question template
    const newQuestionTemplate: Question = {
        id: 'new', // temporary
        question: '',
        questionType: 'multiple_choice',
        points: 1,
        order: questions.length,
        options: [
            { text: 'Option 1', isCorrect: false },
            { text: 'Option 2', isCorrect: false }
        ]
    };

    const handleAddQuestion = () => {
        setEditQuestion({ ...newQuestionTemplate, id: `temp-${Date.now()}` });
        setIsDialogOpen(true);
    };

    const handleEditQuestion = (q: Question) => {
        setEditQuestion({ ...q });
        setIsDialogOpen(true);
    };

    const handleSaveQuestion = () => {
        if (!editQuestion) return;

        let updatedQuestions = [...questions];
        const existingIndex = updatedQuestions.findIndex(q => q.id === editQuestion.id);

        if (existingIndex >= 0) {
            updatedQuestions[existingIndex] = editQuestion;
        } else {
            updatedQuestions.push(editQuestion);
        }

        setQuestions(updatedQuestions);
        setIsDialogOpen(false);
        setEditQuestion(null);
    };

    const handleDeleteQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleSaveQuiz = async () => {
        setIsSaving(true);
        try {
            // Bulk update via API
            // Note: In a real app, you might want to optimistic update or save individual questions on change
            // For now, we'll send the whole list to replace/sync
            const res = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions })
            });

            if (res.ok) {
                router.refresh();
                // Toast success
            }
        } catch (error) {
            console.error('Failed to save quiz:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to render icon based on type
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'multiple_choice': return <ListChecks className="w-4 h-4" />;
            case 'true_false': return <CheckCircle2 className="w-4 h-4" />;
            case 'short_answer': return <Type className="w-4 h-4" />;
            case 'essay': return <AlignLeft className="w-4 h-4" />;
            default: return <HelpCircle className="w-4 h-4" />;
        }
    };

    // Helper to render configuration inputs based on type
    const renderQuestionConfig = () => {
        if (!editQuestion) return null;

        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Question Type</label>
                    <select
                        value={editQuestion.questionType}
                        onChange={(e) => setEditQuestion({ ...editQuestion, questionType: e.target.value as any })}
                        className="w-full border rounded-md p-2"
                    >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True / False</option>
                        <option value="short_answer">Short Answer</option>
                        <option value="essay">Essay</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Question Text</label>
                    <textarea
                        value={editQuestion.question}
                        onChange={(e) => setEditQuestion({ ...editQuestion, question: e.target.value })}
                        className="w-full border rounded-md p-2 h-24"
                        placeholder="Enter your question here..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Points</label>
                    <input
                        type="number"
                        min="0"
                        value={editQuestion.points}
                        onChange={(e) => setEditQuestion({ ...editQuestion, points: parseFloat(e.target.value) })}
                        className="w-full border rounded-md p-2"
                    />
                </div>

                {/* Specific Configs */}
                {editQuestion.questionType === 'multiple_choice' && (
                    <div className="space-y-2 border-t pt-4">
                        <label className="block text-sm font-medium mb-1">Options</label>
                        {editQuestion.options?.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="correct-opt"
                                    checked={opt.isCorrect}
                                    onChange={() => {
                                        const newOpts = editQuestion.options?.map((o, i) => ({ ...o, isCorrect: i === idx })) || [];
                                        setEditQuestion({ ...editQuestion, options: newOpts });
                                    }}
                                />
                                <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => {
                                        const newOpts = [...(editQuestion.options || [])];
                                        newOpts[idx].text = e.target.value;
                                        setEditQuestion({ ...editQuestion, options: newOpts });
                                    }}
                                    className="flex-1 border rounded-md p-2"
                                    placeholder={`Option ${idx + 1}`}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const newOpts = editQuestion.options?.filter((_, i) => i !== idx) || [];
                                        setEditQuestion({ ...editQuestion, options: newOpts });
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setEditQuestion({
                                    ...editQuestion,
                                    options: [...(editQuestion.options || []), { text: '', isCorrect: false }]
                                });
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Option
                        </Button>
                    </div>
                )}

                {editQuestion.questionType === 'true_false' && (
                    <div className="space-y-2 border-t pt-4">
                        <label className="block text-sm font-medium mb-1">Correct Answer</label>
                        <select
                            value={String(editQuestion.correctAnswer)}
                            onChange={(e) => setEditQuestion({ ...editQuestion, correctAnswer: e.target.value === 'true' })}
                            className="w-full border rounded-md p-2"
                        >
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    </div>
                )}

                <div className="space-y-2 border-t pt-4">
                    <label className="block text-sm font-medium mb-1">Explanation (Optional)</label>
                    <textarea
                        value={editQuestion.explanation || ''}
                        onChange={(e) => setEditQuestion({ ...editQuestion, explanation: e.target.value })}
                        className="w-full border rounded-md p-2 h-20 text-sm"
                        placeholder="Explain why the answer is correct (shown after grading)..."
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{quizTitle}</h1>
                    <p className="text-gray-500">Edit Questions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleAddQuestion}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                    </Button>
                    <Button onClick={handleSaveQuiz} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {questions.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center text-gray-500">
                            No questions yet. Click "Add Question" to start building your quiz.
                        </CardContent>
                    </Card>
                ) : (
                    questions.map((q, index) => (
                        <Card key={q.id} className="cursor-move hover:border-sky-300 transition-colors group">
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className="mt-2 text-gray-400 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-500">Q{index + 1}.</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 uppercase font-medium flex items-center gap-1">
                                            {getTypeIcon(q.questionType)}
                                            {q.questionType.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            ({q.points} points)
                                        </span>
                                    </div>
                                    <p className="text-gray-900 mb-2 line-clamp-2">{q.question}</p>

                                    {/* Quick Preview of options/answer */}
                                    {q.questionType === 'multiple_choice' && (
                                        <div className="text-sm text-gray-500 pl-4 border-l-2 border-gray-200">
                                            {q.options?.length || 0} Options
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(q)}>
                                        <Settings className="w-4 h-4 text-gray-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editQuestion?.id.startsWith('temp') ? 'Add Question' : 'Edit Question'}
                        </DialogTitle>
                    </DialogHeader>
                    {renderQuestionConfig()}
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveQuestion}>
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
