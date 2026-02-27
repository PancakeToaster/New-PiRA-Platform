import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';

export async function GET(
    request: NextRequest,
    { params }: { params: { key: string } }
) {
    try {
        const setting = await prisma.siteSetting.findUnique({
            where: { key: params.key },
        });

        if (!setting) {
            // Try to get default value
            // We use getSetting from lib/settings which handles defaults
            // But getSetting is async and might look up DB again. 
            // However, we know it's missing here. 
            // We can just rely on getSetting to do the right thing (it returns default if missing)
            // Or we can import defaultSettings directly but it's not exported.

            // Let's use getSetting which encapsulates the fallback logic
            // Note: casting key to any because params.key is string but getSetting expects keyof SiteSettings
            const value = await getSetting(params.key as any);

            // If we got a value back (default or otherwise), return it
            if (value !== undefined) {
                return NextResponse.json({
                    key: params.key,
                    value: value,
                });
            }

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
