import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { BookOpen, ClipboardList, TrendingUp, Award } from 'lucide-react';

export default async function LMSDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const isStudent = user.roles?.includes('Student');
  const isTeacher = user.roles?.includes('Teacher');

  let stats = {
    knowledgeNodes: 0,
    assignments: 0,
    completedAssignments: 0,
    progress: 0,
  };

  if (isStudent && user.profiles?.student) {
    const studentAssignments = await prisma.assignment.count({
      where: {
        OR: [
          { studentId: user.profiles.student },
          { studentId: null }, // All-student assignments
        ],
      },
    });

    const completedAssignments = await prisma.assignmentSubmission.count({
      where: {
        studentId: user.profiles.student,
        status: 'graded',
      },
    });

    const progressRecords = await prisma.studentProgress.findMany({
      where: { studentId: user.profiles.student },
    });

    const totalProgress = progressRecords.reduce((acc, p) => acc + p.progress, 0);
    const avgProgress = progressRecords.length > 0 ? totalProgress / progressRecords.length : 0;

    stats = {
      knowledgeNodes: progressRecords.length,
      assignments: studentAssignments,
      completedAssignments,
      progress: Math.round(avgProgress),
    };
  }

  if (isTeacher && user.profiles?.teacher) {
    const teacherNodes = await prisma.knowledgeNode.count({
      where: { authorId: user.id },
    });

    const teacherAssignments = await prisma.assignment.count({
      where: { teacherId: user.id },
    });

    stats = {
      knowledgeNodes: teacherNodes,
      assignments: teacherAssignments,
      completedAssignments: 0,
      progress: 0,
    };
  }

  const recentNodes = await prisma.knowledgeNode.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        {isTeacher ? 'Teacher Dashboard' : 'Student Dashboard'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isTeacher ? 'Created Nodes' : 'Knowledge Nodes'}
                </p>
                <p className="text-3xl font-bold">{stats.knowledgeNodes}</p>
              </div>
              <BookOpen className="w-12 h-12 text-sky-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isTeacher ? 'Created Assignments' : 'Assignments'}
                </p>
                <p className="text-3xl font-bold">{stats.assignments}</p>
              </div>
              <ClipboardList className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {isStudent && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-3xl font-bold">{stats.completedAssignments}</p>
                  </div>
                  <Award className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Progress</p>
                    <p className="text-3xl font-bold">{stats.progress}%</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Knowledge Nodes</CardTitle>
              <Link
                href="/lms/knowledge"
                className="text-sm text-sky-500 hover:text-sky-600"
              >
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentNodes.length === 0 ? (
              <p className="text-gray-600">No knowledge nodes yet.</p>
            ) : (
              <div className="space-y-3">
                {recentNodes.map((node) => (
                  <Link
                    key={node.id}
                    href={`/lms/knowledge/${node.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-semibold">{node.title}</h3>
                    <p className="text-sm text-gray-600">
                      By {node.author.firstName} {node.author.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Updated {new Date(node.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isTeacher && (
                <>
                  <Link
                    href="/lms/knowledge/new"
                    className="block p-4 bg-sky-50 border-2 border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                  >
                    <h3 className="font-semibold text-sky-800">Create Knowledge Node</h3>
                    <p className="text-sm text-sky-600">Add new content to the knowledge base</p>
                  </Link>
                  <Link
                    href="/lms/assignments/new"
                    className="block p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <h3 className="font-semibold text-blue-900">Create Assignment</h3>
                    <p className="text-sm text-blue-700">Assign work to students</p>
                  </Link>
                </>
              )}
              <Link
                href="/lms/knowledge"
                className="block p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <h3 className="font-semibold text-green-900">Browse Knowledge Base</h3>
                <p className="text-sm text-green-700">Explore learning materials</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
