'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface GanttTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  progress: number;
  dependencies: {
    fromTaskId: string;
    toTaskId: string;
    type: string;
  }[];
  assignees: {
    user: {
      firstName: string;
      lastName: string;
    };
  }[];
  checklistItems?: { id: string; content: string; isCompleted: boolean; order: number }[];
  projectName?: string;
  projectColor?: string;
}

interface GanttChartProps {
  tasks: GanttTask[];
  onTaskClick: (task: GanttTask) => void;
}

type ZoomLevel = 'day' | 'week' | 'month';

export default function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate date range based on tasks
  const getDateRange = () => {
    const dates = tasks
      .flatMap((t) => [t.startDate, t.dueDate])
      .filter((d): d is string => d !== null)
      .map((d) => new Date(d));

    if (dates.length === 0) {
      const today = new Date();
      return {
        min: new Date(today.setDate(today.getDate() - 7)),
        max: new Date(today.setDate(today.getDate() + 30)),
      };
    }

    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add padding
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 14);

    return { min, max };
  };

  const dateRange = getDateRange();

  // Get column width based on zoom level
  const getColumnWidth = () => {
    switch (zoomLevel) {
      case 'day':
        return 40;
      case 'week':
        return 120;
      case 'month':
        return 200;
    }
  };

  const columnWidth = getColumnWidth();

  // Generate dates for the header
  const generateDates = () => {
    const dates: Date[] = [];
    const current = new Date(startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 60); // Show 60 days

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const dates = generateDates();

  // Get position and width for a task bar
  const getTaskBarStyle = (task: GanttTask) => {
    if (!task.startDate || !task.dueDate) {
      return { left: 0, width: 0, visible: false };
    }

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.dueDate);
    const viewStart = new Date(startDate);

    const startDiff = Math.floor(
      (taskStart.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const duration = Math.max(
      1,
      Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const left = startDiff * (columnWidth / (zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30));
    const width = duration * (columnWidth / (zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30));

    return { left, width, visible: true };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'review':
        return 'bg-purple-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-600';
      case 'high':
        return 'border-l-4 border-orange-500';
      case 'medium':
        return 'border-l-4 border-yellow-500';
      default:
        return 'border-l-4 border-muted';
    }
  };

  const formatDateHeader = (date: Date) => {
    if (zoomLevel === 'day') {
      return date.getDate().toString();
    }
    if (zoomLevel === 'week') {
      const weekStart = new Date(date);
      const weekEnd = new Date(date);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(startDate);
    const offset = zoomLevel === 'day' ? 7 : zoomLevel === 'week' ? 14 : 30;
    newDate.setDate(newDate.getDate() + (direction === 'next' ? offset : -offset));
    setStartDate(newDate);
  };

  // Group dates by week/month for headers
  const getGroupedDates = () => {
    if (zoomLevel === 'day') {
      return dates.map((d) => ({ date: d, label: d.getDate().toString() }));
    }

    const groups: { date: Date; label: string; span: number }[] = [];
    let currentGroup: Date | null = null;
    let span = 0;

    dates.forEach((date, index) => {
      if (zoomLevel === 'week') {
        const weekStart = date.getDay() === 0;
        if (weekStart || index === 0) {
          if (currentGroup) {
            groups.push({
              date: currentGroup,
              label: formatDateHeader(currentGroup),
              span,
            });
          }
          currentGroup = new Date(date);
          span = 1;
        } else {
          span++;
        }
      } else {
        const monthStart = date.getDate() === 1;
        if (monthStart || index === 0) {
          if (currentGroup) {
            groups.push({
              date: currentGroup,
              label: formatDateHeader(currentGroup),
              span,
            });
          }
          currentGroup = new Date(date);
          span = 1;
        } else {
          span++;
        }
      }
    });

    if (currentGroup) {
      groups.push({
        date: currentGroup,
        label: formatDateHeader(currentGroup),
        span,
      });
    }

    return groups;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const todayPosition = todayOffset * (columnWidth / (zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30));

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 ml-2">
            {startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Zoom:</span>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setZoomLevel('day')}
              className={`px-3 py-1 text-sm ${zoomLevel === 'day'
                ? 'bg-sky-500 text-white'
                : 'bg-card text-muted-foreground hover:bg-accent'
                }`}
            >
              Day
            </button>
            <button
              onClick={() => setZoomLevel('week')}
              className={`px-3 py-1 text-sm border-x border-border ${zoomLevel === 'week'
                ? 'bg-sky-500 text-white'
                : 'bg-card text-muted-foreground hover:bg-accent'
                }`}
            >
              Week
            </button>
            <button
              onClick={() => setZoomLevel('month')}
              className={`px-3 py-1 text-sm ${zoomLevel === 'month'
                ? 'bg-sky-500 text-white'
                : 'bg-card text-muted-foreground hover:bg-accent'
                }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Task List */}
        <div className="w-64 flex-shrink-0 border-r border-border">
          {/* Header */}
          <div className="h-12 px-4 flex items-center bg-muted/30 border-b border-border">
            <span className="font-medium text-foreground">Task</span>
          </div>
          {/* Task Names */}
          <div>
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={`h-12 px-4 flex items-center border-b border-border hover:bg-accent cursor-pointer ${getPriorityBorder(
                  task.priority
                )}`}
              >
                <div className="flex flex-col justify-center w-full overflow-hidden">
                  {task.projectName && (
                    <span
                      className="text-xs font-semibold mb-0.5 text-muted-foreground"
                      style={{ color: task.projectColor }}
                    >
                      {task.projectName}
                    </span>
                  )}
                  <span className="text-sm text-foreground truncate">{task.title}</span>
                  {(task.checklistItems?.length ?? 0) > 0 && (
                    <div className="flex items-center mt-0.5 space-x-1 text-xs text-muted-foreground">
                      <CheckSquare className="w-3 h-3" />
                      <span>
                        {task.checklistItems?.filter(i => i.isCompleted).length}/{task.checklistItems?.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                No tasks with dates
              </div>
            )}
          </div>
        </div>

        {/* Gantt Area */}
        <div className="flex-1 overflow-x-auto" ref={containerRef}>
          {/* Date Headers */}
          <div className="h-12 flex bg-muted/30 border-b border-border sticky top-0">
            {dates.map((date, index) => {
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isToday = date.toDateString() === today.toDateString();
              return (
                <div
                  key={index}
                  className={`flex-shrink-0 flex items-center justify-center border-r border-border text-xs ${isWeekend ? 'bg-muted/10' : ''
                    } ${isToday ? 'bg-sky-500/10' : ''}`}
                  style={{ width: columnWidth / (zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30) }}
                >
                  {zoomLevel === 'day' && (
                    <div className="text-center">
                      <div className="text-muted-foreground">{date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}</div>
                      <div className={`font-medium ${isToday ? 'text-sky-600' : 'text-foreground'}`}>
                        {date.getDate()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Task Bars */}
          <div className="relative">
            {/* Today Line */}
            {todayPosition > 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: todayPosition }}
              />
            )}

            {/* Grid Lines */}
            <div className="absolute inset-0 flex">
              {dates.map((date, index) => {
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <div
                    key={index}
                    className={`flex-shrink-0 border-r border-border ${isWeekend ? 'bg-muted/5' : ''
                      }`}
                    style={{ width: columnWidth / (zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30) }}
                  />
                );
              })}
            </div>

            {/* Task Rows */}
            {tasks.map((task) => {
              const barStyle = getTaskBarStyle(task);
              return (
                <div
                  key={task.id}
                  className="h-12 relative border-b border-border"
                >
                  {barStyle.visible && (
                    <div
                      onClick={() => onTaskClick(task)}
                      className={`absolute top-2 h-8 rounded cursor-pointer transition-all hover:opacity-80 ${getStatusColor(
                        task.status
                      )}`}
                      style={{
                        left: Math.max(0, barStyle.left),
                        width: Math.max(20, barStyle.width),
                      }}
                    >
                      {/* Progress Bar */}
                      <div
                        className="absolute inset-0 bg-white/30 rounded-r"
                        style={{ left: `${task.progress}%` }}
                      />
                      {/* Label */}
                      <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                        <span className="text-xs text-white font-medium truncate">
                          {barStyle.width > 80 ? task.title : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="h-24 flex items-center justify-center text-muted-foreground/50 text-sm">
                Add dates to tasks to see them on the Gantt chart
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span className="text-muted-foreground">To Do</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-muted-foreground">In Progress</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-muted-foreground">Review</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Done</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-muted-foreground">Blocked</span>
        </div>
        <div className="flex items-center space-x-2 ml-auto">
          <div className="w-0.5 h-4 bg-red-500" />
          <span className="text-muted-foreground">Today</span>
        </div>
      </div>
    </div>
  );
}
