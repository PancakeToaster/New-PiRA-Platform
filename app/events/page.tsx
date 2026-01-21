import { prisma } from '@/lib/prisma';
import PublicEventsClient from '@/components/events/PublicEventsClient';
import Footer from '@/components/layout/Footer';

export const revalidate = 0; // Ensure fresh data on every request

export default async function EventsPage() {
    const events = await prisma.calendarEvent.findMany({
        where: {
            isPublic: true
        },
        include: {
            // Include related data if needed, e.g., team name if exposed?
            // For now, just the event fields are enough
        },
        orderBy: {
            startTime: 'asc'
        }
    });

    // Transform dates to strings to ensure serializability across the boundary
    const serializedEvents = events.map(event => ({
        ...event,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime ? event.endTime.toISOString() : null,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
    }));

    return (
        <PublicEventsClient initialEvents={serializedEvents} footer={<Footer />} />
    );
}
