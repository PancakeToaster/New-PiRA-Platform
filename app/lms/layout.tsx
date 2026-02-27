import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import LMSAppShell from '@/components/lms/LMSAppShell';
import { getStudentCourseProgress } from '@/lib/progress';

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
  const allowedRoles = ['Student', 'Teacher', 'Admin'];
  const hasAccess = user.roles.some((role: string) => allowedRoles.includes(role));

  if (!hasAccess) {
    redirect('/');
  }

  // Fetch user's courses
  const isStudent = user.roles?.includes('Student');
  const isTeacher = user.roles?.includes('Teacher');
  let courses: any[] = [];

  if (isStudent && user.profiles?.student) {
    const studentId = user.profiles.student;
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId },
      include: {
        lmsCourse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
    courses = await Promise.all(enrollments.map(async (e) => {
      const progress = await getStudentCourseProgress(studentId, e.lmsCourse.id);
      return {
        ...e.lmsCourse,
        progress
      };
    }));
  } else if (isTeacher) {
    courses = await prisma.lMSCourse.findMany({
      where: { instructorId: user.id },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  }

  return (
    <LMSAppShell user={user} courses={courses}>
      {children}
    </LMSAppShell>
  );
}
