'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, Timer, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizPlayerProps {
    quizId: string;
    courseId: string;
}

interface Question {
    id: string;
    question: string;
    questionType: string;
    points: number;
    options?: any[]; // For MC
    order: number;
}

export default function QuizPlayer({ quizId, courseId }: QuizPlayerProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [quizData, setQuizData] = useState<any>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    // State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Initial Fetch (Start Attempt)
    const startQuiz = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/student/quizzes/${quizId}/start`, {
                method: 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                setQuizData(data.quiz);
                setQuestions(data.questions);
                setAttemptId(data.attempt.id);

                // Restore answers if resuming
                // (Assuming API returns previous answers if resuming - implementation detail skipped for brevity)

                // Set Timer
                if (data.quiz.timeLimit) {
                    const startTime = new Date(data.attempt.startedAt).getTime();
                    const endTime = startTime + (data.quiz.timeLimit * 60 * 1000);
                    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
                    setTimeLeft(remaining);
                }

                setHasStarted(true);
            } else {
                // Handle error (e.g., max attempts reached)
                alert("Could not start quiz. Max attempts reached?");
                router.back();
            }
        } catch (error) {
            console.error("Quiz start error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Timer Logic
    useEffect(() => {
        if (!hasStarted || timeLeft === null) return;

        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [hasStarted, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (questionId: string, value: any) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/student/quizzes/${quizId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attemptId,
                    answers: Object.entries(responses).map(([qId, val]) => ({
                        questionId: qId,
                        answer: val
                    }))
                })
            });

            if (res.ok) {
                const result = await res.json();
                // Redirect to results page (or show inline)
                // For now, simple alert or redirect back to course ??
                // Actually, let's redirect to a results view if possible, or back to course
                router.push(`/student/quizzes/${quizId}/result/${result.attempt.id}`);
            }
        } catch (error) {
            console.error("Submission failed:", error);
            setIsSubmitting(false);
        }
    };

    if (!hasStarted) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <CardTitle>Ready to begin?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Click start when you are ready.
                            {loading ? ' Loading...' : ''}
                        </p>
                        <Button
                            onClick={startQuiz}
                            disabled={loading}
                            className="w-full"
                            size="lg"
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Start Quiz
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 bg-card p-4 rounded-lg shadow-sm border border-border">
                <div>
                    <h1 className="text-xl font-bold text-foreground">{quizData?.title}</h1>
                    <div className="text-sm text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </div>
                </div>
                {timeLeft !== null && (
                    <div className={cn(
                        "flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-md",
                        timeLeft < 60 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted text-muted-foreground"
                    )}>
                        <Timer className="w-5 h-5" />
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Question Area */}
                <div className="lg:col-span-3">
                    <Card className="min-h-[400px] flex flex-col">
                        <CardContent className="p-6 flex-1">
                            <div className="mb-6">
                                <h2 className="text-lg font-medium text-foreground mb-2">
                                    {currentQuestion.question}
                                </h2>
                                <span className="text-sm text-muted-foreground italic">
                                    {currentQuestion.points} points
                                </span>
                            </div>

                            {/* Answer Inputs */}
                            <div className="space-y-3 max-w-xl">
                                {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options?.map((opt, idx) => (
                                    <label
                                        key={idx}
                                        className={cn(
                                            "flex items-center p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent",
                                            responses[currentQuestion.id] === opt.text ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name={`q-${currentQuestion.id}`}
                                            value={opt.text}
                                            checked={responses[currentQuestion.id] === opt.text}
                                            onChange={() => handleOptionSelect(currentQuestion.id, opt.text)}
                                            className="h-4 w-4 text-primary focus:ring-primary border-border"
                                        />
                                        <span className="ml-3 text-foreground">{opt.text}</span>
                                    </label>
                                ))}

                                {currentQuestion.questionType === 'true_false' && (
                                    <div className="space-y-3">
                                        {['True', 'False'].map((opt) => (
                                            <label
                                                key={opt}
                                                className={cn(
                                                    "flex items-center p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent",
                                                    responses[currentQuestion.id] === opt ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`q-${currentQuestion.id}`}
                                                    value={opt}
                                                    checked={responses[currentQuestion.id] === opt}
                                                    onChange={() => handleOptionSelect(currentQuestion.id, opt)}
                                                    className="h-4 w-4 text-primary focus:ring-primary border-border"
                                                />
                                                <span className="ml-3 text-foreground">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {(currentQuestion.questionType === 'short_answer' || currentQuestion.questionType === 'essay') && (
                                    <textarea
                                        className="w-full border border-border rounded-md p-3 focus:ring-2 focus:ring-primary focus:border-primary min-h-[150px] bg-background text-foreground"
                                        placeholder="Type your answer here..."
                                        value={responses[currentQuestion.id] || ''}
                                        onChange={(e) => handleOptionSelect(currentQuestion.id, e.target.value)}
                                    />
                                )}
                            </div>
                        </CardContent>
                        <div className="border-t border-border p-4 bg-muted/30 flex justify-between items-center rounded-b-lg">
                            <Button
                                variant="ghost"
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>

                            {isLastQuestion ? (
                                <Button
                                    onClick={handleSubmit}
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                    )}
                                    Submit Quiz
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Question Navigator */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm">Questions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="grid grid-cols-4 gap-2">
                                {questions.map((q, idx) => (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={cn(
                                            "w-full aspect-square flex items-center justify-center text-sm font-medium rounded-md transition-colors",
                                            idx === currentQuestionIndex ? "ring-2 ring-primary ring-offset-2 bg-card border-primary text-primary" :
                                                responses[q.id] ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:bg-accent"
                                        )}
                                    >
                                        {idx + 1}
                                        {responses[q.id] && idx !== currentQuestionIndex && (
                                            <div className="absolute top-0 right-0 w-2 h-2 bg-sky-500 rounded-full ring-2 ring-white" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-primary/20 rounded" />
                                    <span>Answered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-muted rounded" />
                                    <span>Unanswered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-primary rounded" />
                                    <span>Current</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
