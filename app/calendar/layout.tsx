import { getCurrentUser } from '@/lib/permissions';
import CalendarAppShell from '@/components/calendar/CalendarAppShell';

export default async function CalendarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    return (
        <CalendarAppShell user={user}>
            {children}
        </CalendarAppShell>
    );
}
