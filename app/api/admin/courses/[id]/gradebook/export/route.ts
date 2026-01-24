import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/courses/[id]/gradebook/export - Export gradebook to CSV
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
        // Reuse logic or fetch data similarly to the main gradebook endpoint
        // Ideally extract shared logic, but for now we repeat minimal fetch for independence

        // 1. Fetch Students
        const course = await prisma.lMSCourse.findUnique({
            where: { id },
            include: {
                enrollments: {
                    include: {
                        student: {
                            include: { user: true }
                        }
                    }
                }
            }
        });

        if (!course) return NextResponse.json({ error: 'NotFound' }, { status: 404 });

        // 2. Fetch Assignments
        const assignments = await prisma.assignment.findMany({
            where: { lmsCourseId: id },
            orderBy: { dueDate: 'asc' },
            include: { submissions: true }
        });

        // 3. Fetch Quizzes
        const quizzes = await prisma.quiz.findMany({
            where: { lmsCourseId: id },
            orderBy: { createdAt: 'asc' },
        });

        // Fetch all attempts (optimization: could filter by course via relation but manual better here)
        const attempts = await prisma.quizAttempt.findMany({
            where: { quiz: { lmsCourseId: id } },
            orderBy: { score: 'desc' }
        });

        // 4. Generate CSV
        // Header
        const headers = ['Student Name', 'Email', ...assignments.map(a => `[A] ${a.title}`), ...quizzes.map(q => `[Q] ${q.title}`), 'Average (%)'];

        let csvContent = headers.join(',') + '\n';

        // Rows
        course.enrollments.forEach(enrollment => {
            const student = enrollment.student;
            const name = `"${student.user.firstName} ${student.user.lastName}"`;
            const email = student.user.email;

            let totalScore = 0;
            let totalMax = 0;

            const assignmentCols = assignments.map(a => {
                const sub = a.submissions.find(s => s.studentId === student.id);
                if (sub && sub.grade !== null) {
                    totalScore += sub.grade;
                    totalMax += a.maxPoints;
                    return sub.grade;
                }
                return ''; // or 0
            });

            const quizCols = quizzes.map(q => {
                const bestAttempt = attempts.find(at => at.quizId === q.id && at.studentId === student.id);
                if (bestAttempt && bestAttempt.score !== null) {
                    totalScore += bestAttempt.score;
                    totalMax += 100;
                    return bestAttempt.score.toFixed(1);
                }
                return '';
            });

            const average = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

            const row = [name, email, ...assignmentCols, ...quizCols, average.toFixed(2)];
            csvContent += row.join(',') + '\n';
        });

        // Return CSV
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="gradebook-${course.code}.csv"`,
            },
        });

    } catch (error) {
        console.error('Failed to export gradebook:', error);
        return NextResponse.json({ error: 'Failed to export gradebook' }, { status: 500 });
    }
}
