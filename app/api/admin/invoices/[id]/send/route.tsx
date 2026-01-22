
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasRole } from '@/lib/permissions';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '@/components/invoices/InvoicePDF';

const resend = new Resend(process.env.RESEND_API_KEY);

interface Props {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
    const { id } = await params;
    const user = await getCurrentUser();

    // Only admins should be able to trigger invoice emails manually
    const isAdmin = await hasRole('Admin');
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                items: true,
                parent: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const parentEmail = invoice.parent.user.email;
        if (!parentEmail) {
            return NextResponse.json({ error: 'Parent email not found' }, { status: 400 });
        }

        // Generate PDF Buffer
        const pdfBuffer = await renderToBuffer(<InvoicePDF invoice={ invoice } />);

        // Send Email
        const { data, error } = await resend.emails.send({
            from: 'PiRA <finance@playideasny.com>', // Or a configured domain
            to: [parentEmail],
            subject: `Invoice ${invoice.invoiceNumber} from Playideas Robotics Academy`,
            html: `
                <p>Dear ${invoice.parent.user.firstName},</p>
                <p>Please find attached your invoice <strong>${invoice.invoiceNumber}</strong> due on ${new Date(invoice.dueDate).toLocaleDateString()}.</p>
                <p>Total: $${invoice.total.toFixed(2)}</p>
                <p>Thank you,<br/>Playideas Robotics Academy</p>
            `,
            attachments: [
                {
                    filename: `Invoice_${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        if (error) {
            console.error('Resend Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Email Send Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
