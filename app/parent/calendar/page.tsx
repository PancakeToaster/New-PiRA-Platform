import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import ParentCalendar from '@/components/parent/ParentCalendar';

export const revalidate = 0;

export default async function ParentCalendarPage() {
    const user = await getCurrentUser();

    // 1. Fetch Parent & Students Data
    const typedUser = user as any;
    let parentId = typedUser?.profiles?.parent;

    if (!parentId && (typedUser.isTestMode || typedUser.roles.includes('Admin'))) {
        const demoProfile = await prisma.parentProfile.findFirst();
        if (demoProfile) {
            parentId = demoProfile.id;
        }
    }

    if (!parentId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
                <h2 className="text-xl font-bold text-foreground mb-2">Setup Required</h2>
                <p className="text-muted-foreground mb-4">No Parent Profile found for this user.</p>
            </div>
        );
    }

    const parentProfile = await prisma.parentProfile.findUnique({
        where: { id: parentId },
        include: {
            students: {
                include: {
                    student: {
                        include: {
                            user: {
                                include: {
                                    teamMemberships: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!parentProfile) return <div>Profile not found</div>;

    // 2. Extract Team IDs
    // Create a map to quickly look up student names by team ID so we can tag events
    const studentTeamMap = new Map<string, string[]>();

    parentProfile.students.forEach(s => {
        const studentName = `${s.student.user.firstName}`;
        s.student.user.teamMemberships.forEach(tm => {
            if (!studentTeamMap.has(tm.teamId)) {
                studentTeamMap.set(tm.teamId, []);
            }
            studentTeamMap.get(tm.teamId)!.push(studentName);
        });
    });

    const teamIds = Array.from(studentTeamMap.keys());

    // 3. Fetch Events
    const events = await prisma.calendarEvent.findMany({
        where: {
            OR: [
                { isPublic: true },
                { teamId: { in: teamIds } }
            ]
        },
        orderBy: { startTime: 'asc' }
    });

    // 4. Transform for the component
    const formattedEvents = events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startTime: e.startTime.toISOString(),
        endTime: e.endTime ? e.endTime.toISOString() : null,
        eventType: e.eventType,
        location: e.location,
        color: e.color,
        teamId: e.teamId,
        allDay: e.allDay,
        // Tag events with matching student names if it is a team event
        studentNames: e.teamId ? (studentTeamMap.get(e.teamId) || []) : [],
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Family Calendar</h1>
                <p className="text-muted-foreground mt-2">
                    View full schedule of public events and activities for your children's teams.
                </p>
            </div>

            <ParentCalendar events={formattedEvents} />
        </div>
    );
}
