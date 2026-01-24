'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, X, Plus, Loader2, Search } from 'lucide-react';

interface Student {
    id: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface Enrollment {
    id: string;
    studentId: string;
    enrolledAt: string;
    student: Student;
}

export default function CourseEnrollments({ courseId }: { courseId: string }) {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');

    useEffect(() => {
        fetchEnrollments();
        fetchAllStudents();
    }, [courseId]);

    const fetchEnrollments = async () => {
        try {
            const response = await fetch(`/api/admin/courses/${courseId}/enrollments`);
            if (response.ok) {
                const data = await response.json();
                setEnrollments(data.enrollments);
            }
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const response = await fetch('/api/admin/students');
            if (response.ok) {
                const data = await response.json();
                setAllStudents(data.students);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleAddStudent = async () => {
        if (!selectedStudent) return;

        try {
            const response = await fetch(`/api/admin/courses/${courseId}/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: selectedStudent }),
            });

            if (response.ok) {
                await fetchEnrollments();
                setSelectedStudent('');
                setIsAdding(false);
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to add student');
            }
        } catch (error) {
            console.error('Error adding student:', error);
            alert('Failed to add student');
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!confirm('Are you sure you want to remove this student from the course?')) {
            return;
        }

        try {
            const response = await fetch(
                `/api/admin/courses/${courseId}/enrollments?studentId=${studentId}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                await fetchEnrollments();
            } else {
                alert('Failed to remove student');
            }
        } catch (error) {
            console.error('Error removing student:', error);
            alert('Failed to remove student');
        }
    };

    const enrolledStudentIds = new Set(enrollments.map((e) => e.studentId));
    const availableStudents = allStudents.filter(
        (s) => !enrolledStudentIds.has(s.id)
    );

    const filteredStudents = availableStudents.filter((s) =>
        `${s.user.firstName} ${s.user.lastName} ${s.user.email}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Enrolled Students ({enrollments.length})
                    </CardTitle>
                    <Button onClick={() => setIsAdding(!isAdding)} size="sm">
                        {isAdding ? (
                            <>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Student
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isAdding && (
                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 outline-none text-sm"
                            />
                        </div>
                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        >
                            <option value="">Select a student...</option>
                            {filteredStudents.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.user.firstName} {student.user.lastName} ({student.user.email})
                                </option>
                            ))}
                        </select>
                        <Button onClick={handleAddStudent} disabled={!selectedStudent} className="w-full">
                            Add Student to Course
                        </Button>
                    </div>
                )}

                {enrollments.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No students enrolled yet.</p>
                ) : (
                    <div className="space-y-2">
                        {enrollments.map((enrollment) => (
                            <div
                                key={enrollment.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {enrollment.student.user.firstName} {enrollment.student.user.lastName}
                                    </p>
                                    <p className="text-sm text-gray-600">{enrollment.student.user.email}</p>
                                    <p className="text-xs text-gray-500">
                                        Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleRemoveStudent(enrollment.studentId)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
