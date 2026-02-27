import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import CertificatePDF from '@/components/certificates/CertificatePDF';

// GET /api/certificates/[code]/pdf — Login-required PDF download
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;

    try {
        const award = await prisma.studentCertificate.findUnique({
            where: { code },
            include: {
                certificate: true,
                student: {
                    select: {
                        userId: true,
                        user: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
            },
        });

        if (!award) {
            return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
        }

        // Only Admin, Teacher, or the certificate owner can download
        const isAdmin = user.roles?.includes('Admin');
        const isTeacher = user.roles?.includes('Teacher');
        const isOwner = award.student.userId === user.id;

        if (!isAdmin && !isTeacher && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const studentName = `${award.student.user?.firstName ?? ''} ${award.student.user?.lastName ?? ''}`.trim();

        const element = React.createElement(CertificatePDF, {
            studentName,
            certificateTitle: award.certificate.title,
            description: award.certificate.description ?? undefined,
            awardedAt: award.awardedAt,
            code: award.code,
        });

        // renderToBuffer expects the root Document element — CertificatePDF renders it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfBuffer = await renderToBuffer(element as any);

        const filename = `certificate-${award.code}.pdf`;
        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('[CERT_PDF_GET]', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
