import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { logActivity } from '@/lib/logging';
import { createTaskSchema } from '@/lib/validations/project';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string; projectSlug: string }> }
) {
  const user = await getCurrentUser();
  const { teamSlug, projectSlug } = await params;

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

    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        checklistItems: {
          orderBy: {
            order: 'asc',
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignees: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { kanbanOrder: 'asc' },
      ],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string; projectSlug: string }> }
) {
  const user = await getCurrentUser();
  const { teamSlug, projectSlug } = await params;

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

    const body = await request.json();
    const parsed = createTaskSchema.safeParse({ ...body, projectId: project.id });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      status,
      priority,
      taskType,
      dueDate,
      startDate,
      estimatedHours,
      assigneeIds,
      parentId,
    } = parsed.data;

    // Get the max kanban order for the status
    const maxOrderTask = await prisma.task.findFirst({
      where: { projectId: project.id, status },
      orderBy: { kanbanOrder: 'desc' },
    });

    const kanbanOrder = (maxOrderTask?.kanbanOrder ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title,
        description,
        status,
        priority,
        taskType,
        kanbanOrder,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        estimatedHours,
        parentId,
        assignees: assigneeIds?.length
          ? {
            create: assigneeIds.map((userId: string) => ({
              userId,
            })),
          }
          : undefined,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Create activity record
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId: user.id,
        action: 'created',
      },
    });

    // Log to centralized activity log
    await logActivity({
      userId: user.id,
      action: 'project.task.created',
      entityType: 'Task',
      entityId: task.id,
      details: { projectId: project.id, teamId: team.id, title },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
