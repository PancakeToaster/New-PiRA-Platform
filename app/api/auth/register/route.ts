import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      userType,
      // Student fields
      dateOfBirth,
      grade,
      school,
      // Parent fields
      childFirstName,
      childLastName,
      childAge,
      interests,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get role based on user type
    const roleName = userType === 'student' ? 'Student' : userType === 'parent' ? 'Parent' : 'Public';
    const role = await prisma.role.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Create user with profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          roles: {
            create: {
              roleId: role.id,
            },
          },
        },
      });

      // Create profile based on user type
      if (userType === 'student') {
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            grade,
            school,
          },
        });
      } else if (userType === 'parent') {
        const parentProfile = await tx.parentProfile.create({
          data: {
            userId: user.id,
            phone,
          },
        });

        // If child info was provided, create a placeholder student
        if (childFirstName && childLastName) {
          // Get student role
          const studentRole = await tx.role.findFirst({
            where: { name: 'Student' },
          });

          if (studentRole) {
            // Create child user (without password - parent manages)
            const childUser = await tx.user.create({
              data: {
                email: `${email.split('@')[0]}.child.${Date.now()}@placeholder.local`,
                password: hashedPassword, // Same as parent for now
                firstName: childFirstName,
                lastName: childLastName,
                roles: {
                  create: {
                    roleId: studentRole.id,
                  },
                },
              },
            });

            // Create student profile for child
            await tx.studentProfile.create({
              data: {
                userId: childUser.id,
                grade: childAge ? `Age ${childAge}` : null,
              },
            });

            // Link child to parent
            await tx.parentStudent.create({
              data: {
                parentId: parentProfile.id,
                studentId: (await tx.studentProfile.findUnique({ where: { userId: childUser.id } }))!.id,
              },
            });
          }
        }
      }

      // Store interests as a note or in a separate table if needed
      // For now, we'll just return success

      return user;
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
