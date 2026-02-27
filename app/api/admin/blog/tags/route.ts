import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { blogTagSchema } from '@/lib/validations/blog';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tags = await prisma.blogTag.findMany({
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ tags }, { status: 200 });
    } catch (error) {
        console.error('Error fetching blog tags:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tags' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = blogTagSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
                { status: 400 }
            );
        }

        const { name } = parsed.data;

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const tag = await prisma.blogTag.create({
            data: {
                name,
                slug,
            },
        });

        return NextResponse.json({ tag }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating blog tag:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
        }
        return NextResponse.json(
            { error: 'Failed to create tag' },
            { status: 500 }
        );
    }
}
