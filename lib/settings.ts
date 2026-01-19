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
}

const defaultSettings: SiteSettings = {
  siteName: 'Robotics Academy',
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
