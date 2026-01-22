import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ExpenseForm from '@/components/finance/ExpenseForm';

export default async function NewExpensePage() {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        redirect('/admin');
    }

    // Fetch dropdown data
    const [projects, inventoryItems] = await Promise.all([
        prisma.project.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
        prisma.inventoryItem.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    ]);

    return (
        <ExpenseForm
            projects={projects}
            inventoryItems={inventoryItems}
        />
    );
}
