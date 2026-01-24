const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);

    const courseCount = await prisma.course.count();
    console.log('Course count:', courseCount);

    // Check if lMSCourse model is accessible
    if (prisma.lMSCourse) {
      const lmsCourseCount = await prisma.lMSCourse.count();
      console.log('LMSCourse count:', lmsCourseCount);
    } else {
      console.log('prisma.lMSCourse property is undefined!');
      console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    }

    const roles = await prisma.role.findMany();
    console.log('Roles found:', roles.length, roles.map(r => r.name));

    const knowledgeNodeCount = await prisma.knowledgeNode.count();
    console.log('KnowledgeNode count:', knowledgeNodeCount);

    if (knowledgeNodeCount > 0) {
      const publishedCount = await prisma.knowledgeNode.count({ where: { isPublished: true } });
      console.log('Published KnowledgeNode count:', publishedCount);
    }

    const users = await prisma.user.findMany({
      take: 1,
      include: { roles: { include: { role: true } } }
    });
    console.log('First user sample:', JSON.stringify(users[0], null, 2));

  } catch (e) {
    console.error('Connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
