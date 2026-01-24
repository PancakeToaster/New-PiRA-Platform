const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const admin = await prisma.user.findFirst({
            where: { email: { contains: 'admin' } }
        });

        if (!admin) {
            console.log('No admin user found to author the wiki page.');
            return;
        }

        const slug = 'welcome-to-wiki-seed-' + Date.now();
        console.log('Creating wiki page with slug:', slug);

        const wikiPage = await prisma.knowledgeNode.create({
            data: {
                title: 'Welcome to the Wiki',
                slug: slug,
                content: '# Welcome\n\nThis is a sample wiki page to verify the system is working.',
                nodeType: 'document',
                isPublished: true,
                authorId: admin.id,
            },
        });
        console.log('Created wiki page:', wikiPage.id);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
