import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import AssignmentSubmissionView from '@/components/lms/AssignmentSubmissionView';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Assignment Submission | Robotics Academy',
};

export default async function AssignmentStatusPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/auth/signin');
    }

    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: currentUser.id },
    });

    if (!studentProfile) {
        redirect('/'); // Not a student
    }

    // Fetch Assignment and Submission
    const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
            lmsCourse: {
                select: {
                    id: true,
                    name: true,
                },
            },
            submissions: {
                where: {
                    studentId: studentProfile.id,
                },
            },
        },
    });

    if (!assignment) {
        notFound();
    }

    const submission = assignment.submissions[0] || null;

    return (
        <AssignmentSubmissionView
            assignment={assignment}
            submission={submission}
            studentId={studentProfile.id}
        />
    );
}
