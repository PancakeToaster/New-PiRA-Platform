import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// POST /api/admin/students/[id]/badges - Award badge to student
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; // Student Profile ID
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { badgeId } = body;

        // Verify student exists
        const student = await prisma.studentProfile.findUnique({
            where: { id },
        });
        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Verify badge exists
        const badge = await prisma.badge.findUnique({
            where: { id: badgeId },
        });
        if (!badge) {
            return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
        }

        // Check if already awarded
        const existingAward = await prisma.studentBadge.findUnique({
            where: {
                studentId_badgeId: {
                    studentId: id,
                    badgeId,
                },
            },
        });

        if (existingAward) {
            return NextResponse.json({ error: 'Student already has this badge' }, { status: 400 });
        }

        // Award badge
        const award = await prisma.studentBadge.create({
            data: {
                studentId: id,
                badgeId,
            },
        });

        return NextResponse.json({ award });
    } catch (error) {
        console.error('Failed to award badge:', error);
        return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 });
    }
}
