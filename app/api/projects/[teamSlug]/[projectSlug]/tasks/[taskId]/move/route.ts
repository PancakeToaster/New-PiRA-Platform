import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { moveTaskSchema } from '@/lib/validations/project';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string; projectSlug: string; taskId: string }> }
) {
  const user = await getCurrentUser();
  const { teamSlug, projectSlug, taskId } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: {
        teamId_slug: {
          teamId: team.id,
          slug: projectSlug,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.projectId !== project.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = moveTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { status, kanbanOrder } = parsed.data;

    const oldStatus = task.status;

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        kanbanOrder,
        completedAt: status === 'done' ? new Date() : null,
      },
    });

    // Log activity if status changed
    if (oldStatus !== status) {
      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          userId: user.id,
          action: 'status_changed',
          field: 'status',
          oldValue: oldStatus,
          newValue: status,
        },
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Failed to move task:', error);
    return NextResponse.json({ error: 'Failed to move task' }, { status: 500 });
  }
}
