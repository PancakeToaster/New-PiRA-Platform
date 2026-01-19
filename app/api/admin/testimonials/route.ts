import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, content, rating, isActive } = body;

    // Get the highest order number and add 1
    const maxOrder = await prisma.testimonial.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        role,
        content,
        rating: parseInt(rating),
        isActive,
        order: (maxOrder?.order ?? 0) + 1,
      },
    });

    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error) {
    console.error('Failed to create testimonial:', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
