'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Users, FolderKanban, Loader2, Search } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  _count: {
    members: number;
    projects: number;
  };
  members: {
    role: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }[];
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const response = await fetch('/api/projects/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by Active vs Archived
    if (status === 'active') return matchesSearch && (team.isActive !== false); // Default true
    if (status === 'archived') return matchesSearch && (team.isActive === false);
    return matchesSearch;
  });

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Teams</h1>
          <p className="mt-1 text-gray-500">
            Manage your teams and collaborate on projects
          </p>
        </div>
        <Link href="/projects/teams/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
        />
      </div>

      {/* Tabs */}
      {teams.some(t => !t.isActive) && ( // Only show tabs if there are archived teams
        <div className="flex space-x-1 border-b border-gray-200 mb-6">
          <button
            onClick={() => setStatus('active')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${status === 'active'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Active Teams
          </button>
          <button
            onClick={() => setStatus('archived')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${status === 'archived'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Archived
          </button>
        </div>
      )}

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              {teams.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first team to start collaborating on projects.
                  </p>
                  <Link href="/projects/teams/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Team
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No {status} teams found</h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Try adjusting your search query.' :
                      status === 'archived' ? 'You have no archived teams.' : 'You have no active teams.'}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Link key={team.id} href={`/projects/teams/${team.slug}`}>
              <Card className={`h-full hover:shadow-lg transition-shadow cursor-pointer ${!team.isActive ? 'bg-gray-50 border-gray-200' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl ${!team.isActive ? 'grayscale opacity-70' : ''}`}
                      style={{ backgroundColor: team.color || '#0ea5e9' }}
                    >
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    {!team.isActive && (
                      <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full font-medium">
                        Archived
                      </span>
                    )}
                  </div>
                  <CardTitle className={`mt-4 ${!team.isActive ? 'text-gray-600' : ''}`}>{team.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {team.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {team.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{team._count.members} members</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FolderKanban className="w-4 h-4" />
                      <span>{team._count.projects} projects</span>
                    </div>
                  </div>
                  {team.members.length > 0 && (
                    <div className="mt-4 flex -space-x-2">
                      {team.members.slice(0, 5).map((member, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded-full bg-sky-100 border-2 border-white flex items-center justify-center"
                          title={`${member.user.firstName} ${member.user.lastName}`}
                        >
                          <span className="text-xs font-medium text-sky-700">
                            {member.user.firstName.charAt(0)}
                          </span>
                        </div>
                      ))}
                      {team._count.members > 5 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">
                            +{team._count.members - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
