import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageInventory } from '@/lib/finance-permissions';
import { updateInventoryItemSchema } from '@/lib/validations/inventory';

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
        const parsed = updateInventoryItemSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
                { status: 400 }
            );
        }

        const { name, sku, category, description, quantity, location, unitCost, reorderLevel, imageUrl } = parsed.data;

        const item = await prisma.inventoryItem.update({
            where: { id },
            data: {
                name,
                sku,
                category,
                description,
                quantity,
                location,
                unitCost,
                reorderLevel,
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
