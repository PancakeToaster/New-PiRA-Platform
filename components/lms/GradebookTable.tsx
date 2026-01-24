'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GradebookTableProps {
    courseId: string;
    students: Array<{
        id: string;
        name: string;
    }>;
    assignments: Array<{
        id: string;
        title: string;
        maxPoints: number;
    }>;
    grades: Record<string, Record<string, number | null>>; // studentId -> assignmentId -> grade
}

export default function GradebookTable({ courseId, students, assignments, grades: initialGrades }: GradebookTableProps) {
    const router = useRouter();
    const [isEditMode, setIsEditMode] = useState(false);
    const [grades, setGrades] = useState(initialGrades);
    const [isSaving, setIsSaving] = useState(false);

    const handleGradeChange = (studentId: string, assignmentId: string, value: string) => {
        const numValue = value === '' ? null : parseFloat(value);
        setGrades((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [assignmentId]: numValue,
            },
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/lms/courses/${courseId}/grades`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grades }),
            });

            if (response.ok) {
                setIsEditMode(false);
                router.refresh();
            } else {
                alert('Failed to save grades');
            }
        } catch (error) {
            console.error('Error saving grades:', error);
            alert('Failed to save grades');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setGrades(initialGrades);
        setIsEditMode(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                {!isEditMode ? (
                    <Button onClick={() => setIsEditMode(true)} size="sm">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Grades
                    </Button>
                ) : (
                    <>
                        <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button onClick={handleSave} size="sm" disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </>
                )}
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                                Student
                            </th>
                            {assignments.map((assignment) => (
                                <th
                                    key={assignment.id}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    <div className="flex flex-col">
                                        <span>{assignment.title}</span>
                                        <span className="text-gray-400 font-normal">
                                            ({assignment.maxPoints} pts)
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => (
                            <tr key={student.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                                    {student.name}
                                </td>
                                {assignments.map((assignment) => {
                                    const grade = grades[student.id]?.[assignment.id];
                                    return (
                                        <td
                                            key={assignment.id}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            {isEditMode ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={assignment.maxPoints}
                                                    step="0.1"
                                                    value={grade ?? ''}
                                                    onChange={(e) =>
                                                        handleGradeChange(student.id, assignment.id, e.target.value)
                                                    }
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                                    placeholder="-"
                                                />
                                            ) : (
                                                <span>{grade !== null && grade !== undefined ? grade : '-'}</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isEditMode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Edit Mode Active:</strong> Make your changes and click "Save Changes" to update grades. All changes will be logged for audit purposes.
                    </p>
                </div>
            )}
        </div>
    );
}
