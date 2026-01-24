import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/permissions';
import ProjectsAppShell from '@/components/projects/ProjectsAppShell';

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure user has appropriate role for Projects
  // "teams" implies Team Member role, along with Mentor and Team Captain.
  const allowedRoles = ['Mentor', 'Team Captain', 'Team Member', 'Admin'];
  const hasAccess = user.roles.some((role: string) => allowedRoles.includes(role));

  if (!hasAccess) {
    redirect('/');
  }

  // Projects area is generally accessible to all authenticated users for now.
  // We can add stricter role checks later if needed (e.g. only Team members).

  return (
    <ProjectsAppShell user={user}>
      {children}
    </ProjectsAppShell>
  );
}
