import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, Filter, Eye } from 'lucide-react';
import Link from 'next/link';

export default async function AssignmentSubmissionsPage({
    params,
}: {
    params: Promise<{ id: string; assignmentId: string }>;
}) {
    const { id, assignmentId } = await params;
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user) {
        redirect('/auth/signin');
    }

    // Fetch assignment and submissions
    const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
            course: true,
            submissions: {
                include: {
                    student: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: { submittedAt: 'desc' }
            }
        }
    });

    if (!assignment) {
        notFound();
    }

    if (assignment.courseId !== id) {
        notFound();
    }

    if (!userIsAdmin && assignment.course.instructorId !== user.id) {
        // Only instructor or admin can view
        redirect('/admin/courses');
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Link href={`/admin/courses/${id}/assignments`} className="hover:underline">Assignments</Link>
                        <span>/</span>
                        <span>{assignment.title}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted At</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignment.submissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        No submissions received yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                assignment.submissions.map((submission) => (
                                    <TableRow key={submission.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={submission.student.user.image || undefined} />
                                                    <AvatarFallback>
                                                        {submission.student.user.firstName[0]}
                                                        {submission.student.user.lastName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">
                                                        {submission.student.user.firstName} {submission.student.user.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{submission.student.user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {submission.status === 'graded' ? (
                                                <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">Graded</Badge>
                                            ) : submission.status === 'submitted' ? (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Needs Grading</Badge>
                                            ) : (
                                                <Badge variant="outline">{submission.status}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(submission.submittedAt).toLocaleString()}
                                            {assignment.dueDate && new Date(submission.submittedAt) > new Date(assignment.dueDate) && (
                                                <span className="ml-2 text-xs text-red-600 font-medium">Late</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {submission.grade !== null ? (
                                                <span className="font-semibold">
                                                    {submission.grade} / {assignment.maxPoints}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/admin/courses/${id}/assignments/${assignmentId}/submissions/${submission.id}`}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Grade
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
