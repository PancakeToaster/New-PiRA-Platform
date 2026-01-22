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

  const mentorRole = await prisma.role.upsert({
    where: { name: 'Mentor' },
    update: {},
    create: {
      name: 'Mentor',
      description: 'Mentors who guide project teams',
      isSystem: true,
    },
  });

  const teamCaptainRole = await prisma.role.upsert({
    where: { name: 'Team Captain' },
    update: {},
    create: {
      name: 'Team Captain',
      description: 'Student leaders of project teams',
      isSystem: true,
    },
  });

  const teamMemberRole = await prisma.role.upsert({
    where: { name: 'Team Member' },
    update: {},
    create: {
      name: 'Team Member',
      description: 'Members of project teams',
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
      content: `<h2>Welcome to PLAYIDEAs Robotics Academy</h2>
<p>At PLAYIDEAs, we believe that <strong>play is the key to infinite potential</strong>. Our mission is to create transformative learning experiences that inspire creativity and innovation in young minds.</p>
<h3>Our Story</h3>
<p>With over 10 years of competitive robotics education experience, we have helped countless students develop their skills in robotics, programming, and STEM education through hands-on learning experiences and competitive opportunities.</p>
<p>We are leaders in digital business, helping companies of all sizes to thrive in an ever-changing landscape while engaging students through hands-on learning with expertise in robotics and STEM education.</p>
<h3>What Makes Us Different</h3>
<ul>
<li><strong>Hands-On Learning:</strong> Students learn by doing, building real robots and solving real problems</li>
<li><strong>Competition Ready:</strong> We prepare teams for VEX, FLL, and other major robotics competitions</li>
<li><strong>Expert Instructors:</strong> Our team brings decades of combined experience in robotics and education</li>
<li><strong>Proven Results:</strong> Our students have won regional and national championships</li>
</ul>`,
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

  // Create sample blog posts
  console.log('📝 Creating sample blog posts...');
  const blogPosts = [
    {
      slug: 'welcome-to-our-new-platform',
      title: 'Welcome to Our New Platform!',
      excerpt: 'We are excited to announce the launch of our new robotics academy platform with enhanced features for students, parents, and teachers.',
      content: `<h2>A New Era of Robotics Education</h2>
<p>We are thrilled to announce the launch of our brand new platform designed to enhance the learning experience for all our students, streamline communication with parents, and provide powerful tools for our instructors.</p>
<h3>What's New?</h3>
<ul>
<li><strong>Interactive Learning Management System:</strong> Access course materials, submit assignments, and track your progress all in one place</li>
<li><strong>Parent Portal:</strong> Parents can now easily view invoices, track their child's progress, and stay connected with our academy</li>
<li><strong>Real-Time Updates:</strong> Get instant notifications about upcoming competitions, events, and important announcements</li>
<li><strong>Project Management Tools:</strong> Competition teams can collaborate more effectively with our new project management features</li>
</ul>
<p>This platform represents our commitment to providing the best possible educational experience. We look forward to seeing how it helps our students achieve even greater success!</p>`,
      isDraft: false,
      publishedAt: new Date(),
    },
    {
      slug: 'preparing-for-vex-competition',
      title: 'Preparing for the VEX Competition Season',
      excerpt: 'Tips and strategies for teams getting ready for this year\'s VEX Robotics Competition.',
      content: `<h2>Competition Season is Here!</h2>
<p>The VEX Robotics Competition season is upon us, and our teams are working hard to prepare. Here are some key strategies we're focusing on this year.</p>
<h3>Build Phase Essentials</h3>
<ol>
<li><strong>Understand the Game:</strong> Study the game manual thoroughly and watch reveal videos</li>
<li><strong>Prototype Early:</strong> Test different mechanisms before committing to a final design</li>
<li><strong>Document Everything:</strong> Keep an engineering notebook with detailed notes and sketches</li>
<li><strong>Practice, Practice, Practice:</strong> Driver practice is just as important as building</li>
</ol>
<h3>Team Collaboration</h3>
<p>Success in VEX requires strong teamwork. Our teams are using the new project management tools on this platform to coordinate tasks, track progress, and communicate effectively.</p>
<p>Good luck to all our teams this season! We can't wait to see what you accomplish.</p>`,
      isDraft: false,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  ];

  for (const post of blogPosts) {
    await prisma.blog.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }


  // Seed Site Settings (Company Info, Services, Learning Process)
  console.log('⚙️  Creating site settings...');

  const companyInfoData = {
    name: 'PLAYIDEAs',
    altName: 'PiRA',
    tagline: 'No Limits, Just Imagination',
    mission: 'Creating transformative learning experiences that inspire creativity and innovation',
    vision: 'Play is the key to Infinite Potential',
    description: 'Leader in digital business, helping companies of all sizes to thrive in an ever-changing landscape. Engaging students through hands-on learning with expertise in robotics and STEM education spanning over a decade.',
    yearsFounded: '10+ Years of Competitive Robotics Education',
    contact: {
      phone: '+1 917-285-5226',
      email: 'info@playideasny.com',
      address: {
        street: '99 Jericho Turnpike, Suite 305',
        city: 'Jericho',
        state: 'NY',
        zip: '11753',
        country: 'United States',
      },
    },
  };

  await prisma.siteSetting.upsert({
    where: { key: 'company_info' },
    update: { value: JSON.stringify(companyInfoData) },
    create: {
      key: 'company_info',
      value: JSON.stringify(companyInfoData),
      type: 'json',
      category: 'general',
    },
  });

  const servicesData = [
    {
      id: '1',
      title: 'Educational Excellence',
      description: 'Digital business leadership for organizational growth and transformation.',
      icon: '🎓',
    },
    {
      id: '2',
      title: 'Robotics Education',
      description: 'Interactive programs and workshops with documented student success globally.',
      icon: '🤖',
    },
    {
      id: '3',
      title: 'Competitive Robotics',
      description: '10+ years of competitive robotics education preparing students for challenges.',
      icon: '⚡',
    },
    {
      id: '4',
      title: 'Hands-On Learning',
      description: 'Engaging students through hands-on learning experiences in robotics and STEM.',
      icon: '✋',
    },
  ];

  await prisma.siteSetting.upsert({
    where: { key: 'services_list' },
    update: { value: JSON.stringify(servicesData) },
    create: {
      key: 'services_list',
      value: JSON.stringify(servicesData),
      type: 'json',
      category: 'general',
    },
  });

  const learningProcessData = [
    {
      id: '1',
      step: 1,
      title: 'Design',
      description: 'Students learn to conceptualize and design robotic solutions to real-world problems.',
      icon: '🎨',
    },
    {
      id: '2',
      step: 2,
      title: 'Build',
      description: 'Hands-on construction of robots using industry-standard components and tools.',
      icon: '🔧',
    },
    {
      id: '3',
      step: 3,
      title: 'Code',
      description: 'Programming robots using languages like Python, C++, and block-based coding.',
      icon: '💻',
    },
    {
      id: '4',
      step: 4,
      title: 'Compete',
      description: 'Apply learned skills in competitive robotics tournaments and challenges.',
      icon: '🏆',
    },
  ];

  await prisma.siteSetting.upsert({
    where: { key: 'learning_process' },
    update: { value: JSON.stringify(learningProcessData) },
    create: {
      key: 'learning_process',
      value: JSON.stringify(learningProcessData),
      type: 'json',
      category: 'general',
    },
  });

  // Seed Public Staff
  console.log('👥 Creating public staff members...');
  const staffMembers = [
    {
      name: 'Barry Chuang',
      role: 'CEO',
      bio: 'Expert in robotics and STEM education, combined decades of experience leading transformative learning programs.',
      email: 'barry@playideasny.com',
      displayOrder: 1,
    },
    {
      name: 'Raymond Zhang',
      role: 'Director',
      bio: 'Veteran in robotics competitions ensuring student resource access and educational excellence.',
      email: 'raymond@playideasny.com',
      displayOrder: 2,
    },
    {
      name: 'William Zhang',
      role: 'Teacher',
      bio: 'Dedicated coach helping students develop robotics and programming skills through hands-on instruction.',
      email: 'william@playideasny.com',
      displayOrder: 3,
    },
  ];

  for (const staff of staffMembers) {
    const existing = await prisma.publicStaff.findFirst({
      where: { email: staff.email },
    });

    if (!existing) {
      await prisma.publicStaff.create({ data: staff });
    }
  }

  // Seed Testimonials
  console.log('💬 Creating testimonials...');
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Parent',
      content: 'My daughter has grown so much in confidence and technical skills since joining PLAYIDEAs. The instructors are patient and knowledgeable.',
      rating: 5,
      order: 1,
    },
    {
      name: 'Michael Rodriguez',
      role: 'Student',
      content: 'The competition training helped our team win the regional championship. Best robotics program I\'ve been part of!',
      rating: 5,
      order: 2,
    },
    {
      name: 'Jennifer Park',
      role: 'Parent',
      content: 'Excellent curriculum and facilities. My son looks forward to every class and has learned so much about engineering.',
      rating: 5,
      order: 3,
    },
  ];

  for (const testimonial of testimonials) {
    // Use name + role as unique identifier
    const existing = await prisma.testimonial.findFirst({
      where: { name: testimonial.name, role: testimonial.role },
    });

    if (!existing) {
      await prisma.testimonial.create({ data: testimonial });
    }
  }

  // Seed Courses
  console.log('📚 Creating courses...');
  const courses = [
    {
      name: 'Introduction to Robotics',
      slug: 'intro-to-robotics',
      description: 'Perfect for beginners! Learn the fundamentals of robotics through hands-on projects and interactive lessons. Students will design, build, and program their first robot.',
      level: 'Beginner',
      ageRange: '8-12 years',
      duration: '12 weeks',
      price: 450,
      topics: ['Basic Mechanics', 'Simple Programming', 'Robot Design', 'Team Collaboration'],
      isActive: true,
    },
    {
      name: 'Python Programming for Robotics',
      slug: 'python-robotics',
      description: 'Dive into Python programming with a focus on robotics applications. Learn to control sensors, motors, and make intelligent decisions in code.',
      level: 'Intermediate',
      ageRange: '12-16 years',
      duration: '16 weeks',
      price: 550,
      topics: ['Python Basics', 'Sensor Integration', 'Motor Control', 'Autonomous Navigation'],
      isActive: true,
    },
    {
      name: 'Advanced Robotics & Competition Prep',
      slug: 'advanced-robotics',
      description: 'Advanced course preparing students for competitive robotics tournaments. Focus on complex mechanisms, advanced programming, and strategic thinking.',
      level: 'Advanced',
      ageRange: '14-18 years',
      duration: '20 weeks',
      price: 650,
      topics: ['Complex Mechanisms', 'Advanced Algorithms', 'Competition Strategy', 'Team Leadership'],
      isActive: true,
    },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {},
      create: course,
    });
  }

  // Seed Activities
  console.log('🎯 Creating activities...');
  const activities = [
    {
      title: 'Weekly Robotics Workshop',
      description: 'Join our hands-on robotics workshops every Saturday. Open to all skill levels!',
      date: new Date('2025-02-01'),
      category: 'workshop',
    },
    {
      title: 'VEX Competition Regional Qualifier',
      description: 'Regional VEX Robotics Competition. Come watch our teams compete!',
      date: new Date('2025-02-15'),
      category: 'tournament',
    },
    {
      title: 'STEM Open House',
      description: 'Free open house! Tour our facility, meet instructors, and try robotics activities.',
      date: new Date('2025-03-01'),
      category: 'event',
    },
  ];

  for (const activity of activities) {
    // Use title + date as unique identifier
    const existing = await prisma.activity.findFirst({
      where: { title: activity.title, date: activity.date },
    });

    if (!existing) {
      await prisma.activity.create({ data: activity });
    }
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
