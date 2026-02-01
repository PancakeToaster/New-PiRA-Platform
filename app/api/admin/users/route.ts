import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  roles: z.array(z.string()).optional(),
  dateOfBirth: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  school: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const [users, totalCount, totalStudents, totalParents, totalTeachers] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          roles: {
            where: {
              role: {
                name: { notIn: ['Mentor', 'Team Captain'] }
              }
            },
            include: {
              role: true,
            },
          },
          studentProfile: {
            include: {
              referrals: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
              referredBy: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
              parents: { include: { parent: { include: { user: { select: { firstName: true, lastName: true } } } } } },
            }
          },
          parentProfile: {
            include: {
              students: {
                include: {
                  student: {
                    include: {
                      user: { select: { firstName: true, lastName: true } },
                      _count: { select: { referrals: true } }
                    }
                  }
                }
              },
              invoices: {
                where: { status: { not: 'paid' } },
                select: { id: true, total: true, status: true, dueDate: true }
              }
            }
          },
          teacherProfile: { select: { id: true, specialization: true } },
        },
      }),
      prisma.user.count(),
      prisma.studentProfile.count(),
      prisma.parentProfile.count(),
      prisma.teacherProfile.count(),
    ]);

    return NextResponse.json({
      users,
      stats: {
        total: totalCount,
        students: totalStudents,
        parents: totalParents,
        teachers: totalTeachers,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
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
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const {
      email,
      password,
      firstName,
      lastName,
      roles: roleNames,
      dateOfBirth,
      grade,
      school,
      phone,
      address,
      bio,
      specialization,
    } = parsed.data;

    // Normalize email
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get role IDs
    const roles = await prisma.role.findMany({
      where: {
        name: {
          in: roleNames || ['Public'],
        },
      },
    });

    // Create user with roles and profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          firstName,
          lastName,
          roles: {
            create: roles.map(role => ({
              roleId: role.id,
            })),
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      // Create profile based on role
      const roleNamesList = roleNames?.map((r: string) => r.toLowerCase()) || [];

      if (roleNamesList.includes('student')) {
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            grade,
            school,
          },
        });
      }

      if (roleNamesList.includes('parent')) {
        await tx.parentProfile.create({
          data: {
            userId: user.id,
            phone,
            address,
          },
        });
      }

      if (roleNamesList.includes('teacher')) {
        await tx.teacherProfile.create({
          data: {
            userId: user.id,
            bio,
            specialization,
          },
        });
      }

      return user;
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
