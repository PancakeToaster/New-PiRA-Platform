'use client';

import { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Calendar, User, Trash2, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  taskType: string;
  dueDate: string | null;
  startDate: string | null;
  kanbanOrder: number;
  assignees: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
  checklistItems?: {
    id: string;
    content: string;
    isCompleted: boolean;
    order: number;
  }[];
  subtasks?: { id: string; title: string; status: string; priority: string; dueDate: string | null }[];
  parent?: { id: string; title: string };
  projectName?: string;
  projectColor?: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: string, newOrder: number) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-secondary' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500/10' },
  { id: 'review', title: 'Review', color: 'bg-purple-500/10' },
  { id: 'done', title: 'Done', color: 'bg-green-500/10' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-500/10' },
];

export default function KanbanBoard({
  tasks,
  onTaskMove,
  onTaskClick,
  onAddTask,
  onDeleteTask,
}: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null);

  const getColumnTasks = (columnId: string) => {
    return localTasks
      .filter((task) => task.status === columnId)
      .sort((a, b) => a.kanbanOrder - b.kanbanOrder);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = draggableId;
    const newStatus = destination.droppableId;
    const newOrder = destination.index;

    // Update local state optimistically
    setLocalTasks((prevTasks) => {
      const task = prevTasks.find((t) => t.id === taskId);
      if (!task) return prevTasks;

      const otherTasks = prevTasks.filter((t) => t.id !== taskId);
      const sameColumnTasks = otherTasks.filter((t) => t.status === newStatus);

      // Reorder tasks in the destination column
      sameColumnTasks.forEach((t, index) => {
        if (index >= newOrder) {
          t.kanbanOrder = index + 1;
        }
      });

      const updatedTask = { ...task, status: newStatus, kanbanOrder: newOrder };

      return [...otherTasks, updatedTask];
    });

    // Call parent handler
    onTaskMove(taskId, newStatus, newOrder);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-muted';
    }
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

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnTasks = getColumnTasks(column.id);

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
            >
              {/* Column Header */}
              <div className={`rounded-t-lg px-4 py-3 ${column.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-foreground">{column.title}</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-background/50 rounded-full text-muted-foreground">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => onAddTask(column.id)}
                    className="p-1 hover:bg-background/50 rounded"
                  >
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[500px] p-2 rounded-b-lg transition-colors ${snapshot.isDraggingOver
                      ? 'bg-accent'
                      : 'bg-muted/30'
                      }`}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onTaskClick(task)}
                            className={`mb-2 p-3 bg-card rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(task.priority)
                              } ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}`}
                          >
                            {/* Task Type Badge */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">
                                {getTaskTypeIcon(task.taskType)}
                              </span>
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuTaskId(openMenuTaskId === task.id ? null : task.id);
                                  }}
                                  className="p-1 hover:bg-accent rounded focus:outline-none"
                                >
                                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                </button>

                                {openMenuTaskId === task.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuTaskId(null);
                                      }}
                                    />
                                    <div className="absolute right-0 mt-1 w-32 bg-popover rounded-md shadow-lg border border-border z-20 overflow-hidden">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteTask(task.id);
                                          setOpenMenuTaskId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center"
                                      >
                                        <Trash2 className="w-3 h-3 mr-2" />
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Task Title */}
                            <h4 className="font-medium text-foreground mb-2 line-clamp-2">
                              {task.title}
                            </h4>

                            {/* Task Description */}
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Task Footer */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex space-x-3">
                                {task.dueDate && (
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                                {(task.checklistItems?.length ?? 0) > 0 && (
                                  <div className="flex items-center space-x-1 text-muted-foreground" title="Subtasks">
                                    <CheckSquare className="w-3 h-3" />
                                    <span>
                                      {task.checklistItems?.filter(i => i.isCompleted).length}/{task.checklistItems?.length}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {task.assignees.length > 0 && (
                                <div className="flex -space-x-1">
                                  {task.assignees.slice(0, 3).map((assignee) => (
                                    <div
                                      key={assignee.user.id}
                                      className="w-6 h-6 rounded-full bg-sky-100 border-2 border-white flex items-center justify-center"
                                      title={`${assignee.user.firstName} ${assignee.user.lastName}`}
                                    >
                                      <span className="text-xs font-medium text-sky-700">
                                        {assignee.user.firstName.charAt(0)}
                                      </span>
                                    </div>
                                  ))}
                                  {task.assignees.length > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        +{task.assignees.length - 3}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Add Task Button */}
                    {columnTasks.length === 0 && (
                      <button
                        onClick={() => onAddTask(column.id)}
                        className="w-full p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-sky-300 hover:text-sky-500 transition-colors"
                      >
                        <Plus className="w-5 h-5 mx-auto" />
                        <span className="text-sm">Add a task</span>
                      </button>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
