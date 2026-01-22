import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageInventory } from '@/lib/finance-permissions';

// GET: Single item detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await canManageInventory()) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const { id } = await params;

    try {
        const item = await prisma.inventoryItem.findUnique({
            where: { id },
            include: {
                expenses: { // Show purchase history using this item
                    orderBy: { date: 'desc' },
                    take: 10,
                    include: { incurredBy: true }
                }
            }
        });

        if (!item) return new NextResponse('Not Found', { status: 404 });
        return NextResponse.json(item);
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// PUT: Update item
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await canManageInventory()) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const { id } = await params;

    try {
        const body = await req.json();
        const { name, sku, category, description, quantity, location, unitCost, reorderLevel, imageUrl } = body;

        const item = await prisma.inventoryItem.update({
            where: { id },
            data: {
                name,
                sku,
                category,
                description,
                quantity: quantity !== undefined ? parseInt(quantity) : undefined,
                location,
                unitCost: unitCost !== undefined ? parseFloat(unitCost) : undefined,
                reorderLevel: reorderLevel !== undefined ? parseInt(reorderLevel) : undefined,
                imageUrl
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error('Update failed:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// DELETE: Remove item
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!await canManageInventory()) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const { id } = await params;

    try {
        await prisma.inventoryItem.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}
