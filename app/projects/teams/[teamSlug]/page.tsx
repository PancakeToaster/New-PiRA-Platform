'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Plus,
  FolderKanban,
  Loader2,
  Users,
  Calendar,
  MoreVertical,
  ArrowRight,
  BarChart3,
} from 'lucide-react';

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
  _count: {
    tasks: number;
  };
}

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  _count: {
    members: number;
    projects: number;
  };
  projects: Project[];
}

export default function TeamPage({ params }: { params: { teamSlug: string } }) {
  const { teamSlug } = params;
  const [team, setTeam] = useState<Team | null>(null);
  const [userRole, setUserRole] = useState<string>('member');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, [teamSlug]);

  async function fetchTeam() {
    try {
      const response = await fetch(`/api/projects/teams/${teamSlug}`);
      if (response.ok) {
        const data = await response.json();
        setTeam(data.team);
        setUserRole(data.userRole);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to load team');
      }
    } catch (err) {
      setError('Failed to load team');
    } finally {
      setIsLoading(false);
    }
  }

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

  const canManage = ['owner', 'captain', 'mentor'].includes(userRole);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          {error || 'Team not found'}
        </h2>
        <Link href="/projects/teams">
          <Button variant="outline">Back to Teams</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
            style={{ backgroundColor: team.color || '#0ea5e9' }}
          >
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
            {team.description && (
              <p className="mt-1 text-gray-500">{team.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {team._count.members} members
              </span>
              <span className="flex items-center">
                <FolderKanban className="w-4 h-4 mr-1" />
                {team._count.projects} projects
              </span>
            </div>
          </div>
        </div>
        {canManage && (
          <Link href={`/projects/teams/${team.slug}/new-project`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href={`/projects/teams/${team.slug}/members`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <Users className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Members</p>
                    <p className="text-sm text-gray-500">{team._count.members} people</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/teams/${team.slug}/subteams`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Subteams</p>
                    <p className="text-sm text-gray-500">Manage structure</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/teams/${team.slug}/files`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <FolderKanban className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Files</p>
                    <p className="text-sm text-gray-500">Docs & assets</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/calendar?team=${team.slug}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Calendar</p>
                    <p className="text-sm text-gray-500">Team events</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/teams/${team.slug}/gantt`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Team Gantt</p>
                    <p className="text-sm text-gray-500">Master schedule</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/teams/${team.slug}/settings`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Settings</p>
                    <p className="text-sm text-gray-500">Manage team</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Projects</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {team.projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderKanban className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first project to start managing tasks.
              </p>
              {canManage && (
                <Link href={`/projects/teams/${team.slug}/new-project`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Project
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {team.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${team.slug}/${project.slug}`}
                >
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: project.color || team.color || '#0ea5e9' }}
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {project._count.tasks} tasks
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status.replace('_', ' ')}
                      </span>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Files Widget */}
      <RecentFilesWidget teamId={team.id} teamSlug={team.slug} />
    </div>
  );
}

function RecentFilesWidget({ teamId, teamSlug }: { teamId: string; teamSlug: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/teams/${teamId}/files?recent=true`)
      .then(res => res.json())
      .then(data => {
        if (data.files) setFiles(data.files);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [teamId]);

  if (!loading && files.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Files</CardTitle>
          <Link href={`/projects/teams/${teamSlug}/files`}>
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : (
          <div className="space-y-3">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <FolderKanban className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">By {file.uploader.firstName} • {new Date(file.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <a href={file.url} download target="_blank" className="text-sky-600 hover:text-sky-700 text-sm font-medium">Download</a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
