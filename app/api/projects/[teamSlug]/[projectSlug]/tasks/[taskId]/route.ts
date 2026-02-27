import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { logActivity } from '@/lib/logging';
import { updateTaskSchema } from '@/lib/validations/project';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ teamSlug: string; projectSlug: string; taskId: string }> }
) {
    const user = await getCurrentUser();
    const { teamSlug, projectSlug, taskId } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
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
                    orderBy: { order: 'asc' }
                },
            },
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ task });
    } catch (error) {
        console.error('Failed to fetch task:', error);
        return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ teamSlug: string; projectSlug: string; taskId: string }> }
) {
    const user = await getCurrentUser();
    const { teamSlug, projectSlug, taskId } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const parsed = updateTaskSchema.safeParse(body);

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
        } = parsed.data;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: {
                    include: {
                        team: true
                    }
                }
            }
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Check permissions (Team Member)
        const membership = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: task.project.teamId,
                    userId: user.id
                }
            }
        });

        if (!membership) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                title,
                description,
                status,
                priority,
                taskType,
                dueDate: dueDate ? new Date(dueDate) : (dueDate === null ? null : undefined),
                startDate: startDate ? new Date(startDate) : (startDate === null ? null : undefined),
                estimatedHours,
                assignees: assigneeIds ? {
                    deleteMany: {},
                    create: assigneeIds.map((userId: string) => ({ userId }))
                } : undefined
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

        // Log activity
        await prisma.taskActivity.create({
            data: {
                taskId: task.id,
                userId: user.id,
                action: 'updated',
                newValue: JSON.stringify(body)
            }
        });

        await logActivity({
            userId: user.id,
            action: 'project.task.updated',
            entityType: 'Task',
            entityId: task.id,
            details: {
                projectId: task.projectId,
                updates: Object.keys(body).join(', ')
            }
        });

        return NextResponse.json({ task: updatedTask });
    } catch (error) {
        console.error('Failed to update task:', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ teamSlug: string; projectSlug: string; taskId: string }> }
) {
    const user = await getCurrentUser();
    const { teamSlug, projectSlug, taskId } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { project: true }
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Check permissions - Admin, Project Manager, or Creator? 
        // For now, any Team Member (simplify, or ideally check role)
        // Let's assume standard team permission we've been using.
        const membership = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: task.project.teamId,
                    userId: user.id
                }
            }
        });

        if (!membership) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        await prisma.task.delete({
            where: { id: taskId }
        });

        await logActivity({
            userId: user.id,
            action: 'project.task.deleted',
            entityType: 'Task',
            entityId: taskId, // Deleted, but log ID reference
            details: { projectId: task.projectId, title: task.title }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete task:', error);
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
