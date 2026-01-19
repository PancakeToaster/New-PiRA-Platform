import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { FileText, Award, Clock, TrendingUp } from 'lucide-react';

export default async function GradesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const isStudent = user.roles?.includes('Student');

  let submissions: any[] = [];
  let stats = {
    totalGraded: 0,
    averageGrade: 0,
    pendingGrades: 0,
  };

  if (isStudent && user.profiles?.student) {
    // Fetch all submissions with grades
    submissions = await prisma.assignmentSubmission.findMany({
      where: { studentId: user.profiles.student },
      include: {
        assignment: {
          select: {
            title: true,
            dueDate: true,
            maxPoints: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Calculate stats
    const gradedSubmissions = submissions.filter((s) => s.status === 'graded');
    stats.totalGraded = gradedSubmissions.length;
    stats.pendingGrades = submissions.filter((s) => s.status === 'submitted').length;

    if (gradedSubmissions.length > 0) {
      const totalPercentage = gradedSubmissions.reduce((acc, s) => {
        const maxPoints = s.assignment.maxPoints || 100;
        return acc + ((s.grade || 0) / maxPoints) * 100;
      }, 0);
      stats.averageGrade = Math.round(totalPercentage / gradedSubmissions.length);
    }
  }

  const getGradeColor = (grade: number, maxPoints: number) => {
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getLetterGrade = (grade: number, maxPoints: number) => {
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Grades</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Grade</p>
                <p className="text-3xl font-bold">{stats.averageGrade}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-sky-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Graded Assignments</p>
                <p className="text-3xl font-bold">{stats.totalGraded}</p>
              </div>
              <Award className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Grades</p>
                <p className="text-3xl font-bold">{stats.pendingGrades}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Grades</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">No submitted assignments yet.</p>
              <Link
                href="/lms/assignments"
                className="inline-block mt-4 text-sky-500 hover:text-sky-600 font-medium"
              >
                View Assignments →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Assignment</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Submitted</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/lms/assignments/${submission.assignmentId}`}
                          className="font-medium text-gray-900 hover:text-sky-600"
                        >
                          {submission.assignment.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {submission.assignment.dueDate
                          ? new Date(submission.assignment.dueDate).toLocaleDateString()
                          : 'No due date'}
                      </td>
                      <td className="py-3 px-4">
                        {submission.status === 'graded' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Graded
                          </span>
                        ) : submission.status === 'submitted' ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Pending
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {submission.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {submission.status === 'graded' && submission.grade !== null ? (
                          <div className="flex items-center justify-end space-x-2">
                            <span
                              className={`px-2 py-1 rounded font-semibold text-sm ${getGradeColor(
                                submission.grade,
                                submission.assignment.maxPoints || 100
                              )}`}
                            >
                              {getLetterGrade(submission.grade, submission.assignment.maxPoints || 100)}
                            </span>
                            <span className="text-gray-600">
                              {submission.grade}/{submission.assignment.maxPoints || 100}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Section */}
      {submissions.some((s) => s.status === 'graded' && s.feedback) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissions
                .filter((s) => s.status === 'graded' && s.feedback)
                .slice(0, 5)
                .map((submission) => (
                  <div key={submission.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{submission.assignment.title}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(submission.gradedAt || submission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{submission.feedback}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
