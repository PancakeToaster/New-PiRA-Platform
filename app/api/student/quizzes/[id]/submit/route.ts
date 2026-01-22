import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// POST /api/student/quizzes/[id]/submit - Submit a quiz attempt
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; // quizId
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { attemptId, answers } = body;
        // answers: Record<questionId, string> (stringified JSON for MC, plain text for others)

        if (!attemptId || !answers) {
            return NextResponse.json({ error: 'Missing attemptId or answers' }, { status: 400 });
        }

        // Fetch student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: currentUser.id },
        });

        if (!studentProfile) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        // Fetch attempt to verify ownership and status
        const attempt = await prisma.quizAttempt.findUnique({
            where: { id: attemptId },
            include: { quiz: true },
        });

        if (!attempt) {
            return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
        }

        if (attempt.studentId !== studentProfile.id) {
            return NextResponse.json({ error: 'Unauthorized attempt access' }, { status: 403 });
        }

        if (attempt.submittedAt) {
            return NextResponse.json({ error: 'Attempt already submitted' }, { status: 400 });
        }

        // Fetch all questions for this quiz to grade against
        const questions = await prisma.quizQuestion.findMany({
            where: { quizId: id },
        });

        const questionMap = new Map(questions.map(q => [q.id, q]));
        let totalPointsEarned = 0;
        let totalPointsPossible = 0;
        let gradedAnswerData = [];

        // Calculate time spent (in seconds)
        const startedAt = new Date(attempt.startedAt);
        const now = new Date();
        // Use Math.floor to get an integer number of seconds
        const timeSpent = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

        // Process each answer
        for (const question of questions) {
            const studentAnswer = answers[question.id] || null;
            totalPointsPossible += question.points;

            let isCorrect = false;
            let pointsEarned = 0;
            let processedAnswer = studentAnswer; // Store raw answer by default

            if (studentAnswer) {
                // --- Auto-Grading Logic ---
                if (question.questionType === 'multiple_choice') {
                    try {
                        // For MC, options is JSON: [{text: "A", isCorrect: true}, ...]
                        // studentAnswer is expected to be JSON string of selected texts: ["A"] or ["A", "B"]

                        const selectedOptions = JSON.parse(studentAnswer); // Array of strings
                        const questionOptions = question.options as any[]; // Array of option objects

                        if (Array.isArray(selectedOptions) && Array.isArray(questionOptions)) {
                            const correctOptionTexts = questionOptions
                                .filter((o: any) => o.isCorrect)
                                .map((o: any) => o.text);

                            // Compare arrays (order doesn't generally matter for "set" equality)
                            // 1. All selected are correct
                            const allSelectedAreCorrect = selectedOptions.every(opt => correctOptionTexts.includes(opt));
                            // 2. All correct are selected
                            const allCorrectAreSelected = correctOptionTexts.every(opt => selectedOptions.includes(opt));

                            if (allSelectedAreCorrect && allCorrectAreSelected) {
                                isCorrect = true;
                                pointsEarned = question.points;
                            }
                        }
                    } catch (e) {
                        console.error(`Error parsing multiple choice answer for Q ${question.id}`, e);
                    }

                } else if (question.questionType === 'true_false') {
                    // Case insensitive comparison
                    if (question.correctAnswer && studentAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
                        isCorrect = true;
                        pointsEarned = question.points;
                    }

                } else if (question.questionType === 'short_answer') {
                    // Short Answer: comma-separated acceptable answers
                    if (question.correctAnswer) {
                        const acceptableAnswers = question.correctAnswer.split(',').map(s => s.trim().toLowerCase());
                        if (acceptableAnswers.includes(studentAnswer.trim().toLowerCase())) {
                            isCorrect = true;
                            pointsEarned = question.points;
                        }
                    }
                }
                // Essay questions remain isCorrect=null (or false), pointsEarned=0 until manual grading
                else if (question.questionType === 'essay') {
                    // Manual grading required.
                    isCorrect = false; // Or null? The schema allows Boolean? so let's stick to default null for "not graded yet" logic or false.
                    // Actually schema says `isCorrect Boolean?`. Let's leave it null for essay to indicate "needs grading".
                    // But strict null check might be tricky in code loops. Let's set null for essay.
                }
            }

            // Special handling for Essay: explicit null for 'isCorrect' to signify "needs grading"
            const finalIsCorrect = question.questionType === 'essay' ? null : isCorrect;

            totalPointsEarned += pointsEarned;

            gradedAnswerData.push({
                attemptId: attemptId,
                questionId: question.id,
                answer: processedAnswer,
                isCorrect: finalIsCorrect,
                pointsEarned: pointsEarned,
            });
        }

        // Save all answers
        // Delete existing answers for this attempt first (safe retry)
        await prisma.quizQuestionAnswer.deleteMany({
            where: { attemptId },
        });

        await prisma.quizQuestionAnswer.createMany({
            data: gradedAnswerData,
        });

        // Calculate final score
        // Note: Score is percentage (0-100)
        const scorePercentage = totalPointsPossible > 0
            ? (totalPointsEarned / totalPointsPossible) * 100
            : 0;

        // Check passing status
        const isPassing = scorePercentage >= (attempt.quiz.passingScore || 0);

        // Update Attempt
        const updatedAttempt = await prisma.quizAttempt.update({
            where: { id: attemptId },
            data: {
                submittedAt: new Date(),
                score: scorePercentage,
                pointsEarned: totalPointsEarned,
                pointsTotal: totalPointsPossible,
                isPassing,
                timeSpent,
            },
        });

        return NextResponse.json({
            success: true,
            attempt: updatedAttempt,
            results: {
                score: scorePercentage,
                passed: isPassing,
                totalPoints: totalPointsPossible,
                earnedPoints: totalPointsEarned
            }
        });

    } catch (error) {
        console.error('Failed to submit quiz:', error);
        return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
    }
}
