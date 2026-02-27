import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const setting = await prisma.siteSetting.findUnique({
            where: { key: 'invoice_settings' }
        });

        if (!setting) {
            return NextResponse.json({
                invoiceSettings: { defaultNotes: '' }
            });
        }

        // Parse the JSON string from the database
        let parsedValue = {};
        try {
            parsedValue = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
        } catch (e) {
            console.error('Failed to parse invoice settings:', e);
            parsedValue = { defaultNotes: '' };
        }

        return NextResponse.json({
            invoiceSettings: parsedValue
        });
    } catch (error) {
        console.error('Failed to fetch invoice settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invoice settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { defaultNotes } = body;

        // Stringify the value before saving
        const valueString = JSON.stringify({ defaultNotes });

        const setting = await prisma.siteSetting.upsert({
            where: { key: 'invoice_settings' },
            update: {
                value: valueString
            },
            create: {
                key: 'invoice_settings',
                value: valueString,
                type: 'json',
                category: 'general'
            }
        });

        return NextResponse.json({
            success: true,
            invoiceSettings: JSON.parse(setting.value)
        });
    } catch (error) {
        console.error('Failed to update invoice settings:', error);
        return NextResponse.json(
            { error: 'Failed to update invoice settings' },
            { status: 500 }
        );
    }
}
