'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import GanttChart, { GanttTask } from '@/components/projects/GanttChart';

export default function GanttPage({
  params,
}: {
  params: { teamSlug: string; projectSlug: string };
}) {
  const { teamSlug, projectSlug } = params;
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [teamSlug, projectSlug]);

  async function fetchTasks() {
    try {
      const response = await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks`);
      if (response.ok) {
        const data = await response.json();
        // Transform tasks to include dependencies
        const transformedTasks = data.tasks.map((task: GanttTask) => ({
          ...task,
          dependencies: task.dependencies || [],
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
    // TODO: Open task detail modal
    console.log('Task clicked:', task);
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
        <h2 className="text-xl font-semibold text-gray-900">Gantt Chart</h2>
        <p className="text-sm text-gray-500">
          {tasks.filter((t) => t.startDate && t.dueDate).length} of {tasks.length} tasks have dates
        </p>
      </div>

      <GanttChart tasks={tasks} onTaskClick={handleTaskClick} />

      {tasks.length > 0 && tasks.filter((t) => t.startDate && t.dueDate).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Add start and due dates to your tasks to see them on the Gantt chart.</p>
        </div>
      )}
    </div>
  );
}
