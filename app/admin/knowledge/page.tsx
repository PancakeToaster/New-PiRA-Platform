'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Search, BookOpen, FolderPlus, Loader2 } from 'lucide-react';

interface KnowledgeNode {
  id: string;
  title: string;
  nodeType: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
  folder: {
    id: string;
    name: string;
  } | null;
}

interface KnowledgeStats {
  total: number;
  published: number;
  byType: Record<string, number>;
}

export default function AdminKnowledgePage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [stats, setStats] = useState<KnowledgeStats>({ total: 0, published: 0, byType: {} });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    async function fetchNodes() {
      try {
        const response = await fetch('/api/admin/knowledge');
        if (response.ok) {
          const data = await response.json();
          setNodes(data.nodes);
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch knowledge nodes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNodes();
  }, []);

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (typeFilter === 'all') return matchesSearch;
    return matchesSearch && node.nodeType === typeFilter;
  });

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Are you sure you want to delete this knowledge node?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/knowledge/${nodeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNodes(nodes.filter(n => n.id !== nodeId));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
      } else {
        alert('Failed to delete node');
      }
    } catch (error) {
      console.error('Failed to delete node:', error);
      alert('Failed to delete node');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
        <div className="space-x-2">
          <Link href="/admin/knowledge/folders">
            <Button variant="outline">
              <FolderPlus className="w-4 h-4 mr-2" />
              Manage Folders
            </Button>
          </Link>
          <Link href="/admin/knowledge/new">
            <Button>
              <BookOpen className="w-4 h-4 mr-2" />
              Create Node
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Nodes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.published}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.byType.markdown || 0}</p>
              <p className="text-sm text-muted-foreground">Markdown</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.byType.mindmap || 0}</p>
              <p className="text-sm text-muted-foreground">Mind Maps</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="markdown">Markdown</option>
              <option value="mindmap">Mind Map</option>
              <option value="graph">Graph</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Knowledge Nodes ({filteredNodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredNodes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No knowledge nodes found
                    </td>
                  </tr>
                ) : (
                  filteredNodes.map((node) => (
                    <tr key={node.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">{node.title}</div>
                        {node.folder && (
                          <div className="text-xs text-muted-foreground">in {node.folder.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${node.nodeType === 'markdown'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : node.nodeType === 'mindmap'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              : 'bg-green-500/10 text-green-600 dark:text-green-400'
                            }`}
                        >
                          {node.nodeType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {node.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-muted text-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {node.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{node.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {node.author.firstName} {node.author.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${node.isPublished
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                            }`}
                        >
                          {node.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(node.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/wiki/${node.id}`}>
                            <Button variant="outline" size="sm">
                              <BookOpen className="w-4 h-4 mr-2" />
                              View / Edit
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteNode(node.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
