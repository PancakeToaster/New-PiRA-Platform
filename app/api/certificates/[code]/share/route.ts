import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { nanoid } from 'nanoid';

const SHARE_DURATIONS: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

// POST /api/certificates/[code]/share — Generate a time-limited share token (Admin only)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user.roles?.includes('Admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { code } = await params;
    const { duration = '7d' } = await request.json().catch(() => ({}));

    const durationMs = SHARE_DURATIONS[duration] ?? SHARE_DURATIONS['7d'];
    const shareExpiresAt = new Date(Date.now() + durationMs);
    const shareToken = nanoid(32);

    try {
        const award = await prisma.studentCertificate.update({
            where: { code },
            data: { shareToken, shareExpiresAt },
        });

        const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/certificates/verify?token=${shareToken}`;
        return NextResponse.json({
            shareToken,
            shareExpiresAt,
            shareUrl,
        });
    } catch (error) {
        console.error('[CERT_SHARE_POST]', error);
        return NextResponse.json({ error: 'Failed to generate share link' }, { status: 500 });
    }
}

// DELETE /api/certificates/[code]/share — Revoke share token (Admin only)
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user.roles?.includes('Admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { code } = await params;

    try {
        await prisma.studentCertificate.update({
            where: { code },
            data: { shareToken: null, shareExpiresAt: null },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[CERT_SHARE_DELETE]', error);
        return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 });
    }
}
