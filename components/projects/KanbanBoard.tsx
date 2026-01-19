'use client';

import { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  taskType: string;
  dueDate: string | null;
  kanbanOrder: number;
  assignees: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: string, newOrder: number) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: string) => void;
}

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'review', title: 'Review', color: 'bg-purple-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-100' },
];

export default function KanbanBoard({
  tasks,
  onTaskMove,
  onTaskClick,
  onAddTask,
}: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState(tasks);

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
        return 'border-l-gray-300';
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
                    <h3 className="font-semibold text-gray-700">{column.title}</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-white/50 rounded-full text-gray-600">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => onAddTask(column.id)}
                    className="p-1 hover:bg-white/50 rounded"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[500px] p-2 rounded-b-lg transition-colors ${
                      snapshot.isDraggingOver
                        ? 'bg-sky-50'
                        : 'bg-gray-50'
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
                            className={`mb-2 p-3 bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                              getPriorityColor(task.priority)
                            } ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}`}
                          >
                            {/* Task Type Badge */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">
                                {getTaskTypeIcon(task.taskType)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>

                            {/* Task Title */}
                            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                              {task.title}
                            </h4>

                            {/* Task Description */}
                            {task.description && (
                              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Task Footer */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              {task.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}

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
                                    <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                                      <span className="text-xs font-medium text-gray-500">
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
                        className="w-full p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-sky-300 hover:text-sky-500 transition-colors"
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
