import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface QuizResultPageProps {
    params: {
        id: string;
        attemptId: string;
    };
}

export default async function QuizResultPage({ params }: QuizResultPageProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/signin');
    }

    const attempt = await prisma.quizAttempt.findUnique({
        where: { id: params.attemptId },
        include: {
            quiz: {
                include: {
                    questions: {
                        orderBy: { order: 'asc' }
                    }
                }
            },
            answers: true
        }
    });

    if (!attempt) {
        notFound();
    }

    if (attempt.studentId !== user.profiles.student && !user.roles.includes('Admin')) {
        notFound();
    }

    const quiz = attempt.quiz;
    const showCorrectAnswers = quiz.showCorrectAnswers;

    // Calculate score (it should be stored in attempt, but we can display detail)
    const scorePercentage = Math.round(((attempt.score || 0) / (quiz.questions.reduce((acc, q) => acc + q.points, 0) || 1)) * 100);
    const passed = scorePercentage >= (quiz.passingScore || 0);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Link
                href={quiz.lmsCourseId ? `/student/courses/${quiz.lmsCourseId}` : '/student/courses'}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Course
            </Link>

            <Card className="mb-8">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-3xl">{quiz.title}</CardTitle>
                    <p className="text-muted-foreground">Results</p>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className={cn(
                            "w-32 h-32 rounded-full flex items-center justify-center border-4 text-4xl font-bold",
                            passed ? "border-green-500 text-green-600 bg-green-50" : "border-red-500 text-red-600 bg-red-50"
                        )}>
                            {scorePercentage}%
                        </div>
                    </div>
                    <div>
                        <p className="text-lg font-medium">
                            {passed ? "Congratulations! You passed." : "You did not pass."}
                        </p>
                        <p className="text-muted-foreground">
                            Score: {attempt.score} / {quiz.questions.reduce((acc, q) => acc + q.points, 0)} points
                        </p>
                    </div>
                </CardContent>
            </Card>

            {showCorrectAnswers ? (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold">Review Answers</h2>
                    {quiz.questions.map((q, idx) => {
                        const userAnswer = attempt.answers.find(a => a.questionId === q.id);
                        const isCorrect = userAnswer?.isCorrect;

                        return (
                            <Card key={q.id} className={cn("border-l-4", isCorrect ? "border-l-green-500" : "border-l-red-500")}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div>
                                            <span className="text-sm text-muted-foreground font-medium mb-1 block">Question {idx + 1}</span>
                                            <p className="font-medium text-lg">{q.question}</p>
                                        </div>
                                        <div className="shrink-0">
                                            {isCorrect ? (
                                                <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Correct
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Incorrect
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 bg-muted/30 p-4 rounded-md">
                                        <div>
                                            <span className="text-xs uppercase text-muted-foreground font-bold">Your Answer:</span>
                                            <p className={cn("mt-1", isCorrect ? "text-green-700" : "text-red-700")}>
                                                {userAnswer?.answer || "No answer"}
                                            </p>
                                        </div>
                                        {!isCorrect && q.questionType !== 'essay' && (
                                            <div className="mt-4 pt-4 border-t border-border/50">
                                                <span className="text-xs uppercase text-muted-foreground font-bold">Correct Answer:</span>
                                                {/* Logic for displaying correct answer based on type */}
                                                <p className="mt-1 text-green-700 font-medium">
                                                    {/* Simple display logic for MC/TrueFalse - for complex types we might need parsing */}
                                                    {q.questionType === 'true_false' ? (q.correctAnswer ? 'True' : 'False') :
                                                        q.questionType === 'multiple_choice' ?
                                                            (q.options as any[]).find(o => o.isCorrect)?.text :
                                                            "See explanation"
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {q.explanation && (
                                            <div className="mt-4 pt-4 border-t border-border/50">
                                                <span className="text-xs uppercase text-muted-foreground font-bold">Explanation:</span>
                                                <p className="mt-1 text-muted-foreground text-sm">{q.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <p>Detailed answer review is disabled for this quiz.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
