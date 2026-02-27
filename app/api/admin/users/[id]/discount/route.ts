import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!currentUser || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { performanceDiscount } = body;

    if (typeof performanceDiscount !== 'number' || performanceDiscount < 0 || performanceDiscount > 100) {
      return NextResponse.json(
        { error: 'Performance discount must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.studentProfile.update({
      where: { userId: id },
      data: { performanceDiscount },
      select: { performanceDiscount: true },
    });

    return NextResponse.json({ performanceDiscount: updated.performanceDiscount });
  } catch (error) {
    console.error('Failed to update performance discount:', error);
    return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 });
  }
}
