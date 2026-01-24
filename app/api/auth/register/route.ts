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
      childEmail,
      childAge,
      childDateOfBirth,
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
    const result = await prisma.$transaction(async (tx) => {
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

      let generatedChildUsername: string | undefined;

      // Create profile based on user type
      if (userType === 'student') {
        const { parentName, parentEmail, parentPhone } = body;

        // 1. Create Student Profile
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            grade,
            school,
          },
        });

        // 2. Handle Parent (Logic simplified for brevity, keeping existing)
        if (parentEmail) {
          // ... existing parent linking logic could go here or remain if untouched ...
          // For safety in this replacement, I'll include the logic but concise
          const parentEmailLower = parentEmail.toLowerCase();
          let parentId: string | null = null;

          const existingParent = await tx.user.findUnique({
            where: { email: parentEmailLower },
            include: { parentProfile: true }
          });

          if (existingParent) {
            if (existingParent.parentProfile) {
              parentId = existingParent.parentProfile.id;
            } else {
              const pp = await tx.parentProfile.create({ data: { userId: existingParent.id } });
              parentId = pp.id;
            }
          } else {
            const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
            const hashedParentPassword = await bcrypt.hash(tempPassword, 10);
            const newParent = await tx.user.create({
              data: {
                email: parentEmailLower,
                password: hashedParentPassword,
                firstName: parentName || 'Parent',
                lastName: '',
                roles: {
                  create: { roleId: (await tx.role.findFirst({ where: { name: 'Parent' } }))!.id }
                }
              }
            });
            const pp = await tx.parentProfile.create({ data: { userId: newParent.id, phone: parentPhone } });
            parentId = pp.id;
            // Log temp password for dev
            console.log(`[EMAIL] Parent Created. TempPass: ${tempPassword}`);
          }

          if (parentId) {
            const studentProfileId = (await tx.studentProfile.findUnique({ where: { userId: user.id } }))!.id;
            const existingLink = await tx.parentStudent.findUnique({ where: { parentId_studentId: { parentId, studentId: studentProfileId } } });
            if (!existingLink) {
              await tx.parentStudent.create({ data: { parentId, studentId: studentProfileId } });
            }
          }
        }

      } else if (userType === 'parent') {
        const parentProfile = await tx.parentProfile.create({
          data: {
            userId: user.id,
            phone,
          },
        });

        // If child info was provided, create a placeholder student
        if (childFirstName && childLastName) {
          const studentRole = await tx.role.findFirst({ where: { name: 'Student' } });

          if (studentRole) {
            let finalChildEmail = childEmail;
            let finalUsername = undefined;

            if (finalChildEmail) {
              finalChildEmail = finalChildEmail.toLowerCase();
              const existingChild = await tx.user.findUnique({ where: { email: finalChildEmail } });
              if (existingChild) throw new Error(`Child email '${finalChildEmail}' is already registered`);
            } else {
              // Placeholder email
              finalChildEmail = `${email.split('@')[0]}.child.${Date.now()}@placeholder.local`.toLowerCase();

              // Generate Username if no email
              let baseUsername = `${childFirstName}.${childLastName}`.toLowerCase().replace(/[^a-z0-9.]/g, '');
              let usernameToCheck = baseUsername;
              let counter = 1;
              while (await tx.user.findUnique({ where: { username: usernameToCheck } })) {
                usernameToCheck = `${baseUsername}${counter}`;
                counter++;
              }
              finalUsername = usernameToCheck;
              generatedChildUsername = finalUsername;
            }

            const childUser = await tx.user.create({
              data: {
                email: finalChildEmail,
                username: finalUsername,
                password: hashedPassword,
                firstName: childFirstName,
                lastName: childLastName,
                roles: {
                  create: {
                    roleId: studentRole.id,
                  },
                },
              },
            });

            await tx.studentProfile.create({
              data: {
                userId: childUser.id,
                grade: childAge ? `Age ${childAge}` : null,
                dateOfBirth: childDateOfBirth ? new Date(childDateOfBirth) : undefined,
              },
            });

            await tx.parentStudent.create({
              data: {
                parentId: parentProfile.id,
                studentId: (await tx.studentProfile.findUnique({ where: { userId: childUser.id } }))!.id,
              },
            });
          }
        }
      }

      return { user, childUsername: generatedChildUsername };
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        child: result.childUsername ? {
          username: result.childUsername,
          info: 'Please save this username for your child to log in.'
        } : undefined
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
