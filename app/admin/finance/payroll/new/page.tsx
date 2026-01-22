import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PayrollWizard from '@/components/finance/PayrollWizard';

export default async function NewPayrollRunPage() {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        redirect('/admin');
    }

    // Fetch active staff (Admins and Teachers)
    // We want to verify roles. 'include: { roles: true }' then filter or use WHERE.
    // Prisma where with related roles:
    const staff = await prisma.user.findMany({
        where: {
            roles: {
                some: {
                    role: {
                        name: { in: ['Admin', 'Teacher'] }
                    }
                }
            }
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
        },
        orderBy: { lastName: 'asc' }
    });

    return (
        <PayrollWizard staff={staff} />
    );
}
