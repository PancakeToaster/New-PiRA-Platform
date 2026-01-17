import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Only admins can enter test mode
  if (!session?.user?.roles?.includes('Admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, roleName } = await req.json();

  // Set a cookie to track test mode
  const cookieStore = await cookies();
  cookieStore.set('test-mode-user-id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
  });

  cookieStore.set('test-mode-role', roleName, {
    httpOnly: false, // Allow client to read this for UI
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles?.includes('Admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.delete('test-mode-user-id');
  cookieStore.delete('test-mode-role');

  return NextResponse.json({ success: true });
}
