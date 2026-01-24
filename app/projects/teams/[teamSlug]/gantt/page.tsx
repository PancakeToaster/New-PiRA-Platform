'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import GanttChart, { GanttTask } from '@/components/projects/GanttChart';
import { TaskDetailModal } from '@/components/projects/TaskDetailModal';

// Extended Task type for API response including project
interface ApiTask extends GanttTask {
    project: {
        name: string;
        slug: string;
        color: string | null;
    };
}

export default function TeamGanttPage({
    params,
}: {
    params: { teamSlug: string };
}) {
    const { teamSlug } = params;
    const [tasks, setTasks] = useState<GanttTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<any | null>(null); // Using any for simplicity with modal types mismatch if present

    useEffect(() => {
        fetchTasks();
    }, [teamSlug]);

    async function fetchTasks() {
        try {
            const response = await fetch(`/api/projects/teams/${teamSlug}/tasks`);
            if (response.ok) {
                const data = await response.json();
                // Transform tasks to include dependencies and project info
                const transformedTasks = data.tasks.map((task: ApiTask) => ({
                    ...task,
                    dependencies: task.dependencies || [],
                    projectName: task.project.name,
                    projectColor: task.project.color,
                }));
                setTasks(transformedTasks);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleTaskClick = (task: GanttTask) => {
        // We need to fetch full task details for editing, or rely on what we have. 
        // The Modal expects a Task object. Our GanttTask is similar.
        // However, to UPDATE, we need the task ID and API.
        // The Modal calls onUpdate. But we need to know WHICH project API to call?
        // Oh, my Modal onUpdate just takes taskId and updates. But my update logic usually needs connection.
        // Wait, Update API is `/api/projects/[team]/[project]/tasks/[id]`.
        // I don't have project slug easily available in onUpdate unless encoded in task or passed.
        // Let's modify TaskDetailModal or handleUpdate here carefully.

        // For now, let's enable READ-ONLY or basic view.
        // Or better: store projectSlug in task data too so we can construct the update URL.
        setSelectedTask({ ...task, projectSlug: (task as any).project?.slug || '' });
        // Note: The API response 'task' included 'project' object. transformedTasks spreads it?
        // Wait, transformedTasks: { ...task, ... } keeps 'project' object inside properties? Yes.
    };

    const handleUpdateTask = async (taskId: string, updates: Partial<any>) => {
        if (!selectedTask) return;
        // We need project slug to update. 
        // The fetched tasks included `project: { slug: ... }`.
        const projectSlug = selectedTask.project.slug;

        try {
            const res = await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (res.ok) {
                // Update local state
                setTasks(prev => prev.map(t =>
                    t.id === taskId ? { ...t, ...updates } : t
                ));
            }
        } catch (error) {
            console.error('Failed to update task', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/projects/teams/${teamSlug}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Team
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Team Gantt Chart</h1>
                        <p className="text-sm text-gray-500">Overview of all active projects</p>
                    </div>
                </div>
            </div>

            <GanttChart tasks={tasks} onTaskClick={handleTaskClick} />

            <TaskDetailModal
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdate={handleUpdateTask}
            />
        </div>
    );
}
