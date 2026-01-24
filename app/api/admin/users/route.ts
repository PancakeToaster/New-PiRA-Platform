import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

export async function GET() {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    console.log('[API_ADMIN_USERS] Unauthorized access attempt:', { user: !!user, isAdmin: userIsAdmin });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[API_ADMIN_USERS] Fetching users...');
    const [users, totalStudents, totalParents, totalTeachers] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
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
      prisma.studentProfile.count(),
      prisma.parentProfile.count(),
      prisma.teacherProfile.count(),
    ]);

    return NextResponse.json({
      users,
      stats: {
        total: users.length,
        students: totalStudents,
        parents: totalParents,
        teachers: totalTeachers,
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
    const {
      email,
      password,
      firstName,
      lastName,
      roles: roleNames,
      // Student-specific fields
      dateOfBirth,
      grade,
      school,
      // Parent-specific fields
      phone,
      address,
      // Teacher-specific fields
      bio,
      specialization,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
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
          email,
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
