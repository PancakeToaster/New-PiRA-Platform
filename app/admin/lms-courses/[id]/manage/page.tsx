'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Save, Loader2, Users, Trash2 } from 'lucide-react';
import TiptapEditor from '@/components/editor/TiptapEditor';

interface LMSCourse {
    id: string;
    name: string;
    code: string;
    description: string | null;
    instructorId: string | null;
    isActive: boolean;
    instructor: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null;
    _count?: {
        enrollments: number;
        modules: number;
        assignments: number;
        lessons: number;
    };
}

interface Teacher {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export default function ManageLMSCoursePage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        instructorId: '',
        isActive: true,
    });

    useEffect(() => {
        if (id) {
            fetchCourse();
            fetchTeachers();
        }
    }, [id]);

    async function fetchCourse() {
        try {
            const response = await fetch(`/api/admin/lms-courses/${id}`);
            if (response.ok) {
                const { course } = await response.json();
                setFormData({
                    name: course.name || '',
                    code: course.code || '',
                    description: course.description || '',
                    instructorId: course.instructorId || '',
                    isActive: course.isActive ?? true,
                });
            } else {
                setError('Course not found');
            }
        } catch (err) {
            setError('Failed to fetch course');
        } finally {
            setIsFetching(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/lms-courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push('/admin/lms-courses');
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update course');
            }
        } catch (err) {
            setError('An error occurred while updating the course');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this LMS course? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/lms-courses/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                router.push('/admin/lms-courses');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete course');
            }
        } catch (err) {
            alert('An error occurred while deleting the course');
        }
    };

    if (isFetching) {
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
                    <h1 className="text-3xl font-bold text-foreground">Manage LMS Course</h1>
                </div>
                <Button variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Course
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Course Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="name" className="mb-2 block">
                                    Course Name *
                                </Label>
                                <input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                    placeholder="Introduction to Robotics"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="code" className="mb-2 block">
                                    Course Code *
                                </Label>
                                <input
                                    id="code"
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                    placeholder="ROBO-101-2024-SPRING"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description" className="mb-2 block">
                                Description
                            </Label>
                            <TiptapEditor
                                content={formData.description}
                                onChange={(content: string) => setFormData(prev => ({ ...prev, description: content }))}
                                placeholder="Describe what students will learn in this course..."
                            />
                        </div>

                        <div>
                            <Label htmlFor="instructor" className="mb-2 block">
                                Instructor
                            </Label>
                            <select
                                id="instructor"
                                value={formData.instructorId}
                                onChange={(e) => setFormData(prev => ({ ...prev, instructorId: e.target.value }))}
                                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            >
                                <option value="" className="bg-background text-foreground">No instructor assigned</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id} className="bg-background text-foreground">
                                        {teacher.firstName} {teacher.lastName} ({teacher.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                className="h-4 w-4 text-primary focus:ring-primary border-input rounded bg-background"
                            />
                            <Label htmlFor="isActive">
                                Active (visible to students)
                            </Label>
                        </div>

                        <div className="flex justify-end space-x-4 pt-4 border-t">
                            <Link href="/admin/lms-courses">
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
