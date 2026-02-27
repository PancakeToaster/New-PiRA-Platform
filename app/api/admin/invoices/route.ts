import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { createInvoiceSchema } from '@/lib/validations/finance';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    const whereClause = parentId ? { parentId } : {};

    const [invoices, totalRevenue, unpaidAmount] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
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
      // Only aggregate stats if fetching all invoices (no filter), mostly for dashboard accuracy
      // Can also aggregate for user if needed, but current dashboard expects global stats
      !parentId ? prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { total: true },
      }) : Promise.resolve({ _sum: { total: 0 } }),
      !parentId ? prisma.invoice.aggregate({
        where: { status: { not: 'paid' } },
        _sum: { total: true },
      }) : Promise.resolve({ _sum: { total: 0 } }),
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
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { parentId, items, dueDate, notes, tax = 0 } = parsed.data;

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
          create: items.map((item: { description: string; quantity: number; unitPrice: number; studentId?: string | null; courseId?: string | null }) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            studentId: item.studentId || null,
            courseId: item.courseId || null,
          })),
        },
        installments: {
          create: body.installments?.map((inst: { amount: number; dueDate: string }) => ({
            amount: inst.amount,
            dueDate: new Date(inst.dueDate),
            status: 'unpaid'
          })) || []
        }
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
