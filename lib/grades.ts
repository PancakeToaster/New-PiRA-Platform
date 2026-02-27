import { prisma } from '@/lib/prisma';

export interface GradeResult {
    totalPoints: number;
    earnedPoints: number;
    percentage: number;
    letterGrade: string;
    isWeighted: boolean;
}

export async function calculateStudentGrade(studentId: string, courseId: string): Promise<GradeResult> {
    const course = await prisma.lMSCourse.findUnique({
        where: { id: courseId },
        select: { gradingScale: true, gradingWeights: true }
    });

    if (!course) throw new Error("Course not found");

    const assignments = await prisma.assignment.findMany({
        where: { lmsCourseId: courseId },
        select: { id: true, maxPoints: true, gradeCategory: true }
    });

    const quizzes = await prisma.quiz.findMany({
        where: { lmsCourseId: courseId, isPublished: true },
        select: { id: true, gradeCategory: true }
    });

    // Efficiently getting max points for quizzes:
    const quizIds = quizzes.map(q => q.id);
    const quizPoints = await prisma.quizQuestion.groupBy({
        by: ['quizId'],
        where: { quizId: { in: quizIds } },
        _sum: { points: true }
    });
    const quizMaxPointsMap = new Map(quizPoints.map(qp => [qp.quizId, qp._sum.points || 0]));

    // Fetch submissions
    const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
        where: {
            studentId,
            assignmentId: { in: assignments.map(a => a.id) },
            status: 'graded'
        },
        select: { assignmentId: true, grade: true }
    });

    const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
            studentId,
            quizId: { in: quizzes.map(q => q.id) },
        },
        select: { quizId: true, score: true, pointsEarned: true }
    });

    return calculateGrade(
        course,
        assignments,
        quizzes,
        assignmentSubmissions,
        quizAttempts,
        quizMaxPointsMap
    );
}

export function calculateGrade(
    course: { gradingWeights: any, gradingScale: any },
    assignments: { id: string, maxPoints: number, gradeCategory: string | null }[],
    quizzes: { id: string, gradeCategory: string | null }[],
    assignmentSubmissions: { assignmentId: string, grade: number | null }[],
    quizAttempts: { quizId: string, pointsEarned: number | null }[],
    quizMaxPointsMap: Map<string, number>
): GradeResult {
    const weights = course.gradingWeights as Record<string, number> | null;
    const scale = course.gradingScale as { label: string; min: number }[] | null;

    let totalPercentage = 0;
    let totalPossibleWeight = 0;

    if (weights) {
        // Weighted Grading
        for (const [category, weight] of Object.entries(weights)) {
            const categoryAssignments = assignments.filter(a => a.gradeCategory === category);
            const categoryQuizzes = quizzes.filter(q => q.gradeCategory === category);

            let catPointsEarned = 0;
            let catPointsPossible = 0;

            // Assignments
            categoryAssignments.forEach(a => {
                const sub = assignmentSubmissions.find(s => s.assignmentId === a.id);
                if (sub && sub.grade != null) {
                    catPointsEarned += sub.grade;
                    catPointsPossible += a.maxPoints;
                }
            });

            // Quizzes
            categoryQuizzes.forEach(q => {
                const attempts = quizAttempts.filter(qa => qa.quizId === q.id);
                if (attempts.length > 0) {
                    // Best attempt
                    const best = attempts.reduce((prev, current) => ((prev.pointsEarned || 0) > (current.pointsEarned || 0) ? prev : current));
                    catPointsEarned += (best.pointsEarned || 0);
                    catPointsPossible += (quizMaxPointsMap.get(q.id) || 0);
                }
            });

            if (catPointsPossible > 0) {
                const catPercentage = (catPointsEarned / catPointsPossible);
                totalPercentage += (catPercentage * 100) * weight;
                totalPossibleWeight += weight;
            }
        }

        if (totalPossibleWeight > 0) {
            totalPercentage = totalPercentage / totalPossibleWeight;
        }

    } else {
        // Unweighted
        let sumEarned = 0;
        let sumPossible = 0;

        assignments.forEach(a => {
            const sub = assignmentSubmissions.find(s => s.assignmentId === a.id);
            if (sub && sub.grade != null) {
                sumEarned += sub.grade;
                sumPossible += a.maxPoints;
            }
        });

        quizzes.forEach(q => {
            const attempts = quizAttempts.filter(qa => qa.quizId === q.id);
            if (attempts.length > 0) {
                // Best attempt
                const best = attempts.reduce((prev, current) => ((prev.pointsEarned || 0) > (current.pointsEarned || 0) ? prev : current));
                sumEarned += (best.pointsEarned || 0);
                sumPossible += (quizMaxPointsMap.get(q.id) || 0);
            }
        });

        if (sumPossible > 0) {
            totalPercentage = (sumEarned / sumPossible) * 100;
        }
    }

    // Letter Grade
    let letterGrade = 'N/A';
    if (scale && scale.length > 0) {
        const sortedScale = [...scale].sort((a, b) => b.min - a.min);
        const match = sortedScale.find(s => totalPercentage >= s.min);
        if (match) letterGrade = match.label;
        else letterGrade = sortedScale[sortedScale.length - 1].label; // Or F?
    }

    return {
        totalPoints: 0,
        earnedPoints: 0,
        percentage: Math.round(totalPercentage * 10) / 10,
        letterGrade,
        isWeighted: !!weights
    };
}
