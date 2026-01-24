const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('Keys on prisma:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
// Check for variants of LMSCourse
const props = Object.getOwnPropertyNames(prisma); // or just loop keys
// Prisma adds models as getters, so they are keys
console.log('lMSCourse exists:', 'lMSCourse' in prisma);
console.log('lmsCourse exists:', 'lmsCourse' in prisma);
console.log('LMSCourse exists:', 'LMSCourse' in prisma);
