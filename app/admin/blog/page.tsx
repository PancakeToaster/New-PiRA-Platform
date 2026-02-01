'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Search, PenSquare, Loader2, Upload, Image, Video, X } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  isDraft: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<Array<{ url: string; type: 'image' | 'video'; filename: string }>>([]);
  const [createForm, setCreateForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    isDraft: true,
  });

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/admin/blog');
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts);
        }
      } catch (error) {
        console.error('Failed to fetch blog posts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'published') return matchesSearch && !post.isDraft;
    if (statusFilter === 'draft') return matchesSearch && post.isDraft;
    return matchesSearch;
  });

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        const { post } = await response.json();
        setPosts([post, ...posts]);
        setIsCreateModalOpen(false);
        setCreateForm({ title: '', slug: '', excerpt: '', content: '', coverImage: '', isDraft: true });
        setUploadedMedia([]);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setUploadedMedia(prev => [...prev, { url: data.url, type: data.type, filename: data.filename }]);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to upload file');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload file');
      }
    }

    setIsUploading(false);
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const insertMediaToContent = (url: string, type: 'image' | 'video') => {
    const mediaTag = type === 'image'
      ? `<img src="${url}" alt="" class="max-w-full h-auto rounded-lg my-4" />`
      : `<video src="${url}" controls class="max-w-full h-auto rounded-lg my-4"></video>`;

    setCreateForm(prev => ({
      ...prev,
      content: prev.content + '\n' + mediaTag,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const publishedCount = posts.filter(p => !p.isDraft).length;
  const draftCount = posts.filter(p => p.isDraft).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Blog Posts</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PenSquare className="w-4 h-4 mr-2" />
          Create New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{posts.length}</p>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{publishedCount}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{draftCount}</p>
              <p className="text-sm text-muted-foreground">Drafts</p>
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
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No blog posts found
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">{post.title}</div>
                        {post.excerpt && (
                          <div className="text-sm text-muted-foreground line-clamp-1">{post.excerpt}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">/{post.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.isDraft
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}
                        >
                          {post.isDraft ? 'Draft' : 'Published'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link href={`/admin/blog/${post.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Blog Post Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Blog Post"
        size="lg"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={createForm.title}
              onChange={(e) => {
                setCreateForm({
                  ...createForm,
                  title: e.target.value,
                  slug: generateSlug(e.target.value),
                });
              }}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="Post title"
              required
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-1">
              Slug *
            </label>
            <div className="flex items-center">
              <span className="text-muted-foreground mr-1">/blog/</span>
              <input
                type="text"
                id="slug"
                value={createForm.slug}
                onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder="post-slug"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-foreground mb-1">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              value={createForm.excerpt}
              onChange={(e) => setCreateForm({ ...createForm, excerpt: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none"
              placeholder="Brief description of the post"
            />
          </div>

          {/* Media Upload Section */}
          <div className="border border-border rounded-lg p-4 bg-muted/50">
            <label className="block text-sm font-medium text-foreground mb-3">
              Media Upload
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
              {isUploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Images: JPEG, PNG, GIF, WebP (max 5MB) | Videos: MP4, WebM, OGG (max 100MB)
            </p>

            {/* Uploaded Media Preview */}
            {uploadedMedia.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Uploaded Files:</p>
                <div className="grid grid-cols-2 gap-3">
                  {uploadedMedia.map((media, index) => (
                    <div
                      key={index}
                      className="relative bg-card border border-border rounded-lg p-2 flex items-center gap-2"
                    >
                      {media.type === 'image' ? (
                        <Image className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <Video className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      )}
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {media.filename}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => insertMediaToContent(media.url, media.type)}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                        >
                          Insert
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cover Image */}
          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-foreground mb-1">
              Cover Image URL
            </label>
            <input
              type="text"
              id="coverImage"
              value={createForm.coverImage}
              onChange={(e) => setCreateForm({ ...createForm, coverImage: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="https://... or use uploaded image URL"
            />
            {uploadedMedia.filter(m => m.type === 'image').length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {uploadedMedia.filter(m => m.type === 'image').map((media, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, coverImage: media.url })}
                    className="text-xs px-2 py-1 bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
                  >
                    Use {media.filename}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1">
              Content *
            </label>
            <textarea
              id="content"
              value={createForm.content}
              onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none"
              placeholder="Blog post content (HTML supported)"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDraft"
              checked={createForm.isDraft}
              onChange={(e) => setCreateForm({ ...createForm, isDraft: e.target.checked })}
              className="h-4 w-4 text-primary focus:ring-primary border-input rounded bg-background"
            />
            <label htmlFor="isDraft" className="ml-2 block text-sm text-foreground">
              Save as draft
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
