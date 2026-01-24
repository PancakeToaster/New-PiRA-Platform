'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Search, Filter, ChevronDown, Calendar, User, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TaskDetailModal } from '@/components/projects/TaskDetailModal';

// Using consistent Task interface
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  taskType: string;
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  progress: number;
  // properties required by TaskDetailModal
  kanbanOrder?: number;
  checklistItems?: { id: string; content: string; isCompleted: boolean; order: number }[];
  assignees: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
}

interface NewTaskForm {
  title: string;
  description: string;
  priority: string;
  taskType: string;
  status: string;
  startDate: string;
  dueDate: string;
}

export default function ListPage({
  params,
}: {
  params: { teamSlug: string; projectSlug: string };
}) {
  const { teamSlug, projectSlug } = params;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created');

  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, ...updates } as Task : t
        ));
        // Update selected task too if open
        if (selectedTask?.id === taskId) {
          setSelectedTask(prev => prev ? { ...prev, ...updates } as Task : null);
        }
      }
    } catch (error) {
      console.error('Failed to update task', error);
    }
  };

  // Checklist Handlers (Copied/Adapted from BoardPage)
  const handleChecklistAdd = async (taskId: string, content: string) => {
    try {
      const res = await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks/${taskId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const { item } = await res.json();
        // Update tasks state
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, checklistItems: [...(t.checklistItems || []), item] } : t
        ));
        // Update selected task
        if (selectedTask?.id === taskId) {
          setSelectedTask(prev => prev ? { ...prev, checklistItems: [...(prev.checklistItems || []), item] } : null);
        }
      }
    } catch (error) {
      console.error('Failed to add checklist item', error);
    }
  };

  const handleChecklistUpdate = async (taskId: string, itemId: string, updates: any) => {
    // Note: List view doesn't show checklist, but Modal needs updated state.
    // Optimistic update for Selected Task (Modal)
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? {
        ...prev,
        checklistItems: prev.checklistItems?.map(i => i.id === itemId ? { ...i, ...updates } : i)
      } : null);
    }

    // Also update main list just in case (though invisible there)
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? {
          ...t,
          checklistItems: t.checklistItems?.map(i => i.id === itemId ? { ...i, ...updates } : i)
        }
        : t
    ));

    try {
      await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks/${taskId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update checklist item', error);
    }
  };

  const handleChecklistDelete = async (taskId: string, itemId: string) => {
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? {
        ...prev,
        checklistItems: prev.checklistItems?.filter(i => i.id !== itemId)
      } : null);
    }
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, checklistItems: t.checklistItems?.filter(i => i.id !== itemId) }
        : t
    ));

    try {
      await fetch(`/api/projects/${teamSlug}/${projectSlug}/tasks/${taskId}/checklist/${itemId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete checklist item', error);
    }
  };


  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'status':
          const statusOrder = { todo: 0, in_progress: 1, review: 2, blocked: 3, done: 4 };
          return (statusOrder[a.status as keyof typeof statusOrder] || 5) -
            (statusOrder[b.status as keyof typeof statusOrder] || 5);
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      todo: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      review: 'bg-purple-100 text-purple-700',
      done: 'bg-green-100 text-green-700',
      blocked: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-500',
    };
    return colors[priority] || 'bg-gray-100 text-gray-500';
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'bug':
        return '🐛';
      case 'feature':
        return '✨';
      case 'improvement':
        return '🔧';
      case 'research':
        return '🔍';
      default:
        return '📋';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Task List</h2>
        <Button onClick={() => setShowNewTaskModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters (unchanged) */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
          >
            <option value="created">Sort by Created</option>
            <option value="priority">Sort by Priority</option>
            <option value="dueDate">Sort by Due Date</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignees
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {tasks.length === 0
                    ? 'No tasks yet. Create your first task!'
                    : 'No tasks match your filters.'}
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTask(task)} // Row Click
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <span>{getTaskTypeIcon(task.taskType)}</span>
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-500 truncate max-w-md">
                            {task.description}
                          </p>
                        )}
                        {(task.checklistItems?.length ?? 0) > 0 && (
                          <div className="flex items-center mt-1 space-x-1 text-xs text-gray-400">
                            <CheckSquare className="w-3 h-3" />
                            <span>
                              {task.checklistItems?.filter(i => i.isCompleted).length}/{task.checklistItems?.length} subtasks
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                        task.status
                      )}`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {task.dueDate ? (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No due date</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {task.assignees.length > 0 ? (
                      <div className="flex -space-x-1">
                        {task.assignees.slice(0, 3).map((assignee, index) => (
                          <div
                            key={index}
                            className="w-7 h-7 rounded-full bg-sky-100 border-2 border-white flex items-center justify-center"
                            title={`${assignee.user.firstName} ${assignee.user.lastName}`}
                          >
                            <span className="text-xs font-medium text-sky-700">
                              {assignee.user.firstName.charAt(0)}
                            </span>
                          </div>
                        ))}
                        {task.assignees.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500">
                              +{task.assignees.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full max-w-[100px]">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-sky-500 h-2 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{task.progress}%</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask ? { ...selectedTask, kanbanOrder: selectedTask.kanbanOrder ?? 0 } as any : null}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask as any}
        onChecklistAdd={handleChecklistAdd}
        onChecklistUpdate={handleChecklistUpdate}
        onChecklistDelete={handleChecklistDelete}
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
