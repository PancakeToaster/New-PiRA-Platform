// Mock data for demo mode (no database required)

export const mockUser = {
  id: 'mock-admin-id',
  email: 'admin@roboticsacademy.com',
  name: 'Admin User',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['Admin'],
  permissions: [
    { resource: 'all', action: 'all' }
  ],
  profiles: {
    parent: null,
    student: null,
    teacher: null,
  },
};

export const mockActivities = [
  {
    id: '1',
    title: 'First Place at State Robotics Competition',
    description: 'Our advanced team won first place in the autonomous navigation challenge at the state robotics competition.',
    date: new Date('2024-01-15'),
    image: null,
    category: 'tournament',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Community STEM Fair Success',
    description: 'Students demonstrated their robotics projects to over 500 attendees at the annual community STEM fair.',
    date: new Date('2024-01-10'),
    image: null,
    category: 'event',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'New Partnership with Local University',
    description: 'Excited to announce our partnership with State University Engineering Department for mentorship program.',
    date: new Date('2024-01-05'),
    image: null,
    category: 'achievement',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockCourses = [
  {
    id: '1',
    name: 'Introduction to Robotics',
    description: 'Learn the fundamentals of robotics including basic mechanics, sensors, and programming.',
    duration: '8 weeks',
    ageRange: '8-12 years',
    price: 299,
    image: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Intermediate Robot Building',
    description: 'Build more complex robots with advanced sensors and autonomous behaviors.',
    duration: '10 weeks',
    ageRange: '12-16 years',
    price: 399,
    image: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Competition Preparation',
    description: 'Intensive training for robotics competitions including strategy, design, and teamwork.',
    duration: '12 weeks',
    ageRange: '14-18 years',
    price: 499,
    image: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: 'Programming for Robotics',
    description: 'Deep dive into programming concepts for robotics using Python and block coding.',
    duration: '6 weeks',
    ageRange: '10-14 years',
    price: 249,
    image: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockBlogs = [
  {
    id: '1',
    slug: 'welcome-to-our-new-platform',
    title: 'Welcome to Our New Learning Platform',
    excerpt: 'We are excited to announce the launch of our new robotics academy platform with enhanced features for students, parents, and teachers.',
    content: '<h1>Welcome to Our New Learning Platform</h1><p>We are thrilled to introduce our brand new platform designed to enhance the learning experience for all our students...</p>',
    coverImage: null,
    isDraft: false,
    publishedAt: new Date('2024-01-20'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    slug: 'why-robotics-education-matters',
    title: 'Why Robotics Education Matters in 2024',
    excerpt: 'Discover the importance of robotics education and how it prepares students for future careers in technology.',
    content: '<h1>Why Robotics Education Matters in 2024</h1><p>In an increasingly technology-driven world, robotics education has become more important than ever...</p>',
    coverImage: null,
    isDraft: false,
    publishedAt: new Date('2024-01-18'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    status: 'paid',
    dueDate: new Date('2024-02-01'),
    paidDate: new Date('2024-01-25'),
    subtotal: 299,
    tax: 23.92,
    total: 322.92,
    notes: 'Thank you for your prompt payment!',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-25'),
    items: [
      {
        id: '1',
        description: 'Introduction to Robotics - Spring 2024',
        quantity: 1,
        unitPrice: 299,
        total: 299,
      },
    ],
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    status: 'unpaid',
    dueDate: new Date('2024-02-15'),
    paidDate: null,
    subtotal: 399,
    tax: 31.92,
    total: 430.92,
    notes: 'Payment due by February 15, 2024',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    items: [
      {
        id: '2',
        description: 'Intermediate Robot Building - Spring 2024',
        quantity: 1,
        unitPrice: 399,
        total: 399,
      },
    ],
  },
];

export const mockKnowledgeNodes = [
  {
    id: '1',
    title: 'Introduction to Sensors',
    content: '# Introduction to Sensors\n\nSensors are essential components of any robot...',
    nodeType: 'markdown',
    isPublished: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    author: {
      firstName: 'Sarah',
      lastName: 'Johnson',
    },
  },
  {
    id: '2',
    title: 'Basic Programming Concepts',
    content: '# Basic Programming Concepts\n\nLet\'s learn the fundamentals of programming...',
    nodeType: 'markdown',
    isPublished: true,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    author: {
      firstName: 'Michael',
      lastName: 'Chen',
    },
  },
  {
    id: '3',
    title: 'Robot Mechanics Basics',
    content: '# Robot Mechanics Basics\n\nUnderstanding how robots move...',
    nodeType: 'markdown',
    isPublished: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    author: {
      firstName: 'Sarah',
      lastName: 'Johnson',
    },
  },
];

export const mockUsers = [
  {
    id: '1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date('2024-01-20'),
    roles: [
      { roleId: '1', role: { name: 'Student' } },
    ],
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    createdAt: new Date('2024-01-19'),
    roles: [
      { roleId: '2', role: { name: 'Parent' } },
    ],
  },
  {
    id: '3',
    email: 'sarah.johnson@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    createdAt: new Date('2024-01-18'),
    roles: [
      { roleId: '3', role: { name: 'Teacher' } },
    ],
  },
];

export const mockStats = {
  users: {
    total: 45,
    students: 28,
    parents: 12,
    teachers: 4,
  },
  financial: {
    totalRevenue: 15678.50,
    unpaidRevenue: 2543.68,
    totalInvoices: 32,
    unpaidInvoices: 6,
  },
  content: {
    knowledgeNodes: 24,
    publishedNodes: 18,
    assignments: 15,
    pageViews24h: 156,
    newContacts: 3,
  },
  student: {
    knowledgeNodes: 12,
    assignments: 8,
    completedAssignments: 5,
    progress: 67,
  },
  teacher: {
    knowledgeNodes: 18,
    assignments: 12,
  },
};

export const mockStudents = [
  {
    id: '1',
    user: {
      firstName: 'Emma',
      lastName: 'Wilson',
    },
    grade: '7th Grade',
    school: 'Lincoln Middle School',
  },
  {
    id: '2',
    user: {
      firstName: 'Noah',
      lastName: 'Brown',
    },
    grade: '9th Grade',
    school: 'Washington High School',
  },
];

export const mockParentProfile = {
  id: '1',
  students: mockStudents.map(s => ({ student: s })),
  invoices: mockInvoices,
};
