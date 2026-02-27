'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft, Plus, Search, Trash2, UserPlus, Loader2 } from 'lucide-react';

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface Enrollment {
    id?: string; // Enrollment ID might not be needed if we delete by studentId
    studentId: string;
    student: {
        user: Student;
    };
    enrolledAt: string;
}

export default function CourseEnrollmentsPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(false);

    useEffect(() => {
        if (id) {
            fetchEnrollments();
            fetchStudents();
        }
    }, [id]);

    async function fetchEnrollments() {
        try {
            const response = await fetch(`/api/admin/lms-courses/${id}/enrollments`);
            if (response.ok) {
                const data = await response.json();
                setEnrollments(data.enrollments);
            }
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchStudents() {
        try {
            const response = await fetch('/api/admin/students');
            if (response.ok) {
                const data = await response.json();
                // Map the nested structure from admin/students API to flat Student interface
                // The API returns User objects with studentProfile
                // IMPORTANT: CourseEnrollment links to StudentProfile, NOT User. 
                // We must use studentProfile.id as the student identifier.
                const students = data
                    .filter((user: any) => user.studentProfile?.id)
                    .map((user: any) => ({
                        id: user.studentProfile.id, // Use Profile ID for enrollment logic
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                    }));
                setAllStudents(students);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
        }
    }

    const handleEnroll = async (studentId: string) => {
        setIsEnrolling(true);
        try {
            const response = await fetch(`/api/admin/lms-courses/${id}/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId }),
            });

            if (response.ok) {
                await fetchEnrollments();
                setIsEnrollModalOpen(false);
                setSearchQuery('');
            } else {
                alert('Failed to enroll student');
            }
        } catch (error) {
            console.error('Failed to enroll student:', error);
            alert('Error enrolling student');
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleUnenroll = async (studentId: string) => {
        if (!confirm('Are you sure you want to remove this student from the course?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/lms-courses/${id}/enrollments?studentId=${studentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchEnrollments();
            } else {
                alert('Failed to remove student');
            }
        } catch (error) {
            console.error('Failed to remove student:', error);
            alert('Error removing student');
        }
    };

    // Filter students: 
    // 1. Must match search query
    // 2. Must NOT be already enrolled
    const availableStudents = allStudents.filter(student => {
        const matchesSearch =
            student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase());

        const isEnrolled = enrollments.some(e => e.student.user.id === student.id);

        return matchesSearch && !isEnrolled;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/lms-courses">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground">Manage Enrollments</h1>
                </div>
                <Button onClick={() => setIsEnrollModalOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enroll Student
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Enrolled Students ({enrollments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {enrollments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No students enrolled yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {enrollments.map((enrollment) => (
                                <div key={enrollment.studentId} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {enrollment.student.user.firstName[0]}
                                            {enrollment.student.user.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">
                                                {enrollment.student.user.firstName} {enrollment.student.user.lastName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {enrollment.student.user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right mr-4 hidden sm:block">
                                            <p className="text-xs text-muted-foreground">Enrolled</p>
                                            <p className="text-sm text-foreground">
                                                {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleUnenroll(enrollment.studentId)} // Check if id vs studentId
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={isEnrollModalOpen}
                onClose={() => setIsEnrollModalOpen(false)}
                title="Enroll Student"
            >
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {availableStudents.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                {searchQuery ? 'No students found.' : 'Start typing to search...'}
                            </p>
                        ) : (
                            availableStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group"
                                    onClick={() => handleEnroll(student.id)}
                                >
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {student.firstName} {student.lastName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {student.email}
                                        </p>
                                    </div>
                                    <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        Enroll
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
