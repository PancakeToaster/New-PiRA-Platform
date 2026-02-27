import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  referralSource: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    const submission = await prisma.contactSubmission.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        referralSource: validatedData.referralSource || null,
        message: validatedData.message,
        status: 'new',
      },
    });

    try {
      await resend.emails.send({
        from: 'PiRA Platform <onboarding@resend.dev>', // Update this when you have a verified domain
        to: process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com', // Replace with your actual alert email address
        subject: `New Contact Form Submission from ${validatedData.name}`,
        html: `
          <h2>New Contact Submission</h2>
          <p><strong>Name:</strong> ${validatedData.name}</p>
          <p><strong>Email:</strong> ${validatedData.email}</p>
          <p><strong>Phone:</strong> ${validatedData.phone || 'N/A'}</p>
          <p><strong>Referral Source:</strong> ${validatedData.referralSource || 'N/A'}</p>
          <p><strong>Message:</strong></p>
          <p>${validatedData.message}</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // We still return success to the user since the submission was saved
    }

    return NextResponse.json({ success: true, id: submission.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Contact submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
