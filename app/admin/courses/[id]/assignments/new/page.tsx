import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import AssignmentForm from '@/components/lms/AssignmentForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewAssignmentPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        redirect('/auth/signin');
    }

    // Fetch course and its modules/lessons for binding
    const course = await prisma.lMSCourse.findUnique({
        where: { id },
        include: {
            modules: {
                include: {
                    lessons: {
                        select: { id: true, title: true }
                    }
                }
            }
        }
    });

    if (!course) {
        notFound();
    }

    // Flatten lessons for easier consumption
    const lessons = course.modules.flatMap(m => m.lessons);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href={`/admin/courses/${id}/assignments`}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">New Assignment</h1>
                    <p className="text-muted-foreground text-sm">Create an assignment for {course.name}</p>
                </div>
            </div>

            <AssignmentForm
                lmsCourseId={id}
                lessons={lessons}
            />
        </div>
    );
}
