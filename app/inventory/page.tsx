import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { canViewInventory } from '@/lib/finance-permissions';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import InventoryViewer from '@/components/finance/InventoryViewer';
import { Boxes } from 'lucide-react';

export default async function InventoryPage() {
    const isAllowed = await canViewInventory();
    if (!isAllowed) {
        redirect('/');
    }

    // Fetch items directly
    const items = await prisma.inventoryItem.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            quantity: true,
            location: true,
            imageUrl: true,
            description: true
        }
    });

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Boxes className="w-8 h-8 text-sky-600" />
                    Team Inventory
                </h1>
                <p className="text-gray-500 mt-2">
                    Browse available hardware and assets. Contact a lead for access to restricted items.
                </p>
            </div>

            <InventoryViewer initialItems={items} />
        </div>
    );
}
