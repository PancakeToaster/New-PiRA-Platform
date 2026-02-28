import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { generateAndSaveInvoicePdf } from '@/lib/invoice-pdf';

interface Props {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    try {
        const pdfUrl = await generateAndSaveInvoicePdf(id);

        if (!pdfUrl) {
            return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
        }

        return NextResponse.json({ success: true, pdfUrl }, { status: 200 });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json({ error: 'Failed to regenerate PDF' }, { status: 500 });
    }
}
