import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// POST /api/admin/assignments/[id]/rubric-grade - Submit rubric scores for a submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assignmentId } = await params;
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { submissionId, scores, feedback } = body;

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    if (!Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json({ error: 'Scores are required' }, { status: 400 });
    }

    // Verify submission belongs to this assignment
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { rubric: { include: { criteria: true } } } } },
    });

    if (!submission || submission.assignmentId !== assignmentId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (!submission.assignment.rubric) {
      return NextResponse.json({ error: 'Assignment does not have a rubric' }, { status: 400 });
    }

    // Upsert each score
    let totalScore = 0;
    for (const score of scores) {
      const criterion = submission.assignment.rubric.criteria.find(
        (c) => c.id === score.criterionId
      );
      if (!criterion) continue;

      const clampedScore = Math.min(Math.max(0, Number(score.score)), criterion.maxPoints);
      totalScore += clampedScore;

      await prisma.rubricScore.upsert({
        where: {
          criterionId_submissionId: {
            criterionId: score.criterionId,
            submissionId,
          },
        },
        update: {
          score: clampedScore,
          comment: score.comment || null,
        },
        create: {
          criterionId: score.criterionId,
          submissionId,
          score: clampedScore,
          comment: score.comment || null,
        },
      });
    }

    // Update the submission with the total grade
    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: totalScore,
        feedback: feedback || undefined,
        status: 'graded',
      },
    });

    return NextResponse.json({
      success: true,
      totalScore,
    });
  } catch (error) {
    console.error('[RUBRIC_GRADE]', error);
    return NextResponse.json({ error: 'Failed to submit rubric grades' }, { status: 500 });
  }
}
