'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface Lesson {
    id: string;
    title: string;
}

interface AssignmentFormProps {
    courseId: string;
    initialData?: any;
    lessons: Lesson[];
}

export default function AssignmentForm({
    courseId,
    initialData,
    lessons,
}: AssignmentFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        maxPoints: initialData?.maxPoints || 100,
        lessonId: initialData?.lessonId || '',
        allowTextEntry: initialData?.allowTextEntry ?? true,
        allowFileUpload: initialData?.allowFileUpload ?? true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = initialData
                ? `/api/admin/assignments/${initialData.id}`
                : '/api/admin/assignments';

            const method = initialData ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    courseId,
                    maxPoints: Number(formData.maxPoints),
                }),
            });

            if (!res.ok) throw new Error('Failed to save assignment');

            router.push(`/admin/courses/${courseId}/assignments`);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to save assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Assignment Title</Label>
                        <Input
                            id="title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Robot Arm Kinematics"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            rows={5}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detailed instructions for the assignment..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                required
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxPoints">Points</Label>
                            <Input
                                id="maxPoints"
                                type="number"
                                min="0"
                                required
                                value={formData.maxPoints}
                                onChange={(e) => setFormData({ ...formData, maxPoints: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lessonId">Link to Lesson (Optional)</Label>
                        <select
                            id="lessonId"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                            value={formData.lessonId}
                            onChange={(e) => setFormData({ ...formData, lessonId: e.target.value })}
                        >
                            <option value="">-- No Lesson Linked --</option>
                            {lessons.map((lesson) => (
                                <option key={lesson.id} value={lesson.id}>
                                    {lesson.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-medium text-gray-900">Submission Types</h3>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.allowTextEntry}
                                    onChange={(e) => setFormData({ ...formData, allowTextEntry: e.target.checked })}
                                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="text-sm text-gray-700">Online Text Entry</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.allowFileUpload}
                                    onChange={(e) => setFormData({ ...formData, allowFileUpload: e.target.checked })}
                                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="text-sm text-gray-700">File Uploads</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t">
                        <Link href={`/admin/courses/${courseId}/assignments`}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save className="w-4 h-4 mr-2" />
                            {initialData ? 'Update Assignment' : 'Create Assignment'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
