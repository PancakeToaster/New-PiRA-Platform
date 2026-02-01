'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Loader2,
  FolderKanban,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import GanttChart, { GanttTask } from '@/components/projects/GanttChart';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  priority: string;
  color: string | null;
  startDate: string | null;
  endDate: string | null;
  team: {
    name: string;
    slug: string;
    color: string | null;
  };
  _count: {
    tasks: number;
  };
  tasks: GanttTask[];
}

export default function ProjectOverviewPage({
  params,
}: {
  params: { teamSlug: string; projectSlug: string };
}) {
  const { teamSlug, projectSlug } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [teamSlug, projectSlug]);

  async function fetchProject() {
    try {
      const response = await fetch(`/api/projects/${teamSlug}/${projectSlug}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to load project');
      }
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          {error || 'Project not found'}
        </h2>
        <Link href={`/projects/teams/${teamSlug}`}>
          <Button variant="outline">Back to Team</Button>
        </Link>
      </div>
    );
  }

  const taskStats = {
    total: project.tasks.length,
    todo: project.tasks.filter((t) => t.status === 'todo').length,
    inProgress: project.tasks.filter((t) => t.status === 'in_progress').length,
    review: project.tasks.filter((t) => t.status === 'review').length,
    done: project.tasks.filter((t) => t.status === 'done').length,
    blocked: project.tasks.filter((t) => t.status === 'blocked').length,
  };

  const completionPercent =
    taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Link href={`/projects/teams/${teamSlug}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: project.color || project.team.color || '#0ea5e9' }}
              >
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                <p className="text-sm text-muted-foreground">{project.team.name}</p>
              </div>
            </div>
          </div>
        </div>
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}
        >
          {project.status.replace('_', ' ')}
        </span>
      </div>

      {project.description && (
        <p className="text-muted-foreground">{project.description}</p>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                <FolderKanban className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{taskStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{taskStats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{taskStats.done}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{taskStats.blocked}</p>
                <p className="text-sm text-muted-foreground">Blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Project Timeline</h2>
          <Link href={`/projects/${teamSlug}/${projectSlug}/gantt`}>
            {/* Keeping the link optionally or removing if tab is gone. User said "just have the gantt chart show up on the overview tab", implies removing the other page. 
                 But I'll keep the section header clean. */}
          </Link>
        </div>
        <GanttChart
          tasks={project.tasks.map(t => ({ ...t, dependencies: t.dependencies || [] }))}
          onTaskClick={(task) => console.log('Task clicked', task)}
        />
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Completion</span>
              <span className="text-sm font-medium text-foreground">{completionPercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>To Do: {taskStats.todo}</span>
              <span>In Progress: {taskStats.inProgress}</span>
              <span>Review: {taskStats.review}</span>
              <span>Done: {taskStats.done}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link href={`/projects/${teamSlug}/${projectSlug}/board`}>
          <Button>
            <FolderKanban className="w-4 h-4 mr-2" />
            View Kanban Board
          </Button>
        </Link>
        <Link href={`/projects/${teamSlug}/${projectSlug}/gantt`}>
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Gantt Chart
          </Button>
        </Link>
        <Link href={`/calendar?project=${project.id}`}>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            View Calendar
          </Button>
        </Link>
      </div>
    </div>
  );
}
