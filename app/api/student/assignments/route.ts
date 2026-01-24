import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/student/assignments - Fetch student's assignments
export async function GET(request: NextRequest) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: currentUser.id },
        });

        if (!studentProfile) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        // Get all assignments for courses the student is enrolled in
        const enrollments = await prisma.courseEnrollment.findMany({
            where: { studentId: studentProfile.id },
            select: { lmsCourseId: true },
        });

        const courseIds = enrollments.map(e => e.lmsCourseId);

        const assignments = await prisma.assignment.findMany({
            where: {
                OR: [
                    { lmsCourseId: { in: courseIds }, studentId: null }, // Course-wide assignments
                    { studentId: studentProfile.id }, // Individual assignments
                ],
            },
            include: {
                lmsCourse: {
                    select: {
                        name: true,
                    },
                },
                lesson: {
                    select: {
                        title: true,
                    },
                },
                submissions: {
                    where: {
                        studentId: studentProfile.id,
                    },
                    select: {
                        id: true,
                        status: true,
                        grade: true,
                        submittedAt: true,
                        gradedAt: true,
                    },
                },
            },
            orderBy: {
                dueDate: 'asc',
            },
        });

        // Categorize assignments
        const now = new Date();
        const upcoming = assignments.filter(a =>
            new Date(a.dueDate) > now &&
            (!a.submissions[0] || a.submissions[0].status === 'draft')
        );
        const overdue = assignments.filter(a =>
            new Date(a.dueDate) < now &&
            (!a.submissions[0] || a.submissions[0].status === 'draft')
        );
        const completed = assignments.filter(a =>
            a.submissions[0]?.status === 'submitted' || a.submissions[0]?.status === 'graded'
        );

        return NextResponse.json({
            assignments,
            upcoming,
            overdue,
            completed,
            stats: {
                total: assignments.length,
                upcoming: upcoming.length,
                overdue: overdue.length,
                completed: completed.length,
            },
        });
    } catch (error) {
        console.error('Failed to fetch assignments:', error);
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}
