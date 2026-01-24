'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import KanbanBoard, { Task } from '@/components/projects/KanbanBoard';
import { TaskDetailModal } from '@/components/projects/TaskDetailModal';

interface NewTaskForm {
  title: string;
  description: string;
  priority: string;
  taskType: string;
  status: string;
  startDate: string;
  dueDate: string;
}

export default function BoardPage({
  params,
}: {
  params: { teamSlug: string; projectSlug: string };
}) {
  const { teamSlug, projectSlug } = params;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  const [isCreating, setIsCreating] = useState(false);

  // Task Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: '',
    description: '',
    priority: 'medium',
    taskType: 'task',
    status: 'todo',
    startDate: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchTasks();
  }, [teamSlug, projectSlug]);

  async function fetchTasks() {
    try {
      const response = await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleTaskMove = async (
    taskId: string,
    newStatus: string,
    newOrder: number
  ) => {
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    try {
      await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks/${taskId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, kanbanOrder: newOrder }),
      });
    } catch (error) {
      console.error('Failed to move task:', error);
      fetchTasks(); // Revert on error
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks/${taskId}`, {
        method: 'PATCH', // Assuming PATCH route exists, otherwise I need to create it or PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        // Update local state
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, ...updates } : t
        ));
        // If needed, we could re-fetch to be safe
      }
    } catch (error) {
      console.error('Failed to update task', error);
    }
  };

  const handleAddTask = (status: string) => {
    setNewTaskStatus(status);
    setNewTask((prev) => ({ ...prev, status }));
    setShowNewTaskModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks((prev) => [...prev, data.task]);
        setShowNewTaskModal(false);
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          taskType: 'task',
          status: 'todo',
          startDate: '',
          dueDate: '',
        });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleChecklistAdd = async (taskId: string, content: string) => {
    try {
      const res = await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks/${taskId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const { item } = await res.json();
        setTasks(prev => prev.map(t =>
          t.id === taskId
            ? { ...t, checklistItems: [...(t.checklistItems || []), item] }
            : t
        ));
        // Also update selectedTask if it's the one modified
        if (selectedTask?.id === taskId) {
          setSelectedTask(prev => prev ? { ...prev, checklistItems: [...(prev.checklistItems || []), item] } : null);
        }
      }
    } catch (error) {
      console.error('Failed to add checklist item', error);
    }
  };

  const handleChecklistUpdate = async (taskId: string, itemId: string, updates: any) => {
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? {
          ...t,
          checklistItems: t.checklistItems?.map(i => i.id === itemId ? { ...i, ...updates } : i)
        }
        : t
    ));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? {
        ...prev,
        checklistItems: prev.checklistItems?.map(i => i.id === itemId ? { ...i, ...updates } : i)
      } : null);
    }

    try {
      await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks/${taskId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update checklist item', error);
      fetchTasks(); // Revert
    }
  };

  const handleChecklistDelete = async (taskId: string, itemId: string) => {
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, checklistItems: t.checklistItems?.filter(i => i.id !== itemId) }
        : t
    ));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? {
        ...prev,
        checklistItems: prev.checklistItems?.filter(i => i.id !== itemId)
      } : null);
    }

    try {
      await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks/${taskId}/checklist/${itemId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete checklist item', error);
      fetchTasks();
    }
  };



  const handleSubtaskCreate = async (parentId: string, title: string) => {
    try {
      const response = await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          parentId,
          status: 'todo',
          priority: 'medium',
          taskType: 'task',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTask = data.task;

        setTasks(prev => [...prev, newTask]);

        // Update parent task in state to include this new subtask
        setTasks(prev => prev.map(t =>
          t.id === parentId
            ? { ...t, subtasks: [...(t.subtasks || []), newTask] }
            : t
        ));

        if (selectedTask?.id === parentId) {
          setSelectedTask(prev => prev ? { ...prev, subtasks: [...(prev.subtasks || []), newTask] } : null);
        }
      }
    } catch (error) {
      console.error('Failed to create subtask', error);
    }
  };



  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);

    try {
      await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks/${taskId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      fetchTasks();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Kanban Board</h2>
        <Button onClick={() => handleAddTask('todo')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        tasks={tasks}
        onTaskMove={handleTaskMove}
        onTaskClick={handleTaskClick}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask ? { ...selectedTask, kanbanOrder: selectedTask.kanbanOrder ?? 0 } : null}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onChecklistAdd={handleChecklistAdd}
        onChecklistUpdate={handleChecklistUpdate}
        onChecklistDelete={handleChecklistDelete}
        onSubtaskCreate={handleSubtaskCreate}
        onTaskClick={(taskId) => {
          const task = tasks.find(t => t.id === taskId);
          if (task) setSelectedTask(task);
        }}
      />

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">New Task</h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                  placeholder="Task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                  placeholder="Describe the task..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newTask.taskType}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, taskType: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                  >
                    <option value="task">Task</option>
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                    <option value="improvement">Improvement</option>
                    <option value="research">Research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, priority: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewTaskModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Task'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
