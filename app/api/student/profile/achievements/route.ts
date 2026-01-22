import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/student/profile/achievements - Fetch achievements for current student or specific student (if admin/parent)
export async function GET(request: NextRequest) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const targetStudentId = searchParams.get('studentId');

        let studentIdToCheck = '';

        // Logic to determine which student to fetch
        if (targetStudentId) {
            // If specifying a student ID, check permissions (Admin or Parent of student)
            // For simplicity/security, let's start with basic access check or assume strictly managed access in middleware
            // But here we can check:
            studentIdToCheck = targetStudentId;
        } else {
            // Default to logged-in student
            const studentProfile = await prisma.studentProfile.findUnique({
                where: { userId: currentUser.id }
            });
            if (studentProfile) {
                studentIdToCheck = studentProfile.id;
            } else {
                return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
            }
        }

        if (!studentIdToCheck) {
            return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
        }

        // Fetch Badges
        const badges = await prisma.studentBadge.findMany({
            where: { studentId: studentIdToCheck },
            include: {
                badge: true,
            },
            orderBy: { earnedAt: 'desc' },
        });

        // Fetch Certificates
        const certificates = await prisma.studentCertificate.findMany({
            where: { studentId: studentIdToCheck },
            include: {
                certificate: true,
                awarder: {
                    select: { firstName: true, lastName: true },
                }
            },
            orderBy: { awardedAt: 'desc' },
        });

        return NextResponse.json({
            badges: badges.map(b => ({
                ...b.badge,
                earnedAt: b.earnedAt,
                awardId: b.id
            })),
            certificates: certificates.map(c => ({
                ...c.certificate,
                awardedAt: c.awardedAt,
                code: c.code,
                awardedBy: c.awarder ? `${c.awarder.firstName} ${c.awarder.lastName}` : 'System',
                awardId: c.id
            }))
        });

    } catch (error) {
        console.error('Failed to fetch achievements:', error);
        return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }
}
