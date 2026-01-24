import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// PATCH - Batch update grades with audit logging
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const course = await prisma.lMSCourse.findUnique({
            where: { id },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        const isTeacher = user.roles?.includes('Teacher') && course.instructorId === user.id;
        const isAdmin = user.roles?.includes('Admin');

        if (!isTeacher && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { grades } = body; // Format: { studentId: { assignmentId: grade } }

        if (!grades || typeof grades !== 'object') {
            return NextResponse.json({ error: 'Invalid grades data' }, { status: 400 });
        }

        // Get request metadata for audit log
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';

        // Process grade updates in a transaction
        const updates = [];
        for (const [studentId, assignmentGrades] of Object.entries(grades)) {
            for (const [assignmentId, newGrade] of Object.entries(assignmentGrades as Record<string, number | null>)) {
                updates.push({ studentId, assignmentId, newGrade });
            }
        }

        await prisma.$transaction(async (tx) => {
            for (const { studentId, assignmentId, newGrade } of updates) {
                // Get or create submission
                const existingSubmission = await tx.assignmentSubmission.findUnique({
                    where: {
                        assignmentId_studentId: {
                            assignmentId,
                            studentId,
                        },
                    },
                });

                if (existingSubmission) {
                    // Only update if grade changed
                    if (existingSubmission.grade !== newGrade) {
                        // Update submission
                        await tx.assignmentSubmission.update({
                            where: { id: existingSubmission.id },
                            data: {
                                grade: newGrade,
                                status: newGrade !== null ? 'graded' : existingSubmission.status,
                                gradedAt: newGrade !== null ? new Date() : existingSubmission.gradedAt,
                                gradedBy: user.id,
                            },
                        });

                        // Create audit log
                        await tx.gradeAuditLog.create({
                            data: {
                                submissionId: existingSubmission.id,
                                studentId,
                                courseId: id,
                                fieldChanged: 'grade',
                                oldValue: existingSubmission.grade?.toString() || null,
                                newValue: newGrade?.toString() || null,
                                changedBy: user.id,
                                ipAddress,
                                userAgent,
                            },
                        });
                    }
                } else if (newGrade !== null) {
                    // Create new submission if grade is being set
                    const newSubmission = await tx.assignmentSubmission.create({
                        data: {
                            assignmentId,
                            studentId,
                            grade: newGrade,
                            status: 'graded',
                            gradedAt: new Date(),
                            gradedBy: user.id,
                        },
                    });

                    // Create audit log for new grade
                    await tx.gradeAuditLog.create({
                        data: {
                            submissionId: newSubmission.id,
                            studentId,
                            courseId: id,
                            fieldChanged: 'grade',
                            oldValue: null,
                            newValue: newGrade.toString(),
                            changedBy: user.id,
                            ipAddress,
                            userAgent,
                        },
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating grades:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
