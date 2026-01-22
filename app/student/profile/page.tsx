import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import AchievementsSection from '@/components/profile/AchievementsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default async function StudentProfilePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/signin');
    }

    // Get student profile details
    const studentProfile = await prisma.studentProfile.findFirst({
        where: { userId: user.id },
        include: {
            enrollments: {
                include: { course: true }
            }
        }
    });

    if (!studentProfile) {
        // Ideally direct to "Create Profile" or similar.
        return <div>Student profile not found.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            {/* Header Profile Card */}
            <Card className="mb-8 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-sky-500 to-indigo-600"></div>
                <CardContent className="relative pt-0">
                    <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-4 gap-6 px-4">
                        <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback className="text-4xl bg-sky-100 text-sky-700">
                                {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 pb-2">
                            <h1 className="text-3xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
                            <p className="text-gray-600">{user.email}</p>
                            {studentProfile.school && (
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span>🏫 {studentProfile.school}</span>
                                    {studentProfile.grade && <span>🎓 Grade {studentProfile.grade}</span>}
                                </div>
                            )}
                        </div>
                        <div className="pb-4">
                            {/* Action buttons could go here (Edit Profile) */}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="achievements" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    <TabsTrigger value="courses">My Courses</TabsTrigger>
                    {/* Add Activity/Timeline later */}
                </TabsList>

                <TabsContent value="achievements">
                    <AchievementsSection />
                </TabsContent>

                <TabsContent value="courses">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {studentProfile.enrollments.map((enr) => (
                            <Card key={enr.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">{enr.course.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{enr.course.description}</p>
                                    <div className="text-xs text-gray-400">
                                        Enrolled: {new Date(enr.enrolledAt).toLocaleDateString()}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {studentProfile.enrollments.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No active course enrollments.
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
