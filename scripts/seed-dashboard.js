
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data...');

    // 1. Create System Announcement
    const admin = await prisma.user.findFirst({ where: { roles: { some: { role: { name: 'Admin' } } } } });

    if (admin) {
        await prisma.announcement.create({
            data: {
                title: 'Welcome to the New Parent Portal!',
                content: '<p>We are excited to launch the new dashboard. Check here for updates.</p>',
                type: 'system',
                isActive: true,
                authorId: admin.id
            }
        });
        console.log('Created System Announcement');
    } else {
        console.log('No Admin found to author announcement');
    }

    // 2. Create an Event for today
    const parent = await prisma.parentProfile.findFirst();
    // Find a student of this parent?
    // Just create a public event
    await prisma.calendarEvent.create({
        data: {
            title: 'School Assembly',
            description: 'General assembly for all',
            eventType: 'school_event',
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000),
            isPublic: true,
            createdById: admin ? admin.id : (await prisma.user.findFirst()).id
        }
    });
    console.log('Created Public Event');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
