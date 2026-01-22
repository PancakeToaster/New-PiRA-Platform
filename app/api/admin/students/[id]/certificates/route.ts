import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { nanoid } from 'nanoid';

// POST /api/admin/students/[id]/certificates - Award certificate to student
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
        const { certificateId } = body;

        // Verify student exists
        const student = await prisma.studentProfile.findUnique({
            where: { id },
        });
        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Verify certificate exists
        const certificate = await prisma.certificate.findUnique({
            where: { id: certificateId },
        });
        if (!certificate) {
            return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
        }

        // Check if already awarded
        const existingAward = await prisma.studentCertificate.findUnique({
            where: {
                studentId_certificateId: {
                    studentId: id,
                    certificateId,
                },
            },
        });

        if (existingAward) {
            return NextResponse.json({ error: 'Student already has this certificate' }, { status: 400 });
        }

        // Generate unique code (e.g. CERT-YEAR-RANDOM)
        const year = new Date().getFullYear();
        const uniqueCode = `CERT-${year}-${nanoid(8).toUpperCase()}`;

        // Award certificate
        const award = await prisma.studentCertificate.create({
            data: {
                studentId: id,
                certificateId,
                awardedBy: currentUser.id,
                code: uniqueCode,
            },
        });

        return NextResponse.json({ award });
    } catch (error) {
        console.error('Failed to award certificate:', error);
        return NextResponse.json({ error: 'Failed to award certificate' }, { status: 500 });
    }
}
