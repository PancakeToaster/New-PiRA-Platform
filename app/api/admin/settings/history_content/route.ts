import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const setting = await prisma.siteSetting.findUnique({
            where: { key: 'history_content' },
        });

        if (!setting) {
            return NextResponse.json({ value: null });
        }

        // Parse the JSON string
        try {
            const parsedValue = JSON.parse(setting.value);
            return NextResponse.json({ value: parsedValue });
        } catch (e) {
            return NextResponse.json({ value: null });
        }
    } catch (error) {
        console.error('Failed to fetch history content:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { value } = body;

        if (!value) {
            return new NextResponse('Value is required', { status: 400 });
        }

        // Store as JSON string
        const stringValue = JSON.stringify(value);

        await prisma.siteSetting.upsert({
            where: { key: 'history_content' },
            update: {
                value: stringValue,
                type: 'json'
            },
            create: {
                key: 'history_content',
                value: stringValue,
                type: 'json',
                category: 'content'
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update history content:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
