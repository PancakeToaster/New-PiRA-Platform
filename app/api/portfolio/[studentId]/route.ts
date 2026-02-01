import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/portfolio/[studentId] - Public portfolio (only isPublic items)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;

  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatar: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const items = await prisma.portfolioItem.findMany({
      where: {
        studentId,
        isPublic: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      student: {
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        avatar: student.user.avatar,
      },
      items,
    });
  } catch (error) {
    console.error('[PUBLIC_PORTFOLIO]', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
