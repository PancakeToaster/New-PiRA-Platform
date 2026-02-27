import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { z } from 'zod';

function generateTempPassword(): string {
  return randomBytes(12).toString('base64url').slice(0, 12) + 'A1!';
}

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  userType: z.enum(['student', 'parent', 'public']).default('public'),
  dateOfBirth: z.string().optional(),
  grade: z.string().optional().nullable(),
  school: z.string().optional().nullable(),
  childFirstName: z.string().optional(),
  childLastName: z.string().optional(),
  childEmail: z.string().email().optional().nullable(),
  childAge: z.union([z.string(), z.number()]).optional().nullable(),
  childDateOfBirth: z.string().optional().nullable(),
  interests: z.array(z.string()).optional(),
  referralSource: z.string().optional(),
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional().nullable(),
  parentPhone: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      userType,
      dateOfBirth,
      grade,
      school,
      childFirstName,
      childLastName,
      childEmail,
      childAge,
      childDateOfBirth,
      interests,
      referralSource,
    } = parsed.data;

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
      let generatedChildTempPassword: string | undefined;

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
            referralSource: referralSource || null,
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
            const tempPassword = generateTempPassword();
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
            // TODO: Integrate real email service to send temp password to parent
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

            // Generate a separate password for the child account
            generatedChildTempPassword = generateTempPassword();
            const hashedChildPassword = await bcrypt.hash(generatedChildTempPassword, 10);

            const childUser = await tx.user.create({
              data: {
                email: finalChildEmail,
                username: finalUsername,
                password: hashedChildPassword,
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
                referralSource: referralSource || null,
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

      return { user, childUsername: generatedChildUsername, childTempPassword: generatedChildTempPassword };
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
          tempPassword: result.childTempPassword,
          info: 'Please save this username and temporary password for your child to log in.'
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
