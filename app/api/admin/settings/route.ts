import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { getSiteSettings, updateSettings, SiteSettings } from '@/lib/settings';

export async function GET() {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settingsToUpdate: Partial<SiteSettings> = {};

    // Only include valid settings keys
    const validKeys: (keyof SiteSettings)[] = [
      'siteName',
      'siteDescription',
      'contactEmail',
      'enableAnalytics',
      'maintenanceMode',
      'smtpHost',
      'smtpPort',
      'smtpUser',
      'smtpPassword',
      'maxFileSize',
      'allowedFileTypes',
      'requireEmailVerification',
      'twoFactorAuth',
      'sessionTimeout',
      'passwordMinLength',
    ];

    for (const key of validKeys) {
      if (key in body) {
        (settingsToUpdate as Record<string, unknown>)[key] = body[key];
      }
    }

    await updateSettings(settingsToUpdate);
    const updatedSettings = await getSiteSettings();

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
