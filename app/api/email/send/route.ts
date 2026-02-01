import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { requireAdmin } from '@/lib/permissions';

export async function POST(request: NextRequest) {
    try {
        // SECURITY: Only Admins can send emails via this API
        const authResult = await requireAdmin();
        if ('error' in authResult) {
            return authResult.error;
        }

        const body = await request.json();
        const { to, subject, html, text } = body;

        if (!to || !subject || (!html && !text)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: 'Robotics Academy <onboarding@resend.dev>', // Use verified domain in production
            to: Array.isArray(to) ? to : [to],
            subject,
            html: html || undefined,
            text: text || undefined,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Failed to send email:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
