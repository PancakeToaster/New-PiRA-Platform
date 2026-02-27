import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import SalaryManagementClient from '@/components/finance/SalaryManagementClient';

export const metadata = { title: 'Staff Salary Management' };

export default async function SalariesPage() {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes('Admin')) redirect('/admin');

    const [salaries, staff] = await Promise.all([
        prisma.staffSalary.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        }),
        prisma.user.findMany({
            where: { isApproved: true },
            select: { id: true, firstName: true, lastName: true, email: true },
            orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        }),
    ]);

    const serialized = salaries.map(s => ({
        ...s,
        effectiveDate: s.effectiveDate.toISOString(),
        endDate: s.endDate?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
    }));

    return <SalaryManagementClient initialSalaries={serialized as any} staffOptions={staff} />;
}
