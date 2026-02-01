import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/lms/learning-paths - Student-facing published paths with progress
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const studentProfileId = user.profiles?.student;

    const paths = await prisma.learningPath.findMany({
      where: { isPublished: true },
      include: {
        steps: {
          include: {
            lmsCourse: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get student's enrollments if they have a student profile
    let enrollments: Array<{ lmsCourseId: string; status: string; progress: number | null }> = [];
    if (studentProfileId) {
      enrollments = await prisma.courseEnrollment.findMany({
        where: { studentId: studentProfileId },
        select: { lmsCourseId: true, status: true, progress: true },
      });
    }

    const enrollmentMap = new Map(enrollments.map((e) => [e.lmsCourseId, e]));

    // Enrich paths with progress info
    const enrichedPaths = paths.map((path) => {
      const stepsWithProgress = path.steps.map((step) => {
        const enrollment = enrollmentMap.get(step.lmsCourseId);
        return {
          ...step,
          enrollment: enrollment
            ? { status: enrollment.status, progress: enrollment.progress }
            : null,
        };
      });

      const totalSteps = stepsWithProgress.length;
      const completedSteps = stepsWithProgress.filter(
        (s) => s.enrollment?.status === 'completed'
      ).length;

      return {
        ...path,
        steps: stepsWithProgress,
        progress: {
          total: totalSteps,
          completed: completedSteps,
          percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
        },
      };
    });

    return NextResponse.json({ paths: enrichedPaths });
  } catch (error) {
    console.error('[LMS_LEARNING_PATHS]', error);
    return NextResponse.json({ error: 'Failed to fetch learning paths' }, { status: 500 });
  }
}
