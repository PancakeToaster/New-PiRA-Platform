import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

export async function GET() {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [invoices, totalRevenue, unpaidAmount] = await Promise.all([
      prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          parent: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          items: true,
        },
      }),
      prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { not: 'paid' } },
        _sum: { total: true },
      }),
    ]);

    const pendingCount = invoices.filter(inv => inv.status === 'unpaid').length;

    return NextResponse.json({
      invoices,
      stats: {
        total: invoices.length,
        totalRevenue: totalRevenue._sum.total || 0,
        unpaidAmount: unpaidAmount._sum.total || 0,
        pending: pendingCount,
      },
    });
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!currentUser || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { parentId, items, dueDate, notes, tax = 0 } = body;

    if (!parentId || !items || items.length === 0 || !dueDate) {
      return NextResponse.json(
        { error: 'Parent, items, and due date are required' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    });

    let invoiceNumber = 'INV-0001';
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.invoiceNumber.replace('INV-', ''), 10);
      invoiceNumber = `INV-${String(lastNum + 1).padStart(4, '0')}`;
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal + tax;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        parentId,
        dueDate: new Date(dueDate),
        subtotal,
        tax,
        total,
        notes,
        items: {
          create: items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        parent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        items: true,
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
