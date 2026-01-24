import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import QuizBuilder from '@/components/lms/QuizBuilder';

export default async function QuizBuilderPage({
    params,
}: {
    params: Promise<{ id: string; quizId: string }>;
}) {
    const { id, quizId } = await params;
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user) {
        redirect('/auth/signin');
    }

    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
            questions: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!quiz) {
        notFound();
    }

    // Permission check
    const course = await prisma.lMSCourse.findUnique({ where: { id } });
    if (!course || (!userIsAdmin && course.instructorId !== user.id)) {
        redirect('/admin/courses');
    }

    return (
        <QuizBuilder
            courseId={id}
            quizId={quizId}
            initialQuestions={quiz.questions as any} // Cast because of JSON options type mismatch
            quizTitle={quiz.title}
        />
    );
}
