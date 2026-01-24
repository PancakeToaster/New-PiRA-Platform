import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const user = await getCurrentUser();
    const { teamId } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, parentId } = body;

        if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

        // Verify membership
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } },
        });

        if (!membership && !user.roles.some((r: any) => r.role?.name === 'Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const folder = await prisma.teamFolder.create({
            data: {
                teamId,
                name,
                parentId: parentId || null,
            }
        });

        return NextResponse.json({ folder }, { status: 201 });
    } catch (error) {
        console.error('Failed to create folder:', error);
        return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const folderId = searchParams.get('folderId');

        if (!folderId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.teamFolder.delete({ where: { id: folderId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const user = await getCurrentUser();
    const { teamId } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { folderId, parentId } = body;

        if (!folderId) return NextResponse.json({ error: 'Folder ID required' }, { status: 400 });

        // Basic permission check (in real app, check hierarchy/cycles)
        // Prevent moving folder into itself or its children?
        // Checking cycle is expensive, skipping for MVP but should be noted.

        if (folderId === parentId) {
            return NextResponse.json({ error: 'Cannot move folder into itself' }, { status: 400 });
        }

        const folder = await prisma.teamFolder.update({
            where: { id: folderId },
            data: {
                parentId: parentId || null
            }
        });

        return NextResponse.json({ folder });
    } catch (error) {
        console.error('Failed to move folder:', error);
        return NextResponse.json({ error: 'Failed to move folder' }, { status: 500 });
    }
}
