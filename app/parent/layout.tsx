import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/permissions';
import ParentAppShell from '@/components/parent/ParentAppShell';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure user has 'Parent', 'Student', or 'Admin' role
  const allowedRoles = ['Parent', 'Student', 'Admin'];
  const hasAccess = user.roles.some((role: string) => allowedRoles.includes(role));

  if (!hasAccess) {
    redirect('/');
  }

  return (
    <ParentAppShell user={user}>
      {children}
    </ParentAppShell>
  );
}
