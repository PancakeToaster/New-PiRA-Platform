import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { blogCategorySchema } from '@/lib/validations/blog';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const categories = await prisma.blogCategory.findMany({
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ categories }, { status: 200 });
    } catch (error) {
        console.error('Error fetching blog categories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
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
        const parsed = blogCategorySchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
                { status: 400 }
            );
        }

        const { name } = parsed.data;

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const category = await prisma.blogCategory.create({
            data: {
                name,
                slug,
            },
        });

        return NextResponse.json({ category }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating blog category:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
        }
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        );
    }
}
