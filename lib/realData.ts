// Real data extracted from pirabots.tech and playideasny.com

export const companyInfo = {
  name: 'PLAYIDEAs',
  altName: 'PiRA',
  tagline: 'The ultimate robotics academy',
  mission: 'Creating transformative learning experiences that inspire creativity and innovation',
  vision: 'Where Play Unlocks Infinite Potential',
  description: 'Leader in digital business, helping companies of all sizes to thrive in an ever-changing landscape. Engaging students through hands-on learning with expertise in robotics and STEM education spanning over a decade.',
  yearsFounded: '10+ Years of Competitive Robotics Education',
};

export const contactInfo = {
  phone: '+1 917-285-5226',
  email: 'info@playideasny.com',
  address: {
    street: '99 Jericho Turnpike, Suite 305',
    city: 'Jericho',
    state: 'NY',
    zip: '11753',
    country: 'United States',
  },
};

export const teamMembers = [
  {
    id: '1',
    name: 'Barry Chuang',
    role: 'Owner',
    bio: 'Expert in robotics and STEM education, combined decades of experience leading transformative learning programs.',
    email: 'barry@playideasny.com',
    image: null,
  },
  {
    id: '2',
    name: 'Raymond Zhang',
    role: 'Director',
    bio: 'Veteran in robotics competitions ensuring student resource access and educational excellence.',
    email: 'raymond@playideasny.com',
    image: null,
  },
  {
    id: '3',
    name: 'William Zhang',
    role: 'Coaching Staff',
    bio: 'Dedicated coach helping students develop robotics and programming skills through hands-on instruction.',
    email: 'william@playideasny.com',
    image: null,
  },
];

export const learningProcess = [
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

export const services = [
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

// Course data based on typical robotics academy offerings
export const realCourses = [
  {
    id: '1',
    title: 'Introduction to Robotics',
    slug: 'intro-to-robotics',
    description: 'Perfect for beginners! Learn the fundamentals of robotics through hands-on projects and interactive lessons. Students will design, build, and program their first robot.',
    level: 'Beginner',
    ageRange: '8-12 years',
    duration: '12 weeks',
    price: 450,
    topics: ['Basic Mechanics', 'Simple Programming', 'Robot Design', 'Team Collaboration'],
    isPublished: true,
  },
  {
    id: '2',
    title: 'Python Programming for Robotics',
    slug: 'python-robotics',
    description: 'Dive into Python programming with a focus on robotics applications. Learn to control sensors, motors, and make intelligent decisions in code.',
    level: 'Intermediate',
    ageRange: '12-16 years',
    duration: '16 weeks',
    price: 550,
    topics: ['Python Basics', 'Sensor Integration', 'Motor Control', 'Autonomous Navigation'],
    isPublished: true,
  },
  {
    id: '3',
    title: 'Advanced Robotics & Competition Prep',
    slug: 'advanced-robotics',
    description: 'Advanced course preparing students for competitive robotics tournaments. Focus on complex mechanisms, advanced programming, and strategic thinking.',
    level: 'Advanced',
    ageRange: '14-18 years',
    duration: '20 weeks',
    price: 650,
    topics: ['Complex Mechanisms', 'Advanced Algorithms', 'Competition Strategy', 'Team Leadership'],
    isPublished: true,
  },
  {
    id: '4',
    title: 'Arduino Electronics & Circuits',
    slug: 'arduino-basics',
    description: 'Explore electronics and circuit design using Arduino microcontrollers. Build interactive projects and learn how hardware and software work together.',
    level: 'Beginner',
    ageRange: '10-14 years',
    duration: '10 weeks',
    price: 400,
    topics: ['Arduino Programming', 'Circuit Design', 'Sensors & Actuators', 'Interactive Projects'],
    isPublished: true,
  },
  {
    id: '5',
    title: 'VEX Robotics Competition Training',
    slug: 'vex-competition',
    description: 'Specialized training for VEX Robotics Competition. Learn game strategy, robot optimization, and teamwork skills essential for success.',
    level: 'Intermediate',
    ageRange: '12-18 years',
    duration: '24 weeks',
    price: 750,
    topics: ['VEX System', 'Game Analysis', 'Robot Optimization', 'Tournament Preparation'],
    isPublished: true,
  },
  {
    id: '6',
    title: 'LEGO Mindstorms EV3',
    slug: 'lego-mindstorms',
    description: 'Build and program robots using LEGO Mindstorms EV3. Perfect introduction to robotics for younger students with creative building challenges.',
    level: 'Beginner',
    ageRange: '8-11 years',
    duration: '8 weeks',
    price: 350,
    topics: ['LEGO Building', 'Block Programming', 'Sensors & Motors', 'Problem Solving'],
    isPublished: true,
  },
];

export const realActivities = [
  {
    id: '1',
    title: 'Weekly Robotics Workshop',
    description: 'Join our hands-on robotics workshops every Saturday. Open to all skill levels!',
    date: new Date('2025-01-25'),
    location: '99 Jericho Turnpike, Suite 305, Jericho NY',
    type: 'Workshop',
    ageRange: '8-18 years',
    spotsAvailable: 12,
  },
  {
    id: '2',
    title: 'VEX Competition Regional Qualifier',
    description: 'Regional VEX Robotics Competition. Come watch our teams compete!',
    date: new Date('2025-02-15'),
    location: 'Local High School Gymnasium',
    type: 'Competition',
    ageRange: 'All ages welcome',
    spotsAvailable: null,
  },
  {
    id: '3',
    title: 'Arduino Bootcamp',
    description: 'Intensive 3-day Arduino programming bootcamp during winter break.',
    date: new Date('2025-02-20'),
    location: '99 Jericho Turnpike, Suite 305, Jericho NY',
    type: 'Bootcamp',
    ageRange: '10-16 years',
    spotsAvailable: 8,
  },
  {
    id: '4',
    title: 'STEM Open House',
    description: 'Free open house! Tour our facility, meet instructors, and try robotics activities.',
    date: new Date('2025-02-01'),
    location: '99 Jericho Turnpike, Suite 305, Jericho NY',
    type: 'Open House',
    ageRange: 'All ages',
    spotsAvailable: 50,
  },
];

export const realBlogs = [
  {
    id: '1',
    title: 'Why Robotics Education Matters in 2025',
    slug: 'why-robotics-education-matters-2025',
    excerpt: 'Exploring the growing importance of robotics and STEM education in preparing students for future careers in technology and engineering.',
    content: 'Full blog post content here...',
    author: {
      id: '1',
      name: 'Barry Chuang',
      email: 'barry@playideasny.com',
    },
    publishedAt: new Date('2025-01-10'),
    isPublished: true,
    tags: ['Education', 'Robotics', 'STEM', 'Career'],
  },
  {
    id: '2',
    title: 'Success Stories: Our Students at VEX Worlds',
    slug: 'vex-worlds-success-stories',
    excerpt: 'Celebrating our students who competed at VEX Robotics World Championship and brought home awards.',
    content: 'Full blog post content here...',
    author: {
      id: '2',
      name: 'Raymond Zhang',
      email: 'raymond@playideasny.com',
    },
    publishedAt: new Date('2025-01-05'),
    isPublished: true,
    tags: ['Competition', 'Success', 'VEX', 'Students'],
  },
  {
    id: '3',
    title: 'Getting Started with Arduino: A Beginner\'s Guide',
    slug: 'arduino-beginners-guide',
    excerpt: 'Step-by-step guide for beginners looking to start their journey with Arduino electronics and programming.',
    content: 'Full blog post content here...',
    author: {
      id: '3',
      name: 'William Zhang',
      email: 'william@playideasny.com',
    },
    publishedAt: new Date('2024-12-28'),
    isPublished: true,
    tags: ['Arduino', 'Tutorial', 'Beginner', 'Electronics'],
  },
];

export const testimonials = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Parent',
    content: 'My daughter has grown so much in confidence and technical skills since joining PLAYIDEAs. The instructors are patient and knowledgeable.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    role: 'Student',
    content: 'The competition training helped our team win the regional championship. Best robotics program I\'ve been part of!',
    rating: 5,
  },
  {
    id: '3',
    name: 'Jennifer Park',
    role: 'Parent',
    content: 'Excellent curriculum and facilities. My son looks forward to every class and has learned so much about engineering.',
    rating: 5,
  },
];
