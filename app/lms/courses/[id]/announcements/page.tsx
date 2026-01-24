import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default async function CourseAnnouncementsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    const course = await prisma.lMSCourse.findUnique({
        where: { id },
    });

    if (!course) {
        return <div>Course not found</div>;
    }

    // Fetch course-specific announcements
    const announcements = await prisma.announcement.findMany({
        where: {
            type: 'course',
            targetId: id,
            isActive: true,
        },
        include: {
            author: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/lms/courses">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Courses
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">{course.name} - Announcements</h1>
                    <p className="text-gray-600">Course updates and notifications</p>
                </div>
            </div>

            {announcements.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-gray-600">
                        No announcements yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {announcements.map((announcement) => (
                        <Card key={announcement.id}>
                            <CardHeader>
                                <CardTitle>{announcement.title}</CardTitle>
                                <p className="text-sm text-gray-600">
                                    By {announcement.author.firstName} {announcement.author.lastName} •{' '}
                                    {new Date(announcement.createdAt).toLocaleDateString()}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="prose max-w-none">
                                    {announcement.content}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
