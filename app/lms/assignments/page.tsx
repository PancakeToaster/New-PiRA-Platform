import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/permissions';

export default async function LMSAssignmentsHelper() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/signin');
    }

    const isStudent = user.roles?.includes('Student');
    const isTeacher = user.roles?.includes('Teacher') || user.roles?.includes('Admin');

    if (isTeacher) {
        // Teachers need to select a course context first, or we could build a global list later.
        // For now, send them to the course list where they can drill down.
        redirect('/admin/courses');
    } else if (isStudent) {
        redirect('/student/assignments');
    } else {
        redirect('/');
    }
}
