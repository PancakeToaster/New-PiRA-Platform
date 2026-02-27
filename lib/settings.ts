import { prisma } from './prisma';

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  enableAnalytics: boolean;
  maintenanceMode: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  maxFileSize: number;
  allowedFileTypes: string;
  requireEmailVerification: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordMinLength: number;
  home_content: any; // Using any for flexibility with JSON structure
  history_content: any; // Using any for Awards and Alumni data
}

const defaultSettings: SiteSettings = {
  siteName: 'PiRA',
  siteDescription: 'Learn robotics and programming through hands-on courses',
  contactEmail: 'info@roboticsacademy.com',
  enableAnalytics: true,
  maintenanceMode: false,
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPassword: '',
  maxFileSize: 10,
  allowedFileTypes: '.pdf,.doc,.docx,.jpg,.png',
  requireEmailVerification: true,
  twoFactorAuth: false,
  sessionTimeout: 60,
  passwordMinLength: 8,
  home_content: {
    stats: {
      studentsTaught: "5,000+",
      yearsExperience: "15+",
      awardsWon: "50+",
      programLevels: "3"
    },
    handsOn: {
      title: "Hands-On Learning",
      description: "Real-world projects and competitions that develop critical thinking and problem-solving skills."
    },
    competition: {
      title: "Competing & Winning",
      description: "Our teams consistently excel in robotics competitions and innovation challenges."
    },
    programs: {
      title: "Featured Programs",
      description: "Comprehensive robotics education designed for every skill level"
    },
    events: {
      title: "Upcoming Events",
      description: "Join us for workshops and competitions"
    },
    cta: {
      title: "Ready to Start Your Journey?",
      description: "Join our community of young innovators and start building the future today",
      buttonText: "Get Started Today"
    }
  },
  history_content: {
    awards: [
      { date: "2025-05", competition: "Regional Robotics Championship", titles: "First Place in Innovation", image: "" },
      { date: "2024-11", competition: "National Coding Challenge", titles: "Gold Medalist Team", image: "" },
      { date: "2023-04", competition: "State STEM Fair", titles: "Best Engineering Project", image: "" }
    ],
    alumni: [
      { name: "Alex Johnson", year: "2023", college: "MIT", major: "Computer Science" },
      { name: "Sarah Lee", year: "2022", college: "Stanford", major: "Robotics Engineering" },
      { name: "Michael Chen", year: "2021", college: "Carnegie Mellon", major: "Artificial Intelligence" },
      { name: "Emily Davis", year: "2020", college: "Georgia Tech", major: "Mechanical Engineering" }
    ]
  }
};

function parseValue(value: string, type: string): string | boolean | number {
  switch (type) {
    case 'boolean':
      return value === 'true';
    case 'number':
      return parseFloat(value);
    default:
      return value;
  }
}

function getValueType(value: unknown): string {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await prisma.siteSetting.findMany();

    const result = { ...defaultSettings };

    for (const setting of settings) {
      const key = setting.key as keyof SiteSettings;
      if (key in result) {
        (result as Record<string, unknown>)[key] = parseValue(setting.value, setting.type);
      }
    }

    return result;
  } catch (error) {
    // If database is not available or table doesn't exist, return defaults
    console.error('Failed to fetch site settings:', error);
    return defaultSettings;
  }
}

export async function getSetting<K extends keyof SiteSettings>(key: K): Promise<SiteSettings[K]> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (setting) {
      return parseValue(setting.value, setting.type) as SiteSettings[K];
    }

    return defaultSettings[key];
  } catch (error) {
    console.error(`Failed to fetch setting ${key}:`, error);
    return defaultSettings[key];
  }
}

export async function updateSetting<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): Promise<void> {
  const type = getValueType(value);
  const stringValue = String(value);

  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: stringValue, type },
    create: { key, value: stringValue, type },
  });
}

export async function updateSettings(settings: Partial<SiteSettings>): Promise<void> {
  const updates = Object.entries(settings).map(([key, value]) => {
    const type = getValueType(value);
    return prisma.siteSetting.upsert({
      where: { key },
      update: { value: String(value), type },
      create: { key, value: String(value), type },
    });
  });

  await prisma.$transaction(updates);
}

export async function getSettingsByCategory(category: string): Promise<Record<string, unknown>> {
  const settings = await prisma.siteSetting.findMany({
    where: { category },
  });

  const result: Record<string, unknown> = {};
  for (const setting of settings) {
    result[setting.key] = parseValue(setting.value, setting.type);
  }

  return result;
}
