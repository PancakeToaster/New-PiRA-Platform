import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        // Use fallback logic or check profiles
        const typedUser = user as any;
        let parentId = typedUser?.profiles?.parent;

        // Failover for test mode (if admin acting as parent)
        if (!parentId && (typedUser?.roles?.includes('Admin') || typedUser?.isTestMode)) {
            const demoProfile = await prisma.parentProfile.findFirst();
            if (demoProfile) parentId = demoProfile.id;
        }

        if (!parentId) {
            return NextResponse.json({ error: 'Parent profile not found' }, { status: 403 });
        }

        const body = await req.json();
        const { firstName, lastName, email, dateOfBirth, grade, school } = body;

        if (!firstName || !lastName || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check availability
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        // Default password for new students
        const hashedPassword = await hash('Student123!', 12);

        // Find Student Role ID
        const studentRole = await prisma.role.findUnique({ where: { name: 'Student' } });
        if (!studentRole) return NextResponse.json({ error: 'System error: Student role missing' }, { status: 500 });

        // Transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const newUser = await tx.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    roles: {
                        create: { roleId: studentRole.id }
                    }
                }
            });

            // 2. Create Student Profile
            const newProfile = await tx.studentProfile.create({
                data: {
                    userId: newUser.id,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                    grade,
                    school
                }
            });

            // 3. Link to Parent
            await tx.parentStudent.create({
                data: {
                    parentId: parentId,
                    studentId: newProfile.id
                }
            });

            return newUser;
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[ADD_STUDENT]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
