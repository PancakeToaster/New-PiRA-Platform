import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/logging';
import { updateUserSchema } from '@/lib/validations/user';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!currentUser || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        studentProfile: true,
        parentProfile: {
          include: {
            students: {
              include: {
                student: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true }
                    }
                  }
                }
              }
            }
          }
        },
        teacherProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!currentUser || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const {
      email,
      username,
      firstName,
      lastName,
      roleIds: roleNames,
      studentProfile,
      parentProfile,
      teacherProfile,
    } = parsed.data;

    // Separate extraction for backwards-compatibility or internal fields
    const { password, studentIds } = body;

    // Check if email is taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'This email is already in use' },
          { status: 400 }
        );
      }
    }

    // Check if username is taken
    if (username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id }
        }
      });
      if (existingUsername) {
        return NextResponse.json(
          { error: 'This username is already in use' },
          { status: 400 }
        );
      }
    }

    // Update user in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Build update data
      const updateData: Record<string, unknown> = {};
      if (email) updateData.email = email;
      if (username) updateData.username = username;
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Update basic user info
      const user = await tx.user.update({
        where: { id },
        data: updateData,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          studentProfile: true,
          parentProfile: true,
          teacherProfile: true,
        },
      });

      // Update roles if provided
      if (roleNames && Array.isArray(roleNames)) {
        // Delete existing roles
        await tx.userRole.deleteMany({
          where: { userId: id },
        });

        // Get new role IDs
        const roles = await tx.role.findMany({
          where: { name: { in: roleNames } },
        });

        // Create new role assignments
        await tx.userRole.createMany({
          data: roles.map(role => ({
            userId: id,
            roleId: role.id,
          })),
        });

        // Log role change
        await logActivity({
          userId: currentUser.id,
          action: 'user.roles.updated',
          entityType: 'User',
          entityId: id,
          details: { newRoles: roleNames },
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });
      }

      // Update profiles
      const roleNamesList = roleNames?.map((r: string) => r.toLowerCase()) || [];

      if (roleNamesList.includes('student') && studentProfile) {
        await tx.studentProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            dateOfBirth: studentProfile.dateOfBirth ? new Date(studentProfile.dateOfBirth) : null,
            grade: studentProfile.grade,
            school: studentProfile.school,
            performanceDiscount: studentProfile.performanceDiscount,
            referredById: studentProfile.referredById,
            referralSource: studentProfile.referralSource,
          },
          update: {
            dateOfBirth: studentProfile.dateOfBirth ? new Date(studentProfile.dateOfBirth) : null,
            grade: studentProfile.grade,
            school: studentProfile.school,
            performanceDiscount: studentProfile.performanceDiscount,
            referredById: studentProfile.referredById,
            referralSource: studentProfile.referralSource,
          },
        });
      }

      if (roleNamesList.includes('parent')) {
        const pProfile = await tx.parentProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            phone: parentProfile?.phone,
            address: parentProfile?.address,
          },
          update: {
            phone: parentProfile?.phone,
            address: parentProfile?.address,
          },
        });

        // Update Children Links
        if (studentIds && Array.isArray(studentIds)) {
          await tx.parentStudent.deleteMany({
            where: { parentId: pProfile.id }
          });
          if (studentIds.length > 0) {
            await tx.parentStudent.createMany({
              data: studentIds.map((sid: string) => ({
                parentId: pProfile.id,
                studentId: sid
              }))
            });
          }
        }
      }

      if (roleNamesList.includes('teacher') && teacherProfile) {
        await tx.teacherProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            bio: teacherProfile.bio,
            specialization: teacherProfile.specialization,
          },
          update: {
            bio: teacherProfile.bio,
            specialization: teacherProfile.specialization,
          },
        });
      }

      return user;
    });

    // Log profile update
    const changedFields = Object.keys(body).filter(key =>
      !['studentIds'].includes(key) // Exclude internal fields
    );

    if (changedFields.length > 0) {
      await logActivity({
        userId: currentUser.id,
        action: 'user.profile.updated',
        entityType: 'User',
        entityId: id,
        details: { fields: changedFields },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!currentUser || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Prevent self-deletion
  if (currentUser.id === id) {
    return NextResponse.json(
      { error: 'You cannot delete your own account' },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    await logActivity({
      userId: currentUser.id,
      action: 'user.deleted',
      entityType: 'User',
      entityId: id,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
