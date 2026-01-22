import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canViewInventory } from '@/lib/finance-permissions';

// GET: Public/Team Inventory List
export async function GET(req: NextRequest) {
    if (!await canViewInventory()) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    try {
        const whereClause: any = {};
        if (category) {
            whereClause.category = category;
        }

        // Select specific fields for public view (exclude unitCost?)
        // Usually team members might want to know cost, but let's be safe or just show it.
        // User didn't specify hiding cost, but for "inventory tracking" usually quantity/location is key.

        const items = await prisma.inventoryItem.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                sku: true,
                category: true,
                quantity: true,
                location: true,
                imageUrl: true,
                description: true,
                // Exclude unitCost and reorderLevel for general view?
                // "unitCost" is sensitive? Maybe.
            }
        });

        return NextResponse.json(items);
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 });
    }
}
