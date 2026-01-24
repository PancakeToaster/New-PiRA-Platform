import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

// Available test roles with descriptions and default portal
const TEST_ROLES = [
  { name: 'Parent', description: 'View parent portal, children, and invoices', portal: '/parent' },
  { name: 'Student', description: 'Access LMS, courses, and assignments', portal: '/lms' },
  { name: 'Teacher', description: 'Manage LMS, create courses, grade assignments', portal: '/lms' },
  { name: 'Team Member', description: 'View projects and create tasks', portal: '/projects' },
];

export async function GET() {
  const session = await getServerSession(authOptions);

  // Only admins can access test mode info
  if (!session?.user?.roles?.includes('Admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const currentTestRole = cookieStore.get('test-mode-role')?.value || null;

  return NextResponse.json({
    availableRoles: TEST_ROLES,
    currentTestRole,
    isInTestMode: !!currentTestRole,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Only admins can enter test mode
  if (!session?.user?.roles?.includes('Admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roleName } = await req.json();

  // Validate role name
  const validRole = TEST_ROLES.find((r) => r.name === roleName);
  if (!validRole) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Set cookies to track test mode
  const cookieStore = await cookies();

  // Store original user ID for potential restoration
  cookieStore.set('test-mode-original-user', session.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  cookieStore.set('test-mode-role', roleName, {
    httpOnly: false, // Allow client to read this for UI
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  });

  return NextResponse.json({ success: true, role: roleName, portal: validRole.portal });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const originalUserId = cookieStore.get('test-mode-original-user')?.value;
  const testModeRole = cookieStore.get('test-mode-role')?.value;

  // If we have an original user ID stored, we're in test mode and should allow exit
  // This is the primary check since in test mode, session roles might be overridden
  if (originalUserId) {
    cookieStore.delete('test-mode-original-user');
    cookieStore.delete('test-mode-role');
    return NextResponse.json({ success: true });
  }

  // If not in test mode, check if user is admin
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes('Admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Clear any lingering test mode cookies just in case
  if (testModeRole) {
    cookieStore.delete('test-mode-role');
  }

  return NextResponse.json({ success: true });
}
