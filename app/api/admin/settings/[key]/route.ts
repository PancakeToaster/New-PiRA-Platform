import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { key: string } }
) {
    try {
        const setting = await prisma.siteSetting.findUnique({
            where: { key: params.key },
        });

        if (!setting) {
            return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
        }

        return NextResponse.json({
            key: setting.key,
            value: JSON.parse(setting.value),
        });
    } catch (error) {
        console.error('Failed to fetch setting:', error);
        return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { key: string } }
) {
    try {
        const body = await request.json();
        const { value } = body;

        const setting = await prisma.siteSetting.upsert({
            where: { key: params.key },
            update: {
                value: JSON.stringify(value),
            },
            create: {
                key: params.key,
                value: JSON.stringify(value),
                type: 'json',
                category: 'general',
            },
        });

        return NextResponse.json({
            key: setting.key,
            value: JSON.parse(setting.value),
        });
    } catch (error) {
        console.error('Failed to update setting:', error);
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
}
