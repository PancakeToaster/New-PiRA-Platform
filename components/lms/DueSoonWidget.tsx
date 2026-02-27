import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, FileText } from 'lucide-react';

interface DueSoonWidgetProps {
    studentId: string;
}

export default async function DueSoonWidget({ studentId }: DueSoonWidgetProps) {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get assignments due within the next week
    const dueAssignments = await prisma.assignment.findMany({
        where: {
            dueDate: {
                gte: now,
                lte: oneWeekFromNow,
            },
            lmsCourseId: {
                in: (
                    await prisma.courseEnrollment.findMany({
                        where: { studentId },
                        select: { lmsCourseId: true },
                    })
                ).map((e) => e.lmsCourseId),
            },
        },
        include: {
            lmsCourse: {
                select: {
                    name: true,
                    code: true,
                },
            },
            submissions: {
                where: { studentId },
                select: { status: true },
            },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
    });

    if (dueAssignments.length === 0) {
        return (
            <p className="text-muted-foreground text-center py-4">No assignments due soon. Great job staying on top of things!</p>
        );
    }

    return (
        <div className="space-y-3">
            {dueAssignments.map((assignment) => {
                const submission = assignment.submissions[0];
                const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';
                const daysUntilDue = Math.ceil((assignment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                return (
                    <Link
                        key={assignment.id}
                        href={`/lms/courses/${assignment.lmsCourseId}/assignments`}
                        className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {assignment.lmsCourse?.code || assignment.lmsCourse?.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                        Due {assignment.dueDate.toLocaleDateString()} ({daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''})
                                    </p>
                                </div>
                            </div>
                            {isSubmitted ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                    Submitted
                                </span>
                            ) : (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                                    Pending
                                </span>
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
