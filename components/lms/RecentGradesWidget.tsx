import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileText } from 'lucide-react';

interface RecentGradesWidgetProps {
    studentId: string;
}

export default async function RecentGradesWidget({ studentId }: RecentGradesWidgetProps) {
    // Get recent graded submissions
    const recentGrades = await prisma.assignmentSubmission.findMany({
        where: {
            studentId,
            status: 'graded',
            grade: { not: null },
        },
        include: {
            assignment: {
                include: {
                    lmsCourse: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            },
        },
        orderBy: { gradedAt: 'desc' },
        take: 5,
    });

    if (recentGrades.length === 0) {
        return (
            <p className="text-gray-600 text-center py-4">No graded assignments yet.</p>
        );
    }

    return (
        <div className="space-y-3">
            {recentGrades.map((submission) => {
                const percentage = submission.assignment.maxPoints
                    ? Math.round(((submission.grade || 0) / submission.assignment.maxPoints) * 100)
                    : 0;
                const gradeColor =
                    percentage >= 90
                        ? 'text-green-700 bg-green-100'
                        : percentage >= 80
                            ? 'text-blue-700 bg-blue-100'
                            : percentage >= 70
                                ? 'text-yellow-700 bg-yellow-100'
                                : 'text-red-700 bg-red-100';

                return (
                    <Link
                        key={submission.id}
                        href={`/lms/courses/${submission.assignment.lmsCourseId}/grades`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{submission.assignment.title}</h3>
                                <p className="text-sm text-gray-600">
                                    {submission.assignment.lmsCourse?.code || submission.assignment.lmsCourse?.name}
                                </p>
                                {submission.feedback && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        <FileText className="w-3 h-3 inline mr-1" />
                                        {submission.feedback}
                                    </p>
                                )}
                                {submission.gradedAt && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Graded {new Date(submission.gradedAt).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <div className="ml-3 flex flex-col items-end gap-1">
                                <span className={`px-2 py-1 ${gradeColor} text-sm font-bold rounded`}>
                                    {percentage}%
                                </span>
                                <span className="text-xs text-gray-500">
                                    {submission.grade}/{submission.assignment.maxPoints}
                                </span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
