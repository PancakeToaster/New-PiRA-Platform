import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import AssignmentForm from '@/components/lms/AssignmentForm';

export default async function EditAssignmentPage({
    params,
}: {
    params: Promise<{ id: string; assignmentId: string }>;
}) {
    const { id, assignmentId } = await params;
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    // Allow teachers to edit too if they own the course (checked later or via permission)
    if (!user) {
        redirect('/auth/signin');
    }

    // Fetch assignment data
    const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
            lesson: {
                select: { id: true, title: true }
            }
        }
    });

    if (!assignment) {
        notFound();
    }

    // Verify course context matches
    if (assignment.courseId !== id) {
        notFound();
    }

    // Fetch lessons for the dropdown
    const courseLessons = await prisma.lesson.findMany({
        where: { courseId: id },
        select: { id: true, title: true },
        orderBy: { orderIndex: 'asc' },
    });

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Edit Assignment</h1>
            <AssignmentForm
                courseId={id}
                lessons={courseLessons}
                initialData={{
                    ...assignment,
                    dueDate: assignment.dueDate ? new Date(assignment.dueDate) : undefined,
                    lessonId: assignment.lessonId || undefined
                }}
            />
        </div>
    );
}
