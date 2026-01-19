import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Rate limit: 1 vote per IP per course per 24 hours
const RATE_LIMIT_HOURS = 24;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  try {
    // Get IP address from headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    // Get session ID from cookie or generate one
    const sessionId = request.cookies.get('session_id')?.value || null;

    // Check if course exists and is in development
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (!course.isDevelopment) {
      return NextResponse.json(
        { error: 'This course is not accepting interest votes' },
        { status: 400 }
      );
    }

    // Check rate limit - has this IP voted for this course in the last 24 hours?
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - RATE_LIMIT_HOURS);

    const existingVote = await prisma.courseInterest.findFirst({
      where: {
        courseId,
        ipAddress,
        createdAt: {
          gte: cutoffTime,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        {
          error: 'You have already expressed interest in this course recently',
          alreadyVoted: true,
        },
        { status: 429 }
      );
    }

    // Create interest record
    await prisma.courseInterest.create({
      data: {
        courseId,
        ipAddress,
        sessionId,
      },
    });

    // Get total interest count for this course
    const interestCount = await prisma.courseInterest.count({
      where: { courseId },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your interest!',
      interestCount, // Only shown to admins in practice
    });
  } catch (error) {
    console.error('Failed to record course interest:', error);
    return NextResponse.json(
      { error: 'Failed to record interest' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  try {
    // Get IP address to check if already voted
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - RATE_LIMIT_HOURS);

    const existingVote = await prisma.courseInterest.findFirst({
      where: {
        courseId,
        ipAddress,
        createdAt: {
          gte: cutoffTime,
        },
      },
    });

    return NextResponse.json({
      hasVoted: !!existingVote,
    });
  } catch (error) {
    console.error('Failed to check vote status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
