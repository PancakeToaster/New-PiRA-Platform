import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/permissions';
import LMSAppShell from '@/components/lms/LMSAppShell';

export default async function LMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure user has appropriate role for LMS
  // Assuming 'Student', 'Teacher', or 'Admin' can access.
  // 'Parent' currently accesses '/parent'.
  const allowedRoles = ['Student', 'Teacher', 'Admin'];
  const hasAccess = user.roles.some((role: string) => allowedRoles.includes(role));

  if (!hasAccess) {
    // Optionally redirect to a forbidden page or back to home
    redirect('/');
  }

  return (
    <LMSAppShell>
      {children}
    </LMSAppShell>
  );
}
