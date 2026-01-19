import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get teams the user belongs to
    const userTeams = await prisma.teamMember.findMany({
      where: { userId: user.id },
      select: { teamId: true },
    });

    const teamIds = userTeams.map((t) => t.teamId);

    // Get all tasks from projects in user's teams
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          teamId: {
            in: teamIds,
          },
        },
      },
      select: {
        status: true,
        dueDate: true,
      },
    });

    const now = new Date();
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'done').length,
      inProgressTasks: tasks.filter((t) => t.status === 'in_progress').length,
      overdueTasks: tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
      ).length,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
