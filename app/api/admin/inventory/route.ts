import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageInventory } from '@/lib/finance-permissions';

// GET: List all inventory items
export async function GET(req: NextRequest) {
    if (!await canManageInventory()) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    try {
        const whereClause: any = {};
        if (category) {
            whereClause.category = category;
        }

        const items = await prisma.inventoryItem.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { expenses: true }
                }
            }
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error('Failed to fetch inventory:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST: Create new item
export async function POST(req: NextRequest) {
    if (!await canManageInventory()) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, sku, category, description, quantity, location, unitCost, reorderLevel, imageUrl } = body;

        const item = await prisma.inventoryItem.create({
            data: {
                name,
                sku,
                category,
                description,
                quantity: parseInt(quantity || '0'),
                location,
                unitCost: unitCost ? parseFloat(unitCost) : null,
                reorderLevel: parseInt(reorderLevel || '5'),
                imageUrl
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error('Failed to create inventory item:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
