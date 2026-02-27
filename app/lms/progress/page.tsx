import { getCurrentUser } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart, Users, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function TeacherProgressPage() {
    const user = await getCurrentUser();

    if (!user || !user.roles.includes('Teacher')) {
        redirect('/');
    }

    // Get teacher's courses
    const courses = await prisma.lMSCourse.findMany({
        where: { instructorId: user.id },
        include: {
            _count: {
                select: { enrollments: true }
            }
        }
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Student Progress</h1>
            <p className="text-muted-foreground">Track student progress across your courses.</p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                    <Card key={course.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold">{course.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                                <Users className="w-4 h-4" />
                                <span>{course._count.enrollments} Students Enrolled</span>
                            </div>

                            <Link href={`/admin/courses/${course.id}/grades`}>
                                <div className="w-full bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 py-2 rounded-md text-center text-sm font-medium hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors">
                                    View Detailed Progress
                                </div>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
                {courses.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-muted/50 rounded-lg border border-dashed border-border">
                        <BarChart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-muted-foreground">You haven't created any courses yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
