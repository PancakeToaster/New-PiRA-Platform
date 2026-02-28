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
  const allowedRoles = ['Student', 'Mentor', 'Team Captain', 'Team Member', 'Admin', 'VEX HIGHSCHOOL A'];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const hasAccess = user.roles.some((role: any) => {
    const roleName = typeof role === 'string' ? role : (role.role?.name || role.name);
    return allowedRoles.includes(roleName);
  });

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
