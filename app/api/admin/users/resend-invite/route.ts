
import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

function generateTempPassword(): string {
    return randomBytes(12).toString('base64url').slice(0, 12) + 'A1!';
}

export async function POST(req: Request) {
    try {
        const admin = await getCurrentUser();
        if (!admin || !admin.roles?.includes('Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await req.json();

        if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Generate cryptographically secure temp password
        const tempPassword = generateTempPassword();
        const hashedPassword = await hash(tempPassword, 12);

        // Update user
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        // TODO: Integrate real email service to send temp password to user
        // Do not log passwords — send via email only

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Resend Invite Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
