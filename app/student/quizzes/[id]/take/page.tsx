import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import QuizPlayer from '@/components/lms/QuizPlayer';

export default async function QuizTakePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/signin');
    }

    // Fetch quiz details securely (without answers preferably, but QuizPlayer handles client-side security)
    // Ideally, we fetch questions WITHOUT "isCorrect" for client, or we handle that in the API called by the component.
    // The QuizPlayer will likely fetch questions via API start to ensure security. Here we just get metadata.

    const quiz = await prisma.quiz.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            description: true,
            timeLimit: true,
            lmsCourseId: true,
            questions: {
                select: { id: true } // Just verifying it has questions
            }
        }
    });

    if (!quiz) {
        notFound();
    }

    // Verify enrollment
    if (quiz.lmsCourseId) {
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                lmsCourseId_studentId: {
                    lmsCourseId: quiz.lmsCourseId,
                    studentId: user.profiles.student || ''
                }
            }
        });

        // Allow admins/teachers to preview too
        const isInstructor = await prisma.lMSCourse.findFirst({
            where: { id: quiz.lmsCourseId, instructorId: user.id }
        });

        if (!enrollment && !user.roles.includes('Admin') && !isInstructor) {
            redirect('/student/courses');
        }
    }

    return (
        <QuizPlayer quizId={id} courseId={quiz.lmsCourseId || ''} />
    );
}
