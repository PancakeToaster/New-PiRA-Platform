import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create permissions
  const permissions = [
    // Public
    { resource: 'page', action: 'view', description: 'View public pages' },
    { resource: 'page', action: 'edit', description: 'Edit public pages' },
    { resource: 'blog', action: 'view', description: 'View blog posts' },
    { resource: 'blog', action: 'create', description: 'Create blog posts' },
    { resource: 'blog', action: 'edit', description: 'Edit blog posts' },
    { resource: 'blog', action: 'delete', description: 'Delete blog posts' },
    { resource: 'blog', action: 'comment', description: 'Comment on blog posts' },
    { resource: 'course', action: 'view', description: 'View courses' },
    { resource: 'course', action: 'manage', description: 'Manage courses' },
    { resource: 'activity', action: 'view', description: 'View activities' },
    { resource: 'activity', action: 'manage', description: 'Manage activities' },

    // Invoices
    { resource: 'invoice', action: 'view_own', description: 'View own invoices' },
    { resource: 'invoice', action: 'view_all', description: 'View all invoices' },
    { resource: 'invoice', action: 'create', description: 'Create invoices' },
    { resource: 'invoice', action: 'edit', description: 'Edit invoices' },
    { resource: 'invoice', action: 'delete', description: 'Delete invoices' },

    // LMS
    { resource: 'knowledge', action: 'view', description: 'View knowledge base' },
    { resource: 'knowledge', action: 'create', description: 'Create knowledge nodes' },
    { resource: 'knowledge', action: 'edit', description: 'Edit knowledge nodes' },
    { resource: 'knowledge', action: 'delete', description: 'Delete knowledge nodes' },
    { resource: 'assignment', action: 'view_own', description: 'View own assignments' },
    { resource: 'assignment', action: 'view_all', description: 'View all assignments' },
    { resource: 'assignment', action: 'create', description: 'Create assignments' },
    { resource: 'assignment', action: 'grade', description: 'Grade assignments' },
    { resource: 'assignment', action: 'submit', description: 'Submit assignments' },
    { resource: 'progress', action: 'view_own', description: 'View own progress' },
    { resource: 'progress', action: 'view_linked', description: 'View linked student progress' },
    { resource: 'progress', action: 'view_all', description: 'View all student progress' },

    // Users
    { resource: 'user', action: 'view_all', description: 'View all users' },
    { resource: 'user', action: 'create', description: 'Create users' },
    { resource: 'user', action: 'edit', description: 'Edit users' },
    { resource: 'user', action: 'delete', description: 'Delete users' },
    { resource: 'role', action: 'manage', description: 'Manage roles and permissions' },

    // Analytics
    { resource: 'analytics', action: 'view', description: 'View analytics dashboard' },
    { resource: 'system', action: 'monitor', description: 'View system monitoring' },
    { resource: 'system', action: 'manage', description: 'Manage system settings' },
  ];

  console.log('📝 Creating permissions...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: {},
      create: perm,
    });
  }

  // Create system roles
  const publicRole = await prisma.role.upsert({
    where: { name: 'Public' },
    update: {},
    create: {
      name: 'Public',
      description: 'Public users (not logged in)',
      isSystem: true,
    },
  });

  const parentRole = await prisma.role.upsert({
    where: { name: 'Parent' },
    update: {},
    create: {
      name: 'Parent',
      description: 'Parent users who can view invoices and student progress',
      isSystem: true,
    },
  });

  const studentRole = await prisma.role.upsert({
    where: { name: 'Student' },
    update: {},
    create: {
      name: 'Student',
      description: 'Students who can access the LMS',
      isSystem: true,
    },
  });

  const teacherRole = await prisma.role.upsert({
    where: { name: 'Teacher' },
    update: {},
    create: {
      name: 'Teacher',
      description: 'Teachers who can create content and manage students',
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Administrators with full system access',
      isSystem: true,
    },
  });

  console.log('🔐 Assigning permissions to roles...');

  // Public role permissions
  const publicPermissions = ['page:view', 'blog:view', 'course:view', 'activity:view'];
  await assignPermissions(publicRole.id, publicPermissions);

  // Parent role permissions
  const parentPermissions = [
    'page:view', 'blog:view', 'blog:comment', 'course:view', 'activity:view',
    'invoice:view_own', 'progress:view_linked',
  ];
  await assignPermissions(parentRole.id, parentPermissions);

  // Student role permissions
  const studentPermissions = [
    'page:view', 'blog:view', 'blog:comment', 'course:view', 'activity:view',
    'knowledge:view', 'assignment:view_own', 'assignment:submit', 'progress:view_own',
  ];
  await assignPermissions(studentRole.id, studentPermissions);

  // Teacher role permissions
  const teacherPermissions = [
    'page:view', 'blog:view', 'blog:comment', 'course:view', 'activity:view',
    'knowledge:view', 'knowledge:create', 'knowledge:edit', 'knowledge:delete',
    'assignment:view_all', 'assignment:create', 'assignment:grade',
    'progress:view_all',
  ];
  await assignPermissions(teacherRole.id, teacherPermissions);

  // Admin role - all permissions
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@roboticsacademy.com' },
    update: {},
    create: {
      email: 'admin@roboticsacademy.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // Create sample pages
  console.log('📄 Creating sample pages...');
  const pages = [
    {
      slug: 'home',
      title: 'Welcome to Robotics Academy',
      content: '<h1>Welcome to Robotics Academy</h1><p>Empowering the next generation of innovators through hands-on robotics education.</p>',
      isDraft: false,
      publishedAt: new Date(),
    },
    {
      slug: 'about',
      title: 'About Us',
      content: '<h1>About Us</h1><p>Learn about our mission, vision, and the team behind Robotics Academy.</p>',
      isDraft: false,
      publishedAt: new Date(),
    },
    {
      slug: 'contact',
      title: 'Contact Us',
      content: '<h1>Contact Us</h1><p>Get in touch with us for more information about our programs.</p>',
      isDraft: false,
      publishedAt: new Date(),
    },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log('\n📧 Default admin credentials:');
  console.log('   Email: admin@roboticsacademy.com');
  console.log('   Password: admin123');
  console.log('\n⚠️  Please change the admin password after first login!\n');
}

async function assignPermissions(roleId: string, permissionStrings: string[]) {
  for (const permStr of permissionStrings) {
    const [resource, action] = permStr.split(':');
    const permission = await prisma.permission.findUnique({
      where: { resource_action: { resource, action } },
    });

    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId: permission.id,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
