import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { createRoleSchema } from '@/lib/validations/user';

export async function GET() {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const roles = await prisma.role.findMany({
      where: {
        name: {
          notIn: ['Mentor', 'Team Captain']
        }
      },
      orderBy: { name: 'asc' },
    });


    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { name, description, permissionIds } = parsed.data;

    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissionIds ? {
          create: permissionIds.map(id => ({ permissionId: id }))
        } : undefined
      },
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error('Failed to create role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
