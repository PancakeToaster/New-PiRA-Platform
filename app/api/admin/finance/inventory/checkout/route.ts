import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// POST: Create a new checkout
export async function POST(request: NextRequest) {
    const user = await getCurrentUser();

    // For now we allow any logged in user (who is on a team) to request a checkout. 
    // Admin/Teacher check could be added if only they are allowed to approve.
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { inventoryItemId, teamId, projectId, quantity, expectedReturn, notes } = body;

        if (!inventoryItemId || !teamId || !quantity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify team membership
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } },
        });

        const userIsAdmin = user.roles.some((r: any) => r.role?.name === 'Admin' || r.role?.name === 'Teacher');

        if (!membership && !userIsAdmin) {
            return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
        }

        // Run transaction to ensure quantity is available
        const checkout = await prisma.$transaction(async (tx) => {
            const item = await tx.inventoryItem.findUnique({ where: { id: inventoryItemId } });

            if (!item) throw new Error('Item not found');
            if (item.quantity < quantity) throw new Error('Insufficient quantity in inventory');

            // Decrement global quantity
            await tx.inventoryItem.update({
                where: { id: inventoryItemId },
                data: { quantity: { decrement: quantity } }
            });

            // Create checkout record
            return tx.inventoryCheckout.create({
                data: {
                    inventoryItemId,
                    teamId,
                    projectId: projectId || null,
                    userId: user.id,
                    quantity,
                    expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
                    notes,
                    status: 'active'
                },
                include: {
                    item: true,
                    user: { select: { firstName: true, lastName: true } },
                    team: { select: { name: true } }
                }
            });
        });

        return NextResponse.json({ checkout }, { status: 201 });
    } catch (error: any) {
        console.error('Failed to checkout item:', error);
        return NextResponse.json({ error: error.message || 'Failed to checkout item' }, { status: 500 });
    }
}

// PUT: Update checkout status (e.g. Return item)
export async function PUT(request: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { checkoutId, status, notes } = body;

        if (!checkoutId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingCheckout = await prisma.inventoryCheckout.findUnique({
            where: { id: checkoutId }
        });

        if (!existingCheckout) {
            return NextResponse.json({ error: 'Checkout not found' }, { status: 404 });
        }

        // Verify perms
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId: existingCheckout.teamId, userId: user.id } },
        });
        const userIsAdmin = user.roles.some((r: any) => r.role?.name === 'Admin' || r.role?.name === 'Teacher');

        if (!membership && !userIsAdmin && existingCheckout.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized to modify this checkout' }, { status: 403 });
        }

        const updatedCheckout = await prisma.$transaction(async (tx) => {
            let updateData: any = { status };
            if (notes !== undefined) updateData.notes = notes;

            // If it's being marked returned, and wasn't returned already
            if (status === 'returned' && existingCheckout.status !== 'returned') {
                updateData.returnDate = new Date();

                // Return items to global inventory
                await tx.inventoryItem.update({
                    where: { id: existingCheckout.inventoryItemId },
                    data: { quantity: { increment: existingCheckout.quantity } }
                });
            }
            // If it was returned, but is being changed back to active
            else if (existingCheckout.status === 'returned' && status === 'active') {
                updateData.returnDate = null;

                // Take items back out of global inventory
                await tx.inventoryItem.update({
                    where: { id: existingCheckout.inventoryItemId },
                    data: { quantity: { decrement: existingCheckout.quantity } }
                });
            }

            return tx.inventoryCheckout.update({
                where: { id: checkoutId },
                data: updateData,
                include: {
                    item: true,
                    user: { select: { firstName: true, lastName: true } },
                    team: { select: { name: true } }
                }
            });
        });

        return NextResponse.json({ checkout: updatedCheckout });

    } catch (error: any) {
        console.error('Failed to update checkout:', error);
        return NextResponse.json({ error: error.message || 'Failed to update checkout' }, { status: 500 });
    }
}
