'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Search, Plus, Loader2, Users, Settings } from 'lucide-react';

interface Course {
    id: string;
    name: string;
    slug: string;
    description: string;
    instructorId: string | null;
    instructor: {
        firstName: string;
        lastName: string;
    } | null;
    _count?: {
        enrollments: number;
        modules: number;
        assignments: number;
    };
    createdAt: string;
}

interface Teacher {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export default function AdminLMSCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        code: '',
        description: '',
        instructorId: '',
    });

    useEffect(() => {
        fetchCourses();
        fetchTeachers();
    }, []);

    async function fetchCourses() {
        try {
            const response = await fetch('/api/admin/lms-courses');
            // Fetch all LMS courses with enrollment and content counts
            // Note: prisma.lMSCourse.findMany is a server-side operation.
            // This client-side component should ideally fetch from an API route
            // that then uses Prisma. The provided snippet directly inserts Prisma
            // call into client-side code, which will not work as-is.
            // Assuming the intent is to replace the client-side fetch with a
            // conceptual server-side fetch that returns the data.
            if (response.ok) {
                const data = await response.json();
                setCourses(data.courses);
            }
        } catch (error) {
            console.error('Failed to fetch LMS courses:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchTeachers() {
        try {
            const response = await fetch('/api/admin/teachers');
            if (response.ok) {
                const data = await response.json();
                setTeachers(data.teachers);
            }
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
        }
    }

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const response = await fetch('/api/admin/lms-courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm),
            });

            if (response.ok) {
                setIsCreateModalOpen(false);
                setCreateForm({ name: '', code: '', description: '', instructorId: '' });
                fetchCourses();
            } else {
                alert('Failed to create LMS course');
            }
        } catch (error) {
            console.error('Failed to create LMS course:', error);
            alert('Failed to create LMS course');
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">LMS Courses</h1>
                    <p className="text-muted-foreground mt-1">Manage teaching courses, enrollments, and content</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create LMS Course
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-foreground">{courses.length}</p>
                            <p className="text-sm text-muted-foreground">Total Courses</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">
                                {courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0)}
                            </p>
                            <p className="text-sm text-muted-foreground">Total Enrollments</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">
                                {courses.filter(c => c.instructorId).length}
                            </p>
                            <p className="text-sm text-muted-foreground">With Instructors</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Courses List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredCourses.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            {courses.length === 0
                                ? 'No courses yet. Create courses in the Offerings section first.'
                                : 'No courses found matching your search.'}
                        </CardContent>
                    </Card>
                ) : (
                    filteredCourses.map((course) => (
                        <Card key={course.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-foreground mb-2">
                                            {course.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                            {course.description}
                                        </p>
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>{course._count?.enrollments || 0} students</span>
                                            </div>
                                            <span>•</span>
                                            <span>{course._count?.modules || 0} modules</span>
                                            <span>•</span>
                                            <span>{course._count?.assignments || 0} assignments</span>
                                        </div>
                                        {course.instructor && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Instructor: {course.instructor.firstName} {course.instructor.lastName}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Link href={`/admin/lms-courses/${course.id}/manage`}>
                                            <Button size="sm">
                                                <Settings className="w-4 h-4 mr-2" />
                                                Manage
                                            </Button>
                                        </Link>
                                        <Link href={`/admin/lms-courses/${course.id}/builder`}>
                                            <Button variant="outline" size="sm">
                                                Content
                                            </Button>
                                        </Link>
                                        <Link href={`/admin/lms-courses/${course.id}/enrollments`}>
                                            <Button variant="outline" size="sm">
                                                <Users className="w-4 h-4 mr-2" />
                                                Enrollments
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create LMS Course Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create LMS Course"
            >
                <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Course Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={createForm.name}
                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            placeholder="e.g., Introduction to Robotics"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Course Code *
                        </label>
                        <input
                            type="text"
                            required
                            value={createForm.code}
                            onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            placeholder="e.g., ROBO-101-2024-SPRING"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Description
                        </label>
                        <textarea
                            value={createForm.description}
                            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            rows={3}
                            placeholder="Course description..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Instructor (Optional)
                        </label>
                        <select
                            value={createForm.instructorId}
                            onChange={(e) => setCreateForm({ ...createForm, instructorId: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                        >
                            <option value="">No instructor assigned</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.firstName} {teacher.lastName} ({teacher.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateModalOpen(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Course'
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
