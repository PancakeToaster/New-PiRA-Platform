import { redirect } from 'next/navigation';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import ContactsClient from './ContactsClient';

export const metadata = {
    title: 'Contact CRM - PiRA Platform',
};

export default async function ContactsAdminPage() {
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user || !userIsAdmin) {
        redirect('/login');
    }

    // Fetch all contact submissions
    const submissions = await prisma.contactSubmission.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Contact CRM</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage leads and incoming contact form submissions.
                    </p>
                </div>
            </div>

            <ContactsClient initialSubmissions={submissions} />
        </div>
    );
}
