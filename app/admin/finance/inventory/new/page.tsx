import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import InventoryForm from '@/components/finance/InventoryForm';

export default async function NewInventoryItemPage() {
    const user = await getCurrentUser();
    if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Teacher'))) {
        redirect('/admin');
    }

    return (
        <InventoryForm />
    );
}
