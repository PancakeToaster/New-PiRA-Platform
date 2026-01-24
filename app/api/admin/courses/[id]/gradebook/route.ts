import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/courses/[id]/gradebook - Fetch aggregated gradebook data
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fetch Course with enrolled students
        const course = await prisma.lMSCourse.findUnique({
            where: { id },
            include: {
                enrollments: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        avatar: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // 2. Fetch Assignments
        const assignments = await prisma.assignment.findMany({
            where: { lmsCourseId: id },
            orderBy: { dueDate: 'asc' },
            include: {
                submissions: true, // Fetch all submissions for these assignments
            },
        });

        // 3. Fetch Quizzes
        const quizzes = await prisma.quiz.findMany({
            where: { lmsCourseId: id },
            orderBy: { createdAt: 'asc' },
            include: {
                attempts: {
                    where: { isPassing: true }, // Or get best attempt? Let's get all and process.
                    // Getting all attempts allows selecting the best score.
                },
            },
        });

        const quizAttemptsRaw = await prisma.quizAttempt.findMany({
            where: { quiz: { lmsCourseId: id } },
            orderBy: { score: 'desc' }, // Order by score to easily pick best
        });


        // 4. Construct Data Structure

        // Columns: [Student Info, ...Assignments, ...Quizzes, Course Total]
        const columns = [
            ...assignments.map(a => ({
                id: a.id,
                title: a.title,
                type: 'assignment',
                maxPoints: a.maxPoints,
                dueDate: a.dueDate,
            })),
            ...quizzes.map(q => ({
                id: q.id,
                title: q.title,
                type: 'quiz',
                maxPoints: 100, // Quizzes score in %, so max is 100 usually, or q.totalPoints if calculated
                // Note: Our Quiz model stores score as Percentage (0-100).
                // If we want raw points, we need to sum question points. 
                // For simplicity in gradebook, let's treat Quizzes as 100 basic points (percentage).
            })),
        ];

        // Rows: Students
        const rows = course.enrollments.map(enrollment => {
            const student = enrollment.student;
            const studentId = student.id;

            const grades: Record<string, any> = {};
            let totalEarned = 0;
            let totalPossible = 0;

            // Process Assignments
            assignments.forEach(assign => {
                const submission = assign.submissions.find(s => s.studentId === studentId);

                let score = 0;
                let status = 'not_submitted';

                if (submission) {
                    status = submission.status;
                    if (submission.grade !== null) {
                        score = submission.grade; // Actual float grade
                        grades[assign.id] = { score, status, submissionId: submission.id };

                        // Add to totals (only if graded)
                        totalEarned += score;
                        totalPossible += assign.maxPoints;
                    } else {
                        grades[assign.id] = { score: null, status, submissionId: submission.id };
                    }
                } else {
                    grades[assign.id] = { score: null, status: 'missing' };
                    // Do we count missing as 0? Typically current grade excludes unsubmitted, 
                    // but final grade includes. Let's calculate "Current Grade" (only graded items).
                }
            });

            // Process Quizzes
            quizzes.forEach(quiz => {
                // Find best attempt (highest score)
                const attempts = quizAttemptsRaw.filter(a => a.quizId === quiz.id && a.studentId === studentId);
                const bestAttempt = attempts.length > 0 ? attempts[0] : null; // Already sorted by desc score

                if (bestAttempt && bestAttempt.score !== null) {
                    const score = bestAttempt.score; // Percentage 0-100
                    grades[quiz.id] = { score: score, status: 'completed', attemptId: bestAttempt.id };

                    totalEarned += score;
                    totalPossible += 100; // Assuming equal weight 100 for quizzes
                } else {
                    grades[quiz.id] = { score: null, status: 'not_attempted' };
                }
            });

            // Calculate Average
            const average = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 100;

            return {
                student: {
                    id: student.id,
                    userId: student.user.id,
                    name: `${student.user.firstName} ${student.user.lastName}`,
                    email: student.user.email,
                    avatar: student.user.avatar,
                },
                grades,
                summary: {
                    totalEarned,
                    totalPossible,
                    average: parseFloat(average.toFixed(2)),
                }
            };
        });

        // 5. Calculate Course Analytics
        const courseAverage = rows.length > 0
            ? rows.reduce((acc, row) => acc + row.summary.average, 0) / rows.length
            : 0;

        return NextResponse.json({
            columns,
            rows,
            analytics: {
                totalStudents: rows.length,
                courseAverage: parseFloat(courseAverage.toFixed(2)),
            }
        });

    } catch (error) {
        console.error('Failed to fetch gradebook:', error);
        return NextResponse.json({ error: 'Failed to fetch gradebook' }, { status: 500 });
    }
}
