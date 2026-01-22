import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import GradingInterface from '@/components/lms/GradingInterface';

export default async function GradingPage({
    params,
}: {
    params: Promise<{ id: string; assignmentId: string; submissionId: string }>;
}) {
    const { id, assignmentId, submissionId } = await params;
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user) {
        redirect('/auth/signin');
    }

    // Fetch submission with full context
    const submission = await prisma.assignmentSubmission.findUnique({
        where: { id: submissionId },
        include: {
            student: {
                include: { user: true }
            },
            assignment: {
                include: { course: true }
            }
        }
    });

    if (!submission) {
        notFound();
    }

    if (submission.assignmentId !== assignmentId) {
        notFound();
    }

    if (!userIsAdmin && submission.assignment.course.instructorId !== user.id) {
        redirect('/admin/courses');
    }

    return (
        <GradingInterface
            courseId={id}
            assignment={submission.assignment}
            submission={submission}
            student={submission.student}
        />
    );
}
